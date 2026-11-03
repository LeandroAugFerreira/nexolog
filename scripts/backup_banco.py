"""Backup consistente e verificação antes da restauração. API deve estar parada para restaurar."""
import argparse
from datetime import datetime
from pathlib import Path
import sqlite3
from backend.config import DATABASE_PATH

def main():
    parser = argparse.ArgumentParser(description="Backup/restauração do banco LogiFlow")
    parser.add_argument("--restaurar", type=Path)
    args = parser.parse_args()
    directory = DATABASE_PATH.parent / "backups"
    directory.mkdir(parents=True, exist_ok=True)
    destino = directory / f"backup-{datetime.now():%Y%m%d-%H%M%S-%f}.db"
    if not DATABASE_PATH.exists():
        parser.error("Banco de destino não existe. Nenhum arquivo foi alterado.")
    origem = None
    if args.restaurar:
        if not args.restaurar.is_file():
            parser.error("Arquivo de backup não encontrado.")
        origem = sqlite3.connect(args.restaurar.resolve().as_uri() + "?mode=ro", uri=True)
        if origem.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            parser.error("Backup inválido. Banco atual preservado.")
        required = {"produtos", "pedidos", "itens_pedido", "clientes", "usuarios"}
        tables = {row[0] for row in origem.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if not required <= tables:
            parser.error("Arquivo não é um banco LogiFlow. Banco atual preservado.")
    with sqlite3.connect(str(DATABASE_PATH), timeout=15) as atual, sqlite3.connect(str(destino)) as backup:
        atual.backup(backup)
        if origem:
            origem.backup(atual)
            origem.close()
            print("Banco restaurado. Reinicie a API para aplicar as migrações necessárias.")
    print(f"Backup preservado: {destino}")

if __name__ == "__main__":
    main()
