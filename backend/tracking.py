"""Transportadora simulada persistente, exclusiva de bancos marcados como demonstração."""
import asyncio
import logging
import os
import csv
import io
from contextlib import suppress
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db, SessionLocal
from backend.config import TRACKING_WORKER
from backend.models import BaseDemonstrativa, Pedido, PedidoEvento, RastreamentoSimulado, RelatorioGerado, Produto
from backend.operations import atualizar_pedido, criar_pedido, saldo_disponivel
from backend.schemas import PedidoStatusUpdate, PedidoCreate
from backend.reports import proteger_csv

STAGES = [
    (0.0, "coletado", "Pedido coletado", "Coleta realizada no centro de distribuição."),
    (0.12, "saiu_cd", "Saiu do centro de distribuição", "Veículo liberado para a entrega."),
    (0.28, "em_rota", "Em rota", "Veículo a caminho do destino."),
    (0.80, "proxima_parada", "Próxima parada", "Veículo próximo ao endereço de entrega."),
]

def demonstrativa(db):
    config = db.get(BaseDemonstrativa, 1)
    return bool(config and config.ativa)

def agendar(db, pedido, atraso=0, duracao=360):
    if not demonstrativa(db) or pedido.status not in {"pendente", "processando", "enviado"}:
        return None
    registro = db.get(RastreamentoSimulado, pedido.codigo)
    if registro is None:
        numero = int(''.join(c for c in pedido.codigo if c.isdigit()) or 1)
        registro = RastreamentoSimulado(pedido_codigo=pedido.codigo, ativo=True,
            atraso_segundos=atraso, duracao_segundos=duracao, distancia_km=70 + numero % 110,
            motorista=["Carlos Silva", "Ana Oliveira", "Marcos Souza", "Patrícia Lima"][numero % 4])
        db.add(registro)
        db.flush()
    return registro

def estado(pedido, registro, now=None):
    now = now or datetime.now()
    if not registro:
        return {"simulado": False, "ativo": False, "progresso": 0}
    elapsed = max(0, (now - registro.iniciado_em).total_seconds()) if registro.iniciado_em else 0
    progress = min(1, elapsed / registro.duracao_segundos)
    if pedido.entregue_em:
        progress = 1
    stage = "Aguardando expedição" if not registro.iniciado_em else "Em rota"
    if progress >= 1:
        stage = "Entregue"
    elif progress >= .8:
        stage = "Próxima parada"
    elif progress < .12 and registro.iniciado_em:
        stage = "Pedido coletado"
    elif progress < .28 and registro.iniciado_em:
        stage = "Saiu do centro de distribuição"
    if pedido.status in {"cancelado", "devolvido"}:
        stage = {"cancelado": "Cancelado", "devolvido": "Devolvido"}[pedido.status]
    return {"simulado": True, "ativo": registro.ativo, "progresso": progress,
        "etapa": stage, "duracao_segundos": registro.duracao_segundos,
        "restante_segundos": max(0, registro.duracao_segundos - elapsed) if registro.iniciado_em else registro.duracao_segundos,
        "distancia_km": registro.distancia_km, "motorista": registro.motorista,
        "previsao": (registro.iniciado_em + timedelta(seconds=registro.duracao_segundos)).isoformat() if registro.iniciado_em else None,
        "destino": pedido.destino, "transportadora": pedido.transportadora, "erro": registro.erro}

