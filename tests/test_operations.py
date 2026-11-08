"""Integração em banco temporário. Nunca utiliza o banco da operação."""
import os
from pathlib import Path
import sqlite3
import tempfile
import subprocess
import sys
from unittest.mock import patch
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta

TEMP = tempfile.TemporaryDirectory()
DB_PATH = Path(TEMP.name) / "integration.db"
os.environ["LOGIFLOW_DATABASE_PATH"] = str(DB_PATH)
os.environ["LOGIFLOW_DEMO_MODE"] = "false"
os.environ["LOGIFLOW_ALLOW_DEMO_PASSWORD"] = "false"
os.environ["LOGIFLOW_PUBLIC_SIGNUP"] = "false"
os.environ["LOGIFLOW_TRACKING_WORKER"] = "false"
SCHEMA = Path(__file__).with_name("legacy_schema.sql").read_text(encoding="utf-8")
with sqlite3.connect(str(DB_PATH)) as connection:
    connection.executescript(SCHEMA)
connection.close()

from fastapi.testclient import TestClient
from backend.main import app, criar_credencial
from backend.database import SessionLocal, engine
from backend.models import Usuario, Cliente, Produto, Pedido, ItemPedido, PedidoEvento, Movimentacao, Auditoria, SessaoUsuario, RelatorioGerado, BaseDemonstrativa, RastreamentoSimulado
from backend.tracking import executar_tick
from backend.main import registrar_auditoria
from backend.migrations import migrar_operacao

PASSWORD = "SenhaTesteSomenteTemporaria!"

class OperacaoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client_context = TestClient(app)
        cls.client = cls.client_context.__enter__()
        with SessionLocal() as db:
            for code, profile in [("USR-001", "administrador"), ("USR-002", "consulta"), ("USR-003", "operador")]:
                db.add(Usuario(codigo=code, nome=profile, email=f"{profile}@teste.local", cargo="Teste", perfil=profile, status="ativo"))
                db.flush()
                criar_credencial(db, code, PASSWORD)
            db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.client_context.__exit__(None, None, None)
        engine.dispose()

    def setUp(self):
        with SessionLocal() as db:
            for model in (RastreamentoSimulado, BaseDemonstrativa, RelatorioGerado, PedidoEvento, ItemPedido, Pedido, Movimentacao, Auditoria, Produto, Cliente):
                db.query(model).delete()
            db.add(Cliente(codigo="CLI-001", nome="Cliente de Teste", tipo="pessoa_juridica", documento="11222333000181",
                logradouro="Rua Teste", cidade="Campinas", uf="SP", status="ativo"))
            db.add(Produto(sku="PRD-001", nome="Produto Teste", categoria="Embalagens", estoque_atual=100,
                estoque_minimo=10, custo_unitario=10, preco_venda=20))
            db.commit()
        resposta = self.client.post("/api/auth/login", json={"email": "administrador@teste.local", "senha": PASSWORD})
        self.assertEqual(resposta.status_code, 200, resposta.text)
        self.headers = {"Authorization": "Bearer " + resposta.json()["token"]}

    def produto(self):
        return self.client.get("/api/produtos/PRD-001", headers=self.headers).json()

    def criar(self, quantidade=30):
        return self.client.post("/api/pedidos", headers=self.headers, json={"cliente_codigo": "CLI-001",
            "cliente_nome": "Nome enviado não deve substituir cadastro", "destino": "Campinas - SP",
            "itens": [{"produto_sku": "PRD-001", "quantidade": quantidade, "valor_unitario": "20.00"}]})

    def status(self, codigo, status):
        return self.client.patch(f"/api/pedidos/{codigo}/status", headers=self.headers, json={"status": status})

    def ativar_base_demo(self):
        with SessionLocal() as db:
            db.add(BaseDemonstrativa(id=1, ativa=True, descricao="Banco temporário de teste"))
            db.commit()

    def test_rastreamento_nao_grava_em_banco_operacional(self):
        codigo = self.criar().json()["codigo"]
        self.assertFalse(self.client.get(f"/api/pedidos/{codigo}/rastreamento", headers=self.headers).json()["simulado"])
        self.assertEqual(self.client.post(f"/api/pedidos/{codigo}/rastreamento-simulado", headers=self.headers).status_code, 409)
        executar_tick(registrar_auditoria)
        self.assertEqual(self.produto()["estoque_atual"], 100)

    def test_rastreamento_persistente_expedicao_entrega_auditoria_e_idempotencia(self):
        self.ativar_base_demo()
        codigo = self.criar().json()["codigo"]
        now = datetime.now()
        with SessionLocal() as db:
            registro = db.get(RastreamentoSimulado, codigo)
            registro.inicio_previsto = now
            registro.atraso_segundos = 0
            registro.duracao_segundos = 30
            db.commit()
        executar_tick(registrar_auditoria, now=now)
        self.assertEqual(self.client.get(f"/api/pedidos/{codigo}", headers=self.headers).json()["status"], "processando")
        executar_tick(registrar_auditoria, now=now + timedelta(seconds=15))
        self.assertEqual(self.produto()["estoque_atual"], 70)
        self.assertEqual(self.produto()["estoque_reservado"], 0)
        executar_tick(registrar_auditoria, now=now + timedelta(seconds=46))
        response = self.client.get(f"/api/pedidos/{codigo}", headers=self.headers).json()
        self.assertEqual(response["status"], "entregue")
        self.assertTrue(response["entregue_em"])
        self.assertEqual(len([e for e in response["eventos"] if e["tipo"].startswith("sim_")]), 4)
        with SessionLocal() as db:
            before = (db.query(Auditoria).count(), db.query(PedidoEvento).count(), db.query(Movimentacao).count())
            self.assertEqual(db.query(Auditoria).filter_by(modulo="Rastreamento").count(), 4)
            self.assertEqual(db.query(Movimentacao).count(), 1)
            self.assertEqual(db.query(RelatorioGerado).count(), 1)
            self.assertIn(codigo, db.query(RelatorioGerado).first().conteudo)
        executar_tick(registrar_auditoria, now=now + timedelta(seconds=90))
        with SessionLocal() as db:
            self.assertEqual(before, (db.query(Auditoria).count(), db.query(PedidoEvento).count(), db.query(Movimentacao).count()))
            self.assertEqual(db.query(RelatorioGerado).count(), 1)

    def test_nova_entrega_demo_cria_pedido_sem_reabrir_historico(self):
        self.ativar_base_demo()
        codigo = self.criar().json()["codigo"]
        self.status(codigo, "enviado")
        self.status(codigo, "entregue")
        response = self.client.post(f"/api/pedidos/{codigo}/nova-entrega-demonstrativa", headers=self.headers)
        self.assertEqual(response.status_code, 201, response.text)
        novo = response.json()["codigo"]
        self.assertNotEqual(novo, codigo)
        self.assertEqual(self.produto()["estoque_atual"], 70)
        self.assertEqual(self.produto()["estoque_reservado"], 5)
        self.assertEqual(self.client.get(f"/api/pedidos/{codigo}", headers=self.headers).json()["status"], "entregue")

    def test_rastreamento_recupera_etapas_apos_parada_da_api(self):
        self.ativar_base_demo()
        codigo = self.criar().json()["codigo"]
        self.status(codigo, "enviado")
        now = datetime.now()
        with SessionLocal() as db:
            registro = db.get(RastreamentoSimulado, codigo)
            registro.iniciado_em = now - timedelta(minutes=5)
            registro.inicio_previsto = registro.iniciado_em
            registro.duracao_segundos = 30
            db.commit()
        executar_tick(registrar_auditoria, now=now)
        pedido = self.client.get(f"/api/pedidos/{codigo}", headers=self.headers).json()
        self.assertEqual(pedido["status"], "entregue")
        self.assertEqual(len([e for e in pedido["eventos"] if e["tipo"].startswith("sim_")]), 4)
        self.assertEqual(self.produto()["estoque_atual"], 70)

    def test_cancelamento_interrompe_simulacao_e_perfil_consulta_nao_inicia(self):
        self.ativar_base_demo()
        codigo = self.criar().json()["codigo"]
        login = self.client.post("/api/auth/login", json={"email": "consulta@teste.local", "senha": PASSWORD}).json()
        headers = {"Authorization": "Bearer " + login["token"]}
        self.assertEqual(self.client.post(f"/api/pedidos/{codigo}/rastreamento-simulado", headers=headers).status_code, 403)
        self.assertEqual(self.client.get(f"/api/pedidos/{codigo}/rastreamento", headers=headers).status_code, 200)
        self.status(codigo, "cancelado")
        executar_tick(registrar_auditoria, now=datetime.now()+timedelta(days=1))
        self.assertEqual(self.produto()["estoque_atual"], 100)
        with SessionLocal() as db:
            self.assertFalse(db.get(RastreamentoSimulado, codigo).ativo)
            self.assertEqual(db.query(Movimentacao).count(), 0)

    def test_produtos_mesma_familia_variantes_distintas_sem_duplicidade(self):
        produto = {"nome": "Papel Sulfite", "categoria": "Papéis e Impressão", "marca": "PapelNova",
            "especificacao": "A4 75g 500 folhas", "gtin_ean": "2000000000015", "estoque_atual": 0,
            "estoque_minimo": 10, "custo_unitario": 20, "margem_lucro_percentual": 30}
        self.assertEqual(self.client.post("/api/produtos", headers=self.headers, json=produto).status_code, 201)
        self.assertEqual(self.client.post("/api/produtos", headers=self.headers, json={**produto, "marca": "OutraMarca"}).status_code, 409)
        self.assertEqual(self.client.post("/api/produtos", headers=self.headers, json={**produto, "gtin_ean": "2000000000022"}).status_code, 409)
        self.assertEqual(self.client.post("/api/produtos", headers=self.headers, json={**produto, "especificacao": "A4 90g 500 folhas", "gtin_ean": "2000000000022"}).status_code, 201)
        self.assertEqual(self.client.post("/api/produtos", headers=self.headers, json={**produto, "marca": "OutraMarca", "gtin_ean": "2000000000039"}).status_code, 201)

    def test_reserva_expedicao_entrega_sem_baixa_duplicada(self):
        r = self.criar(); self.assertEqual(r.status_code, 201, r.text); pedido = r.json()
        self.assertEqual(pedido["cliente_codigo"], "CLI-001")
        self.assertEqual(pedido["cliente_nome"], "Cliente de Teste")
        self.assertEqual(pedido["valor_total"], "600.00")
        self.assertEqual([self.produto()[x] for x in ("estoque_atual", "estoque_reservado", "estoque_disponivel")], [100, 30, 70])
        self.assertEqual(self.status(pedido["codigo"], "processando").status_code, 200)
        enviado = self.status(pedido["codigo"], "enviado"); self.assertEqual(enviado.status_code, 200, enviado.text)
        self.assertIsNotNone(enviado.json()["enviado_em"])
        self.status(pedido["codigo"], "enviado")
        self.assertEqual(self.produto()["estoque_atual"], 70)
        entregue = self.status(pedido["codigo"], "entregue").json()
        self.assertEqual(len(entregue["eventos"]), 4)
        data = entregue["entregue_em"]
        atualizado = self.client.patch(f"/api/pedidos/{pedido['codigo']}/status", headers=self.headers,
            json={"status": "entregue", "codigo_rastreio": "REAL-001"})
        self.assertEqual(atualizado.json()["entregue_em"], data)

    def test_cancelamento_libera_reserva_sem_entrada_ficticia(self):
        codigo = self.criar().json()["codigo"]
        self.assertEqual(self.status(codigo, "cancelado").status_code, 200)
        self.assertEqual(self.produto()["estoque_disponivel"], 100)
        self.assertEqual(self.status(codigo, "enviado").status_code, 409)
        with SessionLocal() as db:
            self.assertEqual(db.query(Movimentacao).count(), 0)

    def test_devolucao_recebida_integral_so_uma_vez(self):
        codigo = self.criar().json()["codigo"]
        self.status(codigo, "enviado")
        self.assertEqual(self.status(codigo, "cancelado").status_code, 409)
        self.status(codigo, "entregue")
        self.assertEqual(self.status(codigo, "devolvido").status_code, 200)
        self.status(codigo, "devolvido")
        self.assertEqual(self.produto()["estoque_atual"], 100)
        with SessionLocal() as db:
            self.assertEqual(db.query(Movimentacao).count(), 2)

    def test_saida_manual_respeita_reservas_e_exclusao_bloqueada(self):
        self.criar(80)
        r = self.client.post("/api/movimentacoes", headers=self.headers,
            json={"produto_sku": "PRD-001", "tipo": "saida", "quantidade": 21, "origem": "Estoque Principal", "destino": "Teste"})
        self.assertEqual(r.status_code, 409)
        self.assertEqual(self.client.delete("/api/produtos/PRD-001", headers=self.headers).status_code, 409)
        self.assertEqual(self.produto()["estoque_atual"], 100)

    def test_pedidos_simultaneos_nao_reservam_mesmo_saldo(self):
        with ThreadPoolExecutor(max_workers=2) as pool:
            resultados = list(pool.map(lambda _: self.criar(70).status_code, range(2)))
        self.assertEqual(sorted(resultados), [201, 409])
        self.assertEqual(self.produto()["estoque_disponivel"], 30)

    def test_saidas_simultaneas_sem_perda_de_saldo(self):
        def retirar(_):
            return self.client.post("/api/movimentacoes", headers=self.headers, json={"produto_sku": "PRD-001",
                "tipo": "saida", "quantidade": 60, "origem": "Estoque Principal", "destino": "Teste"}).status_code
        with ThreadPoolExecutor(max_workers=2) as pool:
            resultados = list(pool.map(retirar, range(2)))
        self.assertEqual(sorted(resultados), [201, 409])
        self.assertEqual(self.produto()["estoque_atual"], 40)

    def test_rejeicao_atomicidade_cliente_inativo_e_itens_invalidos(self):
        self.assertEqual(self.criar(101).status_code, 409)
        with SessionLocal() as db:
            db.get(Cliente, "CLI-001").status = "inativo"; db.commit()
        self.assertEqual(self.criar().status_code, 409)
        self.assertEqual(self.produto()["estoque_reservado"], 0)
        self.assertEqual(self.produto()["estoque_atual"], 100)

    def test_pedido_multiplos_itens_falha_sem_reserva_parcial(self):
        r = self.client.post("/api/pedidos", headers=self.headers, json={"cliente_codigo": "CLI-001",
            "cliente_nome": "Cliente de Teste", "destino": "Campinas", "itens": [
                {"produto_sku": "PRD-001", "quantidade": 10, "valor_unitario": "20.00"},
                {"produto_sku": "PRD-INEXISTENTE", "quantidade": 1, "valor_unitario": "20.00"}]})
        self.assertEqual(r.status_code, 404, r.text)
        with SessionLocal() as db:
            self.assertEqual(db.query(Pedido).count(), 0)
            self.assertEqual(db.query(ItemPedido).count(), 0)
            self.assertEqual(db.query(Movimentacao).count(), 0)
        self.assertEqual(self.produto()["estoque_disponivel"], 100)

    def test_importacao_registra_saldo_inicial_e_rejeita_lote_inteiro(self):
        payload = {"nome": "Produto Importado", "categoria": "Canetas e Escrita", "estoque_atual": 15,
            "estoque_minimo": 2, "custo_unitario": "5.00", "preco_venda": "10.00"}
        r = self.client.post("/api/produtos/importar", headers=self.headers, json=[payload])
        self.assertEqual(r.status_code, 201, r.text)
        sku = r.json()[0]["sku"]
        with SessionLocal() as db:
            movimento = db.query(Movimentacao).filter_by(produto_sku=sku).one()
            self.assertEqual((movimento.tipo, movimento.quantidade, movimento.saldo_anterior, movimento.saldo_posterior), ("entrada", 15, 0, 15))
        invalid = dict(payload, nome="Outro Produto", categoria="Categoria inexistente")
        valid = dict(payload, nome="Produto que não deve ser salvo")
        r = self.client.post("/api/produtos/importar", headers=self.headers, json=[valid, invalid])
        self.assertEqual(r.status_code, 400, r.text)
        with SessionLocal() as db:
            self.assertEqual(db.query(Produto).count(), 2)
            self.assertEqual(db.query(Movimentacao).count(), 1)

    def test_backup_e_restauracao_utilitario_preserva_banco_anterior(self):
        path = Path(TEMP.name) / "backup-test.db"
        with sqlite3.connect(str(path)) as connection:
            connection.executescript(SCHEMA)
            connection.execute("INSERT INTO pedidos (codigo,cliente_nome,destino,status,valor_total,criado_em,atualizado_em) VALUES ('PED-BACKUP','Cliente','Campinas','pendente',100,?,?)", (datetime.now().isoformat(), datetime.now().isoformat()))
            connection.commit()
        env = dict(os.environ, LOGIFLOW_DATABASE_PATH=str(path))
        command = [sys.executable, "-m", "scripts.backup_banco"]
        root = Path(__file__).resolve().parents[1]
        result = subprocess.run(command, cwd=root, env=env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        backup = next(path.parent.joinpath("backups").glob("backup-*.db"))
        with sqlite3.connect(str(path)) as connection:
            connection.execute("UPDATE pedidos SET valor_total=200"); connection.commit()
        result = subprocess.run(command + ["--restaurar", str(backup)], cwd=root, env=env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        with sqlite3.connect(str(path)) as connection:
            self.assertEqual(connection.execute("SELECT valor_total FROM pedidos").fetchone()[0], 100)
        snapshots = list(path.parent.joinpath("backups").glob("backup-*.db"))
        self.assertEqual(len(snapshots), 2)
        with sqlite3.connect(str(next(p for p in snapshots if p != backup))) as connection:
            self.assertEqual(connection.execute("SELECT valor_total FROM pedidos").fetchone()[0], 200)

    def test_perfis_login_logout_demo_e_cadastro_publico(self):
        self.assertEqual(self.client.get("/api/produtos").status_code, 401)
        self.assertEqual(self.client.get("/api/auth/demo").status_code, 404)
        self.assertEqual(self.client.post("/api/auth/register", json={"nome": "Teste", "email": "teste@teste.local", "cargo": "Teste", "senha": PASSWORD}).status_code, 403)
        for perfil in ("consulta", "operador"):
            token = self.client.post("/api/auth/login", json={"email": f"{perfil}@teste.local", "senha": PASSWORD}).json()["token"]
            headers = {"Authorization": "Bearer " + token}
            self.assertEqual(self.client.get("/api/usuarios", headers=headers).status_code, 403)
            self.assertEqual(self.client.get("/api/produtos", headers=headers).status_code, 200)
            if perfil == "consulta":
                self.assertEqual(self.client.post("/api/pedidos", headers=headers, json={}).status_code, 403)
        self.assertEqual(self.client.post("/api/auth/login", json={"email": "administrador@teste.local", "senha": "LogiFlow@2026"}).status_code, 403)
        self.assertEqual(self.client.post("/api/auth/logout", headers=self.headers).status_code, 204)
        self.assertEqual(self.client.get("/api/produtos", headers=self.headers).status_code, 401)

    def test_perfil_consulta_nao_pode_gravar_relatorio_e_operador_pode(self):
        payload = {"nome": "Relatorio sintético", "arquivo": "operacao.csv",
            "periodo": "30", "conteudo": "Item;Valor\\nTeste;10\\n"}
        login_consulta = self.client.post("/api/auth/login",
            json={"email": "consulta@teste.local", "senha": PASSWORD})
        self.assertEqual(login_consulta.status_code, 200, login_consulta.text)
        consulta = {"Authorization": "Bearer " + login_consulta.json()["token"]}
        self.assertEqual(self.client.get("/api/relatorios", headers=consulta).status_code, 200)
        negada = self.client.post("/api/relatorios", headers=consulta, json=payload)
        self.assertEqual(negada.status_code, 403, negada.text)
        self.assertIn("somente para visualização", negada.json()["detail"])
        with SessionLocal() as db:
            self.assertEqual(db.query(RelatorioGerado).count(), 0)
        login_operador = self.client.post("/api/auth/login",
            json={"email": "operador@teste.local", "senha": PASSWORD})
        self.assertEqual(login_operador.status_code, 200, login_operador.text)
        operador = {"Authorization": "Bearer " + login_operador.json()["token"]}
        criada = self.client.post("/api/relatorios", headers=operador, json=payload)
        self.assertEqual(criada.status_code, 201, criada.text)
        lida = self.client.get("/api/relatorios", headers=consulta)
        self.assertEqual(lida.status_code, 200, lida.text)
        self.assertEqual(len(lida.json()), 1)

    def test_senha_demo_desativada_por_padrao_sem_variavel_configurada(self):
        # Subprocesso evita recarregar constantes usadas pelos demais testes.
        ambiente = os.environ.copy()
        ambiente.pop("NEXOLOG_ALLOW_DEMO_PASSWORD", None)
        ambiente.pop("LOGIFLOW_ALLOW_DEMO_PASSWORD", None)
        codigo = ("from unittest.mock import patch\\n"
            "with patch('dotenv.load_dotenv', return_value=False):\\n"
            "    from backend.config import ALLOW_DEMO_PASSWORD\\n"
            "    print(ALLOW_DEMO_PASSWORD)\\n")
        execucao = subprocess.run([sys.executable, "-c", codigo],
            cwd=str(Path(__file__).resolve().parents[1]), env=ambiente,
            capture_output=True, text=True, check=True)
        self.assertEqual(execucao.stdout.strip(), "False")

    def test_relatorio_persistido_protegido_e_csv_seguro(self):
        r = self.client.post("/api/relatorios", headers=self.headers, json={"nome": "Resumo", "arquivo": "resumo.csv", "periodo": "30",
            "conteudo": 'Cliente;Valor\n"=HYPERLINK(1)";100\n'})
        self.assertEqual(r.status_code, 201, r.text)
        report = self.client.get(f"/api/relatorios/{r.json()['id']}", headers=self.headers).json()
        self.assertIn("'=HYPERLINK", report["conteudo"])
        self.assertEqual(self.client.get("/api/relatorios", headers=self.headers).json()[0]["id"], r.json()["id"])
        self.assertEqual(self.client.get(f"/api/relatorios/{r.json()['id']}").status_code, 401)

    def test_senha_demo_liberada_valida_credencial_sem_abrir_acesso_publico(self):
        with patch('backend.main.ALLOW_DEMO_PASSWORD', True):
            # A liberação não aceita senha diferente da credencial cadastrada.
            r = self.client.post('/api/auth/login', json={'email': 'administrador@teste.local', 'senha': 'LogiFlow@2026'})
            self.assertEqual(r.status_code, 401)
            try:
                with SessionLocal() as db:
                    criar_credencial(db, 'USR-001', 'LogiFlow@2026'); db.commit()
                r = self.client.post('/api/auth/login', json={'email': 'administrador@teste.local', 'senha': 'LogiFlow@2026'})
                self.assertEqual(r.status_code, 200, r.text)
                headers = {'Authorization': 'Bearer ' + r.json()['token']}
                self.assertEqual(self.client.get('/api/auth/me', headers=headers).status_code, 200)
                self.assertEqual(self.client.get('/api/auth/demo').status_code, 404)
                self.assertEqual(self.client.get('/api/produtos').status_code, 401)
                with SessionLocal() as db:
                    db.get(Usuario, 'USR-001').status = 'inativo'; db.commit()
                self.assertEqual(self.client.post('/api/auth/login', json={'email': 'administrador@teste.local', 'senha': 'LogiFlow@2026'}).status_code, 403)
            finally:
                with SessionLocal() as db:
                    db.get(Usuario, 'USR-001').status = 'ativo'
                    criar_credencial(db, 'USR-001', PASSWORD); db.commit()

    def test_pedido_legado_nao_desconta_novamente_e_cancela_com_estorno(self):
        with SessionLocal() as db:
            db.get(Produto, "PRD-001").estoque_atual = 70
            pedido = Pedido(codigo="PED-LEGADO", cliente_nome="Cliente de Teste", destino="Campinas", status="pendente",
                estoque_baixado=True, valor_total=600, itens=[ItemPedido(produto_sku="PRD-001", produto_nome="Produto Teste", quantidade=30, valor_unitario=20, subtotal=600)])
            db.add(pedido); db.commit()
        self.assertEqual(self.produto()["estoque_disponivel"], 70)
        self.assertEqual(self.status("PED-LEGADO", "cancelado").status_code, 200)
        self.assertEqual(self.produto()["estoque_atual"], 100)

    def test_migracao_preserva_legado_idempotente_e_backup(self):
        path = Path(TEMP.name) / "legacy.db"
        with sqlite3.connect(str(path)) as connection:
            connection.executescript(SCHEMA)
            connection.execute("INSERT INTO pedidos (codigo,cliente_nome,destino,status,valor_total,criado_em,atualizado_em) VALUES ('PED-ANTIGO','Cliente','Campinas','pendente',100,?,?)", (datetime.now().isoformat(), datetime.now().isoformat()))
            connection.commit()
        migrar_operacao(path); migrar_operacao(path)
        with sqlite3.connect(str(path)) as connection:
            self.assertEqual(connection.execute("SELECT codigo,estoque_baixado,entregue_em FROM pedidos").fetchone(), ("PED-ANTIGO", 1, None))
            self.assertEqual(connection.execute("SELECT count(*) FROM logiflow_migrations").fetchone()[0], 1)
            self.assertEqual(connection.execute("PRAGMA integrity_check").fetchone()[0], "ok")
        self.assertTrue(list(path.parent.joinpath("backups").glob("antes-operacao-*.db")))

    def test_item_legado_removido_bloqueia_estorno_sem_alterar_saldos(self):
        with SessionLocal() as db:
            db.add(Pedido(codigo="PED-REMOVIDO", cliente_nome="Cliente de Teste", destino="Campinas",
                status="pendente", estoque_baixado=True, valor_total=100,
                itens=[ItemPedido(produto_sku="PRD-001", produto_nome="Produto Teste", quantidade=2, valor_unitario=20, subtotal=40),
                       ItemPedido(produto_sku="PRD-REMOVIDO", produto_nome="Produto removido", quantidade=3, valor_unitario=20, subtotal=60)]))
            db.commit()
        r = self.status("PED-REMOVIDO", "cancelado")
        self.assertEqual(r.status_code, 409, r.text)
        self.assertIn("Concilie", r.json()["detail"])
        self.assertEqual(self.produto()["estoque_atual"], 100)
        with SessionLocal() as db:
            self.assertEqual(db.get(Pedido, "PED-REMOVIDO").status, "pendente")
            self.assertEqual(db.query(Movimentacao).count(), 0)
            self.assertEqual(db.query(PedidoEvento).count(), 0)

if __name__ == "__main__":
    unittest.main(verbosity=2)
