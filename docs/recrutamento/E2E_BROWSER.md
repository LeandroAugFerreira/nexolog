# Teste com navegador real — NexoLog

Data da validação: 08/11/2026.
Execução: [GitHub Actions #42497737703](https://github.com/LeandroAugFerreira/nexolog/actions/runs/42497737703).
Commit validado: a81d690a715d67dc4071e8b7ab86aa270c3328c8.

## Resultados efetivamente observados

- Backend: **24 testes unittest aprovados**.
- Frontend: **14 testes JavaScript aprovados**, build Vite/React aprovado.
- Browser E2E: **aprovado no Chromium**; login e criação de pedido feitos pela interface React, verificação de saldos via API FastAPI real, mudança de status por cliques nas ações do Kanban e visualização final do pedido no Dashboard real.

**Precisão importante:** nesta versão, o navegador clicou nos menus de ações de pedido do Kanban e escolheu os estados processando → enviado → entregue. As verificações de saldo, status persistido e movimentação foram feitas por requisições à API real. Trata-se de um E2E de um fluxo crítico, não da cobertura de todas as telas ou operações.

## Cenário sintético verificado

| Fase | Estoque físico | Reserva | Disponível |
| --- | ---: | ---: | ---: |
| Inicial | 100 | 0 | 100 |
| Pedido criado (30 unidades) | 100 | 30 | 70 |
| Enviado | 70 | 0 | 70 |
| Entregue | 70 | 0 | 70 |

Também é conferida a existência de exatamente uma movimentação de saída e a exibição do pedido no dashboard.

## Isolamento e segurança

- O job roda no runner Ubuntu 24.04, Python 3.13, Node 22, Chromium e Playwright 1.56.0.
- O script cria SQLite em diretório temporário, sem utilizar a base demonstrativa distribuída ou qualquer base operacional.
- Cliente, produto e usuário são fictícios; senha de QA é aleatória, não registrada em log.
- Backend e Vite usam apenas o endereço de loopback 127.0.0.1, não abrem porta pública.
- Modo demo, senha demo, cadastro público e worker de rastreamento são desabilitados nesse teste.
- O workflow guarda por sete dias uma captura sintética do dashboard em artifact do GitHub Actions.
- O script encerra serviços e elimina a base ao sair.

## Reproduzir somente em ambiente isolado

No repositório, revisar o script scripts/browser_e2e.py antes de executar. Após instalar Python 3.13, Node 22 e dependências em uma cópia descartável:

~~~bash
python -m pip install -r requirements-dev.txt
python -m pip install playwright==1.56.0
python -m playwright install chromium
npm --prefix frontend ci
python scripts/browser_e2e.py
~~~

No GitHub, a automação está em .github/workflows/tests.yml. Em Linux, podem ser necessárias bibliotecas do navegador. Não conectar dados ou credenciais reais.

## Demonstração pública para recrutadores

[Tour interativo didático](https://leandroaugferreira.github.io/nexolog-demo.html).

A página pública é uma **simulação estática** e não executa a API real ou um backend hospedado. Use-a para apresentação rápida; use o CI, as evidências e o código-fonte para comprovar engenharia.

## Não coberto

Implantação de API segura na internet, testes de carga, auditoria de segurança de dependências, pentest, integração real com transportadora, todos os filtros, operações de lote e demais fluxos do Kanban e execução recente do instalador Windows.
