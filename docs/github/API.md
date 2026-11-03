# Inventário estático de rotas

Rotas identificadas nos decoradores do código. Prefixos aplicados ao incluir roteadores podem ser acrescentados ao caminho mostrado. Autenticação, permissões e payloads devem ser conferidos no código/OpenAPI; a tabela não dispensa validação nem comprova implantação.

| Arquivo | Método | Caminho declarado | Função |
|---|---|---|---|
| `backend/main.py` | DELETE | `/api/produtos/{sku}` | `excluir_produto` |
| `backend/main.py` | GET | `/` | `home` |
| `backend/main.py` | GET | `/api/auditoria` | `listar_auditoria` |
| `backend/main.py` | GET | `/api/auth/config` | `configuracao_acesso` |
| `backend/main.py` | GET | `/api/auth/demo` | `acesso_demo` |
| `backend/main.py` | GET | `/api/auth/me` | `usuario_atual` |
| `backend/main.py` | GET | `/api/clientes` | `listar_clientes` |
| `backend/main.py` | GET | `/api/clientes/{codigo}` | `buscar_cliente` |
| `backend/main.py` | GET | `/api/fornecedores` | `listar_fornecedores` |
| `backend/main.py` | GET | `/api/fornecedores/{codigo}` | `buscar_fornecedor` |
| `backend/main.py` | GET | `/api/health` | `health_check` |
| `backend/main.py` | GET | `/api/movimentacoes` | `listar_movimentacoes` |
| `backend/main.py` | GET | `/api/pedidos` | `listar_pedidos` |
| `backend/main.py` | GET | `/api/pedidos/{codigo}` | `buscar_pedido` |
| `backend/main.py` | GET | `/api/produtos` | `listar_produtos` |
| `backend/main.py` | GET | `/api/produtos/{sku}` | `buscar_produto` |
| `backend/main.py` | GET | `/api/usuarios` | `listar_usuarios` |
| `backend/main.py` | GET | `/api/usuarios/{codigo}` | `buscar_usuario` |
| `backend/main.py` | PATCH | `/api/clientes/{codigo}/status` | `atualizar_status_cliente` |
| `backend/main.py` | PATCH | `/api/fornecedores/{codigo}/status` | `atualizar_status_fornecedor` |
| `backend/main.py` | PATCH | `/api/pedidos/{codigo}/status` | `atualizar_status_pedido` |
| `backend/main.py` | PATCH | `/api/usuarios/{codigo}/status` | `atualizar_status_usuario` |
| `backend/main.py` | POST | `/api/auth/login` | `login` |
| `backend/main.py` | POST | `/api/auth/logout` | `logout` |
| `backend/main.py` | POST | `/api/auth/register` | `cadastrar_usuario_publico` |
| `backend/main.py` | POST | `/api/clientes` | `cadastrar_cliente` |
| `backend/main.py` | POST | `/api/fornecedores` | `cadastrar_fornecedor` |
| `backend/main.py` | POST | `/api/movimentacoes` | `registrar_movimentacao` |
| `backend/main.py` | POST | `/api/pedidos` | `cadastrar_pedido` |
| `backend/main.py` | POST | `/api/produtos` | `cadastrar_produto` |
| `backend/main.py` | POST | `/api/produtos/importar` | `importar_produtos` |
| `backend/main.py` | POST | `/api/usuarios` | `cadastrar_usuario` |
| `backend/main.py` | PUT | `/api/clientes/{codigo}` | `editar_cliente` |
| `backend/main.py` | PUT | `/api/fornecedores/{codigo}` | `editar_fornecedor` |
| `backend/main.py` | PUT | `/api/produtos/{sku}` | `editar_produto` |
| `backend/main.py` | PUT | `/api/usuarios/{codigo}` | `editar_usuario` |
| `backend/reports.py` | GET | `/api/relatorios` | `listar` |
| `backend/reports.py` | GET | `/api/relatorios/{identificador}` | `baixar` |
| `backend/reports.py` | POST | `/api/relatorios` | `salvar` |
| `backend/tracking.py` | GET | `/api/pedidos/{codigo}/rastreamento` | `consultar` |
| `backend/tracking.py` | POST | `/api/pedidos/{codigo}/nova-entrega-demonstrativa` | `repetir` |
| `backend/tracking.py` | POST | `/api/pedidos/{codigo}/rastreamento-simulado` | `iniciar` |
