# ============================================================
# LOGIFLOW
# MODELOS DO BANCO DE DADOS
# ============================================================

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)

from sqlalchemy.orm import relationship

from backend.database import Base


# ============================================================
# PRODUTO
# ============================================================
#
# Representa os produtos cadastrados no estoque.
#
# O SKU será utilizado como identificador principal:
#
# PRD-001
# PRD-002
# PRD-003
# ...
#
# ============================================================

class Produto(Base):
    estoque_reservado = 0

    @property
    def estoque_disponivel(self):
        return self.estoque_atual - self.estoque_reservado

    __tablename__ = "produtos"

    # ========================================================
    # IDENTIFICAÇÃO
    # ========================================================

    sku = Column(
        String(20),
        primary_key=True,
        index=True,
    )

    nome = Column(
        String(150),
        nullable=False,
        index=True,
    )

    categoria = Column(
        String(80),
        nullable=False,
        index=True,
    )

    marca = Column(
        String(100),
        nullable=True,
        index=True,
    )

    especificacao = Column(
        String(180),
        nullable=True,
    )

    gtin_ean = Column(
        String,
        nullable=True,
        index=True,
    )

    # ========================================================
    # ESTOQUE
    # ========================================================

    estoque_atual = Column(
        Integer,
        nullable=False,
        default=0,
    )

    estoque_minimo = Column(
        Integer,
        nullable=False,
        default=0,
    )

    # ========================================================
    # FORMAÇÃO DE PREÇO
    # ========================================================
    #
    # Estes campos armazenam as premissas utilizadas na
    # simulação de preço de venda.
    #
    # O cálculo é refeito pelo backend sempre que o produto
    # é criado ou editado.
    #
    # ========================================================

    custo_unitario = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    margem_lucro_percentual = Column(
        Numeric(
            7,
            4,
        ),
        nullable=False,
        default=0,
    )

    ncm = Column(
        String(8),
        nullable=True,
        index=True,
    )

    regime_tributario = Column(
        String(30),
        nullable=False,
        default="lucro_presumido",
        index=True,
    )

    uf_referencia = Column(
        String(2),
        nullable=False,
        default="SP",
    )

    referencia_fiscal = Column(
        String(40),
        nullable=False,
        default="Brasil 2026 / referência SP",
    )

    # ========================================================
    # ALÍQUOTAS UTILIZADAS NA SIMULAÇÃO
    # ========================================================

    aliquota_icms = Column(
        Numeric(
            7,
            4,
        ),
        nullable=False,
        default=18,
    )

    aliquota_pis = Column(
        Numeric(
            7,
            4,
        ),
        nullable=False,
        default=0.65,
    )

    aliquota_cofins = Column(
        Numeric(
            7,
            4,
        ),
        nullable=False,
        default=3,
    )

    aliquota_ipi = Column(
        Numeric(
            7,
            4,
        ),
        nullable=False,
        default=0,
    )

    aliquota_simples = Column(
        Numeric(
            7,
            4,
        ),
        nullable=False,
        default=0,
    )

    # Em 2026, CBS e IBS são mantidos como valores informativos
    # no simulador. O cálculo do preço não os soma automaticamente.
    aliquota_cbs = Column(
        Numeric(
            7,
            4,
        ),
        nullable=False,
        default=0.9,
    )

    aliquota_ibs = Column(
        Numeric(
            7,
            4,
        ),
        nullable=False,
        default=0.1,
    )

    # ========================================================
    # MODO DE FORMAÇÃO DO PREÇO
    # ========================================================

    calculo_preco_automatico = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    preco_venda_manual = Column(
        Numeric(
            12,
            2,
        ),
        nullable=True,
    )

    # ========================================================
    # RESULTADO DA SIMULAÇÃO
    # ========================================================

    valor_margem = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    base_comercial = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    valor_icms = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    valor_pis = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    valor_cofins = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    valor_ipi = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    valor_simples = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    valor_cbs = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    valor_ibs = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    preco_venda = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
        index=True,
    )

    # ========================================================
    # DATAS
    # ========================================================

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
    )

    atualizado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now,
    )

    # ========================================================
    # REGRAS DO BANCO
    # ========================================================

    __table_args__ = (
        CheckConstraint(
            "estoque_atual >= 0",
            name="ck_produto_estoque_atual_nao_negativo",
        ),
        CheckConstraint(
            "estoque_minimo >= 0",
            name="ck_produto_estoque_minimo_nao_negativo",
        ),
        CheckConstraint(
            "custo_unitario >= 0",
            name="ck_produto_custo_unitario_nao_negativo",
        ),
        CheckConstraint(
            "margem_lucro_percentual >= 0",
            name="ck_produto_margem_nao_negativa",
        ),
        CheckConstraint(
            "preco_venda >= 0",
            name="ck_produto_preco_venda_nao_negativo",
        ),
        CheckConstraint(
            "regime_tributario IN "
            "('lucro_presumido', 'lucro_real', 'simples_nacional', 'manual')",
            name="ck_produto_regime_tributario_valido",
        ),
    )

    # ========================================================
    # REPRESENTAÇÃO
    # ========================================================

    def __repr__(self):
        return (
            f"<Produto("
            f"sku='{self.sku}', "
            f"nome='{self.nome}', "
            f"estoque_atual={self.estoque_atual}"
            f")>"
        )


