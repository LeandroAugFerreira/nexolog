from backend.config import DATABASE_PATH, DEMO_MODE, ALLOW_DEMO_PASSWORD, PUBLIC_SIGNUP, CORS_ORIGINS, DEMO_PASSWORD
from backend.migrations import migrar_operacao
from backend.operations import criar_pedido, atualizar_pedido, saldo_disponivel, preencher_saldos

# ============================================================
# LOGIFLOW
# API PRINCIPAL
# FASTAPI + SQLALCHEMY + SQLITE
# ============================================================


import contextvars
import hashlib
import hmac
import secrets
import unicodedata

from datetime import (
    datetime,
    timedelta,
)

from decimal import (
    Decimal,
    ROUND_HALF_UP,
)


from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Request,
    Response,
    status,
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from sqlalchemy import (
    inspect,
    text,
)

from sqlalchemy.orm import (
    Session,
    selectinload,
)


from backend.database import (
    Base,
    SessionLocal,
    engine,
    get_db,
)

from backend.models import (
    Auditoria,
    Cliente,
    CredencialUsuario,
    Fornecedor,
    ItemPedido,
    Movimentacao,
    Pedido,
    Produto,
    SessaoUsuario,
    Usuario,
)

from backend.schemas import (
    AcessoDemoResponse,
    AuditoriaResponse,
    CadastroPublicoRequest,
    ClienteCreate,
    ClienteResponse,
    ClienteStatusUpdate,
    ClienteUpdate,
    FornecedorCreate,
    FornecedorResponse,
    FornecedorStatusUpdate,
    FornecedorUpdate,
    MovimentacaoCreate,
    MovimentacaoResponse,
    PedidoCreate,
    PedidoResponse,
    PedidoStatusUpdate,
    ProdutoCreate,
    ProdutoResponse,
    ProdutoUpdate,
    LoginRequest,
    LoginResponse,
    UsuarioCreate,
    UsuarioResponse,
    UsuarioStatusUpdate,
    UsuarioUpdate,
)



# ============================================================
# AUTENTICAÇÃO / SESSÃO
# ============================================================

SENHA_DEMO_INICIAL = DEMO_PASSWORD

DURACAO_SESSAO_HORAS = 12

ITERACOES_PBKDF2 = 210_000

usuario_contexto = (
    contextvars.ContextVar(
        "logiflow_usuario_contexto",
        default=None,
    )
)


def gerar_hash_senha(
    senha: str,
    salt_hex: str | None = None,
) -> tuple[str, str]:

    if (
        salt_hex is None
    ):
        salt = (
            secrets.token_bytes(
                32,
            )
        )

        salt_hex = (
            salt.hex()
        )

    else:
        salt = (
            bytes.fromhex(
                salt_hex,
            )
        )

    senha_hash = (
        hashlib.pbkdf2_hmac(
            "sha256",
            senha.encode(
                "utf-8",
            ),
            salt,
            ITERACOES_PBKDF2,
        )
        .hex()
    )

    return (
        senha_hash,
        salt_hex,
    )


def senha_confere(
    senha: str,
    credencial: CredencialUsuario,
) -> bool:

    calculado, _ = (
        gerar_hash_senha(
            senha,
            credencial.senha_salt,
        )
    )

    return hmac.compare_digest(
        calculado,
        credencial.senha_hash,
    )


def hash_token(
    token: str,
) -> str:

    return (
        hashlib.sha256(
            token.encode(
                "utf-8",
            ),
        )
        .hexdigest()
    )


def criar_credencial(
    db: Session,
    usuario_codigo: str,
    senha: str,
) -> CredencialUsuario:

    senha_hash, senha_salt = (
        gerar_hash_senha(
            senha,
        )
    )

    credencial = (
        db.query(
            CredencialUsuario,
        )
        .filter(
            CredencialUsuario.usuario_codigo ==
            usuario_codigo,
        )
        .first()
    )

    if (
        credencial is None
    ):
        credencial = CredencialUsuario(
            usuario_codigo=usuario_codigo,
            senha_hash=senha_hash,
            senha_salt=senha_salt,
        )

        db.add(
            credencial,
        )

    else:
        credencial.senha_hash = (
            senha_hash
        )

        credencial.senha_salt = (
            senha_salt
        )

    return credencial


def garantir_credenciais_demo():
    """
    Usuários já existentes no banco demonstrativo recebem uma
    senha inicial apenas se ainda não possuem credencial.

    Senhas já alteradas nunca são sobrescritas.
    """

    db = SessionLocal()

    try:
        usuarios = (
            db.query(
                Usuario,
            )
            .all()
        )

        alterou = False

        for usuario in usuarios:
            credencial = (
                db.query(
                    CredencialUsuario,
                )
                .filter(
                    CredencialUsuario.usuario_codigo ==
                    usuario.codigo,
                )
                .first()
            )

            if (
                credencial is None
            ):
                criar_credencial(
                    db,
                    usuario.codigo,
                    SENHA_DEMO_INICIAL,
                )

                alterou = True

        if (
            alterou
        ):
            db.commit()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


def obter_sessao_por_token(
    db: Session,
    token: str,
) -> tuple[
    SessaoUsuario | None,
    Usuario | None,
]:

    if (
        not token
    ):
        return (
            None,
            None,
        )

    agora = datetime.now()

    sessao = (
        db.query(
            SessaoUsuario,
        )
        .filter(
            SessaoUsuario.token_hash ==
            hash_token(
                token,
            ),
            SessaoUsuario.revogado_em.is_(
                None,
            ),
            SessaoUsuario.expira_em >
            agora,
        )
        .first()
    )

    if (
        sessao is None
    ):
        return (
            None,
            None,
        )

    usuario = (
        db.query(
            Usuario,
        )
        .filter(
            Usuario.codigo ==
            sessao.usuario_codigo,
            Usuario.status ==
            "ativo",
        )
        .first()
    )

    if (
        usuario is None
    ):
        return (
            None,
            None,
        )

    return (
        sessao,
        usuario,
    )


def token_request(
    request: Request,
) -> str:

    autorizacao = (
        request.headers.get(
            "Authorization",
            "",
        )
    )

    prefixo = (
        "Bearer "
    )

    if (
        not autorizacao.startswith(
            prefixo,
        )
    ):
        return ""

    return (
        autorizacao[
            len(
                prefixo,
            ):
        ]
        .strip()
    )


def permissao_endpoint(usuario: Usuario, request: Request) -> tuple[bool, str]:
    """
    Regras simples de perfil para a versão de portfólio.

    administrador:
      acesso completo.

    gerente:
      operação completa, exceto gestão de usuários.

    operador:
      leitura geral + escrita em produtos, movimentações, pedidos
      e geração de relatórios CSV.

    consulta:
      somente leitura.
    """
    metodo = request.method.upper()
    caminho = request.url.path
    perfil = usuario.perfil
    if caminho.startswith('/api/auth/'):
        return (True, '')
    if perfil == 'administrador':
        return (True, '')
    if caminho.startswith('/api/usuarios'):
        return (False, 'Somente administradores podem acessar a gestão de usuários.')
    if metodo in {'GET', 'HEAD'}:
        return (True, '')
    if perfil == 'consulta':
        return (False, 'O perfil Consulta possui acesso somente para visualização.')
    if perfil == 'gerente':
        return (True, '')
    if perfil == 'operador':
        # A exportação é uma escrita operacional, mas o perfil Consulta não pode gravar.
        if caminho == '/api/relatorios' and metodo == 'POST':
            return (True, '')
        rotas_operador = ('/api/produtos', '/api/movimentacoes', '/api/pedidos')
        if caminho.startswith(rotas_operador):
            return (True, '')
        return (False, 'O perfil Operador não possui permissão para esta alteração.')
    return (False, 'Perfil sem permissão para esta operação.')


def usuario_autenticado_atual():
    return (
        usuario_contexto.get()
    )



# ============================================================
# CRIAR TABELAS
# ============================================================

Base.metadata.create_all(
    bind=engine,
)


# ============================================================
# MIGRAÇÃO LEVE - PRECIFICAÇÃO DE PRODUTOS
# ============================================================
#
migrar_operacao(DATABASE_PATH)

# Base.metadata.create_all() cria tabelas novas, mas não adiciona
# colunas em uma tabela SQLite que já existe.
#
# Esta migração preserva os produtos atuais e adiciona apenas as
# novas colunas necessárias para a formação do preço de venda.
#
# ============================================================

def migrar_colunas_precificacao_produtos():
    inspetor = inspect(
        engine,
    )

    if (
        "produtos"
        not in
        inspetor.get_table_names()
    ):
        return

    colunas_existentes = {
        coluna["name"]
        for coluna in
        inspetor.get_columns(
            "produtos",
        )
    }

    novas_colunas = {
        "marca":
            "VARCHAR(100)",

        "especificacao":
            "VARCHAR(180)",

        "gtin_ean":
            "TEXT",

        "custo_unitario":
            "NUMERIC(12, 2) NOT NULL DEFAULT 0",

        "margem_lucro_percentual":
            "NUMERIC(7, 4) NOT NULL DEFAULT 0",

        "ncm":
            "VARCHAR(8)",

        "regime_tributario":
            "VARCHAR(30) NOT NULL DEFAULT 'lucro_presumido'",

        "uf_referencia":
            "VARCHAR(2) NOT NULL DEFAULT 'SP'",

        "referencia_fiscal":
            "VARCHAR(40) NOT NULL DEFAULT 'Brasil 2026 / referência SP'",

        "aliquota_icms":
            "NUMERIC(7, 4) NOT NULL DEFAULT 18",

        "aliquota_pis":
            "NUMERIC(7, 4) NOT NULL DEFAULT 0.65",

        "aliquota_cofins":
            "NUMERIC(7, 4) NOT NULL DEFAULT 3",

        "aliquota_ipi":
            "NUMERIC(7, 4) NOT NULL DEFAULT 0",

        "aliquota_simples":
            "NUMERIC(7, 4) NOT NULL DEFAULT 0",

        "aliquota_cbs":
            "NUMERIC(7, 4) NOT NULL DEFAULT 0.9",

        "aliquota_ibs":
            "NUMERIC(7, 4) NOT NULL DEFAULT 0.1",

        "valor_margem":
            "NUMERIC(12, 2) NOT NULL DEFAULT 0",

        "base_comercial":
            "NUMERIC(12, 2) NOT NULL DEFAULT 0",

        "valor_icms":
            "NUMERIC(12, 2) NOT NULL DEFAULT 0",

        "valor_pis":
            "NUMERIC(12, 2) NOT NULL DEFAULT 0",

        "valor_cofins":
            "NUMERIC(12, 2) NOT NULL DEFAULT 0",

        "valor_ipi":
            "NUMERIC(12, 2) NOT NULL DEFAULT 0",

        "valor_simples":
            "NUMERIC(12, 2) NOT NULL DEFAULT 0",

        "valor_cbs":
            "NUMERIC(12, 2) NOT NULL DEFAULT 0",

        "valor_ibs":
            "NUMERIC(12, 2) NOT NULL DEFAULT 0",

        "preco_venda":
            "NUMERIC(12, 2) NOT NULL DEFAULT 0",

        "calculo_preco_automatico":
            "BOOLEAN NOT NULL DEFAULT 1",

        "preco_venda_manual":
            "NUMERIC(12, 2)",
    }

    with engine.begin() as conexao:
        for (
            nome_coluna,
            definicao,
        ) in novas_colunas.items():

            if (
                nome_coluna
                in
                colunas_existentes
            ):
                continue

            conexao.execute(
                text(
                    "ALTER TABLE produtos "
                    f"ADD COLUMN {nome_coluna} "
                    f"{definicao}"
                )
            )

        conexao.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS "
                "ux_produtos_gtin_ean "
                "ON produtos(gtin_ean) "
                "WHERE gtin_ean IS NOT NULL "
                "AND TRIM(gtin_ean) <> ''"
            )
        )


