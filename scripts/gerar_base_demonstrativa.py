"""Gera uma base nova e conciliada. Recusa sobrescrever qualquer banco existente."""
import argparse
import calendar
from datetime import datetime, timedelta
from decimal import Decimal
import json
import os
from pathlib import Path
import random

CATALOGO = [
    ("Papéis e Impressão", ["Papel Sulfite", "Papel Fotográfico", "Papel Colorido"], ["A4 · 75 g/m² · resma 500 folhas", "A4 · 90 g/m² · resma 500 folhas"], ["OfficePlus", "PapelNova", "PrintMax"], 18),
    ("Canetas e Escrita", ["Caneta Esferográfica", "Caneta Gel", "Caneta Roller"], ["Azul · ponta 0,7 mm · caixa 12", "Preto · ponta 1,0 mm · caixa 12"], ["Escreva", "Traço", "LinhaFina"], 8),
    ("Pastas, Arquivos e Organização", ["Pasta Catálogo", "Pasta Sanfonada", "Fichário"], ["A4 · preto · 20 divisórias", "A4 · azul · 40 divisórias"], ["OfficePlus", "Organiza", "ArquivoPro"], 16),
    ("Embalagens", ["Caixa de Papelão", "Filme Stretch", "Fita Adesiva"], ["Linha compacta · pacote 10 unidades", "Linha reforçada · pacote 20 unidades"], ["EmbalaMais", "PackPrime", "CaixaForte"], 24),
    ("Identificação", ["Etiqueta Térmica", "Ribbon de Cera", "Etiqueta Adesiva"], ["100 × 150 mm · rolo 500 etiquetas", "50 × 30 mm · rolo 1.000 etiquetas"], ["LabelPro", "MarcaCerta", "ImprimeJá"], 32),
    ("Cadernos, Agendas e Blocos", ["Caderno Universitário", "Agenda Diária", "Bloco de Anotações"], ["A5 · capa azul · 96 folhas", "A4 · capa preta · 200 folhas"], ["NotaMax", "Escreva", "PáginaNova"], 22),
    ("EPI", ["Luva de Segurança", "Óculos de Proteção", "Protetor Auricular"], ["Tamanho M · uso operacional", "Tamanho G · uso operacional"], ["Protege", "SafeWork", "SeguraMais"], 12),
    ("Colas, Fitas e Adesivos", ["Cola Branca", "Cola Bastão", "Cola Instantânea"], ["Uso escolar · embalagem 40 g", "Uso profissional · embalagem 90 g"], ["Adere", "ColaPro", "FixaMais"], 14),
]
CIDADES = [("São Paulo", "SP", "01310100"), ("Guarulhos", "SP", "07010000"), ("Osasco", "SP", "06010000"),
    ("Santo André", "SP", "09010000"), ("Campinas", "SP", "13010000"), ("Santos", "SP", "11010000"),
    ("Curitiba", "PR", "80010000"), ("Belo Horizonte", "MG", "30110000")]
TRANSPORTADORAS = ["NexoLog Express", "ViaLog", "Rota Express", "Azul Cargas", "SulLog", "Brasil Entregas"]

def ean13(numero):
    base = f"200{numero:09d}"
    soma = sum(int(n) * (1 if index % 2 == 0 else 3) for index, n in enumerate(base))
    return base + str((-soma) % 10)

def documento(numero):
    base = f"{numero:08d}0001"
    for pesos in ([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]):
        resto = sum(int(n) * peso for n, peso in zip(base, pesos)) % 11
        base += str(0 if resto < 2 else 11 - resto)
    return base