# ============================================================
# MOVIMENTAÇÃO DE ESTOQUE
# ============================================================
#
# Cada entrada ou saída realizada ficará registrada.
#
# Não usamos chave estrangeira obrigatória para Produto.
#
# Isso preserva o histórico caso um produto seja excluído.
#
# produto_nome funciona como uma fotografia histórica
# do produto no momento da movimentação.
#
# ============================================================

class Movimentacao(Base):
    __tablename__ = "movimentacoes"

    # ========================================================
    # IDENTIFICAÇÃO
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        index=True,
    )

    # ========================================================
    # PRODUTO
    # ========================================================

    produto_sku = Column(
        String(20),
        nullable=False,
        index=True,
    )

    produto_nome = Column(
        String(150),
        nullable=False,
    )

    # ========================================================
    # MOVIMENTAÇÃO
    # ========================================================

    tipo = Column(
        String(20),
        nullable=False,
        index=True,
    )

    quantidade = Column(
        Integer,
        nullable=False,
    )

    origem = Column(
        String(200),
        nullable=False,
    )

    destino = Column(
        String(200),
        nullable=False,
    )

    # ========================================================
    # SALDO
    # ========================================================

    saldo_anterior = Column(
        Integer,
        nullable=False,
    )

    saldo_posterior = Column(
        Integer,
        nullable=False,
    )

    # ========================================================
    # DATA
    # ========================================================

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        index=True,
    )

    # ========================================================
    # REGRAS DO BANCO
    # ========================================================

    __table_args__ = (
        CheckConstraint(
            "quantidade > 0",
            name="ck_movimentacao_quantidade_positiva",
        ),
        CheckConstraint(
            "saldo_anterior >= 0",
            name="ck_movimentacao_saldo_anterior_nao_negativo",
        ),
        CheckConstraint(
            "saldo_posterior >= 0",
            name="ck_movimentacao_saldo_posterior_nao_negativo",
        ),
        CheckConstraint(
            "tipo IN ('entrada', 'saida')",
            name="ck_movimentacao_tipo_valido",
        ),
    )

    # ========================================================
    # REPRESENTAÇÃO
    # ========================================================

    def __repr__(self):
        return (
            f"<Movimentacao("
            f"id={self.id}, "
            f"produto_sku='{self.produto_sku}', "
            f"tipo='{self.tipo}', "
            f"quantidade={self.quantidade}"
            f")>"
        )


# ============================================================
# PEDIDO
# ============================================================
#
# Representa um pedido realizado no LogiFlow.
#
# O código será criado pelo backend:
#
# PED-001
# PED-002
# PED-003
# ...
#
# Os status disponíveis serão:
#
# pendente
# processando
# enviado
# entregue
#
# ============================================================

