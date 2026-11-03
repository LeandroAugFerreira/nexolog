# ============================================================
# LOGIFLOW
# CARGA HISTÓRICA DEMONSTRATIVA
# ============================================================
#
# Objetivo:
# - criar histórico de 11 meses anteriores ao mês atual;
# - manter o mês atual intacto;
# - preservar exatamente o estoque atual de cada produto;
# - criar pedidos históricos coerentes com as saídas;
# - criar entradas de reposição coerentes com o saldo;
# - evitar duplicação da carga;
# - criar backup automático antes de qualquer alteração.
#
# Execução a partir da raiz do projeto:
#
# python -m scripts.popular_historico_demo
#
# ============================================================

from __future__ import annotations

import json
import random
import shutil

from collections import defaultdict

from datetime import (
    datetime,
    timedelta,
)

from decimal import (
    Decimal,
    ROUND_HALF_UP,
)

from pathlib import Path


from backend.database import (
    DATABASE_PATH,
    SessionLocal,
)

from backend.models import (
    Auditoria,
    Cliente,
    Fornecedor,
    ItemPedido,
    Movimentacao,
    Pedido,
    Produto,
)


# ============================================================
# CONFIGURAÇÕES
# ============================================================

MARCADOR_CARGA = (
    "HISTORICO-DEMO-12M-V1"
)

SEMENTE_ALEATORIA = (
    260927
)

QUANTIDADE_MESES_HISTORICOS = (
    11
)

PEDIDOS_POR_MES = [
    2,
    2,
    3,
    2,
    3,
    2,
    3,
    2,
    3,
    3,
    3,
]

TRANSPORTADORAS = [
    "Loggi",
    "Jadlog",
    "Total Express",
    "Correios",
    "Azul Cargo",
]

QUANTIDADES_BASE = {
    "PRD-001": (
        8,
        30,
    ),
    "PRD-002": (
        12,
        60,
    ),
    "PRD-003": (
        3,
        15,
    ),
    "PRD-004": (
        5,
        24,
    ),
    "PRD-005": (
        6,
        28,
    ),
    "PRD-006": (
        2,
        12,
    ),
    "PRD-007": (
        2,
        10,
    ),
    "PRD-008": (
        1,
        5,
    ),
    "PRD-009": (
        1,
        6,
    ),
    "PRD-010": (
        1,
        4,
    ),
}

PESOS_PRODUTOS = {
    "PRD-001":
        1.60,

    "PRD-002":
        1.70,

    "PRD-003":
        1.35,

    "PRD-004":
        1.15,

    "PRD-005":
        1.10,

    "PRD-006":
        0.90,

    "PRD-007":
        0.85,

    "PRD-008":
        0.70,

    "PRD-009":
        0.65,

    "PRD-010":
        0.60,
}


# ============================================================
# AUXILIARES
# ============================================================

def dinheiro(
    valor,
) -> Decimal:

    return (
        Decimal(
            str(
                valor,
            )
        )
        .quantize(
            Decimal(
                "0.01"
            ),
            rounding=(
                ROUND_HALF_UP
            ),
        )
    )


def primeiro_dia_mes(
    data: datetime,
) -> datetime:

    return datetime(
        data.year,
        data.month,
        1,
        0,
        0,
        0,
        0,
    )


def adicionar_meses(
    data: datetime,
    quantidade: int,
) -> datetime:

    indice_mes = (
        data.year *
        12 +
        (
            data.month -
            1
        ) +
        quantidade
    )

    ano = (
        indice_mes //
        12
    )

    mes = (
        indice_mes %
        12 +
        1
    )

    return datetime(
        ano,
        mes,
        1,
    )


def ultimo_dia_mes(
    inicio_mes: datetime,
) -> datetime:

    proximo_mes = (
        adicionar_meses(
            inicio_mes,
            1,
        )
    )

    return (
        proximo_mes -
        timedelta(
            microseconds=1,
        )
    )