migrar_colunas_precificacao_produtos()


# ============================================================
# MIGRAÇÃO LEVE - NOMENCLATURA DO ESTOQUE
# ============================================================
#
# O LogiFlow trabalha com um único local padrão:
#
# Estoque Principal
#
# Registros antigos eventualmente gravados como "Estoque Final"
# são normalizados para "Estoque Principal".
#
# "Estoque Atual", "Saldo Anterior" e "Saldo Posterior" são
# quantidades, e não locais físicos.
#
# ============================================================

def migrar_nomenclatura_estoque():
    inspetor = inspect(
        engine,
    )

    if (
        "movimentacoes"
        not in
        inspetor.get_table_names()
    ):
        return

    with engine.begin() as conexao:

        conexao.execute(
            text(
                "UPDATE movimentacoes "
                "SET origem = 'Estoque Principal' "
                "WHERE LOWER(TRIM(origem)) = 'estoque final'"
            )
        )

        conexao.execute(
            text(
                "UPDATE movimentacoes "
                "SET destino = 'Estoque Principal' "
                "WHERE LOWER(TRIM(destino)) = 'estoque final'"
            )
        )


migrar_nomenclatura_estoque()


# ============================================================
# APLICAÇÃO FASTAPI
# ============================================================

app = FastAPI(
    title="NexoLog API",
    description=(
        "API do sistema de gestão logística NexoLog."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

origens_permitidas = CORS_ORIGINS


app.add_middleware(
    CORSMiddleware,
    allow_origins=origens_permitidas,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ============================================================
# MIDDLEWARE DE AUTENTICAÇÃO
# ============================================================

ROTAS_PUBLICAS_API = {
    "/api/health",
    "/api/auth/config",
    "/api/auth/login",
    "/api/auth/demo",
    "/api/auth/register",
}


@app.middleware(
    "http",
)
async def autenticar_requisicoes(
    request: Request,
    call_next,
):
    caminho = (
        request.url.path
    )

    if (
        request.method.upper() ==
        "OPTIONS"
    ):
        return await call_next(
            request,
        )

    if (
        not caminho.startswith(
            "/api/"
        ) or
        caminho in
        ROTAS_PUBLICAS_API
    ):
        return await call_next(
            request,
        )

    token = (
        token_request(
            request,
        )
    )

    if (
        not token
    ):
        return JSONResponse(
            status_code=401,
            content={
                "detail":
                    "Sessão não autenticada."
            },
        )

    db = SessionLocal()

    contexto_token = None

    try:
        sessao, usuario = (
            obter_sessao_por_token(
                db,
                token,
            )
        )

        if (
            sessao is None or
            usuario is None
        ):
            return JSONResponse(
                status_code=401,
                content={
                    "detail":
                        "Sessão inválida ou expirada."
                },
            )

        permitido, mensagem = (
            permissao_endpoint(
                usuario,
                request,
            )
        )

        if (
            not permitido
        ):
            return JSONResponse(
                status_code=403,
                content={
                    "detail":
                        mensagem
                },
            )

        request.state.usuario = (
            usuario
        )

        request.state.sessao = (
            sessao
        )

        contexto_token = (
            usuario_contexto.set({
                "codigo":
                    usuario.codigo,

                "nome":
                    usuario.nome,

                "perfil":
                    usuario.perfil,
            })
        )

        return await call_next(
            request,
        )

    finally:
        if (
            contexto_token is not None
        ):
            usuario_contexto.reset(
                contexto_token,
            )

        db.close()




# ============================================================
# CONFIGURAÇÕES DE PRODUTO
# ============================================================

CATEGORIAS_PERMITIDAS = [
    "Papéis e Impressão",
    "Cadernos, Agendas e Blocos",
    "Canetas e Escrita",
    "Lápis, Lapiseiras e Grafites",
    "Marca-textos e Marcadores",
    "Desenho, Pintura e Colorir",
    "Borrachas, Apontadores e Corretivos",
    "Colas, Fitas e Adesivos",
    "Corte, Régua e Geometria",
    "Pastas, Arquivos e Organização",
    "Etiquetas e Identificação",
    "Grampeamento, Perfuração e Clips",
    "Notas Autoadesivas e Marcadores de Página",
    "Calculadoras e Acessórios de Escritório",
    "Escolar, Estojos e Kits",
    "Embalagens",
    "Paletização",
    "Identificação",
    "EPI",
    "Equipamentos",
]


# ============================================================
# PRECIFICAÇÃO / SIMULAÇÃO FISCAL
# ============================================================
#
# O LogiFlow usa uma simulação para justificar a formação do
# preço de venda. Ela NÃO substitui a apuração fiscal oficial.
#
# Cenário de referência do portfólio:
#
# - Brasil / 2026
# - operação interna de referência em SP
# - CBS 0,9% e IBS 0,1% exibidos como informativos em 2026
#   e não adicionados automaticamente ao preço;
# - ICMS, PIS, COFINS, IPI e Simples permanecem editáveis porque
#   podem variar conforme NCM, regime, benefícios e operação.
#
# Fórmula de formação:
#
# base comercial = custo + margem sobre custo
#
# tributos "por dentro":
# preço sem IPI = base comercial / (1 - taxa efetiva)
#
# IPI, quando informado, é acrescentado após o preço sem IPI.
#
# ============================================================

CENTAVOS = Decimal(
    "0.01"
)

CEM = Decimal(
    "100"
)


def quantizar_moeda(
    valor,
) -> Decimal:

    return (
        Decimal(
            str(valor)
        )
        .quantize(
            CENTAVOS,
            rounding=ROUND_HALF_UP,
        )
    )


def normalizar_ncm(
    ncm: str | None,
) -> str | None:

    if (
        ncm is None
    ):
        return None

    numeros = "".join(
        caractere
        for caractere in str(ncm)
        if caractere.isdigit()
    )

    if (
        numeros == ""
    ):
        return None

    if (
        len(numeros) !=
        8
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "O NCM deve possuir 8 dígitos "
                "quando informado."
            ),
        )

    return numeros


def calcular_precificacao_produto(
    dados,
) -> dict:

    custo = quantizar_moeda(
        dados.custo_unitario,
    )

    calculo_automatico = bool(
        dados.calculo_preco_automatico
    )

    regime = (
        dados.regime_tributario
    )

    uf_referencia = (
        dados.uf_referencia
        .strip()
        .upper()
    )

    if (
        len(uf_referencia) !=
        2 or
        not uf_referencia.isalpha()
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Informe uma UF de referência válida "
                "com 2 letras."
            ),
        )

    ncm = normalizar_ncm(
        dados.ncm,
    )

    aliquota_icms = Decimal(
        str(
            dados.aliquota_icms
        )
    )

    aliquota_pis = Decimal(
        str(
            dados.aliquota_pis
        )
    )

    aliquota_cofins = Decimal(
        str(
            dados.aliquota_cofins
        )
    )

    aliquota_ipi = Decimal(
        str(
            dados.aliquota_ipi
        )
    )

    aliquota_simples = Decimal(
        str(
            dados.aliquota_simples
        )
    )

    aliquota_cbs = Decimal(
        str(
            dados.aliquota_cbs
        )
    )

    aliquota_ibs = Decimal(
        str(
            dados.aliquota_ibs
        )
    )

    if (
        regime ==
        "simples_nacional"
    ):
        aliquota_preco = (
            aliquota_simples
        )
    else:
        aliquota_preco = (
            aliquota_icms +
            aliquota_pis +
            aliquota_cofins
        )

    if (
        aliquota_preco >=
        CEM
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A soma das alíquotas utilizadas "
                "na formação do preço deve ser menor "
                "que 100%."
            ),
        )

    # ========================================================
    # PREÇO AUTOMÁTICO
    # ========================================================

    if (
        calculo_automatico
    ):
        margem_percentual = Decimal(
            str(
                dados.margem_lucro_percentual
            )
        )

        valor_margem = quantizar_moeda(
            custo *
            (
                margem_percentual /
                CEM
            )
        )

        base_comercial = quantizar_moeda(
            custo +
            valor_margem
        )

        divisor = (
            Decimal("1") -
            (
                aliquota_preco /
                CEM
            )
        )

        if (
            base_comercial ==
            Decimal("0.00")
        ):
            preco_sem_ipi = Decimal(
                "0.00"
            )
        else:
            preco_sem_ipi = (
                base_comercial /
                divisor
            )

        valor_ipi = quantizar_moeda(
            preco_sem_ipi *
            (
                aliquota_ipi /
                CEM
            )
        )

        preco_venda = quantizar_moeda(
            preco_sem_ipi +
            valor_ipi
        )

        preco_venda_manual = None

    # ========================================================
    # PREÇO MANUAL
    # ========================================================

    else:
        if (
            dados.preco_venda_manual
            is None
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Informe o preço de venda manual."
                ),
            )

        preco_venda = quantizar_moeda(
            dados.preco_venda_manual,
        )

        if (
            preco_venda <=
            Decimal("0.00")
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "O preço de venda manual deve ser "
                    "maior que zero."
                ),
            )

        fator_ipi = (
            Decimal("1") +
            (
                aliquota_ipi /
                CEM
            )
        )

        preco_sem_ipi = (
            preco_venda /
            fator_ipi
        )

        base_comercial = quantizar_moeda(
            preco_sem_ipi *
            (
                Decimal("1") -
                (
                    aliquota_preco /
                    CEM
                )
            )
        )

        valor_margem = quantizar_moeda(
            base_comercial -
            custo
        )

        if (
            valor_margem <
            Decimal("0.00")
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "O preço de venda manual é insuficiente "
                    "para cobrir o custo e os tributos do cenário."
                ),
            )

        if (
            custo >
            Decimal("0.00")
        ):
            margem_percentual = (
                valor_margem /
                custo *
                CEM
            )
        else:
            margem_percentual = Decimal(
                "0.00"
            )

        preco_venda_manual = (
            preco_venda
        )

    # ========================================================
    # TRIBUTOS ESTIMADOS
    # ========================================================

    if (
        regime ==
        "simples_nacional"
    ):
        valor_simples = quantizar_moeda(
            preco_sem_ipi *
            (
                aliquota_simples /
                CEM
            )
        )

        valor_icms = Decimal(
            "0.00"
        )

        valor_pis = Decimal(
            "0.00"
        )

        valor_cofins = Decimal(
            "0.00"
        )

    else:
        valor_simples = Decimal(
            "0.00"
        )

        valor_icms = quantizar_moeda(
            preco_sem_ipi *
            (
                aliquota_icms /
                CEM
            )
        )

        valor_pis = quantizar_moeda(
            preco_sem_ipi *
            (
                aliquota_pis /
                CEM
            )
        )

        valor_cofins = quantizar_moeda(
            preco_sem_ipi *
            (
                aliquota_cofins /
                CEM
            )
        )

    valor_ipi = quantizar_moeda(
        preco_sem_ipi *
        (
            aliquota_ipi /
            CEM
        )
    )

    # ========================================================
    # CBS / IBS 2026 - INFORMATIVOS
    # ========================================================

    if (
        regime ==
        "simples_nacional"
    ):
        valor_cbs = Decimal(
            "0.00"
        )

        valor_ibs = Decimal(
            "0.00"
        )

    else:
        valor_cbs = quantizar_moeda(
            preco_sem_ipi *
            (
                aliquota_cbs /
                CEM
            )
        )

        valor_ibs = quantizar_moeda(
            preco_sem_ipi *
            (
                aliquota_ibs /
                CEM
            )
        )

    referencia_fiscal = (
        f"Brasil 2026 / referência {uf_referencia}"
    )

    return {
        "custo_unitario":
            custo,

        "margem_lucro_percentual":
            margem_percentual,

        "ncm":
            ncm,

        "regime_tributario":
            regime,

        "uf_referencia":
            uf_referencia,

        "referencia_fiscal":
            referencia_fiscal,

        "calculo_preco_automatico":
            calculo_automatico,

        "preco_venda_manual":
            preco_venda_manual,

        "aliquota_icms":
            aliquota_icms,

        "aliquota_pis":
            aliquota_pis,

        "aliquota_cofins":
            aliquota_cofins,

        "aliquota_ipi":
            aliquota_ipi,

        "aliquota_simples":
            aliquota_simples,

        "aliquota_cbs":
            aliquota_cbs,

        "aliquota_ibs":
            aliquota_ibs,

        "valor_margem":
            valor_margem,

        "base_comercial":
            base_comercial,

        "valor_icms":
            valor_icms,

        "valor_pis":
            valor_pis,

        "valor_cofins":
            valor_cofins,

        "valor_ipi":
            valor_ipi,

        "valor_simples":
            valor_simples,

        "valor_cbs":
            valor_cbs,

        "valor_ibs":
            valor_ibs,

        "preco_venda":
            preco_venda,
    }


