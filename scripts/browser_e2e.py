"""End-to-end smoke do NexoLog com navegador real e banco SQLite efêmero.

Usado exclusivamente no runner CI, sem tocar em data/nexolog-demo.db nem na base local.
Inicia API e Vite apenas no loopback; sem qualquer serviço externo da aplicação.
"""
from __future__ import annotations

import os
from pathlib import Path
import secrets
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
API = "http://127.0.0.1:8000"
SITE = "http://127.0.0.1:5173"
ARTIFACTS = ROOT / "artifacts" / "e2e"

SEED = """
import os
from backend.main import criar_credencial
from backend.database import SessionLocal
from backend.models import Usuario, Cliente, Produto

with SessionLocal() as db:
    usuario = Usuario(codigo="USR-900", nome="Avaliador de Testes",
        email="avaliador@teste.invalid", cargo="Avaliador de QA",
        perfil="administrador", status="ativo")
    db.add(usuario)
    db.add(Cliente(codigo="CLI-900", nome="Cliente Sintetico QA",
        tipo="pessoa_juridica", documento="11222333000181",
        logradouro="Rua dos Testes", cidade="Campinas", uf="SP", status="ativo"))
    db.add(Produto(sku="PRD-900", nome="Caixa Sintetica QA",
        categoria="Embalagens", estoque_atual=100, estoque_minimo=10,
        custo_unitario=10, preco_venda=20))
    db.flush()
    criar_credencial(db, usuario.codigo, os.environ["NEXOLOG_E2E_PASSWORD"])
    db.commit()
"""

def online(url: str, timeout: float = 55.0) -> None:
    limit = time.monotonic() + timeout
    last = None
    while time.monotonic() < limit:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.status < 500:
                    return
        except (urllib.error.URLError, TimeoutError, OSError) as error:
            last = error
        time.sleep(0.35)
    raise RuntimeError(f"Serviço não iniciou no loopback {url}: {type(last).__name__}")

def require_value(obj: dict, field: str, expected: object) -> None:
    actual = obj[field]
    if actual != expected:
        raise AssertionError(f"{field}: esperado {expected!r}; recebido {actual!r}")

