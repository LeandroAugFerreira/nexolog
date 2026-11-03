# ============================================================
# LOGIFLOW
# CARGA INICIAL DE DADOS DEMONSTRATIVOS
# ============================================================
#
# Execute a partir da raiz do projeto:
#
# python -m backend.seed
#
# O script NÃO apaga dados existentes.
# Cada grupo só é criado quando sua respectiva tabela está vazia.
#
# ============================================================

from datetime import datetime, timedelta
from decimal import Decimal

from backend.database import (
    Base,
    SessionLocal,
    engine,
)

from backend.models import (
    Auditoria,
    Cliente,
    Fornecedor,
    ItemPedido,
    Movimentacao,
    Pedido,
    Produto,
    Usuario,
)


# ============================================================
# CRIAR TABELAS
# ============================================================

Base.metadata.create_all(
    bind=engine,
)


# ============================================================
# DATAS DE REFERÊNCIA
# ============================================================

AGORA = datetime.now()


# ============================================================
# PRODUTOS DEMONSTRATIVOS
# ============================================================

PRODUTOS = [
    {
        "sku": "PRD-001",
        "nome": "Papel Sulfite A4 75g",
        "categoria": "Papéis e Impressão",
        "marca": "Chamex",
        "especificacao": "A4 • 75 g/m² • 500 folhas",
        "gtin_ean": "7891173023303",
        "estoque_atual": 420,
        "estoque_minimo": 120,
        "custo_unitario": Decimal("22.90"),
        "margem_lucro_percentual": Decimal("30.00"),
        "preco_venda": Decimal("38.02"),
    },
    {
        "sku": "PRD-002",
        "nome": "Caneta Esferográfica Azul",
        "categoria": "Canetas e Escrita",
        "marca": "BIC",
        "especificacao": "Ponta 1.0 mm",
        "gtin_ean": "070330413602",
        "estoque_atual": 950,
        "estoque_minimo": 250,
        "custo_unitario": Decimal("1.65"),
        "margem_lucro_percentual": Decimal("45.00"),
        "preco_venda": Decimal("3.02"),
    },
    {
        "sku": "PRD-003",
        "nome": "Caderno Universitário 10 Matérias",
        "categoria": "Cadernos, Agendas e Blocos",
        "marca": "Tilibra",
        "especificacao": "200 folhas",
        "gtin_ean": "7891027135282",
        "estoque_atual": 185,
        "estoque_minimo": 80,
        "custo_unitario": Decimal("17.40"),
        "margem_lucro_percentual": Decimal("35.00"),
        "preco_venda": Decimal("29.74"),
    },
    {
        "sku": "PRD-004",
        "nome": "Marca-texto Amarelo",
        "categoria": "Marca-textos e Marcadores",
        "marca": "Stabilo",
        "especificacao": "Boss Original",
        "gtin_ean": "4006381114849",
        "estoque_atual": 72,
        "estoque_minimo": 90,
        "custo_unitario": Decimal("4.80"),
        "margem_lucro_percentual": Decimal("40.00"),
        "preco_venda": Decimal("8.51"),
    },
    {
        "sku": "PRD-005",
        "nome": "Fita Adesiva Transparente",
        "categoria": "Colas, Fitas e Adesivos",
        "marca": "3M",
        "especificacao": "45 mm x 45 m",
        "gtin_ean": "7891040121453",
        "estoque_atual": 310,
        "estoque_minimo": 100,
        "custo_unitario": Decimal("5.60"),
        "margem_lucro_percentual": Decimal("38.00"),
        "preco_venda": Decimal("9.78"),
    },
    {
        "sku": "PRD-006",
        "nome": "Pasta Catálogo",
        "categoria": "Pastas, Arquivos e Organização",
        "marca": "ACP",
        "especificacao": "50 envelopes",
        "gtin_ean": "7897027200501",
        "estoque_atual": 44,
        "estoque_minimo": 60,
        "custo_unitario": Decimal("12.30"),
        "margem_lucro_percentual": Decimal("35.00"),
        "preco_venda": Decimal("21.03"),
    },
    {
        "sku": "PRD-007",
        "nome": "Etiqueta Adesiva A4",
        "categoria": "Etiquetas e Identificação",
        "marca": "Pimaco",
        "especificacao": "100 folhas",
        "gtin_ean": "7896025521037",
        "estoque_atual": 136,
        "estoque_minimo": 50,
        "custo_unitario": Decimal("31.50"),
        "margem_lucro_percentual": Decimal("28.00"),
        "preco_venda": Decimal("51.07"),
    },
    {
        "sku": "PRD-008",
        "nome": "Grampeador de Mesa",
        "categoria": "Grampeamento, Perfuração e Clips",
        "marca": "Maped",
        "especificacao": "Até 25 folhas",
        "gtin_ean": "3154143543112",
        "estoque_atual": 64,
        "estoque_minimo": 30,
        "custo_unitario": Decimal("16.90"),
        "margem_lucro_percentual": Decimal("35.00"),
        "preco_venda": Decimal("28.89"),
    },
    {
        "sku": "PRD-009",
        "nome": "Filme Stretch 500mm",
        "categoria": "Embalagens",
        "marca": "PackFilm",
        "especificacao": "500 mm x 0,025 mm",
        "gtin_ean": "7898956001015",
        "estoque_atual": 28,
        "estoque_minimo": 45,
        "custo_unitario": Decimal("42.00"),
        "margem_lucro_percentual": Decimal("30.00"),
        "preco_venda": Decimal("69.73"),
    },
    {
        "sku": "PRD-010",
        "nome": "Calculadora de Mesa 12 Dígitos",
        "categoria": "Calculadoras e Acessórios de Escritório",
        "marca": "Casio",
        "especificacao": "12 dígitos",
        "gtin_ean": "4971850092671",
        "estoque_atual": 39,
        "estoque_minimo": 20,
        "custo_unitario": Decimal("38.00"),
        "margem_lucro_percentual": Decimal("32.00"),
        "preco_venda": Decimal("63.54"),
    },
]