def avancar(db, pedido, registro, auditar, now):
    def audit(**kwargs):
        return auditar(db, usuario_nome="Transportadora simulada", **kwargs)
    def mudar(status):
        atualizar_pedido(db, pedido.codigo, PedidoStatusUpdate(status=status,
            transportadora=pedido.transportadora or "NexoLog Express",
            codigo_rastreio=pedido.codigo_rastreio or f"SIM-{pedido.codigo}"),
            lambda _db, **kwargs: audit(**kwargs), None, simulado=True, agora=now, commit=False)
    if pedido.status in {"cancelado", "devolvido", "entregue"}:
        registro.ativo = False
        db.commit()
        return
    if not registro.inicio_previsto:
        registro.inicio_previsto = now + timedelta(seconds=registro.atraso_segundos)
    if now < registro.inicio_previsto:
        db.commit()
        return
    if pedido.status == "pendente":
        mudar("processando")
        registro.inicio_previsto = now + timedelta(seconds=15)
        db.commit()
        return
    if pedido.status == "processando":
        mudar("enviado")
    if not registro.iniciado_em:
        registro.iniciado_em = now
    elapsed = max(0, (now - registro.iniciado_em).total_seconds())
    progress = min(1, elapsed / registro.duracao_segundos)
    for index, (threshold, kind, title, description) in enumerate(STAGES):
        if index > registro.ultima_etapa and progress >= threshold:
            instant = registro.iniciado_em + timedelta(seconds=threshold * registro.duracao_segundos)
            db.add(PedidoEvento(pedido_codigo=pedido.codigo, tipo=f"sim_{kind}",
                descricao=f"[SIMULADO] {title}: {description}", criado_em=instant))
            log = audit(modulo="Rastreamento", acao=kind, entidade="Pedido",
                registro_referencia=pedido.codigo, detalhes=f"[SIMULADO] {title}. Transporte: {pedido.transportadora}.")
            log.criado_em = instant
            registro.ultima_etapa = index
    if progress >= 1:
        mudar("entregue")
        registro.ativo = False
        output = io.StringIO()
        writer = csv.writer(output, delimiter=";", lineterminator="\n")
        writer.writerow(["Entrega simulada", "Cliente", "Destino", "Transportadora", "Motorista", "Expedição", "Entrega", "Valor BRL"])
        writer.writerow([pedido.codigo, pedido.cliente_nome, pedido.destino, pedido.transportadora,
            registro.motorista, pedido.enviado_em.isoformat(), pedido.entregue_em.isoformat(), f"{pedido.valor_total:.2f}"])
        writer.writerow([])
        writer.writerow(["SKU", "Produto", "Quantidade", "Preço unitário BRL", "Subtotal BRL"])
        for item in pedido.itens:
            writer.writerow([item.produto_sku, item.produto_nome, item.quantidade, item.valor_unitario, item.subtotal])
        writer.writerow([])
        writer.writerow(["Etapa simulada", "Data e hora"])
        for item in db.query(PedidoEvento).filter_by(pedido_codigo=pedido.codigo).order_by(PedidoEvento.criado_em).all():
            writer.writerow([item.descricao, item.criado_em.isoformat()])
        relatorio = RelatorioGerado(nome=f"Entrega simulada {pedido.codigo}", arquivo=f"entrega_simulada_{pedido.codigo}.csv",
            periodo=now.date().isoformat(), conteudo=proteger_csv(output.getvalue()), gerado_em=now)
        db.add(relatorio)
        audit(modulo="Relatórios", acao="gerar_entrega_simulada", entidade="Relatorio",
            registro_referencia=pedido.codigo, detalhes=f"[SIMULADO] Relatório automático da entrega {pedido.codigo}.")
    db.commit()

def executar_tick(auditar, factory=SessionLocal, now=None):
    with factory() as db:
        if not demonstrativa(db):
            return
        codigos = [row[0] for row in db.query(RastreamentoSimulado.pedido_codigo).filter_by(ativo=True).all()]
    for codigo in codigos:
        with factory() as db:
            try:
                db.connection().exec_driver_sql("BEGIN IMMEDIATE")
                if not demonstrativa(db):
                    return
                registro = db.get(RastreamentoSimulado, codigo)
                pedido = db.get(Pedido, codigo)
                if registro and pedido and registro.ativo:
                    avancar(db, pedido, registro, auditar, now or datetime.now())
            except Exception as error:
                db.rollback()
                logging.getLogger(__name__).exception("Falha no rastreamento simulado de %s", codigo)
                registro = db.get(RastreamentoSimulado, codigo)
                if registro:
                    registro.ativo = False
                    registro.erro = str(getattr(error, "detail", error))[:250]
                    auditar(db, modulo="Rastreamento", acao="interrompido", entidade="Pedido",
                        registro_referencia=codigo, usuario_nome="Transportadora simulada",
                        detalhes=f"[SIMULADO] Interrompido: {registro.erro}")
                    db.commit()

