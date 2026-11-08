// ============================================================
// NEXOLOG
// SERVIÇO CENTRAL DA API
// ============================================================


export const API_BASE_URL = (import.meta.env?.VITE_API_URL || (import.meta.env?.PROD ? '/api' : 'http://127.0.0.1:8000/api')).replace(/\/$/, '')



const TOKEN_KEY =
  'logiflow_token'


export function obterToken() {
  return (
    window.localStorage.getItem(
      TOKEN_KEY,
    ) ||
    ''
  )
}


export function salvarToken(
  token,
) {
  if (
    token
  ) {
    window.localStorage.setItem(
      TOKEN_KEY,
      token,
    )
  } else {
    window.localStorage.removeItem(
      TOKEN_KEY,
    )
  }
}


export function limparToken() {
  window.localStorage.removeItem(
    TOKEN_KEY,
  )
}


// ============================================================
// FORMATAR ERRO DO FASTAPI
// ============================================================

function formatarErroApi(
  dados,
) {
  // ==========================================================
  // FASTAPI / PYDANTIC
  // ==========================================================

  if (
    Array.isArray(
      dados?.detail,
    )
  ) {
    return dados.detail
      .map(
        (
          erro,
        ) => {
          const localizacao =
            Array.isArray(
              erro?.loc,
            )
              ? erro.loc
                  .filter(
                    (
                      parte,
                    ) =>
                      parte !==
                      'body',
                  )
                  .join(
                    '.',
                  )
              : ''


          const mensagem =
            erro?.msg ||
            'Valor inválido.'


          if (
            localizacao
          ) {
            return (
              `${localizacao}: ${mensagem}`
            )
          }


          return mensagem
        },
      )
      .join(
        ' | ',
      )
  }


  // ==========================================================
  // DETAIL EM TEXTO
  // ==========================================================

  if (
    typeof dados?.detail ===
    'string'
  ) {
    return dados.detail
  }


  // ==========================================================
  // MENSAGEM PADRÃO DA API
  // ==========================================================

  if (
    typeof dados?.mensagem ===
    'string'
  ) {
    return dados.mensagem
  }


  // ==========================================================
  // FALLBACK
  // ==========================================================

  return (
    'Não foi possível concluir a operação.'
  )
}


// ============================================================
// REQUISIÇÃO PADRÃO
// ============================================================

// Compartilha apenas leituras em andamento; não mantém cache após a resposta.
// Evita consultas duplicadas por componentes e pelo StrictMode no desenvolvimento.
const leiturasEmAndamento = new Map()

function requisicao(endpoint, opcoes = {}) {
  if ((opcoes.method || 'GET').toUpperCase() !== 'GET' || opcoes.signal) {
    return executarRequisicao(endpoint, opcoes)
  }
  const chave = `${obterToken()}:${endpoint}`
  if (leiturasEmAndamento.has(chave)) return leiturasEmAndamento.get(chave)
  const promessa = executarRequisicao(endpoint, opcoes)
  leiturasEmAndamento.set(chave, promessa)
  const limpar = () => leiturasEmAndamento.delete(chave)
  promessa.then(limpar, limpar)
  return promessa
}

async function executarRequisicao(
  endpoint,
  opcoes = {},
) {
  const resposta =
    await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...opcoes,

        headers: {
          'Content-Type':
            'application/json',

          ...(
            obterToken()
              ? {
                  Authorization:
                    `Bearer ${obterToken()}`,
                }
              : {}
          ),

          ...opcoes.headers,
        },
      },
    )


  // ==========================================================
  // SEM CONTEÚDO
  // ==========================================================

  if (
    resposta.status ===
    204
  ) {
    return null
  }


  // ==========================================================
  // LER RESPOSTA
  // ==========================================================

  let dados


  try {
    dados =
      await resposta.json()
  } catch {
    dados =
      null
  }


  // ==========================================================
  // ERRO
  // ==========================================================

  if (
    !resposta.ok
  ) {
    if (
      resposta.status ===
      401 &&
      endpoint !==
      '/auth/login'
    ) {
      limparToken()

      window.dispatchEvent(
        new CustomEvent(
          'logiflow:unauthorized',
        ),
      )
    }

    const mensagem =
      formatarErroApi(
        dados,
      )


    console.error(
      'Erro da API:',
      {
        endpoint,
        status:
          resposta.status,
        dados,
      },
    )


    throw new Error(
      mensagem,
    )
  }


  return dados
}




// ============================================================
// AUTENTICAÇÃO
// ============================================================

export async function obterAcessoDemo() {
  return requisicao(
    '/auth/demo',
  )
}




export async function cadastrarUsuarioPublicoApi(
  dados,
) {
  return requisicao(
    '/auth/register',
    {
      method:
        'POST',

      body:
        JSON.stringify(
          dados,
        ),
    },
  )
}


export async function loginApi(
  email,
  senha,
) {
  const resposta =
    await requisicao(
      '/auth/login',
      {
        method:
          'POST',

        body:
          JSON.stringify({
            email,
            senha,
          }),
      },
    )

  salvarToken(
    resposta.token,
  )

  return resposta
}


