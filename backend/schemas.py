# ============================================================
# LOGIFLOW
# SCHEMAS PYDANTIC
# ============================================================
#
# MODELS.PY
#     representa as tabelas do banco SQLite.
#
# SCHEMAS.PY
#     representa os dados recebidos e enviados pela API.
#
# ============================================================

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


# ============================================================
# PRODUTOS
# ============================================================

class ProdutoBase(BaseModel):
    nome: str = Field(
        ...,
        min_length=1,
        max_length=150,
        examples=[
            "Filme Stretch 500mm",
        ],
    )

    categoria: str = Field(
        ...,
        min_length=1,
        max_length=80,
        examples=[
            "Embalagens",
        ],
    )

    marca: str | None = Field(
        default=None,
        max_length=100,
        examples=[
            "Chamex",
        ],
    )

    especificacao: str | None = Field(
        default=None,
        max_length=180,
        examples=[
            "A4 • 75 g/m² • pacote com 500 folhas",
        ],
    )

    gtin_ean: str | None = Field(
        default=None,
        examples=[
            "7891234567895",
            "CX-A4-CHAMEX-75G",
        ],
        description=(
            "Código de barras / GTIN / EAN opcional. "
            "O LogiFlow não impõe formato, tamanho ou dígito "
            "verificador. Quando informado, continua sendo usado "
            "como identificador prioritário contra duplicidade."
        ),
    )

    estoque_atual: int = Field(
        default=0,
        ge=0,
        examples=[
            0,
        ],
        description=(
            "Saldo atual do estoque. No cadastro individual "
            "o backend inicia o produto em zero e o saldo passa "
            "a ser atualizado pelas movimentações."
        ),
    )

    estoque_minimo: int = Field(
        ...,
        ge=0,
        examples=[
            100,
        ],
    )

    # ========================================================
    # FORMAÇÃO DE PREÇO
    # ========================================================

    custo_unitario: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        max_digits=12,
        decimal_places=2,
        examples=[
            100.00,
        ],
    )

    margem_lucro_percentual: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        le=500,
        max_digits=7,
        decimal_places=4,
        examples=[
            30.00,
        ],
    )

    ncm: str | None = Field(
        default=None,
        max_length=20,
        examples=[
            "39232190",
        ],
    )

    regime_tributario: Literal[
        "lucro_presumido",
        "lucro_real",
        "simples_nacional",
        "manual",
    ] = "lucro_presumido"

    uf_referencia: str = Field(
        default="SP",
        min_length=2,
        max_length=2,
    )

    # ========================================================
    # MODO DE FORMAÇÃO DO PREÇO
    # ========================================================

    calculo_preco_automatico: bool = True

    preco_venda_manual: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=12,
        decimal_places=2,
        examples=[
            149.90,
        ],
    )

    # ========================================================
    # ALÍQUOTAS DA SIMULAÇÃO
    # ========================================================

    aliquota_icms: Decimal = Field(
        default=Decimal("18.00"),
        ge=0,
        le=100,
        max_digits=7,
        decimal_places=4,
    )

    aliquota_pis: Decimal = Field(
        default=Decimal("0.65"),
        ge=0,
        le=100,
        max_digits=7,
        decimal_places=4,
    )

    aliquota_cofins: Decimal = Field(
        default=Decimal("3.00"),
        ge=0,
        le=100,
        max_digits=7,
        decimal_places=4,
    )

    aliquota_ipi: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        le=100,
        max_digits=7,
        decimal_places=4,
    )

    aliquota_simples: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        le=100,
        max_digits=7,
        decimal_places=4,
    )

    aliquota_cbs: Decimal = Field(
        default=Decimal("0.90"),
        ge=0,
        le=100,
        max_digits=7,
        decimal_places=4,
    )

    aliquota_ibs: Decimal = Field(
        default=Decimal("0.10"),
        ge=0,
        le=100,
        max_digits=7,
        decimal_places=4,
    )


# ============================================================
# CRIAÇÃO DE PRODUTO
# ============================================================

class ProdutoCreate(
    ProdutoBase,
):
    pass


# ============================================================
# EDIÇÃO DE PRODUTO
# ============================================================

class ProdutoUpdate(
    ProdutoBase,
):
    pass


# ============================================================
# RESPOSTA DO PRODUTO
# ============================================================