# ============================================================
# NORMALIZAR TEXTO
# ============================================================
#
# Usado principalmente para comparação de duplicidades.
#
# Exemplos:
#
# "Embalagens"
# "embalagens"
# " EMBALAGENS "
#
# passam a ser considerados equivalentes.
#
# Também removemos acentuação para tornar a comparação mais
# consistente.
#
# ============================================================

def normalizar_texto(
    texto: str,
) -> str:

    texto_normalizado = (
        unicodedata.normalize(
            "NFD",
            str(texto).strip(),
        )
    )


    texto_sem_acentos = "".join(
        caractere
        for caractere in texto_normalizado
        if (
            unicodedata.category(
                caractere,
            )
            != "Mn"
        )
    )


    return (
        texto_sem_acentos
        .casefold()
    )


# ============================================================
# NORMALIZAR SKU
# ============================================================

def normalizar_sku(
    sku: str,
) -> str:

    return (
        sku
        .strip()
        .upper()
    )


# ============================================================
# OBTER MAIOR NÚMERO DE SKU
# ============================================================

def obter_maior_numero_sku(
    db: Session,
) -> int:
    """
    Procura o maior número já utilizado.

    Exemplo:

    PRD-001
    PRD-007
    PRD-015

    retorna:

    15
    """

    produtos = (
        db.query(Produto)
        .all()
    )


    maior_numero = 0


    for produto in produtos:

        try:
            numero = int(
                produto.sku.replace(
                    "PRD-",
                    "",
                )
            )


            if (
                numero >
                maior_numero
            ):
                maior_numero = (
                    numero
                )

        except (
            ValueError,
            AttributeError,
        ):
            continue


    return maior_numero


# ============================================================
# GERAR PRÓXIMO SKU
# ============================================================

def gerar_proximo_sku(
    db: Session,
) -> str:

    proximo_numero = (
        obter_maior_numero_sku(
            db,
        )
        + 1
    )


    return (
        f"PRD-{proximo_numero:03d}"
    )


# ============================================================
# IDENTIFICAÇÃO INTELIGENTE DO PRODUTO
# ============================================================

def normalizar_campo_produto(
    valor: str | None,
) -> str | None:

    if (
        valor is None
    ):
        return None

    texto = (
        str(valor)
        .strip()
    )

    return (
        texto
        or None
    )


def normalizar_gtin_ean(
    valor: str | None,
) -> str | None:

    if (
        valor is None
    ):
        return None

    texto = (
        str(valor)
        .strip()
    )

    return (
        texto
        or None
    )


def chave_identidade_produto(
    nome: str,
    marca: str | None,
    especificacao: str | None,
) -> tuple[str, str, str]:

    return (
        normalizar_texto(nome),
        normalizar_texto(marca or ""),
        normalizar_texto(especificacao or ""),
    )


# ============================================================
# VERIFICAR PRODUTO DUPLICADO
# ============================================================

def produto_duplicado(
    db: Session,
    nome: str,
    marca: str | None,
    especificacao: str | None,
    gtin_ean: str | None,
    sku_ignorar: str | None = None,
) -> Produto | None:

    gtin_normalizado = normalizar_gtin_ean(gtin_ean)
    chave_nova = chave_identidade_produto(
        nome,
        marca,
        especificacao,
    )

    produtos = db.query(Produto).all()

    for produto in produtos:
        if (
            sku_ignorar is not None
            and produto.sku == sku_ignorar
        ):
            continue

        gtin_existente = normalizar_gtin_ean(
            produto.gtin_ean,
        )

        if (
            gtin_normalizado is not None
            and gtin_existente is not None
            and gtin_existente == gtin_normalizado
        ):
            return produto

        if (
            chave_identidade_produto(
                produto.nome,
                produto.marca,
                produto.especificacao,
            )
            == chave_nova
        ):
            return produto

    return None


# ============================================================
# BUSCAR PRODUTO PELO SKU
# ============================================================

def buscar_produto_por_sku(
    db: Session,
    sku: str,
) -> Produto:

    sku_normalizado = (
        normalizar_sku(
            sku,
        )
    )


    produto = (
        db.query(Produto)
        .filter(
            Produto.sku ==
            sku_normalizado,
        )
        .first()
    )


    if (
        produto is None
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                f"Produto {sku_normalizado} "
                "não encontrado."
            ),
        )


    return produto


# ============================================================
# NORMALIZAR CÓDIGO DO PEDIDO
# ============================================================

def normalizar_codigo_pedido(
    codigo: str,
) -> str:

    return (
        codigo
        .strip()
        .upper()
    )


# ============================================================
# OBTER MAIOR NÚMERO DE PEDIDO
# ============================================================

def obter_maior_numero_pedido(
    db: Session,
) -> int:
    """
    Procura o maior número já utilizado.

    Exemplo:

    PED-001
    PED-007
    PED-015

    retorna:

    15
    """

    pedidos = (
        db.query(Pedido)
        .all()
    )


    maior_numero = 0


    for pedido in pedidos:

        try:
            numero = int(
                pedido.codigo.replace(
                    "PED-",
                    "",
                )
            )


            if (
                numero >
                maior_numero
            ):
                maior_numero = (
                    numero
                )

        except (
            ValueError,
            AttributeError,
        ):
            continue


    return maior_numero


# ============================================================
# GERAR PRÓXIMO CÓDIGO DE PEDIDO
# ============================================================

def gerar_proximo_codigo_pedido(
    db: Session,
) -> str:

    proximo_numero = (
        obter_maior_numero_pedido(
            db,
        )
        + 1
    )


    return (
        f"PED-{proximo_numero:03d}"
    )


# ============================================================
# BUSCAR PEDIDO PELO CÓDIGO
# ============================================================

def buscar_pedido_por_codigo(
    db: Session,
    codigo: str,
) -> Pedido:

    codigo_normalizado = (
        normalizar_codigo_pedido(
            codigo,
        )
    )


    pedido = (
        db.query(Pedido)
        .options(
            selectinload(
                Pedido.itens,
            ), selectinload(Pedido.eventos), selectinload(Pedido.rastreamento_simulado),
        )
        .filter(
            Pedido.codigo ==
            codigo_normalizado,
        )
        .first()
    )


    if (
        pedido is None
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                f"Pedido {codigo_normalizado} "
                "não encontrado."
            ),
        )


    return pedido



# ============================================================
# AUDITORIA
# ============================================================

def registrar_auditoria(
    db: Session,
    modulo: str,
    acao: str,
    entidade: str | None = None,
    registro_referencia: str | None = None,
    detalhes: str | None = None,
    usuario_codigo: str | None = None,
    usuario_nome: str | None = None,
    dados_anteriores: str | None = None,
    dados_novos: str | None = None,
) -> Auditoria:
    """
    Adiciona um registro de auditoria à mesma transação atual.

    O commit continua sendo responsabilidade da operação que chamou
    esta função. Dessa forma, a alteração principal e sua auditoria
    são gravadas juntas.
    """

    contexto = (
        usuario_autenticado_atual()
    )

    if (
        usuario_codigo is None and
        contexto is not None
    ):
        usuario_codigo = (
            contexto.get(
                "codigo",
            )
        )

    if (
        usuario_nome is None
    ):
        usuario_nome = (
            contexto.get(
                "nome",
            )
            if contexto is not None
            else "Sistema"
        )

    registro = Auditoria(
        usuario_codigo=usuario_codigo,
        usuario_nome=usuario_nome,
        modulo=modulo,
        acao=acao,
        entidade=entidade,
        registro_referencia=registro_referencia,
        detalhes=detalhes,
        dados_anteriores=dados_anteriores,
        dados_novos=dados_novos,
    )

    db.add(
        registro,
    )

    return registro



# ============================================================
# STARTUP
# ============================================================

@app.on_event(
    "startup",
)
def inicializar_autenticacao():
    if DEMO_MODE:
        garantir_credenciais_demo()
    elif not ALLOW_DEMO_PASSWORD:
        db = SessionLocal()
        try:
            for credencial in db.query(CredencialUsuario).all():
                if senha_confere(SENHA_DEMO_INICIAL, credencial):
                    db.query(SessaoUsuario).filter(SessaoUsuario.usuario_codigo == credencial.usuario_codigo,
                        SessaoUsuario.revogado_em.is_(None)).update({'revogado_em': datetime.now()})
            db.commit()
        finally:
            db.close()



# ============================================================
# AUTENTICAÇÃO
# ACESSO DEMONSTRATIVO
# ============================================================

