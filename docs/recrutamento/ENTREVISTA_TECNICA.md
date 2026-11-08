# Preparação para entrevista técnica — NexoLog

**Escopo:** 15 perguntas prováveis para Desenvolvedor Full Stack Júnior/Python. Respostas **baseadas na leitura do código**; não devem ser decoradas como experiências pessoais. Estude o funcionamento, verifique o código e pratique em instalação segura.

## 1. Qual problema o NexoLog resolve?
**Resposta técnica:** conecta pedidos, produtos, estoque e indicadores. Um pedido cria reserva, a expedição gera movimentação de saída e os eventos dão visibilidade do processo. [operations.py](../../backend/operations.py), [Dashboard.jsx](../../frontend/src/pages/Dashboard.jsx).
**Estudar:** necessidades operacionais e diferença entre valor de negócio e ganho medido.

## 2. Como você explica a arquitetura em uma lousa?
**Resposta:** React faz interface, api.js centraliza requisições, FastAPI expõe rotas, Pydantic valida payloads, operações executam regras, SQLAlchemy persiste em SQLite. [ARQUITETURA.md](ARQUITETURA.md).
**Estudar:** fluxo HTTP completo, código de erro e divisão de responsabilidades.

## 3. Por que não reduzir o estoque quando o pedido é criado?
**Resposta:** pedido pendente/processando reserva unidades, mas a baixa física ocorre em enviado. Assim saldo físico e disponível refletem fases distintas. [operations.py](../../backend/operations.py).
**Estudar:** invariantes e reconciliação de saldos.

## 4. Como são impedidas duas reservas concorrentes das mesmas unidades?
**Resposta:** em escritas, a dependência de banco inicia BEGIN IMMEDIATE no SQLite; operações calculam disponibilidade descontando reservas. O teste concorrente espera uma criação 201 e outra 409 ao disputar o mesmo saldo. [database.py](../../backend/database.py), [test_operations.py](../../tests/test_operations.py).
**Estudar:** lock de SQLite, isolamento, limites dessa abordagem em múltiplos servidores.

## 5. Como o ciclo de vida do pedido impede estados inválidos?
**Resposta:** dicionário TRANSITIONS determina arestas válidas entre pendente, processando, enviado, entregue, cancelado e devolvido; transição inválida gera 409. [operations.py](../../backend/operations.py).
**Estudar:** máquina de estados e casos de borda.

## 6. Como o sistema evita baixa ou estorno duplicados?
**Resposta:** estoque_baixado sinaliza a baixa já efetuada; atualizar_pedido usa esse campo para não repetir saída ou entrada em transições idempotentes. [operations.py](../../backend/operations.py).
**Estudar:** idempotência de status versus idempotência de criação de pedido.

## 7. Como o backend valida valores e dados recebidos?
**Resposta:** PedidoCreate e ItemPedidoCreate usam Field do Pydantic para tamanho, item obrigatório, quantidade positiva e Decimal; operations.py valida existência/estado do cliente, duplicidade SKU, saldo e preço positivo. [schemas.py](../../backend/schemas.py), [operations.py](../../backend/operations.py).
**Estudar:** diferença entre validação de estrutura e regra de negócio, códigos 422/409/404.

## 8. Por que usar Decimal em cálculos financeiros?
**Resposta:** preços e subtotais são Decimal, quantizados para duas casas com ROUND_HALF_UP, evitando os problemas típicos de ponto flutuante binário. [operations.py](../../backend/operations.py).
**Estudar:** arredondamento, centavos, impostos apenas simulados, reconciliação.

## 9. Como funciona autenticação?
**Resposta:** senha recebe PBKDF2-HMAC-SHA256 e salt; no login é emitido token aleatório, cujo hash fica na tabela de sessões. Middleware valida token, prazo e usuário ativo; logout marca revogação. [main.py](../../backend/main.py), [models.py](../../backend/models.py).
**Estudar:** hash versus criptografia, sessão versus JWT, ataques de força bruta, custo de PBKDF2.

## 10. Como funcionam os níveis de permissão?
**Resposta:** permissao_endpoint aplica regras por caminho, método e perfil. Administrador tem acesso total; gerente não gerencia usuários; operador altera operações permitidas; consulta é descrito como leitura. **Ressalva:** há exceção explícita em POST /api/relatorios para qualquer autenticado, a revisar. [main.py](../../backend/main.py).
**Estudar:** princípio de menor privilégio, testes negativos e problemas de regras globais por prefixo.

## 11. Como são modelados os dados?
**Resposta:** Pedido tem itens, eventos e rastreamento simulado, Produto tem saldo; Movimentacao registra alterações, Auditoria registra ações, CredencialUsuario e SessaoUsuario controlam acesso. ItemPedido preserva SKU e nome históricos mesmo após remoção de Produto. [models.py](../../backend/models.py).
**Estudar:** relações, FKs, snapshots históricos e integridade.

## 12. Como os indicadores do dashboard são atualizados?
**Resposta:** Dashboard.jsx consulta produtos, movimentações e pedidos com Promise.all e calcula indicadores no cliente. Faz nova leitura periodicamente (15 segundos quando a página está visível) e por recarregamento; não é streaming via WebSocket. [Dashboard.jsx](../../frontend/src/pages/Dashboard.jsx), [api.js](../../frontend/src/services/api.js).
**Estudar:** consistência eventual, cache, polling e alternativas para escala.

## 13. O rastreamento é uma integração logística real?
**Resposta:** não. tracking.py calcula estados/tempo fictícios, grava eventos demonstrativos e pode avançar pedidos em banco marcado como demo. Não usa GPS ou API real de transportadora. [tracking.py](../../backend/tracking.py).
**Estudar:** como substituir simulação por adapter externo sem comprometer integridade.

## 14. Como você garante qualidade e lida com regressões?
**Resposta:** tests/test_operations.py contém testes de HTTP com banco temporário, contemplando reserva, conciliação, concorrência, autenticação, backup e migração; o workflow executa unittest e build. O registro anterior reporta 22 aprovados, mas esta auditoria não executou o app localmente. [test_operations.py](../../tests/test_operations.py), [workflow](../../.github/workflows/tests.yml), [evidências](EVIDENCIAS.md).
**Estudar:** testes unitários, integração, E2E, fixtures isoladas, evidência de CI.

## 15. O que você melhoraria primeiro se colocasse o NexoLog na internet?
**Resposta:** não publicaria a versão demo tal como está. Primeiro revisaria autorização de relatórios, modo demo e senhas; criaria ambiente isolado com contas de baixo privilégio, HTTPS, rate limit, CSP e logs; validaria migrações, carga e E2E. [AUDITORIA.md](AUDITORIA.md), [PLANO_DE_MELHORIAS.md](PLANO_DE_MELHORIAS.md).
**Estudar:** threat modeling, defesa em profundidade, isolamento de dados e operações.

---

## Treino prático para a entrevista

1. Explique as perguntas 2, 3, 4 e 9 sem ler o roteiro.
2. Abra as funções citadas e mostre em qual linha está a regra.
3. Desenhe o fluxo de um pedido e explique HTTP 201, 409 e 401.
4. Responda como empregou ferramentas de IA e o que verificou pessoalmente, com transparência.
5. Não diga “implantei para clientes reais”, “economizei X horas” ou “rodei todos os testes agora” sem evidência verificável.

**Pergunta para treinar em voz alta:** “Se eu trouxer dois pedidos de 70 unidades para um saldo de 100, o que acontece no banco e por quê?” A resposta correta deve mencionar reserva, transação e concorrência, mas também limitações do SQLite.