# ============================================================
# FORNECEDORES DEMONSTRATIVOS
# ============================================================

FORNECEDORES = [
    {
        "codigo": "FOR-001",
        "razao_social": "Camp Office Distribuidora Ltda",
        "nome_fantasia": "Camp Office",
        "cnpj": "12345678000101",
        "categoria": "Papelaria",
        "contato": "Marina Lopes",
        "telefone": "(19) 3232-1001",
        "email": "comercial@campoffice.com.br",
        "cidade": "Campinas",
        "uf": "SP",
        "prazo_medio_entrega": 3,
        "status": "ativo",
    },
    {
        "codigo": "FOR-002",
        "razao_social": "Interior Embalagens Comércio Ltda",
        "nome_fantasia": "Interior Embalagens",
        "cnpj": "22345678000102",
        "categoria": "Embalagens",
        "contato": "Rafael Lima",
        "telefone": "(19) 3876-2040",
        "email": "vendas@interiorembalagens.com.br",
        "cidade": "Valinhos",
        "uf": "SP",
        "prazo_medio_entrega": 2,
        "status": "ativo",
    },
    {
        "codigo": "FOR-003",
        "razao_social": "Suprimentos Paulista S.A.",
        "nome_fantasia": "Supra SP",
        "cnpj": "32345678000103",
        "categoria": "Escritório",
        "contato": "Bianca Nunes",
        "telefone": "(11) 4002-7788",
        "email": "atendimento@suprasp.com.br",
        "cidade": "São Paulo",
        "uf": "SP",
        "prazo_medio_entrega": 4,
        "status": "ativo",
    },
    {
        "codigo": "FOR-004",
        "razao_social": "Rota Identificação e Etiquetas Ltda",
        "nome_fantasia": "Rota Etiquetas",
        "cnpj": "42345678000104",
        "categoria": "Identificação",
        "contato": "Carlos Duarte",
        "telefone": "(19) 3456-8877",
        "email": "pedidos@rotaetiquetas.com.br",
        "cidade": "Americana",
        "uf": "SP",
        "prazo_medio_entrega": 5,
        "status": "ativo",
    },
]


