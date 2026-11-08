# Roteiro de demonstração — NexoLog em 3 minutos

**Objetivo:** apresentar o problema, a experiência full stack e uma regra de negócio verificável para um entrevistador técnico. **Não é prova de execução nesta auditoria.** Use apenas instalação isolada, base fictícia e versão identificada. Não executar contra dados reais.

## Pré-condições — antes da entrevista

- Execute a aplicação conforme o [README](../../README.md), em cópia local nova e descartável. Confirme que está usando a base demonstrativa, sem conexão externa e sem dados privados.
- Preferir o acesso de demonstração publicado na [página do NexoLog](https://leandroaugferreira.github.io/nexolog.html), seguindo o manual; não inserir credenciais reais em gravação.
- Tenha previamente um cliente ativo, um produto com saldo físico conhecido, acesso autorizado para criar pedidos e atualização visual do dashboard.
- Durante a sessão, não revelar token de autenticação, cookies, senhas, caminhos pessoais nem conteúdo sensível.
- Abrir as telas de **Pedidos**, **Estoque** e **Dashboard** e manter o código de [operations.py](../../backend/operations.py) em aba separada, se o entrevistador pedir detalhes.

## 00:00–00:25 — Problema e proposta

**Fala sugerida:** “O NexoLog reúne pedidos, estoque e indicadores para que a operação acompanhe o que está fisicamente disponível e o que já está comprometido. É um projeto demonstrativo com dados fictícios, não uma implantação comercial.”

**Tela:** Dashboard e visão geral da aplicação.
**Evidência visível:** navegação, módulos e indicadores.

## 00:25–01:10 — Criar pedido e reservar

**Ação:** abrir Estoque, anotar saldo físico e disponível de um produto da fixture; em Pedidos, criar pedido com cliente ativo, destino e um item dentro do saldo disponível.

**Fala sugerida:** “Na criação, o backend valida o cliente e o estoque, calcula o total e cria uma reserva. Isso não é ainda uma saída física.”

**Comprovação:** voltar a Estoque e observar estoque_atual inalterado, estoque_reservado aumentado e estoque_disponivel reduzido. Mostrar status pendente no pedido.

**Código:** [operations.py, criar_pedido](../../backend/operations.py).

## 01:10–01:55 — Expedição e regras

**Ação:** levar pedido de pendente para processando e depois enviado, conforme controles da interface. Reabrir o produto.

**Fala sugerida:** “Na expedição, a operação baixa fisicamente o estoque uma única vez, cria movimentação de saída e registra evento. Uma transição fora da máquina de estados é rejeitada.”

**Comprovação:** status enviado, reserva liberada e estoque físico reduzido; localizar movimentação/evento correspondente. Se a interface não mostrar esses dados em uma única tela, consultar a API /api/pedidos/{codigo} e /api/movimentacoes pelo fluxo autorizado, sem expor Bearer token na tela.

**Código:** [operations.py, atualizar_pedido](../../backend/operations.py).

## 01:55–02:25 — Indicadores e leitura

**Ação:** abrir Dashboard; usar recarga manual ou aguardar a próxima consulta periódica (a interface prevê atualização em até 15 segundos quando visível).

**Fala sugerida:** “Os componentes consultam a API e recalculam indicadores a partir de pedidos, produtos e movimentações. Não é streaming: os dados são obtidos por requisição.”

**Código:** [Dashboard.jsx](../../frontend/src/pages/Dashboard.jsx) e [api.js](../../frontend/src/services/api.js).

## 02:25–02:50 — Qualidade, limitações e arquitetura

**Fala sugerida:** “O backend usa FastAPI, Pydantic, SQLAlchemy e SQLite; no frontend, React. Existe uma suíte de integração que testa cenários de reserva, estoque e concorrência, com resultado histórico de 22 aprovações. O rastreamento exibido é simulado.”

**Tela:** desenho em [ARQUITETURA.md](ARQUITETURA.md) e evidências em [EVIDENCIAS.md](EVIDENCIAS.md). Não afirmar que novos testes foram executados se não houver novo log.

## 02:50–03:00 — Encerramento

**Fala sugerida:** “A maior decisão de negócio foi separar reserva da baixa física. Para evoluir, priorizaria testes E2E e o endurecimento de permissões antes de qualquer acesso público.”

**Fecho:** convidar entrevistador a perguntar sobre concorrência, banco, autenticação e trade-offs.

## Contingências

- **Sem Windows ou download bloqueado:** use o vídeo/capturas do projeto, código e testes documentados, dizendo explicitamente que é uma apresentação gravada, não live demo.
- **Sem saldo disponível:** usar produto fictício da base de teste ou restaurar fixture isolada; não forçar alteração de banco de terceiros.
- **Pedido não atualiza:** registrar falha, verificar resposta HTTP/console sem expor tokens. Não falsificar vídeo.
- **Sem internet:** usar cópia local e Markdown offline.
- **Rastreamento automático:** sempre explicar que o caminhão, etapas e entregas são **simulados**, e não uma integração externa.

## Evidências a preservar após ensaio real

Anotar commit, sistema operacional, build, conta demo não sensível, quantidade antes/depois, pedido fictício, resposta HTTP, data da captura, resultado de teste e limites observados. Não incluir números fictícios como se fossem resultados de cliente real.

## Respostas rápidas possíveis

- **“Por que não baixar na criação?”** Porque reserva e expedição são eventos distintos.
- **“E dois pedidos ao mesmo tempo?”** BEGIN IMMEDIATE e validação de disponibilidade; ver teste concorrente.
- **“Como garante que não baixou duas vezes?”** Campo estoque_baixado e máquina de estados.
- **“Qual seria a primeira melhoria?”** Corrigir/verificar exceção de escrita do perfil Consulta em relatórios, depois preparar demo isolada e E2E.

[Acompanhamento técnico](AUDITORIA.md) · [Perguntas](ENTREVISTA_TECNICA.md) · [Plano](PLANO_DE_MELHORIAS.md).


## Alternativa para recrutadores sem instalação

Abrir [o tour interativo](https://leandroaugferreira.github.io/nexolog-demo.html) e demonstrar quatro etapas fictícias (criar, processar, expedir, entregar). Dizer explicitamente que é **uma simulação sem backend**. Em seguida, compartilhar [a execução real de testes](https://github.com/LeandroAugFerreira/nexolog/actions/runs/42497737703) e o código backend/operations.py para comprovar o fluxo técnico; não confundir tour com serviço em produção.