export async function usuarioAtualApi() {
  return requisicao(
    '/auth/me',
  )
}


export async function logoutApi() {
  try {
    await requisicao(
      '/auth/logout',
      {
        method:
          'POST',
      },
    )
  } finally {
    limparToken()
  }
}


// ============================================================
// PRODUTOS
// LISTAR
// ============================================================

export async function listarProdutos() {
  return requisicao(
    '/produtos',
  )
}


// ============================================================
// PRODUTOS
// BUSCAR
// ============================================================

export async function buscarProduto(
  sku,
) {
  return requisicao(
    `/produtos/${sku}`,
  )
}


// ============================================================
// PRODUTOS
// CADASTRAR
// ============================================================

export async function cadastrarProdutoApi(
  dados,
) {
  return requisicao(
    '/produtos',
    {
      method:
        'POST',

      body:
        JSON.stringify(
          dados,
        ),
    },
  )
}


// ============================================================
// PRODUTOS
// IMPORTAR
// ============================================================

export async function importarProdutosApi(
  produtos,
) {
  return requisicao(
    '/produtos/importar',
    {
      method:
        'POST',

      body:
        JSON.stringify(
          produtos,
        ),
    },
  )
}


// ============================================================
// PRODUTOS
// EDITAR
// ============================================================

export async function editarProdutoApi(
  sku,
  dados,
) {
  return requisicao(
    `/produtos/${sku}`,
    {
      method:
        'PUT',

      body:
        JSON.stringify(
          dados,
        ),
    },
  )
}


// ============================================================
// PRODUTOS
// EXCLUIR
// ============================================================

export async function excluirProdutoApi(
  sku,
) {
  return requisicao(
    `/produtos/${sku}`,
    {
      method:
        'DELETE',
    },
  )
}


// ============================================================
// MOVIMENTAÇÕES
// LISTAR
// ============================================================

export async function listarMovimentacoes() {
  return requisicao(
    '/movimentacoes',
  )
}


// ============================================================
// MOVIMENTAÇÕES
// REGISTRAR
// ============================================================

export async function registrarMovimentacaoApi(
  dados,
) {
  return requisicao(
    '/movimentacoes',
    {
      method:
        'POST',

      body:
        JSON.stringify(
          dados,
        ),
    },
  )
}


// ============================================================
// PEDIDOS
// LISTAR
// ============================================================

export async function listarPedidos() {
  return requisicao(
    '/pedidos',
  )
}


// ============================================================
// PEDIDOS
// BUSCAR
// ============================================================

export async function buscarPedido(
  codigo,
) {
  return requisicao(
    `/pedidos/${codigo}`,
  )
}


// ============================================================
// PEDIDOS
// CADASTRAR
// ============================================================

export async function cadastrarPedido(
  dados,
) {
  return requisicao(
    '/pedidos',
    {
      method:
        'POST',

      body:
        JSON.stringify(
          dados,
        ),
    },
  )
}


// ============================================================
// PEDIDOS
// ATUALIZAR STATUS
// ============================================================

export async function atualizarStatusPedido(
  codigo,
  novoStatus,
) {
  return requisicao(
    `/pedidos/${codigo}/status`,
    {
      method:
        'PATCH',

      body:
        JSON.stringify({
          status:
            novoStatus,
        }),
    },
  )
}


// ============================================================
// FORNECEDORES
// LISTAR
// ============================================================

export async function listarFornecedores() {
  return requisicao(
    '/fornecedores',
  )
}


// ============================================================
// FORNECEDORES
// BUSCAR
// ============================================================

export async function buscarFornecedor(
  codigo,
) {
  return requisicao(
    `/fornecedores/${codigo}`,
  )
}


// ============================================================
// FORNECEDORES
// CADASTRAR
// ============================================================

export async function cadastrarFornecedor(
  dados,
) {
  return requisicao(
    '/fornecedores',
    {
      method:
        'POST',

      body:
        JSON.stringify(
          dados,
        ),
    },
  )
}


// ============================================================
// FORNECEDORES
// EDITAR
// ============================================================

export async function editarFornecedor(
  codigo,
  dados,
) {
  return requisicao(
    `/fornecedores/${codigo}`,
    {
      method:
        'PUT',

      body:
        JSON.stringify(
          dados,
        ),
    },
  )
}


// ============================================================
// FORNECEDORES
// ATUALIZAR STATUS
// ============================================================

export async function atualizarStatusFornecedor(
  codigo,
  novoStatus,
) {
  return requisicao(
    `/fornecedores/${codigo}/status`,
    {
      method:
        'PATCH',

      body:
        JSON.stringify({
          status:
            novoStatus,
        }),
    },
  )
}




// ============================================================
// CLIENTES
// LISTAR
// ============================================================

export async function listarClientes() {
  return requisicao(
    '/clientes',
  )
}


// ============================================================
// CLIENTES
// BUSCAR
// ============================================================

export async function buscarCliente(
  codigo,
) {
  return requisicao(
    `/clientes/${codigo}`,
  )
}