class ProdutoResponse(
    ProdutoBase,
):
    model_config = ConfigDict(
        from_attributes=True,
    )

    sku: str
    estoque_reservado: int = 0
    estoque_disponivel: int = 0

    referencia_fiscal: str

    valor_margem: Decimal

    base_comercial: Decimal

    valor_icms: Decimal

    valor_pis: Decimal

    valor_cofins: Decimal

    valor_ipi: Decimal

    valor_simples: Decimal

    valor_cbs: Decimal

    valor_ibs: Decimal

    preco_venda: Decimal

    criado_em: datetime

    atualizado_em: datetime


# ============================================================
# MOVIMENTAÇÕES
# ============================================================

class MovimentacaoCreate(
    BaseModel,
):
    produto_sku: str = Field(
        ...,
        min_length=1,
        max_length=20,
        examples=[
            "PRD-003",
        ],
    )

    tipo: Literal[
        "entrada",
        "saida",
    ]

    quantidade: int = Field(
        ...,
        gt=0,
        examples=[
            200,
        ],
    )

    origem: str = Field(
        ...,
        min_length=1,
        max_length=200,
        examples=[
            "Fornecedor: Embala Mais",
        ],
    )

    destino: str = Field(
        ...,
        min_length=1,
        max_length=200,
        examples=[
            "Estoque Principal",
        ],
    )


# ============================================================
# RESPOSTA DE MOVIMENTAÇÃO
# ============================================================

class MovimentacaoResponse(
    BaseModel,
):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    produto_sku: str

    produto_nome: str

    tipo: Literal[
        "entrada",
        "saida",
    ]

    quantidade: int

    origem: str

    destino: str

    saldo_anterior: int

    saldo_posterior: int

    criado_em: datetime


# ============================================================
# TIPOS DE STATUS DO PEDIDO
# ============================================================

StatusPedido = Literal[
    "pendente",
    "processando",
    "enviado",
    "entregue",
    "cancelado",
    "devolvido",
]


# ============================================================
# ITEM DO PEDIDO
# ============================================================
#
# Na criação do pedido o frontend enviará:
#
# - SKU
# - quantidade
# - valor unitário
#
# O backend buscará o nome atual do produto e calculará:
#
# subtotal = quantidade * valor_unitario
#
# ============================================================

class ItemPedidoCreate(
    BaseModel,
):
    produto_sku: str = Field(
        ...,
        min_length=1,
        max_length=20,
        examples=[
            "PRD-001",
        ],
    )

    quantidade: int = Field(
        ...,
        gt=0,
        examples=[
            2,
        ],
    )

    valor_unitario: Decimal = Field(
        ...,
        ge=0,
        max_digits=12,
        decimal_places=2,
        examples=[
            79.90,
        ],
    )


# ============================================================
# RESPOSTA DO ITEM
# ============================================================

class ItemPedidoResponse(
    BaseModel,
):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    pedido_codigo: str

    produto_sku: str

    produto_nome: str

    quantidade: int

    valor_unitario: Decimal

    subtotal: Decimal

    criado_em: datetime


# ============================================================
# CRIAÇÃO DO PEDIDO
# ============================================================
#
# O código PED-XXX será criado automaticamente pelo backend.
#
# O valor_total também será calculado automaticamente.
#
# ============================================================

class PedidoCreate(
    BaseModel,
):
    cliente_codigo: str | None = Field(
        default=None,
        max_length=20,
        examples=[
            "CLI-001",
        ],
        description=(
            "Código do cliente cadastrado. "
            "Quando informado, o backend valida se o cliente "
            "existe e está ativo antes de criar o pedido."
        ),
    )

    cliente_nome: str = Field(
        ...,
        min_length=1,
        max_length=150,
        examples=[
            "Comercial Nova Campinas",
        ],
    )

    destino: str = Field(
        ...,
        min_length=1,
        max_length=200,
        examples=[
            "Campinas - SP",
        ],
    )

    transportadora: str | None = Field(
        default=None,
        max_length=120,
        examples=[
            "Loggi Transportes",
        ],
    )

    codigo_rastreio: str | None = Field(
        default=None,
        max_length=80,
        examples=[
            "LOG-2026-000123",
        ],
    )

    itens: list[
        ItemPedidoCreate
    ] = Field(
        ...,
        min_length=1,
    )