class Pedido(Base):
    __tablename__ = "pedidos"

    # ========================================================
    # IDENTIFICAÇÃO
    # ========================================================

    codigo = Column(
        String(20),
        primary_key=True,
        index=True,
    )

    # ========================================================
    # CLIENTE
    # ========================================================
    #
    # Por enquanto armazenamos o nome como fotografia
    # histórica.
    #
    # Quando criarmos o módulo Clientes poderemos relacionar
    # um cliente cadastrado ao pedido sem perder este histórico.
    #
    # ========================================================

    cliente_nome = Column(
        String(150),
        nullable=False,
        index=True,
    )

    cliente_codigo = Column(String(20), nullable=True, index=True)
    estoque_baixado = Column(Boolean, nullable=False, default=False)
    processado_em = Column(DateTime, nullable=True)
    enviado_em = Column(DateTime, nullable=True)
    entregue_em = Column(DateTime, nullable=True)
    cancelado_em = Column(DateTime, nullable=True)
    devolvido_em = Column(DateTime, nullable=True)
    eventos = relationship("PedidoEvento", order_by="PedidoEvento.id", cascade="all, delete-orphan")
    rastreamento_simulado = relationship("RastreamentoSimulado", uselist=False, cascade="all, delete-orphan")

    # ========================================================
    # ENTREGA
    # ========================================================

    destino = Column(
        String(200),
        nullable=False,
    )

    transportadora = Column(
        String(120),
        nullable=True,
    )

    codigo_rastreio = Column(
        String(80),
        nullable=True,
        index=True,
    )

    # ========================================================
    # STATUS
    # ========================================================

    status = Column(
        String(20),
        nullable=False,
        default="pendente",
        index=True,
    )

    # ========================================================
    # VALOR
    # ========================================================

    valor_total = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
        default=0,
    )

    # ========================================================
    # DATAS
    # ========================================================

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        index=True,
    )

    atualizado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now,
    )

    # ========================================================
    # ITENS
    # ========================================================

    itens = relationship(
        "ItemPedido",
        back_populates="pedido",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ItemPedido.id",
    )

    # ========================================================
    # REGRAS DO BANCO
    # ========================================================

    __table_args__ = (
        CheckConstraint(
            "status IN "
            "('pendente', 'processando', 'enviado', 'entregue', 'cancelado', 'devolvido')",
            name="ck_pedido_status_valido",
        ),
        CheckConstraint(
            "valor_total >= 0",
            name="ck_pedido_valor_total_nao_negativo",
        ),
    )

    # ========================================================
    # REPRESENTAÇÃO
    # ========================================================

    def __repr__(self):
        return (
            f"<Pedido("
            f"codigo='{self.codigo}', "
            f"cliente_nome='{self.cliente_nome}', "
            f"status='{self.status}', "
            f"valor_total={self.valor_total}"
            f")>"
        )


# ============================================================
# ITEM DO PEDIDO
# ============================================================
#
# Cada pedido poderá possuir um ou vários produtos.
#
# O item mantém:
#
# - SKU histórico
# - nome histórico
# - quantidade
# - valor unitário
# - subtotal
#
# Não usamos ForeignKey para Produto.
#
# Assim, mesmo que o produto seja excluído futuramente,
# o pedido continuará preservando o que foi vendido.
#
# ============================================================

class ItemPedido(Base):
    __tablename__ = "itens_pedido"

    # ========================================================
    # IDENTIFICAÇÃO
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        index=True,
    )

    # ========================================================
    # PEDIDO
    # ========================================================

    pedido_codigo = Column(
        String(20),
        ForeignKey(
            "pedidos.codigo",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # PRODUTO
    # ========================================================

    produto_sku = Column(
        String(20),
        nullable=False,
        index=True,
    )

    produto_nome = Column(
        String(150),
        nullable=False,
    )

    # ========================================================
    # QUANTIDADE E VALORES
    # ========================================================

    quantidade = Column(
        Integer,
        nullable=False,
    )

    valor_unitario = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
    )

    subtotal = Column(
        Numeric(
            12,
            2,
        ),
        nullable=False,
    )

    # ========================================================
    # DATA
    # ========================================================

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
    )

    # ========================================================
    # RELACIONAMENTO
    # ========================================================

    pedido = relationship(
        "Pedido",
        back_populates="itens",
    )

    # ========================================================
    # REGRAS DO BANCO
    # ========================================================

    __table_args__ = (
        CheckConstraint(
            "quantidade > 0",
            name="ck_item_pedido_quantidade_positiva",
        ),
        CheckConstraint(
            "valor_unitario >= 0",
            name="ck_item_pedido_valor_unitario_nao_negativo",
        ),
        CheckConstraint(
            "subtotal >= 0",
            name="ck_item_pedido_subtotal_nao_negativo",
        ),
    )

    # ========================================================
    # REPRESENTAÇÃO
    # ========================================================

    def __repr__(self):
        return (
            f"<ItemPedido("
            f"id={self.id}, "
            f"pedido_codigo='{self.pedido_codigo}', "
            f"produto_sku='{self.produto_sku}', "
            f"quantidade={self.quantidade}"
            f")>"
        )