def gerar(destino, fim, manifest=None, portfolio=False):
    destino = Path(destino).resolve()
    if destino.exists():
        raise SystemExit("O banco de destino já existe. Use outro caminho; nenhum dado foi substituído.")
    destino.parent.mkdir(parents=True, exist_ok=True)
    os.environ["LOGIFLOW_DATABASE_PATH"] = str(destino)
    os.environ["NEXOLOG_DATABASE_PATH"] = str(destino)
    os.environ["NEXOLOG_DEMO_MODE"] = "false"
    os.environ["NEXOLOG_ALLOW_DEMO_PASSWORD"] = "true"
    os.environ["NEXOLOG_TRACKING_WORKER"] = "false"
    os.environ["LOGIFLOW_DEMO_MODE"] = "false"
    os.environ["LOGIFLOW_ALLOW_DEMO_PASSWORD"] = "true"
    os.environ["LOGIFLOW_TRACKING_WORKER"] = "false"
    from backend.main import (calcular_precificacao_produto, preparar_dados_fornecedor, preparar_dados_cliente,
        produto_duplicado, gerar_proximo_codigo_pedido, criar_credencial, CATEGORIAS_PERMITIDAS)
    from backend.database import SessionLocal, engine
    from backend.models import (Produto, Cliente, Fornecedor, Usuario, Movimentacao, Auditoria, Pedido,
        PedidoEvento, ItemPedido, BaseDemonstrativa, RelatorioGerado, RastreamentoSimulado)
    from backend.schemas import ProdutoCreate, ClienteCreate, FornecedorCreate, PedidoCreate, PedidoStatusUpdate
    from backend.operations import criar_pedido, atualizar_pedido, saldo_disponivel
    from backend.tracking import agendar
    rng = random.Random(20242026)
    abertura = datetime(2024, 1, 1, 8)
    limite = datetime.fromisoformat(fim).replace(hour=23, minute=59, second=59)
    if limite > datetime.now():
        limite = datetime.now()
    if limite < abertura:
        raise SystemExit("O período deve começar em 2024 ou depois.")
    relogio = abertura
    admin_nome = "Administrador Demo" if portfolio else "Leandro A. Ferreira"
    admin_email = "demo@nexolog.app" if portfolio else "portifolio@adm.com.br"
    senha_demo = "NexoLog@2026" if portfolio else "LogiFlow@2026"
    ator = {"codigo": "USR-001", "nome": admin_nome}
    def auditar(db, **kwargs):
        row = Auditoria(usuario_codigo=ator["codigo"], usuario_nome=ator["nome"], criado_em=relogio,
            **kwargs, dados_novos=json.dumps({"origem": "base demonstrativa"}, ensure_ascii=False))
        db.add(row)
        return row
    def movimentar(db, produto, quantidade, tipo, origem, destino_mov):
        antes = produto.estoque_atual
        produto.estoque_atual += quantidade if tipo == "entrada" else -quantidade
        produto.atualizado_em = relogio
        db.add(Movimentacao(produto_sku=produto.sku, produto_nome=produto.nome, tipo=tipo,
            quantidade=quantidade, origem=origem, destino=destino_mov, saldo_anterior=antes,
            saldo_posterior=produto.estoque_atual, criado_em=relogio))
        auditar(db, modulo="Estoque", acao="movimentar_estoque", entidade="Produto",
            registro_referencia=produto.sku, detalhes=f"[DEMO] {tipo.title()} de {quantidade} un.; {origem} → {destino_mov}.")
    with SessionLocal() as db:
        for index, (nome, perfil, cargo) in enumerate([
            (admin_nome, "administrador", "Administrador do Sistema"),
            ("Mariana Costa", "gerente", "Gerente de Operações"), ("Rafael Silva", "operador", "Estoque"),
            ("Carla Almeida", "operador", "Pedidos"), ("Felipe Santos", "operador", "Expedição"),
            ("Ana Pereira", "consulta", "Relatórios"), ("Bruno Garcia", "operador", "Estoque"),
            ("Thaís Lima", "gerente", "Planejamento"), ("Diego Carvalho", "operador", "Pedidos"),
            ("Renata Nunes", "consulta", "Diretoria")], 1):
            codigo = f"USR-{index:03d}"
            db.add(Usuario(codigo=codigo, nome=nome, perfil=perfil, cargo=cargo, status="ativo",
                email=admin_email if index == 1 else f"usuario{index}@nexolog.example.invalid",
                criado_em=abertura, atualizado_em=abertura))
            db.flush()
            criar_credencial(db, codigo, senha_demo)
            auditar(db, modulo="Usuários", acao="cadastrar", entidade="Usuario", registro_referencia=codigo,
                detalhes="[DEMO] Usuário e perfil cadastrados na abertura da base.")
        fornecedores = []
        for cat_index, (categoria, _familias, _variantes, marcas, _custo) in enumerate(CATALOGO):
            for brand_index, marca in enumerate(marcas):
                index = len(fornecedores) + 1
                city, uf, _cep = CIDADES[index % len(CIDADES)]
                dados = FornecedorCreate(razao_social=f"{marca} Distribuição Demonstrativa Ltda", nome_fantasia=marca,
                    cnpj=documento(70000000 + index), categoria=categoria, contato=f"Equipe Comercial {marca}",
                    telefone=f"1190000{index:04d}", email=f"fornecedor{index}@nexolog.example.invalid",
                    cidade=city, uf=uf, prazo_medio_entrega=2 + index % 6)
                row = Fornecedor(codigo=f"FOR-{index:03d}", **preparar_dados_fornecedor(dados), status="ativo",
                    criado_em=abertura, atualizado_em=abertura)
                db.add(row)
                fornecedores.append(row)
                auditar(db, modulo="Fornecedores", acao="cadastrar", entidade="Fornecedor", registro_referencia=row.codigo,
                    detalhes=f"[DEMO] Cadastro do fornecedor {row.razao_social}, categoria {categoria}.")
        clientes = []
        setores = ["Comercial", "Distribuidora", "Escola", "Clínica", "Escritório", "Indústria"]
        nomes = ["Horizonte", "Nova Era", "Sol Nascente", "Vista Alegre", "Alvorada", "Pioneira", "Central", "Integra"]
        for index in range(1, 49):
            city, uf, cep = CIDADES[(index - 1) % len(CIDADES)]
            dados = ClienteCreate(nome=f"{setores[(index-1)//8]} {nomes[(index-1)%8]} Ltda", tipo="pessoa_juridica",
                documento=documento(80000000 + index), telefone=f"1191000{index:04d}",
                email=f"cliente{index}@nexolog.example.invalid", cep=cep, logradouro="Avenida Central",
                numero=str(100 + index * 10), bairro="Centro", cidade=city, uf=uf)
            row = Cliente(codigo=f"CLI-{index:03d}", **preparar_dados_cliente(dados), status="ativo",
                criado_em=abertura, atualizado_em=abertura)
            db.add(row)
            clientes.append(row)
            auditar(db, modulo="Clientes", acao="cadastrar", entidade="Cliente", registro_referencia=row.codigo,
                detalhes=f"[DEMO] Cliente cadastrado em {city}/{uf}.")
        db.flush()
        produtos, fornecedor_por_sku = [], {}
        for cat_index, (categoria, familias, variantes, marcas, custo) in enumerate(CATALOGO):
            assert categoria in CATEGORIAS_PERMITIDAS
            for familia in familias:
                for brand_index, marca in enumerate(marcas):
                    for var_index, variante in enumerate(variantes):
                        index = len(produtos) + 1
                        # A especificação corresponde à família, e não apenas à categoria.
                        if familia == "Filme Stretch": variante = ["500 mm × 300 m · 17 micras", "500 mm × 400 m · 23 micras"][var_index]
                        elif familia == "Caixa de Papelão": variante = ["30 × 20 × 15 cm · onda simples", "60 × 40 × 40 cm · onda dupla"][var_index]
                        elif familia == "Fita Adesiva": variante = ["48 mm × 50 m · transparente", "48 mm × 100 m · marrom"][var_index]
                        elif familia in {"Marca-texto", "Lápis Grafite"}: variante = (["Amarelo · ponta chanfrada · caixa 12", "Verde · ponta chanfrada · caixa 12"] if familia == "Marca-texto" else ["HB · caixa 12", "2B · caixa 12"])[var_index]
                        elif familia == "Ribbon de Cera": variante = ["110 mm × 74 m · preto", "110 mm × 300 m · preto"][var_index]
                        elif familia == "Óculos de Proteção": variante = ["Lente incolor · antiembaçante", "Lente cinza · proteção lateral"][var_index]
                        elif familia == "Protetor Auricular": variante = ["Silicone · com cordão", "Espuma · caixa 50 pares"][var_index]
                        elif familia == "Gaveteiro": variante = ["3 gavetas · cinza", "5 gavetas · azul"][var_index]
                        elif familia == "Bandeja Empilhável": variante = ["A4 · preto · unidade", "A4 · azul · conjunto 3 unidades"][var_index]
                        elif familia == "Papel Fotográfico": variante = ["A4 · glossy 180 g/m² · 50 folhas", "A4 · matte 230 g/m² · 50 folhas"][var_index]
                        elif familia == "Papel Colorido": variante = ["A4 · azul 80 g/m² · 100 folhas", "A4 · amarelo 120 g/m² · 100 folhas"][var_index]
                        elif familia == "Pasta Catálogo": variante = ["A4 · preto · 20 envelopes", "A4 · azul · 50 envelopes"][var_index]
                        elif familia == "Pasta Sanfonada": variante = ["A4 · preto · 12 divisórias", "A4 · azul · 31 divisórias"][var_index]
                        elif familia == "Fichário": variante = ["A4 · preto · 2 argolas", "A4 · azul · 4 argolas"][var_index]
                        elif familia == "Caderno Universitário": variante = ["1 matéria · 96 folhas · capa azul", "10 matérias · 200 folhas · capa preta"][var_index]
                        elif familia == "Agenda Diária": variante = ["Permanente A5 · 160 folhas · azul", "Permanente A5 · 192 folhas · preta"][var_index]
                        elif familia == "Bloco de Anotações": variante = ["A6 · pautado · 100 folhas", "A5 · sem pauta · 100 folhas"][var_index]
                        elif familia == "Cola Bastão": variante = ["Uso escolar · tubo 20 g", "Uso profissional · tubo 40 g"][var_index]
                        elif familia == "Cola Instantânea": variante = ["Universal · frasco 5 g", "Alta viscosidade · frasco 20 g"][var_index]
                        elif familia == "Etiqueta Adesiva": variante = ["A4 · 20 etiquetas por folha · pacote 100", "A4 · 10 etiquetas por folha · pacote 100"][var_index]
                        dados = ProdutoCreate(nome=familia, categoria=categoria, marca=marca, especificacao=variante,
                            gtin_ean=ean13(index), estoque_atual=0, estoque_minimo=20 + index % 5 * 10,
                            custo_unitario=Decimal(custo) + Decimal(brand_index * 3 + var_index * 5),
                            margem_lucro_percentual=30 + index % 5 * 5, regime_tributario="lucro_presumido")
                        assert produto_duplicado(db, familia, marca, variante, dados.gtin_ean) is None
                        row = Produto(sku=f"PRD-{index:03d}", nome=familia, categoria=categoria, marca=marca,
                            especificacao=variante, gtin_ean=dados.gtin_ean, estoque_atual=0,
                            estoque_minimo=dados.estoque_minimo, criado_em=abertura, atualizado_em=abertura,
                            **calcular_precificacao_produto(dados))
                        db.add(row)
                        db.flush()
                        produtos.append(row)
                        fornecedor_por_sku[row.sku] = fornecedores[cat_index * 3 + brand_index]
                        auditar(db, modulo="Produtos", acao="cadastrar", entidade="Produto", registro_referencia=row.sku,
                            detalhes=f"[DEMO] {familia} · {marca} · {variante}; código {row.gtin_ean}.")
                        fornecedor = fornecedor_por_sku[row.sku]
                        movimentar(db, row, 100 + index % 7 * 30, "entrada", f"Fornecedor {fornecedor.codigo}: {fornecedor.nome_fantasia}", "Estoque Principal")
        db.commit()
        agenda = []
        # Operações distribuídas mensalmente, com itens e eventos em ordem temporal.
        year, month = 2024, 1
        seq = 0
        while datetime(year, month, 1) <= limite:
            maxday = calendar.monthrange(year, month)[1]
            for day in range(2, min(maxday, 25), 2):
                instante = datetime(year, month, day, 9 + day % 4)
                if instante + timedelta(days=3) > limite:
                    continue
                seq += 1
                client = clientes[seq % len(clientes)]
                chosen = rng.sample(produtos, 2 + seq % 3)
                items = [{"produto_sku": p.sku, "quantidade": rng.randint(4, 28), "valor_unitario": p.preco_venda} for p in chosen]
                target = "cancelado" if seq % 23 == 0 else "devolvido" if seq % 29 == 0 else "entregue"
                agenda.append((instante, "criar", seq, client, items, target))
                agenda.append((instante + timedelta(hours=2), "processando", seq, None, None, target))
                if target == "cancelado":
                    agenda.append((instante + timedelta(hours=4), "cancelado", seq, None, None, target))
                else:
                    agenda.append((instante + timedelta(hours=6), "enviado", seq, None, None, target))
                    agenda.append((instante + timedelta(hours=18 + seq % 38), "entregue", seq, None, None, target))
                    if target == "devolvido":
                        agenda.append((instante + timedelta(days=3), "devolvido", seq, None, None, target))
            year, month = (year + 1, 1) if month == 12 else (year, month + 1)
        mapa = {}
        for relogio, action, seq, client, items, _target in sorted(agenda, key=lambda e: (e[0], e[2])):
            ator = {"codigo": f"USR-{3 + seq % 3:03d}", "nome": ["Rafael Silva", "Carla Almeida", "Felipe Santos"][seq % 3]}
            if action == "criar":
                for item in items:
                    produto = db.get(Produto, item["produto_sku"])
                    if saldo_disponivel(db, produto) < item["quantidade"] + produto.estoque_minimo:
                        fornecedor = fornecedor_por_sku[produto.sku]
                        movimentar(db, produto, 180 + seq % 5 * 20, "entrada", f"Fornecedor {fornecedor.codigo}: {fornecedor.nome_fantasia}", "Estoque Principal")
                        db.flush()
                dados = PedidoCreate(cliente_codigo=client.codigo, cliente_nome=client.nome,
                    destino=f"{client.cidade} - {client.uf}", transportadora=TRANSPORTADORAS[seq % 6],
                    codigo_rastreio=f"SIM-{relogio:%Y}-{seq:05d}", itens=items)
                pedido = criar_pedido(db, dados, auditar, gerar_proximo_codigo_pedido, ator, agora=relogio)
                mapa[seq] = pedido.codigo
            else:
                if action == "entregue":
                    pedido = db.get(Pedido, mapa[seq])
                    for fraction, kind, title in [(0.12, "saiu_cd", "Saiu do centro de distribuição"), (0.28, "em_rota", "Em rota"), (0.80, "proxima_parada", "Próxima parada")]:
                        instant = pedido.enviado_em + (relogio - pedido.enviado_em) * fraction
                        db.add(PedidoEvento(pedido_codigo=pedido.codigo, tipo=f"sim_{kind}", descricao=f"[SIMULADO] {title}.", criado_em=instant))
                        log = auditar(db, modulo="Rastreamento", acao=kind, entidade="Pedido", registro_referencia=pedido.codigo, detalhes=f"[DEMO] {title}; entrega histórica simulada.")
                        log.criado_em = instant
                atualizar_pedido(db, mapa[seq], PedidoStatusUpdate(status=action), auditar, ator, simulado=True, agora=relogio)
        for pedido in db.query(Pedido).all():
            inicio = pedido.enviado_em
            duracao = max(30, int((pedido.entregue_em - inicio).total_seconds())) if pedido.entregue_em and inicio else 360
            db.add(RastreamentoSimulado(pedido_codigo=pedido.codigo, ativo=False, iniciado_em=inicio,
                duracao_segundos=duracao, distancia_km=70 + int(pedido.codigo.split('-')[-1]) % 110,
                ultima_etapa=3 if inicio else -1, motorista="Motorista demonstrativo"))
        db.commit()
        # Pedidos atuais para observar separação, expedição, trânsito e entrega ao vivo.
        relogio = min(limite, datetime.now()).replace(microsecond=0) - timedelta(minutes=45)
        ator = {"codigo": "USR-004", "nome": "Carla Almeida"}
        db.add(BaseDemonstrativa(id=1, ativa=True, descricao="Dados fictícios 2024–2026; transportadora simulada persistente.", criado_em=relogio))
        db.flush()
        for index in range(12):
            client = clientes[index]
            chosen = rng.sample(produtos, 3)
            items = [{"produto_sku": p.sku, "quantidade": 5 + index % 5, "valor_unitario": p.preco_venda} for p in chosen]
            for item in items:
                produto = db.get(Produto, item["produto_sku"])
                if saldo_disponivel(db, produto) < item["quantidade"] + 10:
                    fornecedor = fornecedor_por_sku[produto.sku]
                    movimentar(db, produto, 200, "entrada", f"Fornecedor {fornecedor.codigo}: {fornecedor.nome_fantasia}", "Estoque Principal")
                    db.flush()
            pedido = criar_pedido(db, PedidoCreate(cliente_codigo=client.codigo, cliente_nome=client.nome,
                destino=f"{client.cidade} - {client.uf}", transportadora=TRANSPORTADORAS[index % 6],
                codigo_rastreio=f"SIM-AO-VIVO-{index+1:03d}", itens=items), auditar, gerar_proximo_codigo_pedido, ator, agora=relogio)
            if index >= 4:
                atualizar_pedido(db, pedido.codigo, PedidoStatusUpdate(status="processando"), auditar, ator, simulado=True, agora=relogio + timedelta(minutes=5))
            if index >= 8:
                atualizar_pedido(db, pedido.codigo, PedidoStatusUpdate(status="enviado"), auditar, ator, simulado=True, agora=relogio + timedelta(minutes=10))
            agendar(db, pedido, atraso=0 if index >= 8 else 90 + index * 45, duracao=240 + index * 30)
            db.commit()
        # Consumo interno conciliado para exemplificar alertas de estoque baixo.
        relogio = min(limite, datetime.now()).replace(microsecond=0) - timedelta(minutes=5)
        for produto in produtos[::12]:
            disponivel = saldo_disponivel(db, produto)
            alvo = max(1, produto.estoque_minimo // 3)
            if disponivel > alvo:
                movimentar(db, produto, disponivel - alvo, "saida", "Estoque Principal", "Consumo interno demonstrativo")
        db.commit()
        for year in [2024, 2025, 2026]:
            pedidos = db.query(Pedido).filter(Pedido.criado_em >= datetime(year, 1, 1), Pedido.criado_em < datetime(year + 1, 1, 1)).all()
            if not pedidos: continue
            conteudo = "Pedido;Cliente;Status;Criado em;Total BRL\n" + "\n".join(f"{p.codigo};{p.cliente_nome};{p.status};{p.criado_em:%d/%m/%Y};{p.valor_total}" for p in pedidos)
            relogio = min(datetime(year, 12, 31, 18), limite)
            db.add(RelatorioGerado(nome=f"Pedidos demonstrativos {year}", arquivo=f"pedidos_demo_{year}.csv",
                periodo=str(year), conteudo=conteudo, usuario_codigo="USR-001", gerado_em=relogio))
            auditar(db, modulo="Relatórios", acao="exportar", entidade="Relatorio", registro_referencia=str(year), detalhes=f"[DEMO] Snapshot de pedidos de {year}.")
        db.commit()
        summary = {"periodo": ["2024-01-01", limite.date().isoformat()], "dados_ficticios": True,
            "contagens": {m.__tablename__: db.query(m).count() for m in (Produto, Cliente, Fornecedor, Usuario, Pedido, ItemPedido, PedidoEvento, Movimentacao, Auditoria, RelatorioGerado, RastreamentoSimulado)}}
    engine.dispose()
    import sqlite3
    with sqlite3.connect(destino) as db:
        assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        assert not db.execute("PRAGMA foreign_key_check").fetchall()
        # O saldo físico deve coincidir com a soma de todas as entradas e saídas.
        inconsistentes = db.execute("""SELECT p.sku FROM produtos p LEFT JOIN movimentacoes m ON m.produto_sku=p.sku
            GROUP BY p.sku HAVING p.estoque_atual != COALESCE(SUM(CASE m.tipo WHEN 'entrada' THEN m.quantidade ELSE -m.quantidade END),0)""").fetchall()
        assert not inconsistentes, inconsistentes
        assert not db.execute("SELECT gtin_ean FROM produtos GROUP BY gtin_ean HAVING COUNT(*)>1").fetchall()
    summary["validacao"] = {"integridade": "ok", "relacionamentos": "ok", "saldos_conciliados": True, "codigos_barras_unicos": True}
    if manifest: Path(manifest).write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--destino", required=True)
    parser.add_argument("--ate", default=min(datetime.now().date().isoformat(), "2026-12-31"))
    parser.add_argument("--manifesto")
    parser.add_argument("--portfolio", action="store_true", help="Usar somente a identidade fictícia para distribuição pública.")
    args = parser.parse_args()
    gerar(args.destino, args.ate, args.manifesto, portfolio=args.portfolio)
