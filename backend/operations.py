"""Regras de estoque, reserva e ciclo de vida do pedido."""
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from fastapi import HTTPException
from sqlalchemy import func
from backend.models import Cliente, ItemPedido, Movimentacao, Pedido, PedidoEvento, Produto

TRANSITIONS = {
    "pendente": {"processando", "enviado", "cancelado"},
    "processando": {"enviado", "cancelado"},
    "enviado": {"entregue", "devolvido"},
    "entregue": {"devolvido"}, "cancelado": set(), "devolvido": set(),
}

def reservas(db):
    return dict(db.query(ItemPedido.produto_sku, func.sum(ItemPedido.quantidade))
        .join(Pedido, ItemPedido.pedido_codigo == Pedido.codigo)
        .filter(Pedido.status.in_(["pendente", "processando"]), Pedido.estoque_baixado.is_(False))
        .group_by(ItemPedido.produto_sku).all())

def preencher_saldos(db, produtos):
    mapa = reservas(db)
    for produto in produtos:
        produto.estoque_reservado = int(mapa.get(produto.sku, 0))
    return produtos

def saldo_disponivel(db, produto):
    return produto.estoque_atual - int(reservas(db).get(produto.sku, 0))

def produto_por_sku(db, sku):
    produto = db.get(Produto, sku.strip().upper())
    if produto is None:
        raise HTTPException(404, "Produto não encontrado.")
    return produto

def evento(db, pedido, tipo, descricao, usuario=None, agora=None):
    db.add(PedidoEvento(pedido_codigo=pedido.codigo, tipo=tipo, descricao=descricao,
        usuario_codigo=(usuario or {}).get("codigo"), criado_em=agora or datetime.now()))

def criar_pedido(db, dados, auditar, gerar_codigo, usuario, agora=None, commit=True):
    agora = agora or datetime.now()
    if not dados.cliente_codigo:
        raise HTTPException(400, "Selecione um cliente cadastrado pelo código.")
    cliente = db.get(Cliente, dados.cliente_codigo.strip().upper())
    if cliente is None:
        raise HTTPException(404, "Cliente não encontrado.")
    if cliente.status != "ativo":
        raise HTTPException(409, "Cliente inativo. Ative o cliente antes de criar um pedido.")
    destino = dados.destino.strip()
    if not destino:
        raise HTTPException(400, "Informe o destino do pedido.")
    mapa = reservas(db)
    itens, skus, total = [], set(), Decimal("0.00")
    for item in dados.itens:
        produto = produto_por_sku(db, item.produto_sku)
        if produto.sku in skus:
            raise HTTPException(409, "O mesmo produto não pode aparecer duas vezes.")
        skus.add(produto.sku)
        disponivel = produto.estoque_atual - int(mapa.get(produto.sku, 0))
        if item.quantidade > disponivel:
            raise HTTPException(409, f"Estoque insuficiente para {produto.nome}. Disponível: {disponivel} un.")
        valor = item.valor_unitario.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if valor <= 0:
            raise HTTPException(400, "O preço do item deve ser maior que zero.")
        subtotal = (valor * item.quantidade).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        total += subtotal
        itens.append(ItemPedido(produto_sku=produto.sku, produto_nome=produto.nome, criado_em=agora,
            quantidade=item.quantidade, valor_unitario=valor, subtotal=subtotal))
    pedido = Pedido(codigo=gerar_codigo(db), cliente_codigo=cliente.codigo, cliente_nome=cliente.nome,
        destino=destino, transportadora=(dados.transportadora or "").strip() or None,
        codigo_rastreio=(dados.codigo_rastreio or "").strip() or None,
        status="pendente", estoque_baixado=False, valor_total=total, itens=itens, criado_em=agora, atualizado_em=agora)
    db.add(pedido)
    db.flush()
    evento(db, pedido, "criado", "Pedido criado e estoque reservado; aguardando processamento.", usuario, agora)
    auditar(db, modulo="Pedidos", acao="criar_pedido", entidade="Pedido", registro_referencia=pedido.codigo,
        detalhes=f"Pedido {pedido.codigo} criado para {cliente.nome}. Estoque reservado, sem saída física.")
    if commit:
        db.commit()
        db.refresh(pedido)
    else:
        db.flush()
    return pedido

