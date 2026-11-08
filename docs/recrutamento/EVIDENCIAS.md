# Evidências e limites verificáveis — NexoLog

**Data desta revisão:** 08/11/2026. **Base:** commit main 24d00d84ed5c64c1a8dc89e90810f941dbab0728.

## Legenda

- **Inspecionado:** código lido nesta revisão, sem executar a aplicação.
- **Histórico confirmado documentalmente:** registros e workflow existentes, não teste novo feito nesta auditoria.
- **Pendente:** não há evidência independente suficiente nesta revisão.
- **Hipótese:** proposta ou risco a validar, nunca resultado comprovado.

## 1. Evidências verificadas por inspeção de código

| Item | Situação | Fonte | O que comprova / não comprova |
| --- | --- | --- | --- |
| Rotas HTTP FastAPI | Inspecionado | [backend/main.py](../../backend/main.py), [tracking.py](../../backend/tracking.py), [reports.py](../../backend/reports.py) | Decoradores, métodos e delegação; não comprovam serviço em produção. |
| Pedido e reserva | Inspecionado | [operations.py](../../backend/operations.py) | Regras de validação, reserva calculada e expedição; sem execução nova. |
| Transações SQLite | Inspecionado | [database.py](../../backend/database.py) | BEGIN IMMEDIATE em métodos de escrita, foreign_keys e busy_timeout; não garante carga elevada. |
| Schemas Pydantic | Inspecionado | [schemas.py](../../backend/schemas.py) | Restrições declarativas de entrada/saída. |
| Modelagem | Inspecionado | [models.py](../../backend/models.py) | Pedido, ItemPedido, Produto, Movimentacao, histórico, credencial, sessão e auditoria. |
| Login e perfis | Inspecionado | [main.py](../../backend/main.py) | Hash da senha, hash do token, middleware e autorização por perfil; sem pentest. |
| UI e integração | Inspecionado | [Pedidos.jsx](../../frontend/src/pages/Pedidos.jsx), [Dashboard.jsx](../../frontend/src/pages/Dashboard.jsx), [api.js](../../frontend/src/services/api.js) | Chamadas reais às rotas e recálculo dos indicadores a partir de leituras; não é E2E executado. |
| Entrega simulada | Inspecionado | [tracking.py](../../backend/tracking.py) | Estados e persistência demonstrativa; não há GPS ou transporte real. |
| Dados de demonstração | Inspecionado | [manifesto-demo.json](../../data/manifesto-demo.json), [segurança](../github/SEGURANCA.md) | Manifesto identifica a base como fictícia; binário da base não foi integralmente auditado nesta etapa. |

## 2. Evidências históricas (anteriores a esta revisão)

