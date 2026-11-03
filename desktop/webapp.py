"""A mesma API serve o frontend compilado e suas rotas de navegação."""
from pathlib import Path

from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


def create_app(frontend: Path):
    from backend.main import app

    if not (frontend / "index.html").is_file():
        raise RuntimeError("Frontend não compilado. Execute npm run build em frontend.")
    # A home JSON da API dá lugar à aplicação apenas na distribuição desktop.
    app.router.routes[:] = [route for route in app.router.routes if getattr(route, "path", None) != "/"]
    app.mount("/assets", StaticFiles(directory=frontend / "assets"), name="assets")

    @app.get("/favicon.svg", include_in_schema=False)
    def favicon():
        return FileResponse(frontend / "favicon.svg")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend_route(path: str):
        if path not in {"", "estoque", "pedidos", "fornecedores", "clientes", "relatorios", "usuarios"}:
            raise HTTPException(404, "Página não encontrada.")
        return FileResponse(frontend / "index.html")

    return app
