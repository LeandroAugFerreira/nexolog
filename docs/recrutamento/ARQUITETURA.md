# Arquitetura do NexoLog — revisão estática

**Origem:** código do repositório auditado em 08/11/2026, base main 24d00d84ed5c64c1a8dc89e90810f941dbab0728. **Diagrama lógico, não infraestrutura de produção.**

## Visão geral

~~~mermaid
flowchart LR
    U[Usuário no navegador] --> UI[React / React Router / Vite]
    UI --> S[api.js: fetch + Bearer token]
    S --> API[FastAPI backend/main.py]
    API --> MW[Middleware de sessão / perfil]
    MW --> SCH[Pydantic schemas.py]
    SCH --> OP[Operações de pedido / estoque]
    OP --> ORM[SQLAlchemy ORM]
    MW --> REP[Relatórios e exportação CSV]
    REP --> ORM
    ORM --> DB[(SQLite local)]
    MW --> TR[Tracking simulado]
    TR --> ORM
    DB --> API
    API --> S
    S --> UI
~~~

A leitura é simplificada: middleware atua antes dos endpoints FastAPI, e a validação Pydantic ocorre ao interpretar requisições nas rotas. O diagrama não garante que todos os módulos da UI passem por operations.py; várias rotas estão no arquivo main.py.

## Fluxo auditado de pedidos

~~~mermaid
sequenceDiagram
    autonumber
    participant U as Operador
    participant R as React Pedidos.jsx
    participant API as FastAPI
    participant O as operations.py
    participant DB as SQLite
    participant D as React Dashboard.jsx

    U->>R: Cria pedido com cliente, destino e itens
    R->>API: POST /api/pedidos (Bearer + JSON)
    API->>O: criar_pedido(...)
    O->>DB: Valida cliente, SKUs e reservas existentes
    O->>DB: Grava pedido pendente, itens, evento e auditoria
    DB-->>API: commit do pedido e reserva lógica
    API-->>R: 201 + pedido
    R->>API: GET /api/produtos
    API-->>R: Saldos físicos/reservados/disponíveis

    U->>R: Marca pedido como enviado
    R->>API: PATCH /api/pedidos/{codigo}/status
    API->>O: atualizar_pedido(status=enviado)
    O->>DB: Baixa física + movimentação saída + evento
    DB-->>API: commit
    API-->>R: Pedido atualizado
    D->>API: GET produtos, movimentações, pedidos
    API-->>D: Listas atualizadas
    D-->>U: Indicadores recalculados
~~~

## Entidades essenciais

~~~mermaid
erDiagram
    PEDIDO ||--o{ ITEM_PEDIDO : contem
    PEDIDO ||--o{ PEDIDO_EVENTO : possui
    PEDIDO ||--o| RASTREAMENTO_SIMULADO : demonstra
    PRODUTO ||--o{ MOVIMENTACAO : historico_por_sku
    USUARIO ||--o{ SESSAO_USUARIO : autentica
    USUARIO ||--o| CREDENCIAL_USUARIO : possui
~~~

Observação: a ligação Produto–Movimentacao no diagrama é **associação lógica por SKU**, não garantia de FK em todo o modelo. Os itens do pedido mantêm produto_sku e produto_nome históricos sem FK obrigatória para Produto; confirme as constraints ao discutir exclusão.

## Estados implementados

~~~mermaid
stateDiagram-v2
    [*] --> pendente
    pendente --> processando
    pendente --> enviado
    pendente --> cancelado
    processando --> enviado
    processando --> cancelado
    enviado --> entregue
    enviado --> devolvido
    entregue --> devolvido
~~~

- Pendente e processando reservam saldo se estoque_baixado for falso.
- Ao passar para enviado, a saída física acontece uma única vez.
- Cancelamento antes da saída solta a reserva; casos de legado com baixa anterior têm lógica de estorno.
- Devolução reintegra a quantidade integral, sem processo de devolução parcial na regra observada.
- Rotas de status recusam transições não previstas com HTTP 409.

## Persistência e concorrência

[backend/database.py](../../backend/database.py) configura SQLite com chaves estrangeiras habilitadas, busy_timeout e BEGIN IMMEDIATE em métodos de escrita. [backend/operations.py](../../backend/operations.py) calcula reservas com somatório dos itens de pedidos pendentes/processando e só altera saldo físico na expedição. [backend/models.py](../../backend/models.py) define entidades, relacionamentos, timestamps e constraints.

Limitação: o desenho é de aplicação local SQLite, não prova isolamento/distribuição em vários servidores ou comportamento sob alta carga.

## Autenticação e autorização

- PBKDF2-HMAC-SHA256 com salt para credenciais.
- Token de sessão aleatório; apenas hash do token é armazenado.
- Middleware confere Bearer, vencimento, revogação e usuário ativo.
- Papéis administrador, gerente, operador e consulta definem acesso aos endpoints.
- **Atenção:** exceção em POST /api/relatorios autoriza escrita a qualquer usuário autenticado, inclusive consulta. Rever política antes de publicação.

## Onde estão as implementações

| Componente | Arquivo |
| --- | --- |
| Endpoints, autenticação, auditoria | [backend/main.py](../../backend/main.py) |
| Estado do pedido, reserva e baixa | [backend/operations.py](../../backend/operations.py) |
| Schemas de entrada/saída | [backend/schemas.py](../../backend/schemas.py) |
| Models e relacionamento | [backend/models.py](../../backend/models.py) |
| Sessão SQLite e transação | [backend/database.py](../../backend/database.py) |
| Simulação de rastreamento | [backend/tracking.py](../../backend/tracking.py) |
| Relatórios CSV | [backend/reports.py](../../backend/reports.py) |
| Tela de pedidos | [frontend/src/pages/Pedidos.jsx](../../frontend/src/pages/Pedidos.jsx) |
| Indicadores | [frontend/src/pages/Dashboard.jsx](../../frontend/src/pages/Dashboard.jsx) |
| Cliente HTTP | [frontend/src/services/api.js](../../frontend/src/services/api.js) |

## Não representado

Hospedagem pública, cluster, proxy reverso, TLS, filas de produção, GPS, transportadoras reais e infraestrutura multiusuário pública não estão demonstrados no repositório. Estes elementos não devem ser desenhados como se já estivessem operacionais.