# ============================================================
# FORNECEDOR
# ============================================================
#
# Representa os fornecedores cadastrados no LogiFlow.
#
# O código será criado automaticamente pelo backend:
#
# FOR-001
# FOR-002
# FOR-003
# ...
#
# ============================================================

class Fornecedor(Base):
    __tablename__ = "fornecedores"

    # ========================================================
    # IDENTIFICAÇÃO
    # ========================================================

    codigo = Column(
        String(20),
        primary_key=True,
        index=True,
    )

    razao_social = Column(
        String(180),
        nullable=False,
        index=True,
    )

    nome_fantasia = Column(
        String(150),
        nullable=True,
        index=True,
    )

    cnpj = Column(
        String(14),
        nullable=False,
        unique=True,
        index=True,
    )

    categoria = Column(
        String(80),
        nullable=False,
        index=True,
    )

    # ========================================================
    # CONTATO
    # ========================================================

    contato = Column(
        String(120),
        nullable=True,
    )

    telefone = Column(
        String(30),
        nullable=True,
    )

    email = Column(
        String(160),
        nullable=True,
    )

    # ========================================================
    # LOCALIZAÇÃO
    # ========================================================

    cidade = Column(
        String(120),
        nullable=False,
        index=True,
    )

    uf = Column(
        String(2),
        nullable=False,
        index=True,
    )

    # ========================================================
    # OPERAÇÃO
    # ========================================================

    prazo_medio_entrega = Column(
        Integer,
        nullable=False,
        default=0,
    )

    status = Column(
        String(20),
        nullable=False,
        default="ativo",
        index=True,
    )

    # ========================================================
    # DATAS
    # ========================================================

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        index=True,
    )

    atualizado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now,
    )

    # ========================================================
    # REGRAS DO BANCO
    # ========================================================

    __table_args__ = (
        CheckConstraint(
            "prazo_medio_entrega >= 0",
            name="ck_fornecedor_prazo_nao_negativo",
        ),
        CheckConstraint(
            "status IN ('ativo', 'inativo')",
            name="ck_fornecedor_status_valido",
        ),
    )

    # ========================================================
    # REPRESENTAÇÃO
    # ========================================================

    def __repr__(self):
        return (
            f"<Fornecedor("
            f"codigo='{self.codigo}', "
            f"razao_social='{self.razao_social}', "
            f"cnpj='{self.cnpj}', "
            f"status='{self.status}'"
            f")>"
        )


# ============================================================
# CLIENTE
# ============================================================
#
# Representa os clientes cadastrados no LogiFlow.
#
# O código será criado automaticamente pelo backend:
#
# CLI-001
# CLI-002
# CLI-003
# ...
#
# ============================================================

class Cliente(Base):
    __tablename__ = "clientes"

    # ========================================================
    # IDENTIFICAÇÃO
    # ========================================================

    codigo = Column(
        String(20),
        primary_key=True,
        index=True,
    )

    nome = Column(
        String(180),
        nullable=False,
        index=True,
    )

    tipo = Column(
        String(30),
        nullable=False,
        default="pessoa_juridica",
        index=True,
    )

    documento = Column(
        String(14),
        nullable=False,
        unique=True,
        index=True,
    )

    # ========================================================
    # CONTATO
    # ========================================================

    telefone = Column(
        String(30),
        nullable=True,
    )

    email = Column(
        String(160),
        nullable=True,
    )

    # ========================================================
    # ENDEREÇO
    # ========================================================

    cep = Column(
        String(8),
        nullable=True,
        index=True,
    )

    logradouro = Column(
        String(180),
        nullable=False,
    )

    numero = Column(
        String(20),
        nullable=True,
    )

    complemento = Column(
        String(100),
        nullable=True,
    )

    bairro = Column(
        String(120),
        nullable=True,
    )

    cidade = Column(
        String(120),
        nullable=False,
        index=True,
    )

    uf = Column(
        String(2),
        nullable=False,
        index=True,
    )

    # ========================================================
    # STATUS
    # ========================================================

    status = Column(
        String(20),
        nullable=False,
        default="ativo",
        index=True,
    )

    # ========================================================
    # DATAS
    # ========================================================

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        index=True,
    )

    atualizado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now,
    )

    # ========================================================
    # REGRAS
    # ========================================================

    __table_args__ = (
        CheckConstraint(
            "tipo IN ('pessoa_fisica', 'pessoa_juridica')",
            name="ck_cliente_tipo_valido",
        ),
        CheckConstraint(
            "status IN ('ativo', 'inativo')",
            name="ck_cliente_status_valido",
        ),
    )

    # ========================================================
    # REPRESENTAÇÃO
    # ========================================================

    def __repr__(self):
        return (
            f"<Cliente("
            f"codigo='{self.codigo}', "
            f"nome='{self.nome}', "
            f"tipo='{self.tipo}', "
            f"status='{self.status}'"
            f")>"
        )