def fator_sazonal(
    mes: int,
) -> float:

    fatores = {
        1:
            1.45,

        2:
            1.65,

        3:
            1.15,

        4:
            1.00,

        5:
            0.95,

        6:
            0.90,

        7:
            0.92,

        8:
            1.20,

        9:
            1.08,

        10:
            1.00,

        11:
            1.10,

        12:
            0.82,
    }

    return (
        fatores.get(
            mes,
            1.0,
        )
    )


def destino_cliente(
    cliente: Cliente,
) -> str:

    cidade = (
        cliente.cidade
        or "Campinas"
    )

    uf = (
        cliente.uf
        or "SP"
    )

    return (
        f"{cidade}/{uf}"
    )


def nome_fornecedor(
    fornecedor: Fornecedor,
) -> str:

    return (
        fornecedor.nome_fantasia
        or fornecedor.razao_social
        or fornecedor.codigo
    )


def proximo_codigo_numerico_pedido(
    pedidos: list[
        Pedido
    ],
) -> int:

    maior = 0

    for pedido in pedidos:
        try:
            numero = int(
                pedido.codigo
                .replace(
                    "PED-",
                    "",
                )
            )

            maior = max(
                maior,
                numero,
            )

        except (
            ValueError,
            AttributeError,
        ):
            continue

    return (
        maior +
        1
    )


def criar_backup() -> Path:

    raiz_projeto = (
        DATABASE_PATH
        .resolve()
        .parent
        .parent
    )

    pasta_backup = (
        raiz_projeto /
        "backup"
    )

    pasta_backup.mkdir(
        parents=True,
        exist_ok=True,
    )

    agora = (
        datetime.now()
    )

    destino = (
        pasta_backup /
        (
            "logiflow_antes_historico_"
            f"{agora:%Y%m%d_%H%M%S}.db"
        )
    )

    shutil.copy2(
        DATABASE_PATH,
        destino,
    )

    return destino


def validar_sem_historico_anterior(
    movimentacoes: list[
        Movimentacao
    ],
    inicio_mes_atual: datetime,
):
    """
    Esta carga foi desenhada para o banco demo atual.

    Se já houver movimentações anteriores ao mês atual,
    interrompemos para não misturar dois históricos diferentes.
    """

    antigas = [
        movimentacao
        for movimentacao in
        movimentacoes
        if (
            movimentacao.criado_em <
            inicio_mes_atual
        )
    ]

    if (
        antigas
    ):
        primeira = min(
            antigas,
            key=lambda item:
                item.criado_em,
        )

        raise RuntimeError(
            "O banco já possui movimentações anteriores "
            "ao mês atual. A carga histórica foi cancelada "
            "para evitar duplicidade ou quebra de saldo. "
            f"Primeiro registro encontrado: "
            f"{primeira.criado_em:%d/%m/%Y}."
        )


def calcular_saldo_anterior_necessario(
    produto: Produto,
    movimentacoes_mes_atual: list[
        Movimentacao
    ],
) -> int:

    saldo = (
        produto.estoque_atual
    )

    # Voltamos do estoque atual para o saldo existente
    # antes da primeira movimentação do mês atual.
    for movimentacao in sorted(
        movimentacoes_mes_atual,
        key=lambda item: (
            item.criado_em,
            item.id,
        ),
        reverse=True,
    ):
        if (
            movimentacao.tipo ==
            "entrada"
        ):
            saldo -= (
                movimentacao.quantidade
            )

        else:
            saldo += (
                movimentacao.quantidade
            )

    if (
        saldo <
        0
    ):
        raise RuntimeError(
            f"Não foi possível reconstruir o saldo anterior "
            f"de {produto.sku}. Saldo calculado: {saldo}."
        )

    return saldo