# ============================================================
# CLIENTES DEMONSTRATIVOS
# ============================================================

CLIENTES = [
    {
        "codigo": "CLI-001",
        "nome": "Comercial Nova Campinas Ltda",
        "tipo": "pessoa_juridica",
        "documento": "11222333000144",
        "telefone": "(19) 3254-1100",
        "email": "compras@novacampinas.com.br",
        "cep": "13010000",
        "logradouro": "Avenida Francisco Glicério",
        "numero": "900",
        "complemento": None,
        "bairro": "Centro",
        "cidade": "Campinas",
        "uf": "SP",
        "status": "ativo",
    },
    {
        "codigo": "CLI-002",
        "nome": "Instituto Horizonte Educacional Ltda",
        "tipo": "pessoa_juridica",
        "documento": "22333444000155",
        "telefone": "(19) 3777-2200",
        "email": "suprimentos@horizonte.edu.br",
        "cep": "13083020",
        "logradouro": "Avenida John Boyd Dunlop",
        "numero": "1500",
        "complemento": "Bloco B",
        "bairro": "Jardim Ipaussurama",
        "cidade": "Campinas",
        "uf": "SP",
        "status": "ativo",
    },
    {
        "codigo": "CLI-003",
        "nome": "Clínica Vida & Saúde Ltda",
        "tipo": "pessoa_juridica",
        "documento": "33444555000166",
        "telefone": "(19) 3201-3300",
        "email": "administrativo@vidasaude.com.br",
        "cep": "13025000",
        "logradouro": "Avenida Norte Sul",
        "numero": "650",
        "complemento": None,
        "bairro": "Cambuí",
        "cidade": "Campinas",
        "uf": "SP",
        "status": "ativo",
    },
    {
        "codigo": "CLI-004",
        "nome": "Lucas Ferreira",
        "tipo": "pessoa_fisica",
        "documento": "12345678901",
        "telefone": "(19) 99999-1200",
        "email": "lucas.ferreira@email.com",
        "cep": "13270000",
        "logradouro": "Rua das Flores",
        "numero": "82",
        "complemento": None,
        "bairro": "Centro",
        "cidade": "Valinhos",
        "uf": "SP",
        "status": "ativo",
    },
]


# ============================================================
# USUÁRIOS DEMONSTRATIVOS
# ============================================================

USUARIOS = [
    {
        "codigo": "USR-001",
        "nome": "Administrador LogiFlow",
        "email": "admin@logiflow.local",
        "cargo": "Administrador do Sistema",
        "perfil": "administrador",
        "status": "ativo",
        "ultimo_acesso": AGORA - timedelta(minutes=12),
    },
    {
        "codigo": "USR-002",
        "nome": "Mariana Costa",
        "email": "mariana.costa@logiflow.local",
        "cargo": "Gerente de Operações",
        "perfil": "gerente",
        "status": "ativo",
        "ultimo_acesso": AGORA - timedelta(hours=2),
    },
    {
        "codigo": "USR-003",
        "nome": "Pedro Martins",
        "email": "pedro.martins@logiflow.local",
        "cargo": "Assistente de Estoque",
        "perfil": "operador",
        "status": "ativo",
        "ultimo_acesso": AGORA - timedelta(days=1),
    },
    {
        "codigo": "USR-004",
        "nome": "Ana Souza",
        "email": "ana.souza@logiflow.local",
        "cargo": "Analista Administrativo",
        "perfil": "consulta",
        "status": "ativo",
        "ultimo_acesso": AGORA - timedelta(days=2),
    },
]


# ============================================================
# PEDIDOS DEMONSTRATIVOS
# ============================================================