@app.get(
    "/api/auth/demo",
    response_model=AcessoDemoResponse,
    tags=["Autenticação"],
)
def acesso_demo(db: Session=Depends(get_db)):
    if not DEMO_MODE:
        raise HTTPException(404, 'Acesso demonstrativo desativado.')
    administrador = db.query(Usuario).filter(Usuario.status == 'ativo', Usuario.perfil == 'administrador').order_by(Usuario.codigo.asc()).first()
    return {'email': administrador.email if administrador else None, 'senha_inicial': SENHA_DEMO_INICIAL}



# ============================================================
# AUTENTICAÇÃO
# CADASTRO PÚBLICO
# ============================================================
#
# O cadastro público cria sempre um usuário de Consulta.
# Perfis com permissão de alteração continuam sendo definidos
# por um administrador dentro da aba Usuários.
#
# ============================================================

@app.post(
    "/api/auth/register",
    response_model=UsuarioResponse,
    status_code=(
        status.HTTP_201_CREATED
    ),
    tags=["Autenticação"],
)
def cadastrar_usuario_publico(dados: CadastroPublicoRequest, db: Session=Depends(get_db)):
    if not PUBLIC_SIGNUP:
        raise HTTPException(403, 'Cadastro público desativado. Solicite acesso ao administrador.')
    nome = dados.nome.strip()
    email = normalizar_email_usuario(dados.email)
    cargo = dados.cargo.strip()
    if not nome:
        raise HTTPException(status_code=400, detail='Informe o nome completo.')
    if not email or '@' not in email or '.' not in email.split('@')[-1]:
        raise HTTPException(status_code=400, detail='Informe um e-mail válido.')
    if not cargo:
        raise HTTPException(status_code=400, detail='Informe o cargo.')
    existente = db.query(Usuario).filter(Usuario.email == email).first()
    if existente is not None:
        raise HTTPException(status_code=409, detail='Já existe um usuário cadastrado com esse e-mail.')
    codigo = gerar_proximo_codigo_usuario(db)
    novo_usuario = Usuario(codigo=codigo, nome=nome, email=email, cargo=cargo, perfil='consulta', status='ativo', ultimo_acesso=None)
    try:
        db.add(novo_usuario)
        db.flush()
        criar_credencial(db, novo_usuario.codigo, dados.senha)
        registrar_auditoria(db, modulo='Autenticação', acao='cadastro_publico', entidade='Usuario', registro_referencia=novo_usuario.codigo, detalhes=f"Usuário '{novo_usuario.nome}' criado pela tela pública de cadastro com perfil Consulta.", usuario_codigo=novo_usuario.codigo, usuario_nome=novo_usuario.nome)
        db.commit()
        db.refresh(novo_usuario)
    except HTTPException:
        db.rollback()
        raise
    except Exception as erro:
        db.rollback()
        print('Erro ao cadastrar usuário público:', erro)
        raise HTTPException(status_code=500, detail='Não foi possível criar o usuário.')
    return novo_usuario



# ============================================================
# AUTENTICAÇÃO
# LOGIN
# ============================================================

@app.post(
    "/api/auth/login",
    response_model=LoginResponse,
    tags=["Autenticação"],
)
def login(dados: LoginRequest, db: Session=Depends(get_db)):
    if not DEMO_MODE and not ALLOW_DEMO_PASSWORD and dados.senha == SENHA_DEMO_INICIAL:
        raise HTTPException(403, 'Senha demonstrativa desativada. Defina uma senha própria com o administrador.')
    email = normalizar_email_usuario(dados.email)
    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario is None:
        raise HTTPException(status_code=401, detail='E-mail ou senha inválidos.')
    if usuario.status != 'ativo':
        raise HTTPException(status_code=403, detail='Este usuário está inativo.')
    credencial = db.query(CredencialUsuario).filter(CredencialUsuario.usuario_codigo == usuario.codigo).first()
    if credencial is None or not senha_confere(dados.senha, credencial):
        raise HTTPException(status_code=401, detail='E-mail ou senha inválidos.')
    token = secrets.token_urlsafe(48)
    agora = datetime.now()
    sessao = SessaoUsuario(token_hash=hash_token(token), usuario_codigo=usuario.codigo, criado_em=agora, expira_em=agora + timedelta(hours=DURACAO_SESSAO_HORAS), revogado_em=None)
    usuario.ultimo_acesso = agora
    try:
        sessoes_antigas = db.query(SessaoUsuario).filter(SessaoUsuario.usuario_codigo == usuario.codigo, SessaoUsuario.expira_em <= agora).all()
        for sessao_antiga in sessoes_antigas:
            db.delete(sessao_antiga)
        db.add(sessao)
        registrar_auditoria(db, modulo='Autenticação', acao='login', entidade='Usuario', registro_referencia=usuario.codigo, detalhes=f"Login realizado por '{usuario.nome}'.", usuario_codigo=usuario.codigo, usuario_nome=usuario.nome)
        db.commit()
        db.refresh(usuario)
    except Exception:
        db.rollback()
        raise
    return {'token': token, 'usuario': usuario}


# ============================================================
# AUTENTICAÇÃO
# USUÁRIO ATUAL
# ============================================================

@app.get(
    "/api/auth/me",
    response_model=UsuarioResponse,
    tags=["Autenticação"],
)
def usuario_atual(
    request: Request,
):
    return (
        request.state.usuario
    )


# ============================================================
# AUTENTICAÇÃO
# LOGOUT
# ============================================================

@app.post(
    "/api/auth/logout",
    status_code=204,
    tags=["Autenticação"],
)
def logout(
    request: Request,
    db: Session = Depends(
        get_db,
    ),
):

    token = (
        token_request(
            request,
        )
    )

    sessao = (
        db.query(
            SessaoUsuario,
        )
        .filter(
            SessaoUsuario.token_hash ==
            hash_token(
                token,
            ),
            SessaoUsuario.revogado_em.is_(
                None,
            ),
        )
        .first()
    )

    usuario = (
        request.state.usuario
    )

    try:
        if (
            sessao is not None
        ):
            sessao.revogado_em = (
                datetime.now()
            )

        registrar_auditoria(
            db,
            modulo="Autenticação",
            acao="logout",
            entidade="Usuario",
            registro_referencia=usuario.codigo,
            detalhes=(
                f"Logout realizado por "
                f"'{usuario.nome}'."
            ),
        )

        db.commit()

    except Exception:
        db.rollback()
        raise

    return Response(
        status_code=204,
    )



# ============================================================
# HOME
# ============================================================

@app.get(
    "/",
    tags=["Sistema"],
)
def home():

    return {
        "sistema":
            "NexoLog",

        "mensagem":
            "NexoLog API Online",

        "versao":
            "1.0.0",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get(
    "/api/health",
    tags=["Sistema"],
)
def health_check():

    return {
        "status":
            "online",

        "api":
            "NexoLog",
    }



# ============================================================
# AUDITORIA
# LISTAR REGISTROS
# ============================================================

@app.get(
    "/api/auditoria",
    response_model=list[
        AuditoriaResponse
    ],
    tags=["Auditoria"],
)
def listar_auditoria(
    db: Session = Depends(
        get_db,
    ),
):
    registros = (
        db.query(Auditoria)
        .order_by(
            Auditoria.criado_em.desc(),
            Auditoria.id.desc(),
        )
        .all()
    )

    return registros


# ============================================================
# PRODUTOS
# LISTAR TODOS
# ============================================================

@app.get(
    "/api/produtos",
    response_model=list[
        ProdutoResponse
    ],
    tags=["Produtos"],
)
def listar_produtos(db: Session=Depends(get_db)):
    produtos = db.query(Produto).order_by(Produto.sku.asc()).all()
    return preencher_saldos(db, produtos)


# ============================================================
# PRODUTOS
# BUSCAR POR SKU
# ============================================================

@app.get(
    "/api/produtos/{sku}",
    response_model=ProdutoResponse,
    tags=["Produtos"],
)
def buscar_produto(sku: str, db: Session=Depends(get_db)):
    return preencher_saldos(db, [buscar_produto_por_sku(db, sku)])[0]


# ============================================================
# PRODUTOS
# CADASTRAR INDIVIDUAL
# ============================================================

@app.post(
    "/api/produtos",
    response_model=ProdutoResponse,
    status_code=(
        status.HTTP_201_CREATED
    ),
    tags=["Produtos"],
)
def cadastrar_produto(
    dados: ProdutoCreate,
    db: Session = Depends(
        get_db,
    ),
):

    nome = (
        dados.nome
        .strip()
    )


    categoria = (
        dados.categoria
        .strip()
    )

    marca = normalizar_campo_produto(
        dados.marca,
    )

    especificacao = normalizar_campo_produto(
        dados.especificacao,
    )

    gtin_ean = normalizar_gtin_ean(
        dados.gtin_ean,
    )


    # ========================================================
    # VALIDAR NOME
    # ========================================================

    if (
        not nome
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "O nome do produto é obrigatório."
            ),
        )


    # ========================================================
    # VALIDAR CATEGORIA
    # ========================================================

    if (
        categoria
        not in
        CATEGORIAS_PERMITIDAS
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Categoria inválida. "
                "Utilize uma das categorias "
                "permitidas pelo sistema."
            ),
        )


    # ========================================================
    # DUPLICIDADE
    # ========================================================

    duplicado = produto_duplicado(
        db,
        nome,
        marca,
        especificacao,
        gtin_ean,
    )

    if (
        duplicado is not None
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                f"Produto já cadastrado como {duplicado.sku}. "
                "Se chegaram novas unidades, utilize "
                "Registrar Movimento > Entrada."
            ),
        )


    sku = (
        gerar_proximo_sku(
            db,
        )
    )


    precificacao = (
        calcular_precificacao_produto(
            dados,
        )
    )


    estoque_inicial = (
        dados.estoque_atual
    )


    novo_produto = Produto(
        sku=sku,
        nome=nome,
        categoria=categoria,
        marca=marca,
        especificacao=especificacao,
        gtin_ean=gtin_ean,

        estoque_atual=(
            estoque_inicial
        ),

        estoque_minimo=(
            dados.estoque_minimo
        ),

        **precificacao,
    )


    movimentacao_inicial = None


    if (
        estoque_inicial >
        0
    ):
        movimentacao_inicial = Movimentacao(
            produto_sku=(
                sku
            ),

            produto_nome=(
                nome
            ),

            tipo="entrada",

            quantidade=(
                estoque_inicial
            ),

            origem=(
                "Cadastro Inicial"
            ),

            destino=(
                "Estoque Principal"
            ),

            saldo_anterior=0,

            saldo_posterior=(
                estoque_inicial
            ),
        )


    try:

        db.add(
            novo_produto,
        )


        # Garante que o produto exista antes da movimentação.
        db.flush()


        if (
            movimentacao_inicial
            is not None
        ):
            db.add(
                movimentacao_inicial,
            )


        # AUDITORIA AUTOMÁTICA - cadastrar_produto
        registrar_auditoria(
            db,
            modulo="Produtos",
            acao="cadastrar",
            entidade="Produto",
            registro_referencia=sku,
            detalhes=f"Produto '{nome}' cadastrado.",
        )

        db.commit()


        db.refresh(
            novo_produto,
        )


    except Exception as erro:

        db.rollback()


        print(
            "Erro ao cadastrar produto:",
            erro,
        )


        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível cadastrar "
                "o produto."
            ),
        )


    return novo_produto