def atualizar_pedido(db, codigo, dados, auditar, usuario, simulado=False, agora=None, commit=True):
    agora = agora or datetime.now()
    pedido = db.get(Pedido, codigo.strip().upper())
    if pedido is None:
        raise HTTPException(404, "Pedido não encontrado.")
    anterior, novo = pedido.status, dados.status
    if novo != anterior and novo not in TRANSITIONS.get(anterior, set()):
        raise HTTPException(409, f"Transição inválida: {anterior} → {novo}.")
    alteracoes = []
    if novo != anterior:
        if novo == "enviado" and not pedido.estoque_baixado:
            for item in pedido.itens:
                produto = produto_por_sku(db, item.produto_sku)
                if produto.estoque_atual < item.quantidade:
                    raise HTTPException(409, "Saldo físico insuficiente para expedir o pedido.")
                antes = produto.estoque_atual
                produto.estoque_atual -= item.quantidade
                db.add(Movimentacao(produto_sku=produto.sku, produto_nome=produto.nome, tipo="saida",
                    quantidade=item.quantidade, origem="Estoque Principal", destino=f"Expedição {pedido.codigo}",
                    saldo_anterior=antes, saldo_posterior=produto.estoque_atual, criado_em=agora))
            pedido.estoque_baixado = True
        elif novo in {"cancelado", "devolvido"} and pedido.estoque_baixado:
            for item in pedido.itens:
                produto = db.get(Produto, item.produto_sku)
                if produto is None:
                    raise HTTPException(409, f"Estorno bloqueado: o produto {item.produto_sku} ({item.produto_nome}) foi removido do cadastro. Concilie o item com o estoque antes de cancelar ou registrar a devolução; nenhum saldo foi alterado.")
                antes = produto.estoque_atual
                produto.estoque_atual += item.quantidade
                db.add(Movimentacao(produto_sku=produto.sku, produto_nome=produto.nome, tipo="entrada",
                    quantidade=item.quantidade, origem=f"{'Devolução recebida' if novo == 'devolvido' else 'Estorno de pedido legado'} {pedido.codigo}",
                    destino="Estoque Principal", saldo_anterior=antes, saldo_posterior=produto.estoque_atual, criado_em=agora))
            pedido.estoque_baixado = False
        pedido.status = novo
        setattr(pedido, {"processando": "processado_em", "enviado": "enviado_em", "entregue": "entregue_em",
            "cancelado": "cancelado_em", "devolvido": "devolvido_em"}[novo], agora)
        descricao = {
            "processando": "Separação e conferência iniciadas.", "enviado": "Expedição registrada; saída física do estoque.",
            "entregue": "Entrega confirmada pelo operador.", "cancelado": "Pedido cancelado; estoque liberado.",
            "devolvido": "Devolução integral recebida e unidades reintegradas ao estoque.",
        }[novo]
        if simulado:
            descricao = "[SIMULADO] " + ("Entrega concluída pelo simulador de transporte." if novo == "entregue" else descricao)
        evento(db, pedido, novo, descricao, usuario, agora)
        alteracoes.append(f"{anterior} → {novo}")
    for campo in ("transportadora", "codigo_rastreio"):
        if campo in dados.model_fields_set:
            valor = (getattr(dados, campo) or "").strip() or None
            if getattr(pedido, campo) != valor:
                if anterior in {"cancelado", "devolvido"}:
                    raise HTTPException(409, "Pedido encerrado não permite alteração do transporte.")
                setattr(pedido, campo, valor)
                alteracoes.append(f"{campo} atualizado")
    if alteracoes:
        # As datas de expedição/entrega são próprias, independentes desta atualização.
        pedido.atualizado_em = agora
        if anterior == novo:
            evento(db, pedido, "transporte", "; ".join(alteracoes), usuario, agora)
        auditar(db, modulo="Pedidos", acao="atualizar_pedido", entidade="Pedido",
            registro_referencia=pedido.codigo, detalhes=("[SIMULADO] " if simulado else "") + "; ".join(alteracoes))
        if commit:
            db.commit()
            db.refresh(pedido)
        else:
            db.flush()
    return pedido
