# NexoLog — estudo de caso para recrutamento

**Perfil:** Desenvolvedor Full Stack Júnior / Desenvolvedor Python (backend).
**Natureza:** projeto autoral demonstrativo, com base fictícia, não implantação comercial.
**Ponto de partida auditado:** main, commit 24d00d84ed5c64c1a8dc89e90810f941dbab0728, em 08/11/2026.

## Apresentação em 30 segundos

O NexoLog é uma aplicação de gestão logística que conecta produtos, clientes, pedidos, reservas de estoque, expedição, rastreamento *simulado* e indicadores. A principal preocupação de engenharia é evitar inconsistências: criar um pedido não pode consumir fisicamente o estoque antes da expedição, dois pedidos simultâneos não podem reservar as mesmas unidades e mudanças de status devem respeitar uma sequência válida.

## Problema de negócio

Quando estoque, pedidos e expedição são controlados em ferramentas separadas, gestores podem perder a visibilidade do saldo realmente disponível, da etapa do pedido e do impacto da operação nos indicadores. O protótipo procura tornar esse fluxo integrado e auditável.

## Usuários e necessidades

- **Administrador:** acessa cadastros, usuários, operações e auditoria.
- **Gerente:** acompanha indicadores e opera o sistema, exceto gestão de usuários.
- **Operador:** movimenta produtos, estoque e pedidos nos limites do perfil.
- **Consulta:** visualiza os dados; existe uma exceção de escrita em relatórios a corrigir/confirmar, registrada na auditoria.

Esses papéis são regras implementadas em [backend/main.py](../../backend/main.py), não uma validação de políticas de acesso em empresa real.

## Objetivos e requisitos implementados no código

1. Cadastrar produtos e variantes com informação de saldos, preços, categorias e fornecedor.
2. Cadastrar clientes, fornecedores, usuários e manter histórico.
3. Criar pedido com cliente ativo, destino e ao menos um item; verificar estoque disponível e rejeitar SKU duplicado.
4. Reservar unidades na criação sem reduzir fisicamente o estoque.
5. Processar, expedir, entregar, cancelar e devolver respeitando transições autorizadas.
6. Registrar movimentações de estoque e eventos/auditoria; impedir baixa dupla.
7. Disponibilizar indicadores e relatórios derivados das operações.
8. Oferecer ambiente demonstrativo com dados fictícios e simulação explícita de entrega.

## Solução técnica

| Camada | Implementação observada | Evidência |
| --- | --- | --- |
| Interface | React, Vite, React Router, Recharts | [frontend/package.json](../../frontend/package.json) |
| Serviços HTTP | api.js centraliza Bearer token, erros e endpoints | [frontend/src/services/api.js](../../frontend/src/services/api.js) |
| API | FastAPI com middleware de autenticação | [backend/main.py](../../backend/main.py) |
| Entrada e saída | Pydantic, validação de tamanho, quantidade e precisão | [backend/schemas.py](../../backend/schemas.py) |
| Regras | Operations com reservas, estados e movimentações | [backend/operations.py](../../backend/operations.py) |
| Banco | SQLAlchemy + SQLite; BEGIN IMMEDIATE para escritas | [backend/database.py](../../backend/database.py) |
| Histórico | PedidoEvento, Movimentacao, Auditoria, RelatorioGerado | [backend/models.py](../../backend/models.py) |
| Demonstração | Rastreamento persistente em banco marcado como demo | [backend/tracking.py](../../backend/tracking.py) |

## Regra de negócio central: reserva ≠ baixa física

Exemplo didático, não resultado de teste desta auditoria: um produto tem **100** unidades físicas. Um pedido de **30** unidades válidas cria reserva de 30; saldo físico continua 100 e disponível passa a 70. Ao expedir, o físico passa a 70 e a reserva deixa de ser considerada; disponível permanece 70. Ao registrar devolução integral, físico volta a 100. O caso é coberto pelo teste [test_reserva_expedicao_entrega_sem_baixa_duplicada](../../tests/test_operations.py), que consta entre as verificações históricas.

