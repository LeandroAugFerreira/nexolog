# Correções P0 propostas — controles de acesso e modo de demonstração

**Branch:** `fix/nexolog-controles-p0-20261108` · **Origem:** `docs/nexolog-recrutamento-20261108` · **Status:** implementação para revisão, sem merge e sem deploy.

## Escopo das alterações

1. **Autorização de relatórios.** `backend/main.py` deixa de liberar `POST /api/relatorios` para todo usuário autenticado. A regra mantém a escrita para administradores e gerentes, e libera explicitamente essa exportação aos operadores, preservando o comportamento existente para esses perfis. O perfil **Consulta** passa a receber **403** em tentativas de criação de relatório. Leituras por GET permanecem autorizadas. Nenhum dado de aplicação é alterado por essa mudança de configuração do middleware.
2. **Senha de demonstração em modo normal.** `backend/config.py` altera apenas o fallback de `ALLOW_DEMO_PASSWORD` de `true` para `false`. Assim, quando nenhuma variável de ambiente ou .env define a opção, o login com a senha conhecida de demonstração é bloqueado fora do modo de demonstração.
3. **Compatibilidade com o modo demo local.** `scripts/iniciar_demo.py` já ativa `NEXOLOG_DEMO_MODE=true` e `desktop/launcher.py` ativa explicitamente tanto demo quanto permissão de senha. **Esses scripts não foram alterados**; não há implantação pública nesta branch.
4. **Documentação e testes.** O comentário da criação de pedido foi corrigido para descrever reserva sem baixa física imediata. Novos testes em `tests/test_operations.py` verificam o bloqueio de escrita da Consulta, leitura permitida, escrita de operador e a configuração segura por padrão.

## Evidência e critérios de aceite

- Teste `test_perfil_consulta_nao_pode_gravar_relatorio_e_operador_pode`: espera 200 para leitura, 403 para escrita Consulta, nenhuma gravação, 201 para escrita Operador e consulta posterior do documento.
- Teste `test_senha_demo_desativada_por_padrao_sem_variavel_configurada`: importa `backend.config` em processo separado, com variáveis `NEXOLOG_ALLOW_DEMO_PASSWORD` e `LOGIFLOW_ALLOW_DEMO_PASSWORD` ausentes, sem carregar .env; espera `False`.
- Suíte backend e build frontend continuam sendo executados no CI já existente. **O resultado do novo commit deve ser verificado nos logs**; não antecipar aprovação.

## Riscos e restrições remanescentes

- Instalações que dependem implicitamente de senha demonstrativa **sem habilitar modo demo explicitamente** podem deixar de aceitar essa senha. A nova política é deliberada; revisar configurações legadas antes de implantar a correção.
- Variáveis/arquivos .env podem explicitamente habilitar a senha: a nova configuração não garante segurança de um ambiente mal configurado.
- Contas administrativas demonstrativas e endpoints de demonstração **não são apropriados para acesso público**. É necessária uma arquitetura de demo isolada, sem privilégios e com política de rede, sessões e credenciais apropriada.
- Não foi implantada proteção nova contra brute force, XSS, vazamento de token em localStorage ou cabeçalhos HTTP de produção.
- Os testes existentes não são um teste de navegador E2E; isso permanece como prioridade P1.
- A matriz de permissões das demais rotas não foi refatorada.

## Revisão sugerida antes de merge

1. Inspecionar o diff e verificar se o perfil Operador deve continuar podendo exportar relatórios (comportamento preservado).
2. Confirmar que nenhum ambiente fora da demonstração depende de senhas públicas.
3. Conferir execução dos testes da branch e o build.
4. Validar manualmente, em base descartável, o fluxo Consulta → 403 e Operador → 201.
5. Somente após aprovação, abrir/realizar merge. **Nenhum site, deploy ou versão do instalador foi atualizado nesta branch.**

Referências: [Auditoria inicial](AUDITORIA.md) · [Plano de melhorias](PLANO_DE_MELHORIAS.md) · [Teste de operações](../../tests/test_operations.py).