def smoke() -> None:
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="nexolog-e2e-") as workspace:
        env = os.environ.copy()
        for name in list(env):
            if name.startswith(("NEXOLOG_", "LOGIFLOW_")):
                env.pop(name, None)
        password = secrets.token_urlsafe(28)
        env.update({
            "NEXOLOG_DATABASE_PATH": str(Path(workspace) / "e2e-temporary.db"),
            "NEXOLOG_E2E_PASSWORD": password,
            "NEXOLOG_DEMO_MODE": "false",
            "NEXOLOG_ALLOW_DEMO_PASSWORD": "false",
            "NEXOLOG_PUBLIC_SIGNUP": "false",
            "NEXOLOG_TRACKING_WORKER": "false",
            "NEXOLOG_CORS_ORIGINS": SITE,
        })
        subprocess.run([sys.executable, "-c", SEED], cwd=ROOT, env=env, check=True)
        api_log = open(Path(workspace) / "api.log", "w", encoding="utf-8")
        vite_log = open(Path(workspace) / "vite.log", "w", encoding="utf-8")
        api = subprocess.Popen([sys.executable, "-m", "uvicorn", "backend.main:app",
            "--host", "127.0.0.1", "--port", "8000", "--no-access-log"],
            cwd=ROOT, env=env, stdout=api_log, stderr=subprocess.STDOUT)
        vite = subprocess.Popen(["npm", "--prefix", "frontend", "run", "dev",
            "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
            cwd=ROOT, env=env, stdout=vite_log, stderr=subprocess.STDOUT)
        try:
            online(API + "/api/health")
            online(SITE)
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch(headless=True)
                context = browser.new_context(viewport={"width": 1365, "height": 900}, locale="pt-BR")
                page = context.new_page()
                page.set_default_timeout(18000)
                try:
                    page.goto(SITE + "/", wait_until="domcontentloaded")
                    page.locator("#login-email").fill("avaliador@teste.invalid")
                    page.locator("#login-senha").fill(password)
                    page.get_by_role("button", name="Entrar no NexoLog").click()
                    expect(page.get_by_text("Pedidos Recentes")).to_be_visible(timeout=25000)

                    page.goto(SITE + "/pedidos", wait_until="domcontentloaded")
                    page.get_by_role("button", name="Novo Pedido").click()
                    expect(page.get_by_role("heading", name="Realizar Pedido")).to_be_visible()
                    page.locator("#cliente_codigo").select_option("CLI-900")
                    page.locator("#destino").fill("Rota demonstrativa de testes")
                    page.locator(".pedido-item-card select").first.select_option("PRD-900")
                    page.locator(".pedido-item-card input[type=number]").nth(0).fill("30")
                    page.locator(".pedido-item-card input[type=number]").nth(1).fill("20")
                    page.get_by_role("button", name="Cadastrar Pedido").click()
                    expect(page.get_by_role("heading", name="Realizar Pedido")).not_to_be_visible(timeout=25000)

                    token = page.evaluate("window.localStorage.getItem('logiflow_token')")
                    if not token:
                        raise AssertionError("Login não persistiu token de sessão para a UI.")
                    headers = {"Authorization": "Bearer " + token}

                    def get(path: str) -> dict:
                        resp = context.request.get(API + path, headers=headers)
                        if not resp.ok:
                            raise AssertionError(f"GET {path}: HTTP {resp.status}")
                        return resp.json()

                    def advance_in_browser(codigo: str, label: str, expected_status: str) -> None:
                        page.get_by_role("button", name=f"Ações do pedido {codigo}").click()
                        page.get_by_role("button", name=f"Mover para {label}").click()
                        for _ in range(45):
                            pedido_atual = get("/api/pedidos/" + codigo)
                            if pedido_atual["status"] == expected_status:
                                return
                            time.sleep(0.2)
                        raise AssertionError(f"Alteração do status {expected_status} não persistiu após clique na interface.")

                    pedidos = get("/api/pedidos")
                    if len(pedidos) != 1:
                        raise AssertionError(f"Um pedido sintético esperado; recebidos {len(pedidos)}.")
                    codigo = pedidos[0]["codigo"]
                    require_value(pedidos[0], "status", "pendente")
                    saldos = get("/api/produtos/PRD-900")
                    for campo, valor in (("estoque_atual", 100), ("estoque_reservado", 30), ("estoque_disponivel", 70)):
                        require_value(saldos, campo, valor)

                    advance_in_browser(codigo, "Em Processamento", "processando")
                    advance_in_browser(codigo, "Enviado", "enviado")
                    saldos = get("/api/produtos/PRD-900")
                    for campo, valor in (("estoque_atual", 70), ("estoque_reservado", 0), ("estoque_disponivel", 70)):
                        require_value(saldos, campo, valor)
                    advance_in_browser(codigo, "Entregue", "entregue")
                    resultado = get("/api/pedidos/" + codigo)
                    require_value(resultado, "status", "entregue")
                    movimentos = get("/api/movimentacoes")
                    saidas = [x for x in movimentos if x.get("produto_sku") == "PRD-900" and x.get("tipo") == "saida"]
                    if len(saidas) != 1:
                        raise AssertionError(f"Esperada exatamente uma baixa física; encontrada(s) {len(saidas)}.")

                    page.goto(SITE + "/", wait_until="domcontentloaded")
                    expect(page.get_by_text("Pedidos Recentes")).to_be_visible(timeout=25000)
                    expect(page.get_by_text(codigo).first).to_be_visible(timeout=25000)
                    expect(page.get_by_text("Cliente Sintetico QA").first).to_be_visible()
                    page.screenshot(path=str(ARTIFACTS / "nexolog-browser-e2e.png"), full_page=True)
                    print("PASS: login via interface; criação via formulário; reserva 100/30/70;")
                    print("PASS: mudanças de status por clique no Kanban, expedição 70/0/70 e saída única;")
                    print("PASS: pedido sintético visível no Dashboard React após recarga.")
                except Exception:
                    page.screenshot(path=str(ARTIFACTS / "nexolog-browser-e2e-failure.png"), full_page=True)
                    raise
                finally:
                    context.close()
                    browser.close()
        finally:
            for proc in (vite, api):
                if proc.poll() is None:
                    proc.terminate()
                    try:
                        proc.wait(timeout=8)
                    except subprocess.TimeoutExpired:
                        proc.kill()
                        proc.wait()
            for handle in (api_log, vite_log):
                handle.close()

if __name__ == "__main__":
    smoke()