def validar_cauda_existente(
    produto: Produto,
    saldo_inicial: int,
    movimentacoes_mes_atual: list[
        Movimentacao
    ],
):
    """
    Garante que o histórico novo terminará exatamente no saldo
    de onde as movimentações já existentes começam.
    """

    saldo = (
        saldo_inicial
    )

    for movimentacao in sorted(
        movimentacoes_mes_atual,
        key=lambda item: (
            item.criado_em,
            item.id,
        ),
    ):
        if (
            movimentacao.saldo_anterior !=
            saldo
        ):
            raise RuntimeError(
                f"Inconsistência detectada em {produto.sku}. "
                f"A movimentação #{movimentacao.id} espera saldo "
                f"{movimentacao.saldo_anterior}, mas o saldo "
                f"reconstruído é {saldo}."
            )

        if (
            movimentacao.tipo ==
            "entrada"
        ):
            saldo += (
                movimentacao.quantidade
            )

        else:
            saldo -= (
                movimentacao.quantidade
            )

        if (
            saldo !=
            movimentacao.saldo_posterior
        ):
            raise RuntimeError(
                f"Inconsistência no saldo posterior da "
                f"movimentação #{movimentacao.id} "
                f"({produto.sku})."
            )

    if (
        saldo !=
        produto.estoque_atual
    ):
        raise RuntimeError(
            f"O saldo final reconstruído de {produto.sku} "
            f"é {saldo}, mas o cadastro do produto possui "
            f"{produto.estoque_atual}."
        )


def escolher_produtos(
    rng: random.Random,
    produtos: list[
        Produto
    ],
    quantidade: int,
) -> list[
    Produto
]:

    disponiveis = (
        produtos.copy()
    )

    escolhidos = []

    while (
        disponiveis and
        len(
            escolhidos
        ) <
        quantidade
    ):
        pesos = [
            PESOS_PRODUTOS.get(
                produto.sku,
                1.0,
            )
            for produto in
            disponiveis
        ]

        escolhido = (
            rng.choices(
                disponiveis,
                weights=pesos,
                k=1,
            )[0]
        )

        escolhidos.append(
            escolhido,
        )

        disponiveis.remove(
            escolhido,
        )

    return escolhidos


def quantidade_item(
    rng: random.Random,
    produto: Produto,
    fator: float,
) -> int:

    minimo, maximo = (
        QUANTIDADES_BASE.get(
            produto.sku,
            (
                1,
                10,
            ),
        )
    )

    quantidade = (
        rng.randint(
            minimo,
            maximo,
        )
    )

    quantidade = max(
        1,
        round(
            quantidade *
            fator
        ),
    )

    return quantidade


def fator_preco_historico(
    rng: random.Random,
) -> Decimal:

    # Pequena oscilação comercial de -4% a +3%.
    percentual = (
        rng.randint(
            -4,
            3,
        )
    )

    return (
        Decimal(
            "1"
        ) +
        Decimal(
            percentual
        ) /
        Decimal(
            "100"
        )
    )


def percentual_buffer(
    indice_mes: int,
) -> Decimal:

    if (
        indice_mes <=
        1
    ):
        return Decimal(
            "0.00"
        )

    if (
        indice_mes <=
        4
    ):
        return Decimal(
            "0.25"
        )

    if (
        indice_mes <=
        7
    ):
        return Decimal(
            "0.50"
        )

    if (
        indice_mes <=
        9
    ):
        return Decimal(
            "0.75"
        )

    return Decimal(
        "1.00"
    )


# ============================================================
# PRINCIPAL
# ============================================================