# ============================================================
# ALTERAÇÃO DO STATUS / TRACKING
# ============================================================
#
# Será utilizado futuramente quando movermos os cards
# no Kanban.
#
# Exemplo:
#
# pendente
#     ↓
# processando
#     ↓
# enviado
#     ↓
# entregue
#
# ============================================================

class PedidoStatusUpdate(
    BaseModel,
):
    status: StatusPedido

    transportadora: str | None = Field(
        default=None,
        max_length=120,
    )

    codigo_rastreio: str | None = Field(
        default=None,
        max_length=80,
    )


# ============================================================
# RESPOSTA DO PEDIDO
# ============================================================

class PedidoEventoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tipo: str
    descricao: str
    criado_em: datetime
    usuario_codigo: str | None = None

class RastreamentoSimuladoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    ativo: bool
    iniciado_em: datetime | None
    duracao_segundos: int
    distancia_km: int
    motorista: str
    erro: str | None = None


class PedidoResponse(
    BaseModel,
):
    model_config = ConfigDict(
        from_attributes=True,
    )

    codigo: str

    cliente_codigo: str | None = None
    estoque_baixado: bool = False
    processado_em: datetime | None = None
    enviado_em: datetime | None = None
    entregue_em: datetime | None = None
    cancelado_em: datetime | None = None
    devolvido_em: datetime | None = None
    eventos: list[PedidoEventoResponse] = Field(default_factory=list)
    rastreamento_simulado: RastreamentoSimuladoResponse | None = None
    cliente_nome: str

    destino: str

    transportadora: str | None

    codigo_rastreio: str | None

    status: StatusPedido

    valor_total: Decimal

    criado_em: datetime

    atualizado_em: datetime

    itens: list[
        ItemPedidoResponse
    ] = []

# ============================================================
# FORNECEDORES
# ============================================================

StatusFornecedor = Literal[
    "ativo",
    "inativo",
]


class FornecedorBase(
    BaseModel,
):
    razao_social: str = Field(
        ...,
        min_length=1,
        max_length=180,
        examples=[
            "Embalagens Campinas Ltda.",
        ],
    )

    nome_fantasia: str | None = Field(
        default=None,
        max_length=150,
        examples=[
            "EmbalaCamp",
        ],
    )

    cnpj: str = Field(
        ...,
        min_length=1,
        max_length=30,
        examples=[
            "12.345.678/0001-90",
        ],
    )

    categoria: str = Field(
        ...,
        min_length=1,
        max_length=80,
        examples=[
            "Embalagens",
        ],
    )

    contato: str | None = Field(
        default=None,
        max_length=120,
        examples=[
            "Mariana Souza",
        ],
    )

    telefone: str | None = Field(
        default=None,
        max_length=30,
        examples=[
            "(19) 99999-9999",
        ],
    )

    email: str | None = Field(
        default=None,
        max_length=160,
        examples=[
            "comercial@fornecedor.com.br",
        ],
    )

    cidade: str = Field(
        ...,
        min_length=1,
        max_length=120,
        examples=[
            "Campinas",
        ],
    )

    uf: str = Field(
        ...,
        min_length=2,
        max_length=2,
        examples=[
            "SP",
        ],
    )

    prazo_medio_entrega: int = Field(
        ...,
        ge=0,
        le=365,
        examples=[
            5,
        ],
    )


class FornecedorCreate(
    FornecedorBase,
):
    pass


class FornecedorUpdate(
    FornecedorBase,
):
    pass


class FornecedorStatusUpdate(
    BaseModel,
):
    status: StatusFornecedor


class FornecedorResponse(
    FornecedorBase,
):
    model_config = ConfigDict(
        from_attributes=True,
    )

    codigo: str

    status: StatusFornecedor

    criado_em: datetime

    atualizado_em: datetime


# ============================================================
# CLIENTES
# ============================================================

StatusCliente = Literal[
    "ativo",
    "inativo",
]

TipoCliente = Literal[
    "pessoa_fisica",
    "pessoa_juridica",
]


