"""Defina uma senha própria sem publicá-la em argumentos, logs ou arquivos."""
import argparse
from getpass import getpass
from backend.main import criar_credencial, gerar_proximo_codigo_usuario, registrar_auditoria, SENHA_DEMO_INICIAL
from backend.database import SessionLocal
from backend.models import Usuario, SessaoUsuario
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description="Configurar administrador local do LogiFlow")
    parser.add_argument("--email", required=True)
    parser.add_argument("--nome", default="Administrador")
    args = parser.parse_args()
    email = args.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        parser.error("Informe um e-mail válido.")
    senha = getpass("Nova senha (mínimo 12 caracteres): ")
    confirmacao = getpass("Confirme a nova senha: ")
    if senha != confirmacao or len(senha) < 12 or senha == SENHA_DEMO_INICIAL:
        parser.error("Senhas devem coincidir, ter pelo menos 12 caracteres e ser diferentes da senha demonstrativa.")
    with SessionLocal() as db:
        db.connection().exec_driver_sql("BEGIN IMMEDIATE")
        usuario = db.query(Usuario).filter(Usuario.email == email).first()
        if usuario and usuario.perfil != "administrador":
            parser.error("Este e-mail pertence a outro perfil. Use um administrador existente ou um e-mail novo.")
        if usuario is None:
            usuario = Usuario(codigo=gerar_proximo_codigo_usuario(db), nome=args.nome.strip() or "Administrador",
                email=email, cargo="Administrador do Sistema", perfil="administrador", status="ativo")
            db.add(usuario)
            db.flush()
        criar_credencial(db, usuario.codigo, senha)
        usuario.status = "ativo"
        db.query(SessaoUsuario).filter(SessaoUsuario.usuario_codigo == usuario.codigo,
            SessaoUsuario.revogado_em.is_(None)).update({"revogado_em": datetime.now()})
        registrar_auditoria(db, modulo="Autenticação", acao="configurar_admin", entidade="Usuario",
            registro_referencia=usuario.codigo, usuario_codigo=usuario.codigo, usuario_nome=usuario.nome,
            detalhes="Administrador configurado pelo utilitário local; sessões anteriores revogadas.")
        db.commit()
    print("Administrador configurado. Entre com a senha definida.")

if __name__ == "__main__":
    main()
