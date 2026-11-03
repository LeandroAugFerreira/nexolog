"""Servidor da demonstração em código-fonte, sem alterar bancos anteriores."""
import os
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]


def main():
    database = ROOT / "backend" / "nexolog-demo.db"
    if not database.exists():
        shutil.copyfile(ROOT / "data" / "nexolog-demo.db", database)
    os.environ["NEXOLOG_DATABASE_PATH"] = str(database)
    os.environ["NEXOLOG_DEMO_MODE"] = "true"
    os.environ["NEXOLOG_DEMO_PASSWORD"] = "NexoLog@2026"
    os.environ["NEXOLOG_PUBLIC_SIGNUP"] = "false"
    from backend.main import app
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
