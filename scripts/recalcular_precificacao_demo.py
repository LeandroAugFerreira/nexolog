# ============================================================
# LOGIFLOW
# RECÁLCULO DA PRECIFICAÇÃO DO BANCO DEMONSTRATIVO
# ============================================================
#
# OBJETIVO
# -------
# Recalcular os campos derivados da formação de preço dos
# produtos já existentes no banco demonstrativo.
#
# O script usa a MESMA função de precificação do backend:
#
# backend.main.calcular_precificacao_produto
#
# Portanto, não criamos uma segunda regra de cálculo.
#
# COMO EXECUTAR
# -------------
# A partir da raiz do projeto:
#
# python -m scripts.recalcular_precificacao_demo
#
# IMPORTANTE
# ----------
# Pare o backend antes de executar este script.
#
# ============================================================

from datetime import datetime
from pathlib import Path
import shutil

from backend.database import (
    DATABASE_PATH,
    SessionLocal,
)

from backend.main import (
    calcular_precificacao_produto,
)

from backend.models import (
    Auditoria,
    Produto,
)


# ============================================================
# DIRETÓRIO DE BACKUP
# ============================================================

RAIZ_PROJETO = (
    Path(__file__)
    .resolve()
    .parent
    .parent
)

PASTA_BACKUP = (
    RAIZ_PROJETO /
    "backup"
)


# ============================================================
# CAMPOS CALCULADOS
# ============================================================

CAMPOS_PRECIFICACAO = [
    "custo_unitario",
    "margem_lucro_percentual",
    "ncm",
    "regime_tributario",
    "uf_referencia",
    "referencia_fiscal",
    "calculo_preco_automatico",
    "preco_venda_manual",
    "aliquota_icms",
    "aliquota_pis",
    "aliquota_cofins",
    "aliquota_ipi",
    "aliquota_simples",
    "aliquota_cbs",
    "aliquota_ibs",
    "valor_margem",
    "base_comercial",
    "valor_icms",
    "valor_pis",
    "valor_cofins",
    "valor_ipi",
    "valor_simples",
    "valor_cbs",
    "valor_ibs",
    "preco_venda",
]


# ============================================================
# BACKUP AUTOMÁTICO
# ============================================================

def criar_backup() -> Path:
    PASTA_BACKUP.mkdir(
        parents=True,
        exist_ok=True,
    )

    agora = datetime.now()

    nome_backup = (
        "logiflow_antes_recalculo_"
        f"{agora:%Y%m%d_%H%M%S}.db"
    )

    caminho_backup = (
        PASTA_BACKUP /
        nome_backup
    )

    shutil.copy2(
        DATABASE_PATH,
        caminho_backup,
    )

    return caminho_backup


# ============================================================
# FORMATAR VALOR PARA TERMINAL
# ============================================================

def moeda(
    valor,
) -> str:
    return (
        f"R$ {float(valor):,.2f}"
        .replace(
            ",",
            "X",
        )
        .replace(
            ".",
            ",",
        )
        .replace(
            "X",
            ".",
        )
    )


# ============================================================
# RECALCULAR PRODUTOS
# ============================================================

def recalcular_precificacao():
    if (
        not DATABASE_PATH.exists()
    ):
        raise FileNotFoundError(
            f"Banco não encontrado em: {DATABASE_PATH}"
        )

    caminho_backup = (
        criar_backup()
    )

    print()
    print(
        "=============================================="
    )
    print(
        " LOGIFLOW - RECÁLCULO DE PRECIFICAÇÃO"
    )
    print(
        "=============================================="
    )
    print(
        f"Banco: {DATABASE_PATH}"
    )
    print(
        f"Backup: {caminho_backup}"
    )
    print(
        "----------------------------------------------"
    )

    db = SessionLocal()

    try:
        produtos = (
            db.query(
                Produto,
            )
            .order_by(
                Produto.sku.asc(),
            )
            .all()
        )

        if (
            len(
                produtos,
            ) ==
            0
        ):
            print(
                "Nenhum produto encontrado."
            )

            return

        quantidade_atualizada = 0

        for produto in produtos:
            preco_anterior = (
                produto.preco_venda
            )

            resultado = (
                calcular_precificacao_produto(
                    produto,
                )
            )

            for campo in CAMPOS_PRECIFICACAO:
                if (
                    campo
                    in
                    resultado
                ):
                    setattr(
                        produto,
                        campo,
                        resultado[
                            campo
                        ],
                    )

            quantidade_atualizada += 1

            print(
                f"{produto.sku} | "
                f"{produto.nome}"
            )

            print(
                "   Preço anterior: "
                f"{moeda(preco_anterior)}"
            )

            print(
                "   Preço recalculado: "
                f"{moeda(produto.preco_venda)}"
            )

            print(
                "   Margem: "
                f"{moeda(produto.valor_margem)}"
            )

            print(
                "   ICMS: "
                f"{moeda(produto.valor_icms)}"
                " | PIS: "
                f"{moeda(produto.valor_pis)}"
                " | COFINS: "
                f"{moeda(produto.valor_cofins)}"
            )

            print(
                "----------------------------------------------"
            )

        registro_auditoria = Auditoria(
            usuario_codigo=None,
            usuario_nome="Sistema",
            modulo="Produtos",
            acao="recalcular_precificacao",
            entidade="Produto",
            registro_referencia="BANCO-DEMO",
            detalhes=(
                "Recálculo completo da precificação "
                f"de {quantidade_atualizada} produto(s) "
                "do banco demonstrativo."
            ),
        )

        db.add(
            registro_auditoria,
        )

        db.commit()

        print()
        print(
            "=============================================="
        )
        print(
            " RECÁLCULO CONCLUÍDO COM SUCESSO"
        )
        print(
            "=============================================="
        )
        print(
            "Produtos atualizados: "
            f"{quantidade_atualizada}"
        )
        print(
            "Backup preservado em:"
        )
        print(
            caminho_backup
        )
        print(
            "=============================================="
        )
        print()

    except Exception as erro:
        db.rollback()

        print()
        print(
            "=============================================="
        )
        print(
            " ERRO - ALTERAÇÕES CANCELADAS"
        )
        print(
            "=============================================="
        )
        print(
            erro
        )
        print()
        print(
            "O banco não foi atualizado."
        )
        print(
            "O backup permanece disponível em:"
        )
        print(
            caminho_backup
        )
        print(
            "=============================================="
        )
        print()

        raise

    finally:
        db.close()


# ============================================================
# EXECUÇÃO
# ============================================================

if __name__ == "__main__":
    recalcular_precificacao()