// ============================================================
// CLIENTES
// CADASTRAR
// ============================================================

export async function cadastrarCliente(
  dados,
) {
  return requisicao(
    '/clientes',
    {
      method:
        'POST',

      body:
        JSON.stringify(
          dados,
        ),
    },
  )
}


// ============================================================
// CLIENTES
// EDITAR
// ============================================================

export async function editarCliente(
  codigo,
  dados,
) {
  return requisicao(
    `/clientes/${codigo}`,
    {
      method:
        'PUT',

      body:
        JSON.stringify(
          dados,
        ),
    },
  )
}


// ============================================================
// CLIENTES
// ATUALIZAR STATUS
// ============================================================

export async function atualizarStatusCliente(
  codigo,
  novoStatus,
) {
  return requisicao(
    `/clientes/${codigo}/status`,
    {
      method:
        'PATCH',

      body:
        JSON.stringify({
          status:
            novoStatus,
        }),
    },
  )
}




// ============================================================
// USUÁRIOS
// LISTAR
// ============================================================

export async function listarUsuarios() {
  return requisicao(
    '/usuarios',
  )
}


// ============================================================
// USUÁRIOS
// BUSCAR
// ============================================================

export async function buscarUsuario(
  codigo,
) {
  return requisicao(
    `/usuarios/${codigo}`,
  )
}


// ============================================================
// USUÁRIOS
// CADASTRAR
// ============================================================

export async function cadastrarUsuario(
  dados,
) {
  return requisicao(
    '/usuarios',
    {
      method:
        'POST',

      body:
        JSON.stringify(
          dados,
        ),
    },
  )
}


// ============================================================
// USUÁRIOS
// EDITAR
// ============================================================

export async function editarUsuario(
  codigo,
  dados,
) {
  return requisicao(
    `/usuarios/${codigo}`,
    {
      method:
        'PUT',

      body:
        JSON.stringify(
          dados,
        ),
    },
  )
}


// ============================================================
// USUÁRIOS
// ATUALIZAR STATUS
// ============================================================

export async function atualizarStatusUsuario(
  codigo,
  novoStatus,
) {
  return requisicao(
    `/usuarios/${codigo}/status`,
    {
      method:
        'PATCH',

      body:
        JSON.stringify({
          status:
            novoStatus,
        }),
    },
  )
}


// ============================================================
// AUDITORIA
// LISTAR
// ============================================================

export async function listarAuditoria() {
  return requisicao(
    '/auditoria',
  )
}


// ============================================================
// ALIASES DE COMPATIBILIDADE
// ============================================================

export const cadastrarProduto =
  cadastrarProdutoApi


export const importarProdutos =
  importarProdutosApi


export const editarProduto =
  editarProdutoApi


export const excluirProduto =
  excluirProdutoApi


export const registrarMovimentacao =
  registrarMovimentacaoApi


// ============================================================
// EXPORTAÇÃO PADRÃO
// ============================================================

const api = {
  // Autenticação
  obterAcessoDemo,
  cadastrarUsuarioPublicoApi,
  loginApi,
  usuarioAtualApi,
  logoutApi,
  obterToken,
  salvarToken,
  limparToken,

  // Produtos
  listarProdutos,
  buscarProduto,
  cadastrarProdutoApi,
  importarProdutosApi,
  editarProdutoApi,
  excluirProdutoApi,

  // Movimentações
  listarMovimentacoes,
  registrarMovimentacaoApi,

  // Pedidos
  listarPedidos,
  buscarPedido,
  cadastrarPedido,
  atualizarStatusPedido,

  // Fornecedores
  listarFornecedores,
  buscarFornecedor,
  cadastrarFornecedor,
  editarFornecedor,
  atualizarStatusFornecedor,

  // Clientes
  listarClientes,
  buscarCliente,
  cadastrarCliente,
  editarCliente,
  atualizarStatusCliente,

  // Usuários
  listarUsuarios,
  buscarUsuario,
  cadastrarUsuario,
  editarUsuario,
  atualizarStatusUsuario,

  // Auditoria
  listarAuditoria,

  // Compatibilidade
  cadastrarProduto,
  importarProdutos,
  editarProduto,
  excluirProduto,
  registrarMovimentacao,
}


export default api
export const obterConfiguracaoAcesso = () => requisicao('/auth/config')
export const listarRelatorios = () => requisicao('/relatorios')
export const obterRelatorio = id => requisicao(`/relatorios/${id}`)
export const salvarRelatorio = registro => requisicao('/relatorios', { method: 'POST', body: JSON.stringify(registro) })
export const obterRastreamento = codigo => requisicao(`/pedidos/${encodeURIComponent(codigo)}/rastreamento`)
export const iniciarRastreamento = codigo => requisicao(`/pedidos/${encodeURIComponent(codigo)}/rastreamento-simulado`, { method: 'POST' })
export const criarEntregaDemonstrativa = codigo => requisicao(`/pedidos/${encodeURIComponent(codigo)}/nova-entrega-demonstrativa`, { method: 'POST' })