def main():

    rng = random.Random(
        SEMENTE_ALEATORIA,
    )

    db = (
        SessionLocal()
    )

    try:
        # ====================================================
        # EVITAR DUPLICAÇÃO
        # ====================================================

        carga_existente = (
            db.query(
                Auditoria,
            )
            .filter(
                Auditoria.modulo ==
                "Sistema",
                Auditoria.acao ==
                "carga_historica_demo",
                Auditoria.registro_referencia ==
                MARCADOR_CARGA,
            )
            .first()
        )

        if (
            carga_existente is not None
        ):
            print(
                "A carga histórica demonstrativa "
                "já foi executada neste banco."
            )

            print(
                "Nenhuma alteração foi realizada."
            )

            return

        # ====================================================
        # DADOS ATUAIS
        # ====================================================

        produtos = (
            db.query(
                Produto,
            )
            .order_by(
                Produto.sku.asc(),
            )
            .all()
        )

        clientes = (
            db.query(
                Cliente,
            )
            .order_by(
                Cliente.codigo.asc(),
            )
            .all()
        )

        fornecedores = (
            db.query(
                Fornecedor,
            )
            .filter(
                Fornecedor.status ==
                "ativo",
            )
            .order_by(
                Fornecedor.codigo.asc(),
            )
            .all()
        )

        pedidos_existentes = (
            db.query(
                Pedido,
            )
            .all()
        )

        movimentacoes_existentes = (
            db.query(
                Movimentacao,
            )
            .order_by(
                Movimentacao.criado_em.asc(),
                Movimentacao.id.asc(),
            )
            .all()
        )

        if (
            not produtos
        ):
            raise RuntimeError(
                "Nenhum produto encontrado."
            )

        if (
            not clientes
        ):
            raise RuntimeError(
                "Nenhum cliente encontrado."
            )

        if (
            not fornecedores
        ):
            raise RuntimeError(
                "Nenhum fornecedor ativo encontrado."
            )

        # ====================================================
        # JANELA HISTÓRICA
        # ====================================================

        agora = (
            datetime.now()
        )

        inicio_mes_atual = (
            primeiro_dia_mes(
                agora,
            )
        )

        validar_sem_historico_anterior(
            movimentacoes_existentes,
            inicio_mes_atual,
        )

        meses = [
            adicionar_meses(
                inicio_mes_atual,
                deslocamento,
            )
            for deslocamento in
            range(
                -QUANTIDADE_MESES_HISTORICOS,
                0,
            )
        ]

        # ====================================================
        # SALDO QUE O HISTÓRICO PRECISA ENTREGAR
        # ====================================================

        movimentos_mes_atual_por_sku = (
            defaultdict(
                list,
            )
        )

        for movimentacao in (
            movimentacoes_existentes
        ):
            if (
                movimentacao.criado_em >=
                inicio_mes_atual
            ):
                movimentos_mes_atual_por_sku[
                    movimentacao.produto_sku
                ].append(
                    movimentacao,
                )

        saldo_alvo_historico = {}

        for produto in (
            produtos
        ):
            saldo_alvo = (
                calcular_saldo_anterior_necessario(
                    produto,
                    movimentos_mes_atual_por_sku[
                        produto.sku
                    ],
                )
            )

            validar_cauda_existente(
                produto,
                saldo_alvo,
                movimentos_mes_atual_por_sku[
                    produto.sku
                ],
            )

            saldo_alvo_historico[
                produto.sku
            ] = (
                saldo_alvo
            )

        # ====================================================
        # BACKUP
        # ====================================================

        backup = (
            criar_backup()
        )

        print(
            f"Backup criado em: {backup}"
        )

        # ====================================================
        # GERAR PEDIDOS HISTÓRICOS
        # ====================================================

        proximo_codigo = (
            proximo_codigo_numerico_pedido(
                pedidos_existentes,
            )
        )

        pedidos_novos = []

        itens_por_mes_sku = (
            defaultdict(
                list,
            )
        )

        total_pedidos = 0

        total_itens = 0

        for indice_mes, inicio_mes in enumerate(
            meses
        ):
            quantidade_pedidos = (
                PEDIDOS_POR_MES[
                    indice_mes %
                    len(
                        PEDIDOS_POR_MES
                    )
                ]
            )

            fator_mes = (
                fator_sazonal(
                    inicio_mes.month,
                )
            )

            for numero_pedido_mes in range(
                quantidade_pedidos
            ):
                dia = (
                    8 +
                    numero_pedido_mes *
                    5 +
                    rng.randint(
                        0,
                        3,
                    )
                )

                ultimo_dia = (
                    ultimo_dia_mes(
                        inicio_mes,
                    ).day
                )

                dia = min(
                    dia,
                    ultimo_dia -
                    2,
                )

                data_pedido = (
                    inicio_mes.replace(
                        day=dia,
                        hour=(
                            9 +
                            rng.randint(
                                0,
                                7,
                            )
                        ),
                        minute=(
                            rng.choice(
                                [
                                    0,
                                    10,
                                    20,
                                    30,
                                    40,
                                    50,
                                ]
                            )
                        ),
                    )
                )

                cliente = (
                    rng.choice(
                        clientes,
                    )
                )

                codigo = (
                    f"PED-{proximo_codigo:03d}"
                )

                proximo_codigo += (
                    1
                )

                quantidade_produtos = (
                    rng.choices(
                        [
                            1,
                            2,
                            3,
                        ],
                        weights=[
                            0.25,
                            0.50,
                            0.25,
                        ],
                        k=1,
                    )[0]
                )

                produtos_pedido = (
                    escolher_produtos(
                        rng,
                        produtos,
                        quantidade_produtos,
                    )
                )

                pedido = Pedido(
                    codigo=codigo,
                    cliente_nome=(
                        cliente.nome
                    ),
                    destino=(
                        destino_cliente(
                            cliente,
                        )
                    ),
                    transportadora=(
                        rng.choice(
                            TRANSPORTADORAS,
                        )
                    ),
                    codigo_rastreio=(
                        "LF"
                        f"{data_pedido:%y%m}"
                        f"{proximo_codigo:05d}"
                    ),
                    status="entregue",
                    valor_total=(
                        Decimal(
                            "0.00"
                        )
                    ),
                    criado_em=(
                        data_pedido
                    ),
                    atualizado_em=(
                        data_pedido +
                        timedelta(
                            days=(
                                rng.randint(
                                    2,
                                    7,
                                )
                            ),
                        )
                    ),
                )

                db.add(
                    pedido,
                )

                valor_total = (
                    Decimal(
                        "0.00"
                    )
                )

                for produto in (
                    produtos_pedido
                ):
                    quantidade = (
                        quantidade_item(
                            rng,
                            produto,
                            fator_mes,
                        )
                    )

                    preco_base = (
                        dinheiro(
                            produto.preco_venda
                        )
                    )

                    preco_historico = (
                        dinheiro(
                            preco_base *
                            fator_preco_historico(
                                rng,
                            )
                        )
                    )

                    subtotal = (
                        dinheiro(
                            preco_historico *
                            quantidade
                        )
                    )

                    item = ItemPedido(
                        pedido_codigo=(
                            codigo
                        ),
                        produto_sku=(
                            produto.sku
                        ),
                        produto_nome=(
                            produto.nome
                        ),
                        quantidade=(
                            quantidade
                        ),
                        valor_unitario=(
                            preco_historico
                        ),
                        subtotal=(
                            subtotal
                        ),
                        criado_em=(
                            data_pedido
                        ),
                    )

                    db.add(
                        item,
                    )

                    valor_total += (
                        subtotal
                    )

                    itens_por_mes_sku[
                        (
                            indice_mes,
                            produto.sku,
                        )
                    ].append({
                        "data":
                            data_pedido,

                        "pedido_codigo":
                            codigo,

                        "produto":
                            produto,

                        "quantidade":
                            quantidade,
                    })

                    total_itens += (
                        1
                    )

                pedido.valor_total = (
                    dinheiro(
                        valor_total
                    )
                )

                pedidos_novos.append(
                    pedido,
                )

                total_pedidos += (
                    1
                )

        # ====================================================
        # GERAR MOVIMENTAÇÕES COERENTES
        # ====================================================

        saldos = {
            produto.sku:
                0
            for produto in
            produtos
        }

        movimentacoes_novas = []

        total_entradas = 0

        total_saidas = 0

        for indice_mes, inicio_mes in enumerate(
            meses
        ):
            # -----------------------------------------------
            # ENTRADAS / REPOSIÇÕES
            # -----------------------------------------------

            for indice_produto, produto in enumerate(
                produtos
            ):
                eventos_saida = (
                    itens_por_mes_sku.get(
                        (
                            indice_mes,
                            produto.sku,
                        ),
                        [],
                    )
                )

                total_saida_mes = sum(
                    evento[
                        "quantidade"
                    ]
                    for evento in
                    eventos_saida
                )

                saldo_final_alvo = (
                    saldo_alvo_historico[
                        produto.sku
                    ]
                )

                buffer_desejado = int(
                    (
                        Decimal(
                            saldo_final_alvo
                        ) *
                        percentual_buffer(
                            indice_mes,
                        )
                    )
                    .quantize(
                        Decimal(
                            "1"
                        ),
                        rounding=(
                            ROUND_HALF_UP
                        ),
                    )
                )

                saldo_atual = (
                    saldos[
                        produto.sku
                    ]
                )

                entrada_necessaria = max(
                    0,
                    (
                        total_saida_mes +
                        buffer_desejado -
                        saldo_atual
                    ),
                )

                # No último mês histórico garantimos exatamente
                # o saldo necessário para encaixar no mês atual.
                if (
                    indice_mes ==
                    len(
                        meses
                    ) -
                    1
                ):
                    entrada_necessaria = max(
                        0,
                        (
                            total_saida_mes +
                            saldo_final_alvo -
                            saldo_atual
                        ),
                    )

                if (
                    entrada_necessaria >
                    0
                ):
                    fornecedor = (
                        fornecedores[
                            (
                                indice_produto +
                                indice_mes
                            ) %
                            len(
                                fornecedores
                            )
                        ]
                    )

                    data_entrada = (
                        inicio_mes.replace(
                            day=(
                                3 +
                                (
                                    indice_produto %
                                    3
                                )
                            ),
                            hour=(
                                8 +
                                (
                                    indice_produto %
                                    4
                                )
                            ),
                            minute=0,
                        )
                    )

                    saldo_anterior = (
                        saldos[
                            produto.sku
                        ]
                    )

                    saldo_posterior = (
                        saldo_anterior +
                        entrada_necessaria
                    )

                    movimentacao = Movimentacao(
                        produto_sku=(
                            produto.sku
                        ),
                        produto_nome=(
                            produto.nome
                        ),
                        tipo="entrada",
                        quantidade=(
                            entrada_necessaria
                        ),
                        origem=(
                            nome_fornecedor(
                                fornecedor,
                            )
                        ),
                        destino=(
                            "Estoque Principal"
                        ),
                        saldo_anterior=(
                            saldo_anterior
                        ),
                        saldo_posterior=(
                            saldo_posterior
                        ),
                        criado_em=(
                            data_entrada
                        ),
                    )

                    db.add(
                        movimentacao,
                    )

                    movimentacoes_novas.append(
                        movimentacao,
                    )

                    saldos[
                        produto.sku
                    ] = (
                        saldo_posterior
                    )

                    total_entradas += (
                        entrada_necessaria
                    )

            # -----------------------------------------------
            # SAÍDAS DOS PEDIDOS
            # -----------------------------------------------

            saidas_mes = []

            for produto in (
                produtos
            ):
                for evento in (
                    itens_por_mes_sku.get(
                        (
                            indice_mes,
                            produto.sku,
                        ),
                        [],
                    )
                ):
                    saidas_mes.append(
                        evento
                    )

            saidas_mes.sort(
                key=lambda evento:
                    (
                        evento[
                            "data"
                        ],
                        evento[
                            "produto"
                        ].sku,
                    )
            )

            for evento in (
                saidas_mes
            ):
                produto = (
                    evento[
                        "produto"
                    ]
                )

                quantidade = (
                    evento[
                        "quantidade"
                    ]
                )

                saldo_anterior = (
                    saldos[
                        produto.sku
                    ]
                )

                saldo_posterior = (
                    saldo_anterior -
                    quantidade
                )

                if (
                    saldo_posterior <
                    0
                ):
                    raise RuntimeError(
                        f"Saldo negativo durante a simulação "
                        f"de {produto.sku}."
                    )

                data_saida = (
                    evento[
                        "data"
                    ] +
                    timedelta(
                        hours=1,
                    )
                )

                movimentacao = Movimentacao(
                    produto_sku=(
                        produto.sku
                    ),
                    produto_nome=(
                        produto.nome
                    ),
                    tipo="saida",
                    quantidade=(
                        quantidade
                    ),
                    origem=(
                        "Estoque Principal"
                    ),
                    destino=(
                        "Expedição / "
                        + evento[
                            "pedido_codigo"
                        ]
                    ),
                    saldo_anterior=(
                        saldo_anterior
                    ),
                    saldo_posterior=(
                        saldo_posterior
                    ),
                    criado_em=(
                        data_saida
                    ),
                )

                db.add(
                    movimentacao,
                )

                movimentacoes_novas.append(
                    movimentacao,
                )

                saldos[
                    produto.sku
                ] = (
                    saldo_posterior
                )

                total_saidas += (
                    quantidade
                )

        # ====================================================
        # AJUSTE FINAL EXATO
        # ====================================================
        #
        # Em condições normais não será necessário.
        # Mantemos esta etapa apenas como proteção contra
        # arredondamentos do buffer.
        #
        # ====================================================

        fim_historico = (
            ultimo_dia_mes(
                meses[
                    -1
                ]
            )
        )

        for indice_produto, produto in enumerate(
            produtos
        ):
            atual = (
                saldos[
                    produto.sku
                ]
            )

            alvo = (
                saldo_alvo_historico[
                    produto.sku
                ]
            )

            diferenca = (
                alvo -
                atual
            )

            if (
                diferenca ==
                0
            ):
                continue

            data_ajuste = (
                fim_historico.replace(
                    hour=(
                        16 +
                        (
                            indice_produto %
                            4
                        )
                    ),
                    minute=(
                        10 +
                        (
                            indice_produto %
                            5
                        )
                    ),
                    second=0,
                    microsecond=0,
                )
            )

            if (
                diferenca >
                0
            ):
                tipo = (
                    "entrada"
                )

                quantidade = (
                    diferenca
                )

                origem = (
                    "Inventário Demonstrativo"
                )

                destino = (
                    "Estoque Principal"
                )

                posterior = (
                    atual +
                    quantidade
                )

                total_entradas += (
                    quantidade
                )

            else:
                tipo = (
                    "saida"
                )

                quantidade = abs(
                    diferenca
                )

                origem = (
                    "Estoque Principal"
                )

                destino = (
                    "Ajuste de Inventário"
                )

                posterior = (
                    atual -
                    quantidade
                )

                total_saidas += (
                    quantidade
                )

            movimentacao = Movimentacao(
                produto_sku=(
                    produto.sku
                ),
                produto_nome=(
                    produto.nome
                ),
                tipo=tipo,
                quantidade=(
                    quantidade
                ),
                origem=(
                    origem
                ),
                destino=(
                    destino
                ),
                saldo_anterior=(
                    atual
                ),
                saldo_posterior=(
                    posterior
                ),
                criado_em=(
                    data_ajuste
                ),
            )

            db.add(
                movimentacao,
            )

            movimentacoes_novas.append(
                movimentacao,
            )

            saldos[
                produto.sku
            ] = (
                posterior
            )

        # ====================================================
        # VALIDAÇÃO FINAL DO HISTÓRICO
        # ====================================================

        erros_saldo = []

        for produto in (
            produtos
        ):
            esperado = (
                saldo_alvo_historico[
                    produto.sku
                ]
            )

            obtido = (
                saldos[
                    produto.sku
                ]
            )

            if (
                esperado !=
                obtido
            ):
                erros_saldo.append(
                    (
                        produto.sku,
                        esperado,
                        obtido,
                    )
                )

        if (
            erros_saldo
        ):
            raise RuntimeError(
                "A carga foi cancelada porque alguns saldos "
                f"não fecharam: {erros_saldo}"
            )

        # ====================================================
        # FLUSH PARA OBTER IDs DAS MOVIMENTAÇÕES
        # ====================================================

        db.flush()

        ids_movimentacoes = [
            movimentacao.id
            for movimentacao in
            movimentacoes_novas
        ]

        codigos_pedidos = [
            pedido.codigo
            for pedido in
            pedidos_novos
        ]

        # ====================================================
        # AUDITORIA DA CARGA
        # ====================================================

        resumo = {
            "marcador":
                MARCADOR_CARGA,

            "periodo_inicio":
                f"{meses[0]:%Y-%m-%d}",

            "periodo_fim":
                f"{fim_historico:%Y-%m-%d}",

            "pedidos_criados":
                total_pedidos,

            "itens_pedido_criados":
                total_itens,

            "movimentacoes_criadas":
                len(
                    movimentacoes_novas
                ),

            "unidades_entrada":
                total_entradas,

            "unidades_saida":
                total_saidas,

            "codigos_pedidos":
                codigos_pedidos,

            "ids_movimentacoes":
                ids_movimentacoes,
        }

        auditoria = Auditoria(
            usuario_codigo=None,
            usuario_nome=(
                "Sistema Demo"
            ),
            modulo=(
                "Sistema"
            ),
            acao=(
                "carga_historica_demo"
            ),
            entidade=(
                "BancoDemo"
            ),
            registro_referencia=(
                MARCADOR_CARGA
            ),
            detalhes=(
                "Carga histórica demonstrativa de "
                f"{QUANTIDADE_MESES_HISTORICOS} meses "
                "executada para enriquecer os gráficos e "
                "relatórios do portfólio, preservando o "
                "estoque atual."
            ),
            dados_anteriores=None,
            dados_novos=(
                json.dumps(
                    resumo,
                    ensure_ascii=False,
                )
            ),
            criado_em=(
                datetime.now()
            ),
        )

        db.add(
            auditoria,
        )

        # ====================================================
        # COMMIT
        # ====================================================

        db.commit()

        # ====================================================
        # RESUMO
        # ====================================================

        print()
        print(
            "Carga histórica concluída com sucesso."
        )

        print(
            "Período:",
            f"{meses[0]:%m/%Y}",
            "até",
            f"{meses[-1]:%m/%Y}",
        )

        print(
            "Pedidos históricos:",
            total_pedidos,
        )

        print(
            "Itens de pedido:",
            total_itens,
        )

        print(
            "Movimentações históricas:",
            len(
                movimentacoes_novas
            ),
        )

        print(
            "Unidades de entrada:",
            total_entradas,
        )

        print(
            "Unidades de saída:",
            total_saidas,
        )

        print()
        print(
            "Estoque atual preservado:"
        )

        for produto in (
            produtos
        ):
            print(
                f"  {produto.sku}: "
                f"{produto.estoque_atual} un"
            )

        print()
        print(
            "Agora reinicie o backend e atualize "
            "o Dashboard no navegador."
        )

    except Exception as erro:

        db.rollback()

        print()
        print(
            "A carga histórica foi cancelada."
        )

        print(
            "Motivo:",
            erro,
        )

        raise

    finally:

        db.close()


if __name__ == "__main__":
    main()
