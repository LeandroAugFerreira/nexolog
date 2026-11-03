"""Configuração explícita; os padrões servem à operação local."""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=False)
def setting(name, default):
    """A marca nova aceita as variáveis antigas para preservar instalações existentes."""
    return os.getenv(f"NEXOLOG_{name}", os.getenv(f"LOGIFLOW_{name}", default))

DATABASE_PATH = Path(setting("DATABASE_PATH", str(BASE_DIR / "logiflow.db"))).resolve()
DEMO_MODE = setting("DEMO_MODE", "false").lower() == "true"
ALLOW_DEMO_PASSWORD = setting("ALLOW_DEMO_PASSWORD", "true").lower() == "true"
PUBLIC_SIGNUP = setting("PUBLIC_SIGNUP", "false").lower() == "true"
DEMO_PASSWORD = setting("DEMO_PASSWORD", "LogiFlow@2026")
TRACKING_WORKER = setting("TRACKING_WORKER", "true").lower() == "true"
CORS_ORIGINS = [value.strip() for value in setting(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if value.strip()]