class ClienteBase(
    BaseModel,
):
    nome: str = Field(
        ...,
        min_length=1,
        max_length=180,
        examples=[
            "Comercial Nova Campinas",
        ],
    )

    tipo: TipoCliente

    documento: str = Field(
        ...,
        min_length=1,
        max_length=30,
        examples=[
            "12.345.678/0001-90",
        ],
    )

    telefone: str | None = Field(
        default=None,
        max_length=30,
        examples=[
            "(19) 99999-9999",
        ],
    )

    email: str | None = Field(
        default=None,
        max_length=160,
        examples=[
            "cliente@empresa.com.br",
        ],
    )

    cep: str | None = Field(
        default=None,
        max_length=20,
        examples=[
            "13000-000",
        ],
    )

    logradouro: str = Field(
        ...,
        min_length=1,
        max_length=180,
        examples=[
            "Avenida Brasil",
        ],
    )

    numero: str | None = Field(
        default=None,
        max_length=20,
        examples=[
            "123",
        ],
    )

    complemento: str | None = Field(
        default=None,
        max_length=100,
    )

    bairro: str | None = Field(
        default=None,
        max_length=120,
    )

    cidade: str = Field(
        ...,
        min_length=1,
        max_length=120,
        examples=[
            "Campinas",
        ],
    )

    uf: str = Field(
        ...,
        min_length=2,
        max_length=2,
        examples=[
            "SP",
        ],
    )


class ClienteCreate(
    ClienteBase,
):
    pass


class ClienteUpdate(
    ClienteBase,
):
    pass


class ClienteStatusUpdate(
    BaseModel,
):
    status: StatusCliente


class ClienteResponse(
    ClienteBase,
):
    model_config = ConfigDict(
        from_attributes=True,
    )

    codigo: str

    status: StatusCliente

    criado_em: datetime

    atualizado_em: datetime


# ============================================================
# USUÁRIOS
# ============================================================

StatusUsuario = Literal[
    "ativo",
    "inativo",
]

PerfilUsuario = Literal[
    "administrador",
    "gerente",
    "operador",
    "consulta",
]


class UsuarioBase(
    BaseModel,
):
    nome: str = Field(
        ...,
        min_length=1,
        max_length=180,
        examples=[
            "Leandro Augusto Ferreira",
        ],
    )

    email: str = Field(
        ...,
        min_length=3,
        max_length=180,
        examples=[
            "leandro@logiflow.com.br",
        ],
    )

    cargo: str = Field(
        ...,
        min_length=1,
        max_length=120,
        examples=[
            "Gerente de Operações",
        ],
    )

    perfil: PerfilUsuario


class UsuarioCreate(
    UsuarioBase,
):
    senha: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description=(
            "Senha inicial do usuário. "
            "Nunca é retornada pela API."
        ),
    )


class UsuarioUpdate(
    UsuarioBase,
):
    senha: str | None = Field(
        default=None,
        min_length=8,
        max_length=128,
        description=(
            "Nova senha. Quando omitida, "
            "a senha atual é preservada."
        ),
    )


class UsuarioStatusUpdate(
    BaseModel,
):
    status: StatusUsuario


class UsuarioResponse(
    UsuarioBase,
):
    model_config = ConfigDict(
        from_attributes=True,
    )

    codigo: str

    status: StatusUsuario

    ultimo_acesso: datetime | None

    criado_em: datetime

    atualizado_em: datetime


# ============================================================
# AUDITORIA
# ============================================================

class AuditoriaResponse(
    BaseModel,
):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    usuario_codigo: str | None

    usuario_nome: str

    modulo: str

    acao: str

    entidade: str | None

    registro_referencia: str | None

    detalhes: str | None

    dados_anteriores: str | None

    dados_novos: str | None

    criado_em: datetime



# ============================================================
# CADASTRO PÚBLICO DE USUÁRIO
# ============================================================

class CadastroPublicoRequest(
    BaseModel,
):
    nome: str = Field(
        ...,
        min_length=1,
        max_length=180,
    )

    email: str = Field(
        ...,
        min_length=3,
        max_length=180,
    )

    cargo: str = Field(
        ...,
        min_length=1,
        max_length=120,
    )

    senha: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )

# ============================================================
# AUTENTICAÇÃO
# ============================================================

class LoginRequest(
    BaseModel,
):
    email: str = Field(
        ...,
        min_length=3,
        max_length=180,
    )

    senha: str = Field(
        ...,
        min_length=1,
        max_length=128,
    )


class LoginResponse(
    BaseModel,
):
    token: str

    usuario: UsuarioResponse


class AcessoDemoResponse(
    BaseModel,
):
    email: str | None

    senha_inicial: str