- [docs/github/VALIDACAO.md](../github/VALIDACAO.md) registra **22 testes de backend aprovados** e **build frontend aprovado** em 02/11/2026.
- [docs/github/resultados.json](../github/resultados.json) registra unittest_passed=22, backend_exit=0 e frontend build exit_code=0; duração do build reportada pelo arquivo: 8,76 s. Tempo histórico, não benchmark.
- [GitHub Actions, execução 41561332648](https://github.com/LeandroAugFerreira/nexolog/actions/runs/41561332648), em 03/11/2026, estava com conclusão success quando consultada.
- [tests/test_operations.py](../../tests/test_operations.py) contém **22 métodos de teste** (inspecionados na fonte). Entre eles: reserva/expedição sem baixa dupla, cancelamento, devolução, concorrência de pedidos, rollback em lote, perfis, logout, backup, migração e proteção CSV.
- [Workflow](../../.github/workflows/tests.yml) prevê unittest do backend em Python 3.13 e build do frontend com Node 22. **Não inclui execução de navegador E2E ou auditoria de dependências.**
- O repositório também contém testes JavaScript de serviços e utilitários, mas eles **não constam como etapa executada no workflow consultado**. Não declarar sua aprovação sem um comando e log específico.

## 3. Execução nesta etapa

**Testes funcionais novos:** não executados no ambiente local desta auditoria.

**Motivo:** o código foi inspecionado através da integração GitHub, porém o ambiente de execução não tinha checkout completo do repositório. Uma tentativa de acesso de rede ao GitHub por git ls-remote falhou por impossibilidade de resolver github.com; não foi obtida uma instalação isolada para rodar FastAPI/React localmente. Não foram executados scripts de instalação, backend, frontend, simulador, nem executável do Windows; não foram acessados serviços externos.

**Publicação da branch de documentação:** o workflow GitHub Actions configurado para push poderá executar unittest e build no runner isolado. O resultado desse novo workflow precisa ser conferido na aba Actions antes de declarar novos testes aprovados. Esta documentação é deliberadamente conservadora e não antecipa o status.

## 4. Matrizes de cenários — código versus validação

| Cenário | Código observado | Teste na suíte | Resultado nesta auditoria |
| --- | --- | --- | --- |
| Criar pedido válido e reservar | Sim | test_reserva_expedicao_entrega_sem_baixa_duplicada | Inspeção + histórico de suíte; execução nova pendente |
| Expedir sem dupla baixa | Sim | test_reserva_expedicao_entrega_sem_baixa_duplicada | Inspeção + histórico |
| Cancelar sem entrada falsa | Sim | test_cancelamento_libera_reserva_sem_entrada_ficticia | Inspeção + histórico |
| Devolver integralmente | Sim | test_devolucao_recebida_integral_so_uma_vez | Inspeção + histórico |
| Duas reservas concorrentes | Sim | test_pedidos_simultaneos_nao_reservam_mesmo_saldo | Inspeção + histórico |
| Reserva múltiplos itens com erro | Sim | test_pedido_multiplos_itens_falha_sem_reserva_parcial | Inspeção + histórico |
| Relatório CSV seguro | Sim | test_relatorio_persistido_protegido_e_csv_seguro | Inspeção + histórico |
| Perfil Consulta tentar POST relatório | Exceção explícita na autorização | **Não localizado cenário direcionado** | Requer novo teste e decisão |
| Experiência navegador de ponta a ponta | Fluxo UI identificado | **Não localizado E2E em CI** | Pendente |
| Instalação limpa em máquina nova | Scripts e manual existentes | Não validada nesta auditoria | Pendente |
| Rastreamento com transportadora/GPS real | Não é escopo; simulação | N/A | Não afirmar |
| Desempenho em produção/ROI | Sem medição | N/A | Não afirmar |

## 5. Evidências visuais

- [Página pública do projeto](https://leandroaugferreira.github.io/nexolog.html) contém vídeo, material ilustrativo e guia.
- Os vídeos e imagens são **materiais de apresentação** e não substituem log de teste ou rastreabilidade de dados.
- **Pendente:** captura controlada de um fluxo completo em navegador, com dados fictícios, indicadores e resposta API, identificando data, ambiente e versão. O arquivo binário de demonstração não foi executado nesta revisão.

## 6. Como executar testes futuros com segurança

**Pré-condições:** checkout novo em diretório descartável, Python 3.13, Node compatível, configuração apontando apenas para banco temporário. Não reutilizar banco local de operação nem dados pessoais. Não conectar a transportadora, e-mail ou serviços externos.

~~~powershell
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
~~~

O arquivo tests/test_operations.py define banco em TemporaryDirectory antes de importar a aplicação e desliga worker de rastreamento em ambiente de testes. Revisar isso novamente antes da execução. Em outro sistema operacional, adaptar sintaxe dos caminhos. Registrar logs, SHA, duração, ambiente e exit code; descartar ambiente ao final.

## 7. O que registrar após uma validação nova

- Hash do commit e branch.
- Sistema operacional, versões Python e Node.
- Command-line exata, número de casos, aprovações/falhas/ignorados e status do build.
- Capturas do fluxo pedido → expedição → dashboard, com base fictícia.
- Qualquer diferença entre resultado esperado e observado.
- Link de execução do GitHub Actions, sem inserir segredos ou dados reais no relatório.

**Regra para currículo e entrevistas:** nunca chamar resultado de teste histórico de “teste executado agora”, nem confundir demonstração local com cliente em produção.


## 8. Atualização posterior — branch de controles P0 (08/11/2026)

Após a criação deste inventário, foi implementada em branch separada a correção de autorização de escrita de relatórios e o fallback seguro da configuração de senha demo.

- **Branch:** `fix/nexolog-controles-p0-20261108`.
- **Commit validado:** `beb31166d05aab1b6f6ec0872661b7b6e022c58a`.
- **[Execução remota real](https://github.com/LeandroAugFerreira/nexolog/actions/runs/42490711781):** conclusão `success` — **24 testes backend aprovados** (`Ran 24 tests ... OK`) e **build frontend aprovado**.
- **Novos testes:** Consulta não pode gravar relatório, Operador pode exportar, e `ALLOW_DEMO_PASSWORD` permanece falso quando não há variável ou arquivo de configuração.
- **Limite:** nenhuma execução E2E em navegador, teste de segurança ofensivo, homologação de Windows ou deploy público foi realizada nesta etapa.

Veja [CORRECOES_P0.md](CORRECOES_P0.md) para o escopo e os riscos restantes. Os dados históricos das seções anteriores continuam válidos para a auditoria inicial de 08/11/2026, anterior à branch de correção.


## 9. Nova validação de navegador com o sistema real

[GitHub Actions #42497341800](https://github.com/LeandroAugFerreira/nexolog/actions/runs/42497341800), 08/11/2026: **24/24 testes backend, 14/14 testes JavaScript, build Vite e Playwright Chromium aprovados**. O navegador fez login e criou pedido pela interface; API real processou expedição/entrega; o Dashboard mostrou o pedido. SQLite de teste efêmero. Veja [E2E_BROWSER.md](E2E_BROWSER.md) para os limites exatos. O [tour público](https://leandroaugferreira.github.io/nexolog-demo.html) é simulado, sem backend.