PEDIDOS = [
    {
        "codigo": "PED-001",
        "cliente_nome": "Comercial Nova Campinas Ltda",
        "destino": "Campinas/SP",
        "transportadora": "Rota Express",
        "codigo_rastreio": "LF20260001",
        "status": "entregue",
        "valor_total": Decimal("418.20"),
        "criado_em": AGORA - timedelta(days=12),
    },
    {
        "codigo": "PED-002",
        "cliente_nome": "Instituto Horizonte Educacional Ltda",
        "destino": "Campinas/SP",
        "transportadora": "ViaLog",
        "codigo_rastreio": "LF20260002",
        "status": "enviado",
        "valor_total": Decimal("760.40"),
        "criado_em": AGORA - timedelta(days=5),
    },
    {
        "codigo": "PED-003",
        "cliente_nome": "Clínica Vida & Saúde Ltda",
        "destino": "Campinas/SP",
        "transportadora": None,
        "codigo_rastreio": None,
        "status": "processando",
        "valor_total": Decimal("293.40"),
        "criado_em": AGORA - timedelta(days=2),
    },
    {
        "codigo": "PED-004",
        "cliente_nome": "Lucas Ferreira",
        "destino": "Valinhos/SP",
        "transportadora": None,
        "codigo_rastreio": None,
        "status": "pendente",
        "valor_total": Decimal("92.14"),
        "criado_em": AGORA - timedelta(hours=8),
    },
]


ITENS_PEDIDO = [
    {
        "pedido_codigo": "PED-001",
        "produto_sku": "PRD-001",
        "produto_nome": "Papel Sulfite A4 75g",
        "quantidade": 10,
        "valor_unitario": Decimal("38.02"),
        "subtotal": Decimal("380.20"),
    },
    {
        "pedido_codigo": "PED-001",
        "produto_sku": "PRD-002",
        "produto_nome": "Caneta Esferográfica Azul",
        "quantidade": 10,
        "valor_unitario": Decimal("3.80"),
        "subtotal": Decimal("38.00"),
    },
    {
        "pedido_codigo": "PED-002",
        "produto_sku": "PRD-001",
        "produto_nome": "Papel Sulfite A4 75g",
        "quantidade": 20,
        "valor_unitario": Decimal("38.02"),
        "subtotal": Decimal("760.40"),
    },
    {
        "pedido_codigo": "PED-003",
        "produto_sku": "PRD-005",
        "produto_nome": "Fita Adesiva Transparente",
        "quantidade": 30,
        "valor_unitario": Decimal("9.78"),
        "subtotal": Decimal("293.40"),
    },
    {
        "pedido_codigo": "PED-004",
        "produto_sku": "PRD-004",
        "produto_nome": "Marca-texto Amarelo",
        "quantidade": 5,
        "valor_unitario": Decimal("8.51"),
        "subtotal": Decimal("42.55"),
    },
    {
        "pedido_codigo": "PED-004",
        "produto_sku": "PRD-008",
        "produto_nome": "Grampeador de Mesa",
        "quantidade": 1,
        "valor_unitario": Decimal("28.89"),
        "subtotal": Decimal("28.89"),
    },
    {
        "pedido_codigo": "PED-004",
        "produto_sku": "PRD-002",
        "produto_nome": "Caneta Esferográfica Azul",
        "quantidade": 6,
        "valor_unitario": Decimal("3.45"),
        "subtotal": Decimal("20.70"),
    },
]


# ============================================================
# MOVIMENTAÇÕES DEMONSTRATIVAS
# ============================================================

