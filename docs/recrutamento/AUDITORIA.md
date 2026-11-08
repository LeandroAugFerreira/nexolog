# Auditoria técnica do NexoLog — análise para recrutamento

> Escopo: leitura estática do repositório na revisão da branch main de 08/11/2026 (commit 24d00d84ed5c64c1a8dc89e90810f941dbab0728). Não equivale a pentest, teste de produção, homologação ou auditoria completa linha a linha.
>
> Estado das evidências: **[C]** confirmado por leitura de código; **[H]** teste histórico documentado no repositório; **[P]** pendente de validação independente; **[R]** recomendação.

## 1. Parecer executivo

O projeto tem um fluxo de negócio coerente, módulos full stack de fato implementados, regras de reserva/expedição, persistência SQLite, autenticação e uma suíte de integração que cobre erros, concorrência e operações idempotentes. É apresentável para seleção de desenvolvedor júnior, com a ressalva de ser demonstração local e não produto pronto para exposição pública na internet.

Pontos que diferenciam a solução:
- **[C]** Pedido criado reserva unidades sem dar baixa física; a baixa ocorre quando o status passa a enviado, e a devolução integral retorna itens ao saldo. Ver [regras de pedido](../../backend/operations.py).
- **[C]** Há controle transacional para escritas SQLite, incluindo BEGIN IMMEDIATE, que reduz disputas de reserva concorrente. Ver [sessões de banco](../../backend/database.py).
- **[C]** Login, sessões revogáveis, papéis de acesso, relatórios CSV sanitizados e auditoria são contemplados no backend. Ver [API](../../backend/main.py) e [relatórios](../../backend/reports.py).
- **[C]** A interface usa React, React Router, Recharts e camada centralizada de requisições. Ver [package.json](../../frontend/package.json) e [api.js](../../frontend/src/services/api.js).
- **[H]** A documentação registra 22 testes de backend aprovados e build frontend aprovado em 02/11/2026, com workflow remoto de 03/11/2026 concluído com sucesso; **não** se trata de execução independente desta auditoria. Ver [validação anterior](../github/VALIDACAO.md) e [Actions](https://github.com/LeandroAugFerreira/nexolog/actions/runs/41561332648).

## 2. Inventário inspecionado

- Backend: [main.py](../../backend/main.py), [operations.py](../../backend/operations.py), [models.py](../../backend/models.py), [schemas.py](../../backend/schemas.py), [database.py](../../backend/database.py), [config.py](../../backend/config.py), [tracking.py](../../backend/tracking.py), [reports.py](../../backend/reports.py).
- Frontend: [App.jsx](../../frontend/src/App.jsx), [Pedidos.jsx](../../frontend/src/pages/Pedidos.jsx), [Dashboard.jsx](../../frontend/src/pages/Dashboard.jsx), [api.js](../../frontend/src/services/api.js), [package.json](../../frontend/package.json).
- Validação: [tests/test_operations.py](../../tests/test_operations.py), [workflow](../../.github/workflows/tests.yml), [validação](../github/VALIDACAO.md), [resultados.json](../github/resultados.json).
- Contexto/segurança: [README](../../README.md), [manifesto demonstrativo](../../data/manifesto-demo.json), [segurança da cópia](../github/SEGURANCA.md).
- Esta análise **não** revisou integralmente cada arquivo visual, CSS, binário, dependência transitiva ou migração de banco.

## 3. Arquitetura e responsabilidades

**[C]** React/Vite organiza as páginas de Estoque, Pedidos, Clientes, Fornecedores, Relatórios, Usuários e Dashboard. A camada de serviço envia HTTP para FastAPI. Schemas Pydantic recebem payloads; SQLAlchemy persiste objetos e relacionamentos em SQLite. [operations.py](../../backend/operations.py) reúne regras do pedido; [tracking.py](../../backend/tracking.py) implementa transportadora **simulada**, com execução em segundo plano limitada à base explicitamente demonstrativa. O dashboard consulta coleções por GET e calcula indicadores no frontend ([Dashboard.jsx](../../frontend/src/pages/Dashboard.jsx)); portanto, a atualização dos indicadores depende de novas consultas, não de um evento em tempo real.

**[C]** Organização de código: separação de operações, modelos, schemas e requisições é positiva; porém [main.py](../../backend/main.py) tem aproximadamente 4.850 linhas, e algumas telas, como [Pedidos.jsx](../../frontend/src/pages/Pedidos.jsx), são extensas. Isso aumenta custo de revisão e de manutenção. **[R]** Refatorar de maneira incremental, com testes de regressão, sem mudanças amplas antes da entrevista.

## 4. Fluxo crítico auditado — criação até indicadores

1. **[C]** A tela de pedidos monta os dados e chama cadastrarPedido em [Pedidos.jsx](../../frontend/src/pages/Pedidos.jsx), via [api.js](../../frontend/src/services/api.js).
2. **[C]** POST /api/pedidos recebe PedidoCreate, valida cadastro/estado do cliente, itens, duplicidade por SKU, saldo disponível e valores em Decimal. [main.py](../../backend/main.py) delega a [operations.py](../../backend/operations.py).
3. **[C]** O pedido inicia pendente, estoque_baixado=false. As reservas são calculadas a partir dos itens de pedidos pendentes/processando; o saldo físico não muda na criação.
4. **[C]** PATCH /api/pedidos/{codigo}/status aplica uma máquina de estados. Ao chegar em enviado, baixa o estoque físico e registra movimentações de saída uma vez; entregue registra a conclusão; devolvido reintegra a quantidade integral se houve baixa. Cancelar antes da expedição apenas libera a reserva.
5. **[C]** A interface relê produtos e pedidos. O Dashboard faz GET de produtos, movimentações e pedidos e atualiza seus indicadores; há recarga periódica de 15 segundos na interface.
6. **[C]** Eventos do pedido e registros de auditoria documentam a passagem pelo fluxo. A entrega/mapa são simulações no ambiente demonstrativo.

**[P]** Uma nova execução ponta a ponta, com navegador, clique real, requisições, screenshots e conferência SQL, permanece pendente. Testes existentes cobrem etapas do fluxo, mas não comprovam a experiência completa de usuário nesta revisão.

## 5. Autenticação, permissões e segurança

- **[C]** Senhas são armazenadas via PBKDF2-HMAC-SHA256 com salt aleatório (210 mil iterações) e comparadas com hmac.compare_digest. Tokens de sessão aleatórios têm apenas o hash SHA-256 persistido e expiram em 12 horas. Logout revoga a sessão. Referência: [main.py](../../backend/main.py).
- **[C]** Middleware HTTP exige Bearer token em rotas /api/ não públicas. Os perfis previstos são administrador, gerente, operador e consulta; o administrador acessa gestão de usuários, operador modifica operações delimitadas, e consulta é anunciado como somente leitura.
- **[C / R: prioridade alta]** A função permissao_endpoint faz **exceção explícita para POST /api/relatorios**, antes de verificar o perfil. Portanto, usuários autenticados de consulta também podem gravar relatórios, em conflito com a descrição de perfil somente leitura. É necessário confirmar a intenção de negócio, corrigir o controle de acesso se necessário e acrescentar teste. Ver [main.py — permissao_endpoint](../../backend/main.py).
- **[C / R: prioridade alta]** A configuração usa ALLOW_DEMO_PASSWORD=true por padrão, e a senha inicial do modo demonstração tem um valor público de fallback. Isso **não significa** que todo usuário consiga entrar sem credenciais, mas exige endurecimento explícito antes de qualquer serviço exposto. Ver [config.py](../../backend/config.py) e [login](../../backend/main.py).
- **[C / R: prioridade média]** O token é guardado em localStorage no frontend. Isso exige prevenção forte a XSS, CSP apropriada e revisão da estratégia de sessão antes de implantação pública. Ver [api.js](../../frontend/src/services/api.js).
- **[C]** CORS é limitado às origens configuradas, CSV tem proteção contra fórmula e cadastro público está desligado por padrão. Isso são controles positivos, não uma certificação de segurança.
- **[P]** Rate limiting de login, política HTTPS, observabilidade, segurança de dependências, autenticação de produção, segregação de tenants e recuperação de incidentes não foram homologados nesta revisão.

## 6. Persistência, validação e tratamento de erros

- **[C]** SQLite com foreign_keys=ON e busy_timeout=5000; operações de escrita recebem transação BEGIN IMMEDIATE; sessão fecha por dependência. Ver [database.py](../../backend/database.py).
- **[C]** Pedido, ItemPedido, Movimentacao, PedidoEvento e Auditoria compõem histórico; ItemPedido mantém SKU/nome históricos mesmo se produto for removido (sem FK obrigatória para Produto). Ver [models.py](../../backend/models.py).
- **[C]** Schemas usam Field para tamanho, quantidade > 0, decimal com precisão e campos de status; regras de negócios em operações retornam HTTP 400, 404 e 409. Ver [schemas.py](../../backend/schemas.py) e [operations.py](../../backend/operations.py).
- **[C]** O backend trata perda de concorrência do banco como 503; a UI formata erros HTTP/Pydantic. Não foi concluída revisão exaustiva de todos os erros inesperados.
- **[C / R: prioridade média]** Comentário no endpoint de criação em [main.py](../../backend/main.py) ainda descreve baixa física imediata, ao contrário da regra vigente de reserva. Corrigir somente a documentação/comentário após revisão para evitar confusão em entrevista.
- **[C / R: prioridade baixa]** Permanecem referências históricas a LogiFlow em nomes, comentários e chaves de ambiente; migração/nomenclatura deve ser planejada sem quebrar compatibilidade.

## 7. Implementado, demonstrativo e não comprovado

| Recurso | Classificação | Base |
| --- | --- | --- |
| Produtos, variantes, estoque, clientes, fornecedores e usuários | Implementado no código | Rotas, modelos e telas |
| Pedidos, reservas, expedição, cancelamento, devolução e auditoria | Implementado no código; testado historicamente | operations.py e tests/test_operations.py |
| Relatórios CSV persistidos | Implementado no código; teste histórico | reports.py e teste de relatório |
| Autenticação por sessão e papéis | Implementado no código; testes parciais | main.py, testes de perfis |
| Rastreamento com etapas e caminhão | **Simulação** | tracking.py e dados demonstrativos |
| Entregas reais, GPS, integração com transportadora | **Não implementado/comprovado** | README e páginas do projeto |
| Frontend build e testes backend | Evidência histórica | docs/github/VALIDACAO.md e Actions |
| Instalação limpa, E2E em navegador, segurança de produção | **Pendente** | sem prova nesta auditoria |
| Ganhos financeiros, tempo economizado, usuários reais | **Não alegar** | nenhuma medição operacional |

## 8. Riscos e ações recomendadas

1. **Alta / baixo-médio esforço:** validar e restringir POST /api/relatorios para perfil adequado; criar teste para consulta.
2. **Alta / médio esforço:** criar política explícita de configuração segura, sem senha demo por padrão em ambientes públicos; demonstrar com dados fictícios apenas.
3. **Média / baixo esforço:** corrigir documentação de estoque e consolidar fluxo, limites e testes em estudo de caso.
4. **Média / médio esforço:** adicionar fluxo E2E automatizado com fixture descartável e evidência de execução real.
5. **Média / médio-alto esforço:** planejar demo online isolada, acessível por link, sem acesso a banco real nem serviços externos.
6. **Baixa / esforço progressivo:** modularizar main.py e telas grandes com regressão.

## 9. Limites da auditoria e próximos passos

Não foi executado o servidor nesta sessão: o ambiente de trabalho não recebeu uma cópia integral do código e não tem acesso direto de rede para clonar. A inspeção usou o conector GitHub; execução de testes de aplicação deve ocorrer no runner isolado do CI ou em ambiente local preparado por outra etapa. A confirmação do CI após a publicação desta branch será registrada separadamente conforme o estado observado.

Use os documentos [ESTUDO_DE_CASO.md](ESTUDO_DE_CASO.md), [ARQUITETURA.md](ARQUITETURA.md), [EVIDENCIAS.md](EVIDENCIAS.md), [ENTREVISTA_TECNICA.md](ENTREVISTA_TECNICA.md), [ROTEIRO_DEMO.md](ROTEIRO_DEMO.md) e [PLANO_DE_MELHORIAS.md](PLANO_DE_MELHORIAS.md) em conjunto.


## Atualização após a auditoria estática inicial

Novas correções de autorização e configuração foram aplicadas em branch de revisão. [GitHub Actions #42497341800](https://github.com/LeandroAugFerreira/nexolog/actions/runs/42497341800) executou 24 testes backend, 14 testes JS e fluxo real Playwright Chromium com sucesso. Ver [E2E_BROWSER.md](E2E_BROWSER.md). Continua sem implantação web do backend; essa execução não comprova segurança de produção.