# ============================================================
# PRODUTOS
# IMPORTAR EM LOTE
# ============================================================
#
# Esta rota será utilizada pelo Excel/CSV.
#
# Recebe uma lista de produtos:
#
# [
#     {
#         "nome": "...",
#         "categoria": "...",
#         "estoque_atual": 100,
#         "estoque_minimo": 20
#     },
#     ...
# ]
#
# A operação é transacional:
#
# ou TODOS são gravados
# ou NENHUM é gravado.
#
# ============================================================

@app.post(
    "/api/produtos/importar",
    response_model=list[
        ProdutoResponse
    ],
    status_code=(
        status.HTTP_201_CREATED
    ),
    tags=["Produtos"],
)
def importar_produtos(dados: list[ProdutoCreate], db: Session=Depends(get_db)):
    if len(dados) == 0:
        raise HTTPException(status_code=400, detail='Nenhum produto foi enviado para importação.')
    produtos_existentes = db.query(Produto).all()
    chaves_existentes = {chave_identidade_produto(produto.nome, produto.marca, produto.especificacao) for produto in produtos_existentes}
    gtins_existentes = {gtin for gtin in (normalizar_gtin_ean(produto.gtin_ean) for produto in produtos_existentes) if gtin is not None}
    chaves_arquivo = set()
    gtins_arquivo = set()
    produtos_validados = []
    for indice, produto in enumerate(dados, start=1):
        nome = produto.nome.strip()
        categoria = produto.categoria.strip()
        marca = normalizar_campo_produto(produto.marca)
        especificacao = normalizar_campo_produto(produto.especificacao)
        gtin_ean = normalizar_gtin_ean(produto.gtin_ean)
        numero_linha = indice + 1
        if not nome:
            raise HTTPException(status_code=400, detail=f'Linha {numero_linha}: o nome do produto é obrigatório.')
        if categoria not in CATEGORIAS_PERMITIDAS:
            raise HTTPException(status_code=400, detail=f"Linha {numero_linha}: categoria '{categoria}' não permitida.")
        chave = chave_identidade_produto(nome, marca, especificacao)
        if gtin_ean is not None and gtin_ean in gtins_existentes:
            raise HTTPException(status_code=409, detail=f'Linha {numero_linha}: o GTIN/EAN já pertence a um produto cadastrado.')
        if chave in chaves_existentes:
            raise HTTPException(status_code=409, detail=f"Linha {numero_linha}: o produto '{nome}' com a mesma marca e especificação já existe no estoque.")
        if gtin_ean is not None and gtin_ean in gtins_arquivo:
            raise HTTPException(status_code=409, detail=f'Linha {numero_linha}: GTIN/EAN duplicado no arquivo.')
        if chave in chaves_arquivo:
            raise HTTPException(status_code=409, detail=f"Linha {numero_linha}: o produto '{nome}' está duplicado no arquivo.")
        chaves_arquivo.add(chave)
        if gtin_ean is not None:
            gtins_arquivo.add(gtin_ean)
        precificacao = calcular_precificacao_produto(produto)
        produtos_validados.append({'nome': nome, 'categoria': categoria, 'marca': marca, 'especificacao': especificacao, 'gtin_ean': gtin_ean, 'estoque_atual': produto.estoque_atual, 'estoque_minimo': produto.estoque_minimo, 'precificacao': precificacao})
    maior_numero_sku = obter_maior_numero_sku(db)
    novos_produtos = []
    for indice, produto in enumerate(produtos_validados, start=1):
        numero_sku = maior_numero_sku + indice
        sku = f'PRD-{numero_sku:03d}'
        novo_produto = Produto(sku=sku, nome=produto['nome'], categoria=produto['categoria'], marca=produto['marca'], especificacao=produto['especificacao'], gtin_ean=produto['gtin_ean'], estoque_atual=produto['estoque_atual'], estoque_minimo=produto['estoque_minimo'], **produto['precificacao'])
        novos_produtos.append(novo_produto)
    try:
        db.add_all(novos_produtos)
        db.flush()
        for produto in novos_produtos:
            if produto.estoque_atual > 0:
                db.add(Movimentacao(produto_sku=produto.sku, produto_nome=produto.nome,
                    tipo='entrada', quantidade=produto.estoque_atual, origem='Importação inicial',
                    destino='Estoque Principal', saldo_anterior=0, saldo_posterior=produto.estoque_atual))
        registrar_auditoria(db, modulo='Produtos', acao='importar', entidade='Produto', registro_referencia='LOTE', detalhes=f'Importação em lote concluída com {len(novos_produtos)} produto(s).')
        db.commit()
        for produto in novos_produtos:
            db.refresh(produto)
    except Exception as erro:
        db.rollback()
        print('Erro durante importação de produtos:', erro)
        raise HTTPException(status_code=500, detail='Não foi possível concluir a importação dos produtos.')
    return novos_produtos


# ============================================================
# PRODUTOS
# EDITAR
# ============================================================

@app.put(
    "/api/produtos/{sku}",
    response_model=ProdutoResponse,
    tags=["Produtos"],
)
def editar_produto(sku: str, dados: ProdutoUpdate, db: Session=Depends(get_db)):
    produto = buscar_produto_por_sku(db, sku)
    nome = dados.nome.strip()
    categoria = dados.categoria.strip()
    marca = normalizar_campo_produto(dados.marca)
    especificacao = normalizar_campo_produto(dados.especificacao)
    gtin_ean = normalizar_gtin_ean(dados.gtin_ean)
    if not nome:
        raise HTTPException(status_code=400, detail='O nome do produto é obrigatório.')
    if categoria not in CATEGORIAS_PERMITIDAS:
        raise HTTPException(status_code=400, detail='Categoria inválida. Utilize uma das categorias permitidas pelo sistema.')
    duplicado = produto_duplicado(db, nome, marca, especificacao, gtin_ean, sku_ignorar=produto.sku)
    if duplicado is not None:
        raise HTTPException(status_code=409, detail=f'Já existe outro produto com esta identidade: {duplicado.sku}. Para alterar o saldo, utilize Registrar Movimento.')
    produto.nome = nome
    produto.categoria = categoria
    produto.marca = marca
    produto.especificacao = especificacao
    produto.gtin_ean = gtin_ean
    produto.estoque_minimo = dados.estoque_minimo
    precificacao = calcular_precificacao_produto(dados)
    for campo, valor in precificacao.items():
        setattr(produto, campo, valor)
    try:
        registrar_auditoria(db, modulo='Produtos', acao='editar', entidade='Produto', registro_referencia=produto.sku, detalhes=f"Produto '{produto.nome}' atualizado.")
        db.commit()
        db.refresh(produto)
    except Exception as erro:
        db.rollback()
        print('Erro ao editar produto:', erro)
        raise HTTPException(status_code=500, detail='Não foi possível atualizar o produto.')
    return preencher_saldos(db, [produto])[0]


# ============================================================
# PRODUTOS
# EXCLUIR
# ============================================================

@app.delete(
    "/api/produtos/{sku}",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
    tags=["Produtos"],
)
def excluir_produto(sku: str, db: Session=Depends(get_db)):
    produto = buscar_produto_por_sku(db, sku)
    if db.query(ItemPedido).join(Pedido).filter(ItemPedido.produto_sku == produto.sku, Pedido.status.in_(['pendente', 'processando', 'enviado'])).first():
        raise HTTPException(409, 'Produto vinculado a pedido em andamento não pode ser excluído.')
    if produto.estoque_atual > 0:
        raise HTTPException(409, 'Registre a saída das unidades antes de excluir um produto com estoque.')
    try:
        db.delete(produto)
        registrar_auditoria(db, modulo='Produtos', acao='excluir', entidade='Produto', registro_referencia=produto.sku, detalhes=f"Produto '{produto.nome}' excluído.")
        db.commit()
    except Exception as erro:
        db.rollback()
        print('Erro ao excluir produto:', erro)
        raise HTTPException(status_code=500, detail='Não foi possível excluir o produto.')
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ============================================================
# MOVIMENTAÇÕES
# LISTAR TODAS
# ============================================================

@app.get(
    "/api/movimentacoes",
    response_model=list[
        MovimentacaoResponse
    ],
    tags=["Movimentações"],
)
def listar_movimentacoes(
    db: Session = Depends(
        get_db,
    ),
):

    movimentacoes = (
        db.query(Movimentacao)
        .order_by(
            Movimentacao.criado_em.desc(),
            Movimentacao.id.desc(),
        )
        .all()
    )


    return movimentacoes


# ============================================================
# MOVIMENTAÇÕES
# REGISTRAR
# ============================================================

@app.post(
    "/api/movimentacoes",
    response_model=MovimentacaoResponse,
    status_code=(
        status.HTTP_201_CREATED
    ),
    tags=["Movimentações"],
)
def registrar_movimentacao(dados: MovimentacaoCreate, db: Session=Depends(get_db)):
    produto = buscar_produto_por_sku(db, dados.produto_sku)
    origem = dados.origem.strip()
    destino = dados.destino.strip()
    if origem.strip().lower() == 'estoque final':
        origem = 'Estoque Principal'
    if destino.strip().lower() == 'estoque final':
        destino = 'Estoque Principal'
    if not origem:
        raise HTTPException(status_code=400, detail='A origem da movimentação é obrigatória.')
    if not destino:
        raise HTTPException(status_code=400, detail='O destino da movimentação é obrigatório.')
    saldo_anterior = produto.estoque_atual
    if dados.tipo == 'entrada':
        saldo_posterior = saldo_anterior + dados.quantidade
    elif dados.tipo == 'saida':
        if dados.quantidade > saldo_disponivel(db, produto):
            raise HTTPException(status_code=409, detail=f'Estoque insuficiente. Disponível após reservas: {saldo_disponivel(db, produto)} un.')
        saldo_posterior = saldo_anterior - dados.quantidade
    else:
        raise HTTPException(status_code=400, detail='Tipo de movimentação inválido.')
    nova_movimentacao = Movimentacao(produto_sku=produto.sku, produto_nome=produto.nome, tipo=dados.tipo, quantidade=dados.quantidade, origem=origem, destino=destino, saldo_anterior=saldo_anterior, saldo_posterior=saldo_posterior)
    produto.estoque_atual = saldo_posterior
    try:
        db.add(nova_movimentacao)
        registrar_auditoria(db, modulo='Estoque', acao='movimentar_estoque', entidade='Movimentacao', registro_referencia=produto.sku, detalhes=f"{nova_movimentacao.tipo.title()} de {nova_movimentacao.quantidade} unidade(s) do produto '{produto.nome}'.")
        db.commit()
        db.refresh(nova_movimentacao)
    except Exception as erro:
        db.rollback()
        print('Erro ao registrar movimentação:', erro)
        raise HTTPException(status_code=500, detail='Não foi possível registrar a movimentação.')
    return nova_movimentacao