MOVIMENTACOES = [
    {
        "produto_sku": "PRD-001",
        "produto_nome": "Papel Sulfite A4 75g",
        "tipo": "entrada",
        "quantidade": 500,
        "origem": "Camp Office",
        "destino": "Estoque Principal",
        "saldo_anterior": 0,
        "saldo_posterior": 500,
        "criado_em": AGORA - timedelta(days=20),
    },
    {
        "produto_sku": "PRD-001",
        "produto_nome": "Papel Sulfite A4 75g",
        "tipo": "saida",
        "quantidade": 80,
        "origem": "Estoque Principal",
        "destino": "Pedidos / Consumo",
        "saldo_anterior": 500,
        "saldo_posterior": 420,
        "criado_em": AGORA - timedelta(days=4),
    },
    {
        "produto_sku": "PRD-004",
        "produto_nome": "Marca-texto Amarelo",
        "tipo": "entrada",
        "quantidade": 120,
        "origem": "Camp Office",
        "destino": "Estoque Principal",
        "saldo_anterior": 0,
        "saldo_posterior": 120,
        "criado_em": AGORA - timedelta(days=18),
    },
    {
        "produto_sku": "PRD-004",
        "produto_nome": "Marca-texto Amarelo",
        "tipo": "saida",
        "quantidade": 48,
        "origem": "Estoque Principal",
        "destino": "Pedidos / Consumo",
        "saldo_anterior": 120,
        "saldo_posterior": 72,
        "criado_em": AGORA - timedelta(days=3),
    },
    {
        "produto_sku": "PRD-009",
        "produto_nome": "Filme Stretch 500mm",
        "tipo": "entrada",
        "quantidade": 60,
        "origem": "Interior Embalagens",
        "destino": "Estoque Principal",
        "saldo_anterior": 0,
        "saldo_posterior": 60,
        "criado_em": AGORA - timedelta(days=15),
    },
    {
        "produto_sku": "PRD-009",
        "produto_nome": "Filme Stretch 500mm",
        "tipo": "saida",
        "quantidade": 32,
        "origem": "Estoque Principal",
        "destino": "Expedição",
        "saldo_anterior": 60,
        "saldo_posterior": 28,
        "criado_em": AGORA - timedelta(days=2),
    },
]


# ============================================================
# FUNÇÕES
# ============================================================

def adicionar_se_tabela_vazia(
    db,
    modelo,
    registros,
) -> int:
    if (
        db.query(modelo)
        .count()
        > 0
    ):
        return 0

    objetos = [
        modelo(
            **registro,
        )
        for registro in registros
    ]

    db.add_all(
        objetos,
    )

    db.flush()

    return len(
        objetos
    )


def carregar_dados_demo():
    db = SessionLocal()

    resumo = {
        "produtos": 0,
        "fornecedores": 0,
        "clientes": 0,
        "usuarios": 0,
        "pedidos": 0,
        "itens_pedido": 0,
        "movimentacoes": 0,
        "auditoria": 0,
    }

    try:
        resumo["produtos"] = adicionar_se_tabela_vazia(
            db,
            Produto,
            PRODUTOS,
        )

        resumo["fornecedores"] = adicionar_se_tabela_vazia(
            db,
            Fornecedor,
            FORNECEDORES,
        )

        resumo["clientes"] = adicionar_se_tabela_vazia(
            db,
            Cliente,
            CLIENTES,
        )

        resumo["usuarios"] = adicionar_se_tabela_vazia(
            db,
            Usuario,
            USUARIOS,
        )

        if (
            db.query(Pedido)
            .count()
            == 0
        ):
            resumo["pedidos"] = adicionar_se_tabela_vazia(
                db,
                Pedido,
                PEDIDOS,
            )

            resumo["itens_pedido"] = adicionar_se_tabela_vazia(
                db,
                ItemPedido,
                ITENS_PEDIDO,
            )

        resumo["movimentacoes"] = adicionar_se_tabela_vazia(
            db,
            Movimentacao,
            MOVIMENTACOES,
        )

        if (
            db.query(Auditoria)
            .count()
            == 0
        ):
            auditoria_inicial = Auditoria(
                usuario_codigo=None,
                usuario_nome="Sistema",
                modulo="Sistema",
                acao="carga_inicial",
                entidade="Banco de Dados",
                registro_referencia="SEED",
                detalhes=(
                    "Carga inicial demonstrativa do LogiFlow executada."
                ),
                criado_em=AGORA,
            )

            db.add(
                auditoria_inicial,
            )

            resumo["auditoria"] = 1

        db.commit()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()

    return resumo


if __name__ == "__main__":
    resultado = carregar_dados_demo()

    print()
    print("========================================")
    print(" LOGIFLOW - CARGA INICIAL")
    print("========================================")

    for chave, quantidade in resultado.items():
        print(
            f"{chave}: {quantidade}"
        )

    print("========================================")
    print("Carga concluída.")
    print("========================================")
