"""Migração SQLite com backup e preservação do saldo de pedidos legados."""
from datetime import datetime
import re
import sqlite3

VERSION = "operacao_2026_10_02"

def migrar_operacao(path):
    connection = sqlite3.connect(str(path), timeout=15)
    try:
        connection.execute("CREATE TABLE IF NOT EXISTS logiflow_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)")
        connection.commit()
        if connection.execute("SELECT 1 FROM logiflow_migrations WHERE version=?", (VERSION,)).fetchone():
            return
        backup_dir = path.parent / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        backup_path = backup_dir / f"antes-operacao-{datetime.now():%Y%m%d-%H%M%S-%f}.db"
        with sqlite3.connect(str(backup_path)) as backup:
            connection.backup(backup)
        connection.execute("PRAGMA foreign_keys=OFF")
        connection.execute("BEGIN IMMEDIATE")
        columns = {row[1] for row in connection.execute("PRAGMA table_info(pedidos)")}
        additions = {
            "cliente_codigo": "VARCHAR(20)",
            # Antigos pedidos já tiveram baixa na criação. Não descontar novamente.
            "estoque_baixado": "BOOLEAN NOT NULL DEFAULT 1",
            "processado_em": "DATETIME", "enviado_em": "DATETIME",
            "entregue_em": "DATETIME", "cancelado_em": "DATETIME", "devolvido_em": "DATETIME",
        }
        for column, sql_type in additions.items():
            if column not in columns:
                connection.execute(f"ALTER TABLE pedidos ADD COLUMN {column} {sql_type}")
        schema = connection.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='pedidos'").fetchone()[0]
        if "'cancelado'" not in schema:
            indexes = [row[0] for row in connection.execute("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='pedidos' AND sql IS NOT NULL")]
            schema, replaced = re.subn(
                r"status\s+IN\s*\([^)]*\)",
                "status IN ('pendente', 'processando', 'enviado', 'entregue', 'cancelado', 'devolvido')",
                schema, flags=re.I,
            )
            if replaced != 1:
                raise RuntimeError("Não foi possível reconhecer a regra de status. Migração interrompida; backup preservado.")
            schema = re.sub(r'CREATE TABLE\s+["`\[]?pedidos["`\]]?', 'CREATE TABLE pedidos_operacional_tmp', schema, count=1, flags=re.I)
            connection.execute(schema)
            names = [row[1] for row in connection.execute("PRAGMA table_info(pedidos)")]
            fields = ", ".join(f'"{name}"' for name in names)
            connection.execute(f"INSERT INTO pedidos_operacional_tmp ({fields}) SELECT {fields} FROM pedidos")
            connection.execute("DROP TABLE pedidos")
            connection.execute("ALTER TABLE pedidos_operacional_tmp RENAME TO pedidos")
            for index in indexes:
                connection.execute(index)
        # Vincular apenas nomes inequívocos. Nunca inventar uma identidade ou data de entrega.
        connection.execute("""UPDATE pedidos SET cliente_codigo=(SELECT MIN(codigo) FROM clientes
            WHERE LOWER(TRIM(clientes.nome))=LOWER(TRIM(pedidos.cliente_nome)))
            WHERE cliente_codigo IS NULL AND (SELECT COUNT(*) FROM clientes
            WHERE LOWER(TRIM(clientes.nome))=LOWER(TRIM(pedidos.cliente_nome)))=1""")
        if connection.execute("PRAGMA foreign_key_check").fetchall():
            raise RuntimeError("Inconsistência de relacionamento; migração revertida.")
        connection.execute("INSERT INTO logiflow_migrations VALUES (?, ?)", (VERSION, datetime.now().isoformat()))
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