# ============================================================
# PEDIDOS
# LISTAR TODOS
# ============================================================

@app.get(
    "/api/pedidos",
    response_model=list[
        PedidoResponse
    ],
    tags=["Pedidos"],
)
def listar_pedidos(
    db: Session = Depends(
        get_db,
    ),
):

    pedidos = (
        db.query(Pedido)
        .options(
            selectinload(
                Pedido.itens,
            ), selectinload(Pedido.eventos), selectinload(Pedido.rastreamento_simulado),
        )
        .order_by(
            Pedido.criado_em.desc(),
            Pedido.codigo.desc(),
        )
        .all()
    )


    return pedidos


# ============================================================
# PEDIDOS
# BUSCAR POR CÓDIGO
# ============================================================

@app.get(
    "/api/pedidos/{codigo}",
    response_model=PedidoResponse,
    tags=["Pedidos"],
)
def buscar_pedido(
    codigo: str,
    db: Session = Depends(
        get_db,
    ),
):

    return buscar_pedido_por_codigo(
        db,
        codigo,
    )


# ============================================================
# PEDIDOS
# CADASTRAR
# ============================================================
#
# O backend:
#
# 1. gera PED-001, PED-002...
# 2. valida os produtos
# 3. valida disponibilidade atual
# 4. calcula cada subtotal
# 5. calcula o valor total
# 6. grava pedido + itens em uma única transação
# 7. reserva unidades sem alterar o saldo físico
# 8. na mudança para "enviado", registra a saída física e a movimentação
#
# O local padrão da mercadoria é "Estoque Principal".
#
# Na criação, pedido/itens e eventos de reserva são confirmados na mesma
# transação. A saída física e a movimentação são persistidas na expedição.
# Em caso de erro de escrita, a transação pode ser revertida (rollback).
#
# ============================================================

@app.post(
    "/api/pedidos",
    response_model=PedidoResponse,
    status_code=(
        status.HTTP_201_CREATED
    ),
    tags=["Pedidos"],
)
def cadastrar_pedido(dados: PedidoCreate, db: Session = Depends(get_db)):
    pedido = criar_pedido(db, dados, registrar_auditoria, gerar_proximo_codigo_pedido, usuario_contexto.get(), commit=False)
    from backend.tracking import agendar
    agendar(db, pedido, atraso=45)
    db.commit()
    db.refresh(pedido)
    return pedido


# ============================================================
# PEDIDOS
# ALTERAR STATUS / TRACKING
# ============================================================
#
# Esta rota será utilizada futuramente pelo Kanban.
#
# Exemplos:
#
# pendente -> processando
# processando -> enviado
# enviado -> entregue
#
# O schema também permite atualizar transportadora e rastreio.
#
# ============================================================

@app.patch(
    "/api/pedidos/{codigo}/status",
    response_model=PedidoResponse,
    tags=["Pedidos"],
)
def atualizar_status_pedido(codigo: str, dados: PedidoStatusUpdate, db: Session = Depends(get_db)):
    return atualizar_pedido(db, codigo, dados, registrar_auditoria, usuario_contexto.get())


# ============================================================
# FORNECEDORES
# CONFIGURAÇÕES
# ============================================================

CATEGORIAS_FORNECEDOR_PERMITIDAS = [
    "Papelaria",
    "Papéis e Impressão",
    "Canetas e Escrita",
    "Cadernos, Agendas e Blocos",
    "Colas, Fitas e Adesivos",
    "Pastas, Arquivos e Organização",
    "Identificação",
    "Embalagens",
    "Escritório",
    "Equipamentos",
    "Tecnologia",
    "Serviços",
    "Transportes",
    "EPI",
    "Outros",
]


# ============================================================
# FORNECEDORES
# NORMALIZAR CNPJ
# ============================================================

def normalizar_cnpj(
    cnpj: str,
) -> str:

    return "".join(
        caractere
        for caractere in str(cnpj)
        if caractere.isdigit()
    )


# ============================================================
# FORNECEDORES
# NORMALIZAR CÓDIGO
# ============================================================

def normalizar_codigo_fornecedor(
    codigo: str,
) -> str:

    return (
        codigo
        .strip()
        .upper()
    )


# ============================================================
# FORNECEDORES
# MAIOR NÚMERO UTILIZADO
# ============================================================

def obter_maior_numero_fornecedor(
    db: Session,
) -> int:

    fornecedores = (
        db.query(Fornecedor)
        .all()
    )

    maior_numero = 0

    for fornecedor in fornecedores:

        try:
            numero = int(
                fornecedor.codigo.replace(
                    "FOR-",
                    "",
                )
            )

            if (
                numero >
                maior_numero
            ):
                maior_numero = (
                    numero
                )

        except (
            ValueError,
            AttributeError,
        ):
            continue

    return maior_numero


# ============================================================
# FORNECEDORES
# GERAR PRÓXIMO CÓDIGO
# ============================================================

def gerar_proximo_codigo_fornecedor(
    db: Session,
) -> str:

    proximo_numero = (
        obter_maior_numero_fornecedor(
            db,
        )
        + 1
    )

    return (
        f"FOR-{proximo_numero:03d}"
    )


# ============================================================
# FORNECEDORES
# BUSCAR POR CÓDIGO
# ============================================================

def buscar_fornecedor_por_codigo(
    db: Session,
    codigo: str,
) -> Fornecedor:

    codigo_normalizado = (
        normalizar_codigo_fornecedor(
            codigo,
        )
    )

    fornecedor = (
        db.query(Fornecedor)
        .filter(
            Fornecedor.codigo ==
            codigo_normalizado,
        )
        .first()
    )

    if (
        fornecedor is None
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                f"Fornecedor {codigo_normalizado} "
                "não encontrado."
            ),
        )

    return fornecedor


# ============================================================
# FORNECEDORES
# VALIDAR DADOS
# ============================================================

def preparar_dados_fornecedor(
    dados,
) -> dict:

    razao_social = (
        dados.razao_social
        .strip()
    )

    if (
        not razao_social
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A razão social é obrigatória."
            ),
        )

    cnpj = (
        normalizar_cnpj(
            dados.cnpj,
        )
    )

    if (
        len(cnpj) !=
        14
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "O CNPJ deve possuir 14 dígitos."
            ),
        )

    categoria = (
        dados.categoria
        .strip()
    )

    if (
        categoria
        not in
        CATEGORIAS_FORNECEDOR_PERMITIDAS
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Categoria de fornecedor inválida."
            ),
        )

    cidade = (
        dados.cidade
        .strip()
    )

    if (
        not cidade
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A cidade é obrigatória."
            ),
        )

    uf = (
        dados.uf
        .strip()
        .upper()
    )

    if (
        len(uf) !=
        2 or
        not uf.isalpha()
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Informe uma UF válida com 2 letras."
            ),
        )

    nome_fantasia = (
        dados.nome_fantasia.strip()
        if (
            dados.nome_fantasia
            is not None
        )
        else ""
    )

    contato = (
        dados.contato.strip()
        if (
            dados.contato
            is not None
        )
        else ""
    )

    telefone = (
        dados.telefone.strip()
        if (
            dados.telefone
            is not None
        )
        else ""
    )

    email = (
        dados.email.strip()
        if (
            dados.email
            is not None
        )
        else ""
    )

    if (
        email and
        (
            "@" not in email or
            "." not in email.split("@")[-1]
        )
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Informe um e-mail válido."
            ),
        )

    return {
        "razao_social":
            razao_social,

        "nome_fantasia":
            nome_fantasia or None,

        "cnpj":
            cnpj,

        "categoria":
            categoria,

        "contato":
            contato or None,

        "telefone":
            telefone or None,

        "email":
            email or None,

        "cidade":
            cidade,

        "uf":
            uf,

        "prazo_medio_entrega":
            dados.prazo_medio_entrega,
    }


# ============================================================
# FORNECEDORES
# LISTAR TODOS
# ============================================================

@app.get(
    "/api/fornecedores",
    response_model=list[
        FornecedorResponse
    ],
    tags=["Fornecedores"],
)
def listar_fornecedores(
    db: Session = Depends(
        get_db,
    ),
):

    fornecedores = (
        db.query(Fornecedor)
        .order_by(
            Fornecedor.codigo.asc(),
        )
        .all()
    )

    return fornecedores


# ============================================================
# FORNECEDORES
# BUSCAR POR CÓDIGO
# ============================================================

@app.get(
    "/api/fornecedores/{codigo}",
    response_model=FornecedorResponse,
    tags=["Fornecedores"],
)
def buscar_fornecedor(
    codigo: str,
    db: Session = Depends(
        get_db,
    ),
):

    return buscar_fornecedor_por_codigo(
        db,
        codigo,
    )


# ============================================================
# FORNECEDORES
# CADASTRAR
# ============================================================

@app.post(
    "/api/fornecedores",
    response_model=FornecedorResponse,
    status_code=(
        status.HTTP_201_CREATED
    ),
    tags=["Fornecedores"],
)
def cadastrar_fornecedor(
    dados: FornecedorCreate,
    db: Session = Depends(
        get_db,
    ),
):

    dados_preparados = (
        preparar_dados_fornecedor(
            dados,
        )
    )

    fornecedor_existente = (
        db.query(Fornecedor)
        .filter(
            Fornecedor.cnpj ==
            dados_preparados[
                "cnpj"
            ],
        )
        .first()
    )

    if (
        fornecedor_existente
        is not None
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Já existe um fornecedor "
                "cadastrado com esse CNPJ."
            ),
        )

    codigo = (
        gerar_proximo_codigo_fornecedor(
            db,
        )
    )

    novo_fornecedor = Fornecedor(
        codigo=codigo,
        status="ativo",
        **dados_preparados,
    )

    try:

        db.add(
            novo_fornecedor,
        )

        # AUDITORIA AUTOMÁTICA - cadastrar_fornecedor
        registrar_auditoria(
            db,
            modulo="Fornecedores",
            acao="cadastrar",
            entidade="Fornecedor",
            registro_referencia=novo_fornecedor.codigo,
            detalhes=(
                f"Fornecedor '{novo_fornecedor.razao_social}' cadastrado."
            ),
        )

        db.commit()

        db.refresh(
            novo_fornecedor,
        )

    except Exception as erro:

        db.rollback()

        print(
            "Erro ao cadastrar fornecedor:",
            erro,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível cadastrar "
                "o fornecedor."
            ),
        )

    return novo_fornecedor


# ============================================================
# FORNECEDORES
# EDITAR
# ============================================================

