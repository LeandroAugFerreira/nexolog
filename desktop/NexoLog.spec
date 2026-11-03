# PyInstaller: frontend e base fictícia são os únicos dados incorporados.
import os
from pathlib import Path
from PyInstaller.utils.hooks import collect_submodules

root = Path(SPECPATH).parent
onefile = os.environ.get("NEXOLOG_BUILD_ONEFILE", "1") == "1"
a = Analysis(
    [str(root / "desktop" / "launcher.py")], pathex=[str(root)],
    binaries=[], datas=[
        (str(root / "frontend" / "dist"), "frontend/dist"),
        (str(root / "data" / "nexolog-demo.db"), "data"),
        (str(root / "desktop" / "nexolog.ico"), "desktop"),
    ], hiddenimports=collect_submodules("backend") + [
        "uvicorn.logging", "uvicorn.loops.asyncio", "uvicorn.protocols.http.h11_impl",
        "uvicorn.protocols.websockets.websockets_impl", "uvicorn.lifespan.on",
    ], hookspath=[], runtime_hooks=[], excludes=["pytest", "httpx", "watchfiles", "httptools"],
    noarchive=False,
)
pyz = PYZ(a.pure)
options = dict(name="NexoLog", debug=False, bootloader_ignore_signals=False,
    strip=False, upx=False, console=False, icon=str(root / "desktop" / "nexolog.ico"),
    version=str(root / "desktop" / "version.txt"))
if onefile:
    exe = EXE(pyz, a.scripts, a.binaries, a.datas, [], **options)
else:
    exe = EXE(pyz, a.scripts, [], exclude_binaries=True, **options)
    coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, name="NexoLog")
