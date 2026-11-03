"""Arquivos de exportação persistidos e acessíveis somente com autenticação."""
import csv
from datetime import datetime
import io
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import RelatorioGerado

class RelatorioCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=150)
    arquivo: str = Field(pattern=r"^[a-zA-Z0-9_-]+\.csv$", max_length=180)
    periodo: str = Field(min_length=1, max_length=30)
    conteudo: str = Field(min_length=1, max_length=2_000_000)

def proteger_csv(conteudo):
    output = io.StringIO(newline="")
    writer = csv.writer(output, delimiter=";", lineterminator="\n")
    for row in csv.reader(io.StringIO(conteudo), delimiter=";"):
        writer.writerow(["'" + value if value.lstrip().startswith(("=", "+", "-", "@")) else value for value in row])
    return output.getvalue()

def resumo(registro):
    return {"id": registro.id, "nome": registro.nome, "arquivo": registro.arquivo,
        "formato": registro.formato, "periodo": registro.periodo, "gerado_em": registro.gerado_em}

def instalar_rotas(app, auditar, contexto):
    @app.get("/api/relatorios", tags=["Relatórios"])
    def listar(db: Session = Depends(get_db)):
        return [resumo(item) for item in db.query(RelatorioGerado).order_by(RelatorioGerado.id.desc()).all()]

    @app.post("/api/relatorios", status_code=201, tags=["Relatórios"])
    def salvar(dados: RelatorioCreate, db: Session = Depends(get_db)):
        usuario = contexto.get() or {}
        registro = RelatorioGerado(nome=dados.nome.strip(), arquivo=dados.arquivo,
            periodo=dados.periodo, conteudo=proteger_csv(dados.conteudo),
            usuario_codigo=usuario.get("codigo"), gerado_em=datetime.now())
        db.add(registro)
        db.flush()
        auditar(db, modulo="Relatórios", acao="exportar", entidade="Relatorio",
            registro_referencia=str(registro.id), detalhes=f"Exportação registrada: {registro.nome}.")
        db.commit()
        db.refresh(registro)
        return {**resumo(registro), "conteudo": registro.conteudo}

    @app.get("/api/relatorios/{identificador}", tags=["Relatórios"])
    def baixar(identificador: int, db: Session = Depends(get_db)):
        registro = db.get(RelatorioGerado, identificador)
        if registro is None:
            raise HTTPException(404, "Relatório não encontrado.")
        return {**resumo(registro), "conteudo": registro.conteudo}
