# ============================================================
# LOGIFLOW
# CONFIGURAÇÃO DO BANCO DE DADOS
# ============================================================

from fastapi import Request, HTTPException
from sqlalchemy.exc import OperationalError
from backend.config import DATABASE_PATH

from sqlalchemy import create_engine
from sqlalchemy import event
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker


# ============================================================
# CAMINHO DO BANCO
# ============================================================
#
# O banco será criado dentro da própria pasta "backend":
#
# backend/
# └── logiflow.db
#
# Dessa forma, o caminho funciona independentemente do local
# onde o projeto LogiFlow estiver salvo no computador.
# ============================================================

DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)


# ============================================================
# URL DE CONEXÃO
# ============================================================

DATABASE_URL = (
    f"sqlite:///{DATABASE_PATH.as_posix()}"
)


# ============================================================
# ENGINE
# ============================================================
#
# check_same_thread=False é necessário porque o FastAPI
# pode trabalhar com diferentes threads durante as requisições.
# ============================================================

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
)


# ============================================================
# CONFIGURAÇÕES DO SQLITE
# ============================================================
#
# Ativa chaves estrangeiras em todas as conexões.
# Isso garante, por exemplo, que os itens de um pedido respeitem
# corretamente as regras de relacionamento definidas nos models.
#
# busy_timeout reduz erros de "database is locked" em operações
# muito próximas entre frontend e API.
# ============================================================

@event.listens_for(engine, "connect")
def configurar_sqlite(
    dbapi_connection,
    connection_record,
):
    del connection_record

    cursor = dbapi_connection.cursor()

    cursor.execute(
        "PRAGMA foreign_keys=ON"
    )

    cursor.execute(
        "PRAGMA busy_timeout=5000"
    )

    cursor.close()


# ============================================================
# SESSÕES DO BANCO
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ============================================================
# BASE DOS MODELOS
# ============================================================
#
# Todos os futuros modelos do LogiFlow irão herdar desta Base.
#
# Exemplo:
#
# class Produto(Base):
#     ...
# ============================================================

Base = declarative_base()


# ============================================================
# DEPENDÊNCIA DO FASTAPI
# ============================================================
#
# Esta função abrirá uma conexão com o banco para cada
# requisição e fechará a conexão automaticamente ao terminar.
# ============================================================

def get_db(request: Request):
    db = SessionLocal()

    try:
        # Serializar a leitura/validação/gravação, evitando duas reservas do mesmo saldo.
        if request.method.upper() in {"POST", "PUT", "PATCH", "DELETE"}:
            try:
                db.connection().exec_driver_sql("BEGIN IMMEDIATE")
            except OperationalError as error:
                db.rollback()
                raise HTTPException(503, "Banco ocupado. Aguarde e tente novamente.") from error
        yield db

    finally:
        db.close()