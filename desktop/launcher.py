"""Inicia o NexoLog localmente, com dados persistidos fora do executável."""
import argparse
import json
import logging
from logging.handlers import RotatingFileHandler
import os
from pathlib import Path
import shutil
import socket
import sqlite3
import sys
import threading
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen
import webbrowser

ROOT = Path(sys._MEIPASS) if getattr(sys, "frozen", False) else Path(__file__).resolve().parents[1]
DEMO_EMAIL = "demo@nexolog.app"
DEMO_PASSWORD = "NexoLog@2026"


def prepare_data(folder: Path):
    folder.mkdir(parents=True, exist_ok=True)
    database = folder / "nexolog-demo.db"
    if not database.exists():
        seed = ROOT / "data" / "nexolog-demo.db"
        if not seed.is_file():
            raise RuntimeError("Base demonstrativa não encontrada no pacote.")
        temporary = folder / "nexolog-demo.db.tmp"
        shutil.copyfile(seed, temporary)
        temporary.replace(database)
    # A cópia distribuída é fictícia. O banco original do projeto nunca é usado.
    os.environ["NEXOLOG_DATABASE_PATH"] = str(database)
    os.environ["NEXOLOG_DEMO_MODE"] = "true"
    os.environ["NEXOLOG_DEMO_PASSWORD"] = DEMO_PASSWORD
    os.environ["NEXOLOG_ALLOW_DEMO_PASSWORD"] = "true"
    os.environ["NEXOLOG_PUBLIC_SIGNUP"] = "false"
    os.environ["NEXOLOG_TRACKING_WORKER"] = "true"
    handler = RotatingFileHandler(folder / "nexolog.log", maxBytes=2_000_000, backupCount=2, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))
    logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)
    return database


def start_server():
    import uvicorn
    from desktop.webapp import create_app

    listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        listener.bind(("127.0.0.1", 8765))
    except OSError:
        listener.bind(("127.0.0.1", 0))
    port = listener.getsockname()[1]
    server = uvicorn.Server(uvicorn.Config(
        create_app(ROOT / "frontend" / "dist"), host="127.0.0.1", port=port,
        loop="asyncio", http="h11", ws="websockets", log_config=None, access_log=False,
    ))
    thread = threading.Thread(target=server.run, kwargs={"sockets": [listener]}, daemon=True, name="NexoLog API")
    thread.start()
    return server, thread, f"http://127.0.0.1:{port}"


def wait_ready(server, url, timeout=45):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if server.started:
            with urlopen(url + "/api/health", timeout=3) as response:
                if json.load(response).get("api") == "NexoLog":
                    return
        if server.should_exit:
            break
        time.sleep(.15)
    raise RuntimeError("O serviço não iniciou. Consulte nexolog.log na pasta de dados.")


def self_test(url, database, folder):
    from desktop.native_window import NativeWindow
    from types import SimpleNamespace
    window = NativeWindow(SimpleNamespace(should_exit=False), url, folder, ROOT / "desktop" / "nexolog.ico", show=False)
    window.destroy()

    def request(path, data=None, token=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        payload = json.dumps(data).encode() if data else None
        with urlopen(Request(url + path, data=payload, headers=headers), timeout=15) as response:
            return response.read()

    assert b"NexoLog" in request("/")
    assert b"NexoLog" in request("/pedidos")
    assert b"<svg" in request("/favicon.svg")
    try:
        request("/api/produtos")
        raise AssertionError("API sem autenticação")
    except HTTPError as error:
        assert error.code == 401
    login = json.loads(request("/api/auth/login", {"email": DEMO_EMAIL, "senha": DEMO_PASSWORD}))
    token = login["token"]
    counts = {}
    for resource in ("produtos", "fornecedores", "clientes", "usuarios", "pedidos", "relatorios", "auditoria"):
        values = json.loads(request("/api/" + resource, token=token))
        assert isinstance(values, list) and values, resource
        counts[resource] = len(values)
    try:
        request("/api/rota-inexistente", token=token)
        raise AssertionError("Rota inválida respondeu com o frontend")
    except HTTPError as error:
        assert error.code == 404
    with sqlite3.connect(database) as connection:
        assert connection.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        assert not connection.execute("PRAGMA foreign_key_check").fetchall()
    result = {"status": "ok", "api": "NexoLog", "frontend": "ok", "autenticacao": "ok", "sqlite": "ok", "contagens": counts}
    (folder / "self-test.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    if sys.stdout is not None:
        print(json.dumps(result, ensure_ascii=False))


def show_window(server, url, folder):
    from desktop.native_window import NativeWindow
    window = NativeWindow(server, url, folder, ROOT / "desktop" / "nexolog.ico")
    webbrowser.open(url)
    window.run()

def main():
    parser = argparse.ArgumentParser(description="NexoLog — aplicação Windows")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--data-dir", type=Path)
    args = parser.parse_args()
    if args.self_test and args.data_dir is None:
        parser.error("--self-test requer --data-dir apontando para uma pasta de teste separada.")
    folder = args.data_dir or Path(os.getenv("LOCALAPPDATA", str(Path.home()))) / "NexoLog"
    server = thread = None
    mutex = None
    try:
        if os.name == "nt" and not args.self_test:
            import ctypes
            ctypes.windll.kernel32.CreateMutexW.restype = ctypes.c_void_p
            ctypes.windll.kernel32.CreateMutexW.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_wchar_p]
            ctypes.windll.kernel32.CloseHandle.argtypes = [ctypes.c_void_p]
            mutex = ctypes.windll.kernel32.CreateMutexW(None, False, "Local\\NexoLogDesktop")
            if ctypes.windll.kernel32.GetLastError() == 183:
                ctypes.windll.kernel32.CloseHandle(mutex)
                mutex = None
                ctypes.windll.user32.MessageBoxW(None, "O NexoLog já está em execução. Use a janela aberta para acessar o sistema.", "NexoLog", 0)
                return 0
        database = prepare_data(folder)
        server, thread, url = start_server()
        wait_ready(server, url)
        if args.self_test:
            self_test(url, database, folder)
        else:
            show_window(server, url, folder)
        return 0
    except Exception as error:
        logging.exception("Falha ao iniciar o NexoLog")
        if args.self_test:
            folder.mkdir(parents=True, exist_ok=True)
            (folder / "self-test.json").write_text(json.dumps({"status": "erro", "mensagem": str(error)}, ensure_ascii=False), encoding="utf-8")
        elif os.name == "nt":
            import ctypes
            ctypes.windll.user32.MessageBoxW(None, f"Não foi possível iniciar o NexoLog.\n{error}\n\nDados e logs: {folder}", "NexoLog", 16)
        return 1
    finally:
        if server:
            server.should_exit = True
        if thread:
            thread.join(timeout=10)
        if mutex:
            import ctypes
            ctypes.windll.kernel32.CloseHandle(mutex)


if __name__ == "__main__":
    sys.exit(main())
