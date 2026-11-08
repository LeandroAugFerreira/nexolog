# Plano de melhorias priorizado — NexoLog para recrutamento

**Data:** 08/11/2026. **Status atualizado:** correções P0, documentação e teste E2E integrados à main pelo [Pull Request #1](https://github.com/LeandroAugFerreira/nexolog/pull/1). Demais itens de produção permanecem propostos. Não houve deploy público de backend. Ver [CORRECOES_P0.md](CORRECOES_P0.md) e [CI](https://github.com/LeandroAugFerreira/nexolog/actions/runs/42490711781).

## Critérios de prioridade

A prioridade considera visibilidade para recrutadores, impacto de segurança/integridade, esforço estimado e risco. Esforços são **faixas relativas** (baixo/médio/alto), não estimativas de prazo ou promessa de entrega.

| Ordem | Proposta | Benefício | Esforço | Risco de implementação | Evidência / aceite |
| --- | --- | --- | --- | --- | --- |
| P0 | Rever POST /api/relatorios para perfil Consulta e escrever teste negativo | Segurança e princípio de menor privilégio | Baixo | Médio: compatibilidade de exportações | Consulta recebe 403 se escrita não for autorizada; administrador/operador conforme política aprovada |
| P0 | Política de demo segura antes de disponibilização pública | Evitar senhas demo e contas privilegiadas expostas | Médio | Alto se alterar acessos existentes | Configuração separada sem credenciais reais, demo com escopo mínimo, revisão de rotas |
| P1 | Teste E2E do pedido até indicador, com fixture temporária | Prova demonstrável e reprodução do fluxo | Médio | Médio (flakiness/UI) | Teste automatizado executado em CI, screenshots e registro SHA |
| P1 | Corrigir comentários defasados sobre baixa na criação e marcas históricas | Confiança na documentação | Baixo | Baixo | Documentos aderentes a operations.py sem quebrar compatibilidade |
| P1 | Documentar limites da arquitetura SQLite e concorrência | Conversa técnica mais madura | Baixo | Baixo | Explicação e testes concorrentes verificados |
| P2 | Separar módulos de backend/main.py e telas volumosas por domínio | Legibilidade e manutenção | Alto | Médio/alto | Refatoração progressiva, suíte completa passando, diff pequeno por etapa |
| P2 | Ampliar CI (lint, testes de JS e análise de dependências) | Evidência contínua de qualidade | Médio | Médio: novos checks podem expor dívidas técnicas | Jobs reprodutíveis, sem segredos, em ambientes descartáveis |
| P2 | Planejar demonstração online interativa isolada | Avaliação sem Windows | Médio/alto | Alto se expuser backend | Protótipo seguro, dados fictícios, sem acesso privilegiado |
| P3 | Melhorar observabilidade, relatórios de erros e acessibilidade | Manutenção e experiência | Médio | Médio | Logs sanitizados, testes de navegação por teclado e feedbacks consistentes |

## Caminho recomendado de demonstração no navegador

### Opção A — segura e rápida para triagem

Criar **uma visita guiada interativa e estática** (GitHub Pages ou outro static hosting) com capturas reais já existentes, três etapas de fluxo e arquivos JSON explicitamente sintéticos, sem conexão ao backend verdadeiro.

- Vantagem: abre em navegador móvel, sem login, banco ou serviço com capacidade de alterar registros.
- Desvantagem: não comprova que API real está executando; rotular como “tour interativo / demonstração de interface”, nunca “sistema full stack online”.
- Dever de cuidado: revisar imagens e arquivos para eliminar dados privados, tokens, links perigosos e credenciais. Manter material em branch de preview até aprovação.

### Opção B — aplicação full stack acessível via URL, somente após gates

Preparar ambiente efêmero **separado** da máquina de trabalho, com dataset regenerável, banco descartável, nenhuma conexão com operação real e credenciais demo restritas. Antes de abrir para público:
1. Revisar a autorização de rotas e os privilégios da conta demonstrativa.
2. Desligar cadastro público, senhas default, endpoints sensíveis e rotinas de entrega simulada não necessárias à avaliação.
3. Definir HTTPS, política de CORS e CSP, rate limiting, limite de upload e recursos, proteção de sessões e observabilidade sanitizada.
4. Isolar dados, rede, conta e API; impor limpeza automática entre sessões e sem saída para serviços externos.
5. Passar testes de segurança, API, integração e E2E em infraestrutura provisória, com acesso inicial privado.
6. Submeter URL, custos e riscos para aprovação explícita do autor antes de divulgação pública.

**Nenhuma dessas opções foi implantada nesta tarefa.** O site do portfólio principal permanece intocado.

## Testes sugeridos — prioridades

**Autorização**
- Consulta: GET relatórios deve funcionar conforme política; POST relatório deve responder 403 se perfil somente leitura.
- Operador, gerente, administrador: conferir matriz aprovada e negação de /api/usuarios para não administradores.

**Operação**
- Pedido com 100 físicas, 30 reservadas: validar 100/30/70, depois envio 70/0/70.
- Concorrência: dois pedidos de 70 para 100 físicas; somente um deve obter criação bem-sucedida.
- Não duplicar baixa em repetição do status enviado; devolução integral uma única vez.
- Dados inválidos: SKU inexistente, cliente inativo, quantidade maior que saldo, pedido com item duplicado.
- Auditoria e relatórios seguros: entradas não confiáveis em CSV devem ser tratadas.

**UI / experiência**
- Teste Playwright ou equivalente com API/base de teste: login, cadastro de pedido, mudança de estado, consulta de estoque, dashboard, logout.
- Critério objetivo: dados carregados são os mesmos registrados pela API, não valores inseridos manualmente na captura.

## Ordem de execução proposta

1. Revisar políticas e riscos P0 com o autor; nenhuma alteração funcional sem aprovação.
2. Implementar controles de autorização + testes primeiro em branch de correção própria.
3. Preparar E2E reproduzível e reunir capturas/verificações em docs.
4. Produzir tour estático de seleção como proposta, sem expor backend e sem publicar antes de revisão.
5. Só depois avaliar ambiente full stack online com gates de segurança e custos claros.
6. Atualizar currículo e página do projeto **apenas após** verificar fatos e receber autorização.

## Como comprovar impacto sem inventar resultados

- **Engenharia:** número de testes executados (com log e commit), mudanças de cobertura, reprodutibilidade de ambiente, bugs reproduzidos e corrigidos.
- **UX:** porcentagem de passos de demo que o avaliador conclui sem ajuda, a partir de teste com participantes consentidos.
- **Negócio:** apenas resultados com dados/usuários reais e autorização específica; manter bases de teste e métricas sintéticas claramente rotuladas.

## Escopo e branches de revisão

A branch inicial `docs/nexolog-recrutamento-20261108` acrescentou apenas documentos Markdown. A branch posterior `fix/nexolog-controles-p0-20261108` incorpora aquela documentação e propõe correções em `backend/main.py`, `backend/config.py` e testes, com nova documentação de evidências. **Histórico:** a branch de correção foi integrada à main pelo PR #1. Os dados e os releases não foram alterados; o workflow de testes foi ampliado. O site do portfólio foi atualizado em commit separado para disponibilizar somente a simulação estática. Configurações de instalações antigas devem ser verificadas antes de qualquer deploy.


## Progresso posterior — 08/11/2026

Integrados à main: controles P0, dois testes de permissão/configuração, testes JavaScript no CI e [teste integrado de Chromium Playwright](https://github.com/LeandroAugFerreira/nexolog/actions/runs/42497737703) com dados sintéticos. [Simulação web pública](https://leandroaugferreira.github.io/nexolog-demo.html) criada no repositório do portfólio.

Continuam pendentes: backend publicamente hospedado com política de segurança de produção; cobertura de todos os controles do Kanban; rate limiting, TLS/CSP, segurança de sessão, métricas de carga, modularização extensa e demais itens P2/P3. Essas atividades requerem projeto separado e validação antes de eventual deploy; não podem ser chamadas de prontas.