@app.put(
    "/api/fornecedores/{codigo}",
    response_model=FornecedorResponse,
    tags=["Fornecedores"],
)
def editar_fornecedor(
    codigo: str,
    dados: FornecedorUpdate,
    db: Session = Depends(
        get_db,
    ),
):

    fornecedor = (
        buscar_fornecedor_por_codigo(
            db,
            codigo,
        )
    )

    dados_preparados = (
        preparar_dados_fornecedor(
            dados,
        )
    )

    fornecedor_com_mesmo_cnpj = (
        db.query(Fornecedor)
        .filter(
            Fornecedor.cnpj ==
            dados_preparados[
                "cnpj"
            ],
            Fornecedor.codigo !=
            fornecedor.codigo,
        )
        .first()
    )

    if (
        fornecedor_com_mesmo_cnpj
        is not None
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Já existe outro fornecedor "
                "cadastrado com esse CNPJ."
            ),
        )

    for (
        campo,
        valor,
    ) in dados_preparados.items():

        setattr(
            fornecedor,
            campo,
            valor,
        )

    try:

        # AUDITORIA AUTOMÁTICA - editar_fornecedor
        registrar_auditoria(
            db,
            modulo="Fornecedores",
            acao="editar",
            entidade="Fornecedor",
            registro_referencia=fornecedor.codigo,
            detalhes=(
                f"Fornecedor '{fornecedor.razao_social}' atualizado."
            ),
        )

        db.commit()

        db.refresh(
            fornecedor,
        )

    except Exception as erro:

        db.rollback()

        print(
            "Erro ao editar fornecedor:",
            erro,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível atualizar "
                "o fornecedor."
            ),
        )

    return fornecedor


# ============================================================
# FORNECEDORES
# ALTERAR STATUS
# ============================================================

@app.patch(
    "/api/fornecedores/{codigo}/status",
    response_model=FornecedorResponse,
    tags=["Fornecedores"],
)
def atualizar_status_fornecedor(
    codigo: str,
    dados: FornecedorStatusUpdate,
    db: Session = Depends(
        get_db,
    ),
):

    fornecedor = (
        buscar_fornecedor_por_codigo(
            db,
            codigo,
        )
    )

    fornecedor.status = (
        dados.status
    )

    try:

        # AUDITORIA AUTOMÁTICA - atualizar_status_fornecedor
        registrar_auditoria(
            db,
            modulo="Fornecedores",
            acao="alterar_status",
            entidade="Fornecedor",
            registro_referencia=fornecedor.codigo,
            detalhes=(
                f"Status do fornecedor alterado para "
                f"'{fornecedor.status}'."
            ),
        )

        db.commit()

        db.refresh(
            fornecedor,
        )

    except Exception as erro:

        db.rollback()

        print(
            "Erro ao atualizar status do fornecedor:",
            erro,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível atualizar "
                "o status do fornecedor."
            ),
        )

    return fornecedor


# ============================================================
# CLIENTES
# NORMALIZAÇÕES
# ============================================================

def normalizar_documento_cliente(
    documento: str,
) -> str:

    return "".join(
        caractere
        for caractere in str(documento)
        if caractere.isdigit()
    )


def normalizar_cep_cliente(
    cep: str | None,
) -> str | None:

    if (
        cep is None
    ):
        return None

    numeros = "".join(
        caractere
        for caractere in str(cep)
        if caractere.isdigit()
    )

    return (
        numeros
        or None
    )


def normalizar_codigo_cliente(
    codigo: str,
) -> str:

    return (
        codigo
        .strip()
        .upper()
    )


# ============================================================
# CLIENTES
# MAIOR NÚMERO / PRÓXIMO CÓDIGO
# ============================================================

def obter_maior_numero_cliente(
    db: Session,
) -> int:

    clientes = (
        db.query(Cliente)
        .all()
    )

    maior_numero = 0

    for cliente in clientes:

        try:
            numero = int(
                cliente.codigo.replace(
                    "CLI-",
                    "",
                )
            )

            if (
                numero >
                maior_numero
            ):
                maior_numero = numero

        except (
            ValueError,
            AttributeError,
        ):
            continue

    return maior_numero


def gerar_proximo_codigo_cliente(
    db: Session,
) -> str:

    proximo_numero = (
        obter_maior_numero_cliente(
            db,
        )
        + 1
    )

    return (
        f"CLI-{proximo_numero:03d}"
    )


# ============================================================
# CLIENTES
# BUSCAR POR CÓDIGO
# ============================================================

def buscar_cliente_por_codigo(
    db: Session,
    codigo: str,
) -> Cliente:

    codigo_normalizado = (
        normalizar_codigo_cliente(
            codigo,
        )
    )

    cliente = (
        db.query(Cliente)
        .filter(
            Cliente.codigo ==
            codigo_normalizado,
        )
        .first()
    )

    if (
        cliente is None
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                f"Cliente {codigo_normalizado} "
                "não encontrado."
            ),
        )

    return cliente


# ============================================================
# CLIENTES
# PREPARAR / VALIDAR DADOS
# ============================================================

def preparar_dados_cliente(
    dados,
) -> dict:

    nome = (
        dados.nome
        .strip()
    )

    if (
        not nome
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "O nome ou razão social "
                "é obrigatório."
            ),
        )

    tipo = (
        dados.tipo
    )

    documento = (
        normalizar_documento_cliente(
            dados.documento,
        )
    )

    tamanho_documento = (
        11
        if (
            tipo ==
            "pessoa_fisica"
        )
        else 14
    )

    if (
        len(documento) !=
        tamanho_documento
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "CPF inválido: informe 11 dígitos."
                if (
                    tipo ==
                    "pessoa_fisica"
                )
                else
                "CNPJ inválido: informe 14 dígitos."
            ),
        )

    telefone = (
        dados.telefone.strip()
        if (
            dados.telefone
            is not None
        )
        else ""
    )

    email = (
        dados.email.strip()
        if (
            dados.email
            is not None
        )
        else ""
    )

    if (
        email and
        (
            "@" not in email or
            "." not in email.split("@")[-1]
        )
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Informe um e-mail válido."
            ),
        )

    cep = (
        normalizar_cep_cliente(
            dados.cep,
        )
    )

    if (
        cep is not None and
        len(cep) != 8
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "O CEP deve possuir 8 dígitos."
            ),
        )

    logradouro = (
        dados.logradouro
        .strip()
    )

    if (
        not logradouro
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "O logradouro é obrigatório."
            ),
        )

    numero = (
        dados.numero.strip()
        if (
            dados.numero
            is not None
        )
        else ""
    )

    complemento = (
        dados.complemento.strip()
        if (
            dados.complemento
            is not None
        )
        else ""
    )

    bairro = (
        dados.bairro.strip()
        if (
            dados.bairro
            is not None
        )
        else ""
    )

    cidade = (
        dados.cidade
        .strip()
    )

    if (
        not cidade
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A cidade é obrigatória."
            ),
        )

    uf = (
        dados.uf
        .strip()
        .upper()
    )

    if (
        len(uf) != 2 or
        not uf.isalpha()
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Informe uma UF válida com 2 letras."
            ),
        )

    return {
        "nome":
            nome,

        "tipo":
            tipo,

        "documento":
            documento,

        "telefone":
            telefone or None,

        "email":
            email or None,

        "cep":
            cep,

        "logradouro":
            logradouro,

        "numero":
            numero or None,

        "complemento":
            complemento or None,

        "bairro":
            bairro or None,

        "cidade":
            cidade,

        "uf":
            uf,
    }


# ============================================================
# CLIENTES
# LISTAR TODOS
# ============================================================

@app.get(
    "/api/clientes",
    response_model=list[
        ClienteResponse
    ],
    tags=["Clientes"],
)
def listar_clientes(
    db: Session = Depends(
        get_db,
    ),
):

    return (
        db.query(Cliente)
        .order_by(
            Cliente.codigo.asc(),
        )
        .all()
    )


# ============================================================
# CLIENTES
# BUSCAR POR CÓDIGO
# ============================================================

@app.get(
    "/api/clientes/{codigo}",
    response_model=ClienteResponse,
    tags=["Clientes"],
)
def buscar_cliente(
    codigo: str,
    db: Session = Depends(
        get_db,
    ),
):

    return buscar_cliente_por_codigo(
        db,
        codigo,
    )


# ============================================================
# CLIENTES
# CADASTRAR
# ============================================================

@app.post(
    "/api/clientes",
    response_model=ClienteResponse,
    status_code=(
        status.HTTP_201_CREATED
    ),
    tags=["Clientes"],
)
def cadastrar_cliente(
    dados: ClienteCreate,
    db: Session = Depends(
        get_db,
    ),
):

    dados_preparados = (
        preparar_dados_cliente(
            dados,
        )
    )

    cliente_existente = (
        db.query(Cliente)
        .filter(
            Cliente.documento ==
            dados_preparados[
                "documento"
            ],
        )
        .first()
    )

    if (
        cliente_existente
        is not None
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Já existe um cliente "
                "cadastrado com esse CPF/CNPJ."
            ),
        )

    codigo = (
        gerar_proximo_codigo_cliente(
            db,
        )
    )

    novo_cliente = Cliente(
        codigo=codigo,
        status="ativo",
        **dados_preparados,
    )

    try:
        db.add(
            novo_cliente,
        )

        # AUDITORIA AUTOMÁTICA - cadastrar_cliente
        registrar_auditoria(
            db,
            modulo="Clientes",
            acao="cadastrar",
            entidade="Cliente",
            registro_referencia=novo_cliente.codigo,
            detalhes=f"Cliente '{novo_cliente.nome}' cadastrado.",
        )

        db.commit()

        db.refresh(
            novo_cliente,
        )

    except Exception as erro:
        db.rollback()

        print(
            "Erro ao cadastrar cliente:",
            erro,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível cadastrar "
                "o cliente."
            ),
        )

    return novo_cliente


# ============================================================
# CLIENTES
# EDITAR
# ============================================================

@app.put(
    "/api/clientes/{codigo}",
    response_model=ClienteResponse,
    tags=["Clientes"],
)
def editar_cliente(
    codigo: str,
    dados: ClienteUpdate,
    db: Session = Depends(
        get_db,
    ),
):

    cliente = (
        buscar_cliente_por_codigo(
            db,
            codigo,
        )
    )

    dados_preparados = (
        preparar_dados_cliente(
            dados,
        )
    )

    cliente_mesmo_documento = (
        db.query(Cliente)
        .filter(
            Cliente.documento ==
            dados_preparados[
                "documento"
            ],
            Cliente.codigo !=
            cliente.codigo,
        )
        .first()
    )

    if (
        cliente_mesmo_documento
        is not None
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Já existe outro cliente "
                "cadastrado com esse CPF/CNPJ."
            ),
        )

    for (
        campo,
        valor,
    ) in dados_preparados.items():
        setattr(
            cliente,
            campo,
            valor,
        )

    try:
        # AUDITORIA AUTOMÁTICA - editar_cliente
        registrar_auditoria(
            db,
            modulo="Clientes",
            acao="editar",
            entidade="Cliente",
            registro_referencia=cliente.codigo,
            detalhes=f"Cliente '{cliente.nome}' atualizado.",
        )

        db.commit()

        db.refresh(
            cliente,
        )

    except Exception as erro:
        db.rollback()

        print(
            "Erro ao editar cliente:",
            erro,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível atualizar "
                "o cliente."
            ),
        )

    return cliente


# ============================================================
# CLIENTES
# ALTERAR STATUS
# ============================================================