# ============================================================
# USUÁRIO
# ============================================================
#
# Representa os usuários cadastrados no LogiFlow.
#
# O código será criado automaticamente pelo backend:
#
# USR-001
# USR-002
# USR-003
# ...
#
# Nesta etapa o módulo administra cadastro, perfil e status.
#
# Autenticação e senha serão tratadas em uma etapa específica,
# evitando armazenar senha em texto puro.
#
# ============================================================

class Usuario(Base):
    __tablename__ = "usuarios"

    # ========================================================
    # IDENTIFICAÇÃO
    # ========================================================

    codigo = Column(
        String(20),
        primary_key=True,
        index=True,
    )

    nome = Column(
        String(180),
        nullable=False,
        index=True,
    )

    email = Column(
        String(180),
        nullable=False,
        unique=True,
        index=True,
    )

    cargo = Column(
        String(120),
        nullable=False,
        index=True,
    )

    # ========================================================
    # ACESSO
    # ========================================================

    perfil = Column(
        String(30),
        nullable=False,
        default="operador",
        index=True,
    )

    status = Column(
        String(20),
        nullable=False,
        default="ativo",
        index=True,
    )

    ultimo_acesso = Column(
        DateTime,
        nullable=True,
        index=True,
    )

    # ========================================================
    # DATAS
    # ========================================================

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        index=True,
    )

    atualizado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now,
    )

    # ========================================================
    # REGRAS
    # ========================================================

    __table_args__ = (
        CheckConstraint(
            "perfil IN "
            "('administrador', 'gerente', 'operador', 'consulta')",
            name="ck_usuario_perfil_valido",
        ),
        CheckConstraint(
            "status IN ('ativo', 'inativo')",
            name="ck_usuario_status_valido",
        ),
    )

    # ========================================================
    # REPRESENTAÇÃO
    # ========================================================

    def __repr__(self):
        return (
            f"<Usuario("
            f"codigo='{self.codigo}', "
            f"nome='{self.nome}', "
            f"perfil='{self.perfil}', "
            f"status='{self.status}'"
            f")>"
        )



# ============================================================
# CREDENCIAL DE USUÁRIO
# ============================================================
#
# Mantemos a senha fora da tabela "usuarios" para que o banco
# demonstrativo atual possa receber autenticação sem alteração
# destrutiva da tabela já existente.
#
# Nunca armazenamos senha em texto puro.
#
# ============================================================

class CredencialUsuario(Base):
    __tablename__ = "credenciais_usuarios"

    usuario_codigo = Column(
        String(20),
        primary_key=True,
        index=True,
    )

    senha_hash = Column(
        String(128),
        nullable=False,
    )

    senha_salt = Column(
        String(128),
        nullable=False,
    )

    atualizado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        onupdate=datetime.now,
    )

    def __repr__(self):
        return (
            f"<CredencialUsuario("
            f"usuario_codigo='{self.usuario_codigo}'"
            f")>"
        )


# ============================================================
# SESSÃO DE USUÁRIO
# ============================================================

class SessaoUsuario(Base):
    __tablename__ = "sessoes_usuarios"

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        index=True,
    )

    token_hash = Column(
        String(64),
        nullable=False,
        unique=True,
        index=True,
    )

    usuario_codigo = Column(
        String(20),
        nullable=False,
        index=True,
    )

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        index=True,
    )

    expira_em = Column(
        DateTime,
        nullable=False,
        index=True,
    )

    revogado_em = Column(
        DateTime,
        nullable=True,
        index=True,
    )

    def __repr__(self):
        return (
            f"<SessaoUsuario("
            f"id={self.id}, "
            f"usuario_codigo='{self.usuario_codigo}'"
            f")>"
        )