def instalar_rastreamento(app, auditar):
    @app.get("/api/pedidos/{codigo}/rastreamento", tags=["Rastreamento"])
    def consultar(codigo: str, db: Session = Depends(get_db)):
        pedido = db.get(Pedido, codigo.upper())
        if not pedido:
            raise HTTPException(404, "Pedido não encontrado.")
        return estado(pedido, db.get(RastreamentoSimulado, pedido.codigo))

    @app.post("/api/pedidos/{codigo}/rastreamento-simulado", tags=["Rastreamento"])
    def iniciar(codigo: str, db: Session = Depends(get_db)):
        if not demonstrativa(db):
            raise HTTPException(409, "A automação persistente é exclusiva da base demonstrativa.")
        pedido = db.get(Pedido, codigo.upper())
        if not pedido:
            raise HTTPException(404, "Pedido não encontrado.")
        registro = agendar(db, pedido)
        if not registro:
            raise HTTPException(409, "Pedido encerrado não pode iniciar outra entrega.")
        if registro.erro:
            raise HTTPException(409, "Concilie o motivo da interrupção antes de iniciar novamente.")
        db.commit()
        return estado(pedido, registro)

    @app.post("/api/pedidos/{codigo}/nova-entrega-demonstrativa", status_code=201, tags=["Rastreamento"])
    def repetir(codigo: str, db: Session = Depends(get_db)):
        if not demonstrativa(db):
            raise HTTPException(409, "Disponível apenas na base demonstrativa.")
        original = db.get(Pedido, codigo.upper())
        if not original:
            raise HTTPException(404, "Pedido não encontrado.")
        if original.status not in {"entregue", "cancelado", "devolvido"}:
            raise HTTPException(409, "Aguarde o encerramento desta entrega.")
        itens = []
        for item in original.itens:
            produto = db.get(Produto, item.produto_sku)
            disponivel = saldo_disponivel(db, produto) if produto else 0
            if disponivel > 0:
                itens.append({"produto_sku": item.produto_sku, "quantidade": min(5, item.quantidade, disponivel), "valor_unitario": produto.preco_venda})
        if not itens:
            raise HTTPException(409, "Reponha o estoque antes de criar outra entrega.")
        from backend.main import gerar_proximo_codigo_pedido, usuario_contexto
        novo = criar_pedido(db, PedidoCreate(cliente_codigo=original.cliente_codigo, cliente_nome=original.cliente_nome,
            destino=original.destino, transportadora=original.transportadora, itens=itens), auditar,
            gerar_proximo_codigo_pedido, usuario_contexto.get(), commit=False)
        novo.codigo_rastreio = f"SIM-{novo.codigo}"
        agendar(db, novo, duracao=180)
        auditar(db, modulo="Rastreamento", acao="nova_demonstracao", entidade="Pedido", registro_referencia=novo.codigo,
            detalhes=f"[SIMULADO] Nova entrega criada a partir de {original.codigo}; histórico anterior preservado.")
        db.commit()
        return {"codigo": novo.codigo}

    async def acompanhar():
        while True:
            try:
                await asyncio.to_thread(executar_tick, auditar)
            except Exception:
                logging.getLogger(__name__).exception("Falha no serviço de demonstração")
            await asyncio.sleep(2)

    @app.on_event("startup")
    async def iniciar_servico():
        app.state.rastreamento_task = asyncio.create_task(acompanhar()) if TRACKING_WORKER else None

    @app.on_event("shutdown")
    async def parar_servico():
        task = app.state.rastreamento_task
        if task is None:
            return
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task