@app.patch(
    "/api/clientes/{codigo}/status",
    response_model=ClienteResponse,
    tags=["Clientes"],
)
def atualizar_status_cliente(
    codigo: str,
    dados: ClienteStatusUpdate,
    db: Session = Depends(
        get_db,
    ),
):

    cliente = (
        buscar_cliente_por_codigo(
            db,
            codigo,
        )
    )

    cliente.status = (
        dados.status
    )

    try:
        # AUDITORIA AUTOMÁTICA - atualizar_status_cliente
        registrar_auditoria(
            db,
            modulo="Clientes",
            acao="alterar_status",
            entidade="Cliente",
            registro_referencia=cliente.codigo,
            detalhes=(
                f"Status do cliente alterado para "
                f"'{cliente.status}'."
            ),
        )

        db.commit()

        db.refresh(
            cliente,
        )

    except Exception as erro:
        db.rollback()

        print(
            "Erro ao atualizar status do cliente:",
            erro,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível atualizar "
                "o status do cliente."
            ),
        )

    return cliente


# ============================================================
# USUÁRIOS
# NORMALIZAÇÕES
# ============================================================

def normalizar_codigo_usuario(
    codigo: str,
) -> str:

    return (
        codigo
        .strip()
        .upper()
    )


def normalizar_email_usuario(
    email: str,
) -> str:

    return (
        email
        .strip()
        .lower()
    )


# ============================================================
# USUÁRIOS
# MAIOR NÚMERO / PRÓXIMO CÓDIGO
# ============================================================

def obter_maior_numero_usuario(
    db: Session,
) -> int:

    usuarios = (
        db.query(Usuario)
        .all()
    )

    maior_numero = 0

    for usuario in usuarios:

        try:
            numero = int(
                usuario.codigo.replace(
                    "USR-",
                    "",
                )
            )

            if (
                numero >
                maior_numero
            ):
                maior_numero = numero

        except (
            ValueError,
            AttributeError,
        ):
            continue

    return maior_numero


def gerar_proximo_codigo_usuario(
    db: Session,
) -> str:

    proximo_numero = (
        obter_maior_numero_usuario(
            db,
        )
        + 1
    )

    return (
        f"USR-{proximo_numero:03d}"
    )


# ============================================================
# USUÁRIOS
# BUSCAR POR CÓDIGO
# ============================================================

def buscar_usuario_por_codigo(
    db: Session,
    codigo: str,
) -> Usuario:

    codigo_normalizado = (
        normalizar_codigo_usuario(
            codigo,
        )
    )

    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.codigo ==
            codigo_normalizado,
        )
        .first()
    )

    if (
        usuario is None
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                f"Usuário {codigo_normalizado} "
                "não encontrado."
            ),
        )

    return usuario


# ============================================================
# USUÁRIOS
# PREPARAR / VALIDAR DADOS
# ============================================================

def preparar_dados_usuario(
    dados,
) -> dict:

    nome = (
        dados.nome
        .strip()
    )

    if (
        not nome
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "O nome é obrigatório."
            ),
        )

    email = (
        normalizar_email_usuario(
            dados.email,
        )
    )

    if (
        not email or
        "@" not in email or
        "." not in email.split("@")[-1]
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Informe um e-mail válido."
            ),
        )

    cargo = (
        dados.cargo
        .strip()
    )

    if (
        not cargo
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "O cargo é obrigatório."
            ),
        )

    return {
        "nome":
            nome,

        "email":
            email,

        "cargo":
            cargo,

        "perfil":
            dados.perfil,
    }


# ============================================================
# USUÁRIOS
# LISTAR
# ============================================================

@app.get(
    "/api/usuarios",
    response_model=list[
        UsuarioResponse
    ],
    tags=["Usuários"],
)
def listar_usuarios(
    db: Session = Depends(
        get_db,
    ),
):

    return (
        db.query(Usuario)
        .order_by(
            Usuario.codigo.asc(),
        )
        .all()
    )


# ============================================================
# USUÁRIOS
# BUSCAR
# ============================================================

@app.get(
    "/api/usuarios/{codigo}",
    response_model=UsuarioResponse,
    tags=["Usuários"],
)
def buscar_usuario(
    codigo: str,
    db: Session = Depends(
        get_db,
    ),
):

    return (
        buscar_usuario_por_codigo(
            db,
            codigo,
        )
    )


# ============================================================
# USUÁRIOS
# CADASTRAR
# ============================================================

@app.post(
    "/api/usuarios",
    response_model=UsuarioResponse,
    status_code=(
        status.HTTP_201_CREATED
    ),
    tags=["Usuários"],
)
def cadastrar_usuario(
    dados: UsuarioCreate,
    db: Session = Depends(
        get_db,
    ),
):

    dados_preparados = (
        preparar_dados_usuario(
            dados,
        )
    )

    existente = (
        db.query(Usuario)
        .filter(
            Usuario.email ==
            dados_preparados[
                "email"
            ],
        )
        .first()
    )

    if (
        existente is not None
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Já existe um usuário "
                "cadastrado com esse e-mail."
            ),
        )

    codigo = (
        gerar_proximo_codigo_usuario(
            db,
        )
    )

    novo_usuario = Usuario(
        codigo=codigo,
        status="ativo",
        ultimo_acesso=None,
        **dados_preparados,
    )

    try:
        db.add(
            novo_usuario,
        )

        db.flush()

        criar_credencial(
            db,
            novo_usuario.codigo,
            dados.senha,
        )

        # AUDITORIA AUTOMÁTICA - cadastrar_usuario
        registrar_auditoria(
            db,
            modulo="Usuários",
            acao="cadastrar",
            entidade="Usuario",
            registro_referencia=novo_usuario.codigo,
            detalhes=f"Usuário '{novo_usuario.nome}' cadastrado.",
        )

        db.commit()

        db.refresh(
            novo_usuario,
        )

    except Exception as erro:
        db.rollback()

        print(
            "Erro ao cadastrar usuário:",
            erro,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível cadastrar "
                "o usuário."
            ),
        )

    return novo_usuario


# ============================================================
# USUÁRIOS
# EDITAR
# ============================================================

@app.put(
    "/api/usuarios/{codigo}",
    response_model=UsuarioResponse,
    tags=["Usuários"],
)
def editar_usuario(
    codigo: str,
    dados: UsuarioUpdate,
    db: Session = Depends(
        get_db,
    ),
):

    usuario = (
        buscar_usuario_por_codigo(
            db,
            codigo,
        )
    )

    dados_preparados = (
        preparar_dados_usuario(
            dados,
        )
    )

    mesmo_email = (
        db.query(Usuario)
        .filter(
            Usuario.email ==
            dados_preparados[
                "email"
            ],
            Usuario.codigo !=
            usuario.codigo,
        )
        .first()
    )

    if (
        mesmo_email is not None
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Já existe outro usuário "
                "cadastrado com esse e-mail."
            ),
        )

    # ========================================================
    # PROTEÇÃO DO ÚLTIMO ADMINISTRADOR
    # ========================================================

    if (
        usuario.status ==
        "ativo" and
        usuario.perfil ==
        "administrador" and
        dados_preparados[
            "perfil"
        ] !=
        "administrador"
    ):
        outros_admins_ativos = (
            db.query(Usuario)
            .filter(
                Usuario.perfil ==
                "administrador",
                Usuario.status ==
                "ativo",
                Usuario.codigo !=
                usuario.codigo,
            )
            .count()
        )

        if (
            outros_admins_ativos ==
            0
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "O sistema precisa manter "
                    "pelo menos um administrador ativo."
                ),
            )

    for (
        campo,
        valor,
    ) in dados_preparados.items():
        setattr(
            usuario,
            campo,
            valor,
        )

    try:
        if (
            dados.senha
        ):
            criar_credencial(
                db,
                usuario.codigo,
                dados.senha,
            )

            sessoes_ativas = (
                db.query(
                    SessaoUsuario,
                )
                .filter(
                    SessaoUsuario.usuario_codigo ==
                    usuario.codigo,
                    SessaoUsuario.revogado_em.is_(
                        None,
                    ),
                )
                .all()
            )

            agora_revogacao = (
                datetime.now()
            )

            for sessao_ativa in sessoes_ativas:
                sessao_ativa.revogado_em = (
                    agora_revogacao
                )

        # AUDITORIA AUTOMÁTICA - editar_usuario
        registrar_auditoria(
            db,
            modulo="Usuários",
            acao="editar",
            entidade="Usuario",
            registro_referencia=usuario.codigo,
            detalhes=f"Usuário '{usuario.nome}' atualizado.",
        )

        db.commit()

        db.refresh(
            usuario,
        )

    except Exception as erro:
        db.rollback()

        print(
            "Erro ao editar usuário:",
            erro,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível atualizar "
                "o usuário."
            ),
        )

    return usuario


# ============================================================
# USUÁRIOS
# ALTERAR STATUS
# ============================================================

@app.patch(
    "/api/usuarios/{codigo}/status",
    response_model=UsuarioResponse,
    tags=["Usuários"],
)
def atualizar_status_usuario(
    codigo: str,
    dados: UsuarioStatusUpdate,
    db: Session = Depends(
        get_db,
    ),
):

    usuario = (
        buscar_usuario_por_codigo(
            db,
            codigo,
        )
    )

    status_anterior = (
        usuario.status
    )

    # ========================================================
    # PROTEÇÃO DO ÚLTIMO ADMINISTRADOR
    # ========================================================

    if (
        status_anterior ==
        "ativo" and
        dados.status ==
        "inativo" and
        usuario.perfil ==
        "administrador"
    ):
        outros_admins_ativos = (
            db.query(Usuario)
            .filter(
                Usuario.perfil ==
                "administrador",
                Usuario.status ==
                "ativo",
                Usuario.codigo !=
                usuario.codigo,
            )
            .count()
        )

        if (
            outros_admins_ativos ==
            0
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Não é possível inativar "
                    "o último administrador ativo."
                ),
            )

    usuario.status = (
        dados.status
    )

    try:
        # AUDITORIA AUTOMÁTICA - atualizar_status_usuario
        registrar_auditoria(
            db,
            modulo="Usuários",
            acao="alterar_status",
            entidade="Usuario",
            registro_referencia=usuario.codigo,
            detalhes=(
                f"Status do usuário '{usuario.nome}' "
                f"alterado de '{status_anterior}' "
                f"para '{usuario.status}'."
            ),
        )

        db.commit()

        db.refresh(
            usuario,
        )

    except Exception as erro:
        db.rollback()

        print(
            "Erro ao atualizar status do usuário:",
            erro,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível atualizar "
                "o status do usuário."
            ),
        )

    return usuario


@app.get("/api/auth/config", tags=["Autenticação"])
def configuracao_acesso():
    return {"demo": DEMO_MODE, "cadastro_publico": PUBLIC_SIGNUP}

from backend.reports import instalar_rotas
instalar_rotas(app, registrar_auditoria, usuario_contexto)
from backend.tracking import instalar_rastreamento
instalar_rastreamento(app, registrar_auditoria)