# ============================================================
# AUDITORIA
# ============================================================
#
# Registra ações importantes realizadas no LogiFlow.
#
# O objetivo é preservar um histórico independente das demais
# tabelas. Por isso, não utilizamos ForeignKey obrigatória para
# Usuario: mesmo que um usuário seja desativado ou removido no
# futuro, o registro de auditoria continuará íntegro.
#
# Exemplos de ações:
#
# cadastrar
# editar
# excluir
# alterar_status
# importar
# movimentar_estoque
# criar_pedido
# atualizar_pedido
#
# Os campos dados_anteriores e dados_novos poderão armazenar
# JSON serializado pelo backend quando quisermos registrar o
# antes/depois de uma alteração.
#
# ============================================================

class Auditoria(Base):
    __tablename__ = "auditoria"

    # ========================================================
    # IDENTIFICAÇÃO
    # ========================================================

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
        index=True,
    )

    # ========================================================
    # USUÁRIO
    # ========================================================
    #
    # Mantemos código e nome como fotografia histórica.
    #
    # Não há ForeignKey obrigatória para Usuario.
    #
    # ========================================================

    usuario_codigo = Column(
        String(20),
        nullable=True,
        index=True,
    )

    usuario_nome = Column(
        String(180),
        nullable=False,
        default="Sistema",
        index=True,
    )

    # ========================================================
    # AÇÃO
    # ========================================================

    modulo = Column(
        String(80),
        nullable=False,
        index=True,
    )

    acao = Column(
        String(80),
        nullable=False,
        index=True,
    )

    entidade = Column(
        String(80),
        nullable=True,
        index=True,
    )

    registro_referencia = Column(
        String(120),
        nullable=True,
        index=True,
    )

    # ========================================================
    # DETALHES
    # ========================================================

    detalhes = Column(
        Text,
        nullable=True,
    )

    dados_anteriores = Column(
        Text,
        nullable=True,
    )

    dados_novos = Column(
        Text,
        nullable=True,
    )

    # ========================================================
    # DATA
    # ========================================================

    criado_em = Column(
        DateTime,
        nullable=False,
        default=datetime.now,
        index=True,
    )

    # ========================================================
    # REPRESENTAÇÃO
    # ========================================================

    def __repr__(self):
        return (
            f"<Auditoria("
            f"id={self.id}, "
            f"usuario_nome='{self.usuario_nome}', "
            f"modulo='{self.modulo}', "
            f"acao='{self.acao}', "
            f"registro_referencia='{self.registro_referencia}'"
            f")>"
        )



class PedidoEvento(Base):
    __tablename__ = "pedido_eventos"
    id = Column(Integer, primary_key=True, autoincrement=True)
    pedido_codigo = Column(String(20), ForeignKey("pedidos.codigo"), nullable=False, index=True)
    tipo = Column(String(30), nullable=False)
    descricao = Column(Text, nullable=False)
    usuario_codigo = Column(String(20), nullable=True)
    criado_em = Column(DateTime, nullable=False, default=datetime.now)

class RelatorioGerado(Base):
    __tablename__ = "relatorios_gerados"
    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String(150), nullable=False)
    formato = Column(String(10), nullable=False, default="CSV")
    arquivo = Column(String(180), nullable=False)
    periodo = Column(String(30), nullable=False)
    conteudo = Column(Text, nullable=False)
    usuario_codigo = Column(String(20), nullable=True)
    gerado_em = Column(DateTime, nullable=False, default=datetime.now)


class BaseDemonstrativa(Base):
    __tablename__ = "base_demonstrativa"
    id = Column(Integer, primary_key=True)
    ativa = Column(Boolean, nullable=False, default=False)
    descricao = Column(String(180), nullable=False)
    criado_em = Column(DateTime, nullable=False, default=datetime.now)


class RastreamentoSimulado(Base):
    __tablename__ = "rastreamentos_simulados"
    pedido_codigo = Column(String(20), ForeignKey("pedidos.codigo"), primary_key=True)
    ativo = Column(Boolean, nullable=False, default=True)
    iniciado_em = Column(DateTime, nullable=True)
    inicio_previsto = Column(DateTime, nullable=True)
    duracao_segundos = Column(Integer, nullable=False, default=360)
    distancia_km = Column(Integer, nullable=False, default=128)
    atraso_segundos = Column(Integer, nullable=False, default=0)
    ultima_etapa = Column(Integer, nullable=False, default=-1)
    motorista = Column(String(120), nullable=False, default="Carlos Silva")
    erro = Column(String(250), nullable=True)
    __table_args__ = (
        CheckConstraint("duracao_segundos >= 30", name="ck_rastreamento_duracao"),
        CheckConstraint("distancia_km > 0", name="ck_rastreamento_distancia"),
    )
