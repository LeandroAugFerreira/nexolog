"""Prévia local do frontend compilado com um banco de demonstração separado."""
import argparse
from pathlib import Path
from desktop.launcher import prepare_data, ROOT
from desktop.webapp import create_app
import uvicorn

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, required=True)
    parser.add_argument("--port", type=int, default=18765)
    args = parser.parse_args()
    prepare_data(args.data_dir)
    uvicorn.run(create_app(ROOT / "frontend" / "dist"), host="127.0.0.1", port=args.port, log_config=None)