**Código-fonte de referência:** [criar_pedido e atualizar_pedido](../../backend/operations.py).

## Decisões técnicas e justificativas possíveis

- **SQLite para demo local:** simplifica execução de avaliadores, sem infraestrutura remota. O uso de BEGIN IMMEDIATE serializa escritas na conexão SQLite, evitando disputa simples entre reservas; não autoriza afirmar escalabilidade horizontal.
- **Decimal para valores monetários:** reduz riscos de erro de representação binária e aplica arredondamento explícito.
- **Eventos e auditoria:** preservam a evolução do pedido independentemente da tela.
- **React e camada de API centralizada:** deixam a experiência de uso separada das regras e dos dados.
- **Rastreamento separado e rotulado como simulado:** permite demonstrar o fluxo sem afirmar integração de transporte real.

As justificativas são uma interpretação técnica do código. O autor deve confirmar quais decisões foram deliberadas e como foram tomadas antes de usá-las como relato autobiográfico.

## Desafios técnicos que podem ser demonstrados

1. Impedir que duas reservas simultâneas consumam a mesma disponibilidade (teste concorrente existente).
2. Diferenciar o saldo reservado do físico e impedir baixa dupla.
3. Bloquear mudanças inválidas de estado e impedir estorno parcial quando item histórico foi excluído.
4. Manter legados íntegros em migrações e nos backups.
5. Atualizar indicadores sem confundir rastreamento fictício com rastreamento real.

**Importante:** são problemas efetivamente tratados pelo código/testes, não afirmação de que o autor os resolveu pessoalmente sem apoio ou de que ocorreram em produção.

## Como a implementação pode ser avaliada

- Usar dados fictícios em uma cópia nova e isolada.
- Criar um pedido válido e mostrar os saldos antes/depois.
- Tentar uma reserva acima da disponibilidade (esperado: 409).
- Processar e expedir; mostrar a única saída física.
- Entregar e consultar o histórico; mostrar indicadores no dashboard.
- Comprovar a saída de logs e testes, sempre com a data da execução.

A sequência exata e os cuidados estão em [ROTEIRO_DEMO.md](ROTEIRO_DEMO.md). Os resultados efetivamente comprovados estão em [EVIDENCIAS.md](EVIDENCIAS.md).

## Limitações e transparência

- Simulação de transporte; **não há rastreamento GPS nem integração comprovada com transportadora real**.
- Não há resultados de clientes em produção, tempo economizado ou ROI comprovado.
- Executável Windows e fluxo local publicados, mas demo web pública não está homologada.
- Não há nesta auditoria um teste E2E novo em navegador.
- Exceção de escrita para relatório por perfil consulta e políticas de autenticação demo devem ser revisadas antes de qualquer implantação.
- Parte dos comentários e nomes históricos ainda menciona LogiFlow.

## Aprendizados e evolução — roteiro de reflexão para o autor

Antes de entrevista, registrar com exemplos reais e em primeira pessoa:
- Qual bug de concorrência ou integridade exigiu mais investigação? Como foi encontrado?
- Por que escolheste SQLite para demo e quais seriam limitações em múltiplas instâncias?
- Que partes foram implementadas com assistência de IA e como o código foi verificado?
- Que teste falhou antes de uma correção e qual evidência mostra a evolução?
- Se tivesse mais tempo, qual melhoria entregaria primeiro e por quê?

Não preencher essas respostas com histórias inventadas. Transformá-las em exemplos próprios após revisão dos commits e experiência de desenvolvimento.

## Referências

[Repositório](https://github.com/LeandroAugFerreira/nexolog) · [Página do projeto](https://leandroaugferreira.github.io/nexolog.html) · [Auditoria detalhada](AUDITORIA.md) · [Plano priorizado](PLANO_DE_MELHORIAS.md).
