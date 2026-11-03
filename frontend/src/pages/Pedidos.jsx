// ============================================================
// NEXOLOG
// PEDIDOS & TRACKING
// ============================================================

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import ModalNovoPedido
  from '../components/pedidos/ModalNovoPedido'

import {
  atualizarStatusPedido,
  cadastrarPedido,
  listarClientes,
  listarPedidos,
  listarProdutos,
} from '../services/api'

import './Pedidos.css'
import './Operational.css'
import './ReferencePages.css'
import { Dialog } from '../components/ReferenceUI'
import OperationalTracking from '../components/pedidos/OperationalTracking'
import { orderInPeriod, invalidPeriod, recentPeriod } from '../data/orderPeriod'


// ============================================================
// ÍCONES SVG
// ============================================================

function SvgIcon({
  children,
  size = 16,
  strokeWidth = 1.9,
  className = '',
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}





function MoreIcon(
  props,
) {
  return (
    <SvgIcon
      {...props}
    >
      <circle
        cx="5"
        cy="12"
        r="1.45"
        fill="currentColor"
        stroke="none"
      />

      <circle
        cx="12"
        cy="12"
        r="1.45"
        fill="currentColor"
        stroke="none"
      />

      <circle
        cx="19"
        cy="12"
        r="1.45"
        fill="currentColor"
        stroke="none"
      />
    </SvgIcon>
  )
}


function PendingIcon(
  props,
) {
  return (
    <SvgIcon
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path
        d="M12 7.5v6"
      />

      <path
        d="M12 17h.01"
      />
    </SvgIcon>
  )
}


function ProcessingIcon(
  props,
) {
  return (
    <SvgIcon
      {...props}
      strokeWidth={1.65}
    >
      <circle
        cx="12"
        cy="12"
        r="3"
      />

      <path
        d="M19 12a7 7 0 0 0-.12-1.29l2.02-1.58-2-3.46-2.52 1.02A7 7 0 0 0 14.2 5.4L13.8 3h-4l-.4 2.4a7 7 0 0 0-2.18 1.29L4.7 5.67l-2 3.46 2.02 1.58A7 7 0 0 0 4.6 12c0 .44.04.87.12 1.29L2.7 14.87l2 3.46 2.52-1.02A7 7 0 0 0 9.4 18.6l.4 2.4h4l.4-2.4a7 7 0 0 0 2.18-1.29l2.52 1.02 2-3.46-2.02-1.58c.08-.42.12-.85.12-1.29Z"
      />
    </SvgIcon>
  )
}


function TruckIcon(
  props,
) {
  return (
    <SvgIcon
      {...props}
    >
      <path
        d="M3 7h11v10H3z"
      />

      <path
        d="M14 10h4l3 3v4h-7z"
      />

      <circle
        cx="7"
        cy="18"
        r="2"
      />

      <circle
        cx="18"
        cy="18"
        r="2"
      />
    </SvgIcon>
  )
}


function DoneIcon(
  props,
) {
  return (
    <SvgIcon
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path
        d="m8 12 2.5 2.5L16 9"
      />
    </SvgIcon>
  )
}


function PackageIcon(
  props,
) {
  return (
    <SvgIcon
      {...props}
    >
      <path
        d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"
      />

      <path
        d="M4 7.5v9L12 21"
      />

      <path
        d="M20 7.5v9L12 21"
      />

      <path
        d="M12 12v9"
      />
    </SvgIcon>
  )
}


function ClipboardIcon(
  props,
) {
  return (
    <SvgIcon
      {...props}
    >
      <path
        d="M7 5h10v16H7z"
      />

      <path
        d="M9 3h6v4H9z"
      />

      <path
        d="M10 11h4"
      />

      <path
        d="M10 15h4"
      />
    </SvgIcon>
  )
}

















function RefreshIcon(
  props,
) {
  return (
    <SvgIcon
      {...props}
    >
      <path
        d="M20 6v5h-5"
      />

      <path
        d="M19 11a7.5 7.5 0 1 0 1.1 4"
      />
    </SvgIcon>
  )
}


function ClearFiltersIcon(
  props,
) {
  return (
    <SvgIcon
      {...props}
    >
      <path
        d="M4 5h16"
      />

      <path
        d="M7 10h10"
      />

      <path
        d="M10 15h4"
      />

      <path
        d="m8 20 8-8"
      />
    </SvgIcon>
  )
}


function DownloadIcon(
  props,
) {
  return (
    <SvgIcon
      {...props}
    >
      <path
        d="M12 3v12"
      />

      <path
        d="m8 11 4 4 4-4"
      />

      <path
        d="M5 21h14"
      />
    </SvgIcon>
  )
}


function StatusColumnIcon({
  status,
}) {
  const icones = {
    pendente:
      <PendingIcon
        size={17}
      />,

    processando:
      <ProcessingIcon
        size={17}
      />,

    enviado:
      <TruckIcon
        size={17}
      />,

    entregue:
      <DoneIcon
        size={17}
      />,
  }

  return (
    icones[
      status
    ] ??
    <PackageIcon
      size={17}
    />
  )
}


function StatusFooterIcon({
  status,
}) {
  const icones = {
    pendente:
      <PendingIcon
        size={12}
      />,

    processando:
      <ProcessingIcon
        size={12}
      />,

    enviado:
      <TruckIcon
        size={12}
      />,

    entregue:
      <DoneIcon
        size={12}
      />,
  }

  return (
    icones[
      status
    ] ??
    <PackageIcon
      size={12}
    />
  )
}


// ============================================================
// CONFIGURAÇÕES
// ============================================================

const COLUNAS = [
  {
    id: 'pendente',
    titulo: 'Pendente',
    classe: 'pendente',
  },
  {
    id: 'processando',
    titulo: 'Em Processamento',
    classe: 'processando',
  },
  {
    id: 'enviado',
    titulo: 'Enviado',
    classe: 'enviado',
  },
  {
    id: 'entregue',
    titulo: 'Entregue',
    classe: 'entregue',
  },
]

const PROXIMO_STATUS = {
  pendente: 'processando',
  processando: 'enviado',
  enviado: 'entregue',
}

const ROTULOS_STATUS = {
  pendente: 'Pendente',
  processando: 'Em Processamento',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  devolvido: 'Devolvido',
}


// ============================================================
// FORMULÁRIO
// ============================================================

function criarItemVazio() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    produto_sku: '',
    quantidade: 1,
    valor_unitario: '',
  }
}


function criarFormularioInicial() {
  return {
    cliente_codigo: '',
    cliente_nome: '',
    destino: '',
    transportadora: '',
    codigo_rastreio: '',
    itens: [
      criarItemVazio(),
    ],
  }
}


// ============================================================
// AUXILIARES
// ============================================================

function montarDestinoCliente(
  cliente,
) {
  if (
    !cliente
  ) {
    return ''
  }

  const endereco = [
    cliente.logradouro,
    cliente.numero,
  ]
    .filter(
      Boolean,
    )
    .join(
      ', ',
    )

  const localidade = [
    cliente.bairro,
    cliente.cidade,
    cliente.uf,
  ]
    .filter(
      Boolean,
    )
    .join(
      ' - ',
    )

  return (
    [
      endereco,
      localidade,
    ]
      .filter(
        Boolean,
      )
      .join(
        ' • ',
      ) ||
    [
      cliente.cidade,
      cliente.uf,
    ]
      .filter(
        Boolean,
      )
      .join(
        ' - ',
      )
  )
}


function normalizarStatus(
  status,
) {
  const valor = String(
    status || '',
  )
    .trim()
    .toLowerCase()
    .replaceAll(
      ' ',
      '_',
    )
    .replaceAll(
      '-',
      '_',
    )

  if (
    valor === 'pendente' ||
    valor === 'pending'
  ) {
    return 'pendente'
  }

  if (
    valor === 'processando' ||
    valor === 'em_processamento' ||
    valor === 'processing'
  ) {
    return 'processando'
  }

  if (
    valor === 'enviado' ||
    valor === 'shipped'
  ) {
    return 'enviado'
  }

  if (
    valor === 'entregue' ||
    valor === 'delivered'
  ) {
    return 'entregue'
  }

  if (['cancelado', 'devolvido'].includes(valor)) return valor
  return 'pendente'
}


function obterCodigoPedido(
  pedido,
) {
  return (
    pedido.codigo ??
    pedido.numero ??
    pedido.numero_pedido ??
    pedido.id ??
    'PEDIDO'
  )
}


function obterCliente(
  pedido,
) {
  return (
    pedido.cliente_nome ??
    pedido.cliente ??
    'Cliente não informado'
  )
}


function obterDestino(
  pedido,
) {
  return (
    pedido.destino ??
    pedido.endereco_destino ??
    'Destino não informado'
  )
}


function obterQuantidadeItens(
  pedido,
) {
  if (
    !Array.isArray(
      pedido.itens,
    )
  ) {
    return (
      pedido.quantidade_itens ??
      0
    )
  }

  return pedido.itens.reduce(
    (
      total,
      item,
    ) => {
      const quantidade = Number(
        item.quantidade ??
        0,
      )

      return (
        total +
        (
          Number.isFinite(
            quantidade,
          )
            ? quantidade
            : 0
        )
      )
    },
    0,
  )
}


function obterValorTotal(
  pedido,
) {
  const valor = Number(
    pedido.valor_total ??
    pedido.total ??
    0,
  )

  return Number.isNaN(
    valor,
  )
    ? 0
    : valor
}


function montarClassificacaoProduto(
  produto,
) {
  if (
    !produto
  ) {
    return ''
  }

  return [
    produto.marca,
    produto.especificacao,
  ]
    .map(
      (
        valor,
      ) =>
        String(
          valor ??
          '',
        ).trim(),
    )
    .filter(
      Boolean,
    )
    .join(
      ' • ',
    )
}


function formatarMoeda(
  valor,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    },
  ).format(
    Number(
      valor ||
      0,
    ),
  )
}


function formatarData(
  valor,
) {
  if (
    !valor
  ) {
    return '—'
  }

  const data = new Date(
    valor,
  )

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return String(
      valor,
    )
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(
    data,
  )
}


function formatarDataHora(
  valor,
) {
  if (
    !valor
  ) {
    return '—'
  }

  const data = new Date(
    valor,
  )

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return String(
      valor,
    )
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(
    data,
  )
}


function obterRotuloStatus(
  status,
) {
  const normalizado =
    normalizarStatus(
      status,
    )

  return (
    ROTULOS_STATUS[
      normalizado
    ] ??
    'Pendente'
  )
}



function normalizarBuscaPedido(
  valor,
) {
  return String(
    valor || '',
  )
    .normalize(
      'NFD',
    )
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()
    .trim()
}


// ============================================================
// CARD DO PEDIDO
// ============================================================




// ============================================================
// MODAL DE DETALHES
// ============================================================

function ModalDetalhesPedido({
  pedido,
  produtos = [],
  atualizando,
  onFechar,
  onAvancarStatus,
  onSolicitarOperacao,
}) {
  if (
    !pedido
  ) {
    return null
  }

  const codigo =
    obterCodigoPedido(
      pedido,
    )

  const status =
    normalizarStatus(
      pedido.status,
    )

  const proximoStatus =
    PROXIMO_STATUS[
      status
    ]

  const itens =
    Array.isArray(
      pedido.itens,
    )
      ? pedido.itens
      : []

  return (
    <div
      className="pedido-modal-overlay"
      onMouseDown={
        (
          event,
        ) => {
          if (
            event.target ===
            event.currentTarget &&
            !atualizando
          ) {
            onFechar()
          }
        }
      }
    >

      <div
        className="pedido-modal pedido-modal-detalhes"
      >

        <div
          className="pedido-modal-header"
        >

          <div>

            <span
              className="pedido-modal-subtitle"
            >
              {codigo}
            </span>

            <h3>
              Detalhes do Pedido
            </h3>

            <p>
              Informações completas,
              itens e acompanhamento
              logístico.
            </p>

          </div>


          <button
            type="button"
            className="pedido-modal-close"
            onClick={
              onFechar
            }
            disabled={
              atualizando
            }
            aria-label="Fechar"
          >
            ×
          </button>

        </div>


        <div
          className="pedido-detalhes-conteudo"
        >

          <div
            className="pedido-detalhes-topo"
          >

            <div>

              <span>
                Cliente
              </span>

              <strong>
                {
                  obterCliente(
                    pedido,
                  )
                }
              </strong>

            </div>


            <span
              className={
                `pedido-status-badge ${status}`
              }
            >
              <i />

              {
                ROTULOS_STATUS[
                  status
                ]
              }
            </span>

          </div>


          <div
            className="pedido-detalhes-grid"
          >

            <div
              className="pedido-detalhe-card"
            >
              <span>
                Destino
              </span>

              <strong>
                {
                  obterDestino(
                    pedido,
                  )
                }
              </strong>
            </div>


            <div
              className="pedido-detalhe-card"
            >
              <span>
                Transportadora
              </span>

              <strong>
                {
                  pedido.transportadora ||
                  'Não informada'
                }
              </strong>
            </div>


            <div
              className="pedido-detalhe-card"
            >
              <span>
                Código de Rastreio
              </span>

              <strong
                className="pedido-rastreio"
              >
                {
                  pedido.codigo_rastreio ||
                  'Não informado'
                }
              </strong>
            </div>


            <div
              className="pedido-detalhe-card"
            >
              <span>
                Quantidade de Itens
              </span>

              <strong>
                {
                  obterQuantidadeItens(
                    pedido,
                  )
                }
              </strong>
            </div>


            <div
              className="pedido-detalhe-card"
            >
              <span>
                Criado em
              </span>

              <strong>
                {
                  formatarDataHora(
                    pedido.criado_em,
                  )
                }
              </strong>
            </div>


            <div
              className="pedido-detalhe-card"
            >
              <span>
                Atualizado em
              </span>

              <strong>
                {
                  formatarDataHora(
                    pedido.atualizado_em,
                  )
                }
              </strong>
            </div>

          </div>


          <div
            className="pedido-detalhes-itens"
          >

            <div
              className="pedido-detalhes-section-header"
            >

              <div>

                <strong>
                  Itens do Pedido
                </strong>

                <span>
                  Produtos vinculados a {
                    codigo
                  }.
                </span>

              </div>

            </div>


            <div
              className="pedido-detalhes-tabela-wrap"
            >

              <table
                className="pedido-detalhes-tabela"
              >

                <thead>

                  <tr>

                    <th>
                      SKU
                    </th>

                    <th>
                      Produto
                    </th>

                    <th>
                      Qtde.
                    </th>

                    <th>
                      Valor Unit.
                    </th>

                    <th>
                      Subtotal
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {
                    itens.length >
                    0
                      ? itens.map(
                          (
                            item,
                          ) => {
                            const produtoCatalogo =
                              produtos.find(
                                (
                                  produto,
                                ) =>
                                  produto.sku ===
                                  item.produto_sku,
                              )


                            const classificacao =
                              montarClassificacaoProduto({
                                marca:
                                  item.produto_marca ??
                                  produtoCatalogo?.marca,

                                especificacao:
                                  item.produto_especificacao ??
                                  produtoCatalogo?.especificacao,
                              })


                            return (
                              <tr
                                key={
                                  item.id ??
                                  `${item.produto_sku}-${item.produto_nome}`
                                }
                              >

                                <td
                                  className="pedido-detalhes-sku"
                                >
                                  {
                                    item.produto_sku ??
                                    '—'
                                  }
                                </td>

                                <td>
                                  <div
                                    className="pedido-detalhes-produto-identidade"
                                  >

                                    <strong>
                                      {
                                        item.produto_nome ??
                                        produtoCatalogo?.nome ??
                                        'Produto'
                                      }
                                    </strong>


                                    {
                                      classificacao &&
                                      (
                                        <span
                                          title={
                                            classificacao
                                          }
                                        >
                                          {
                                            classificacao
                                          }
                                        </span>
                                      )
                                    }

                                  </div>
                                </td>

                              <td>
                                {
                                  Number(
                                    item.quantidade ??
                                    0,
                                  ).toLocaleString(
                                    'pt-BR',
                                  )
                                }
                              </td>

                              <td>
                                {
                                  formatarMoeda(
                                    item.valor_unitario,
                                  )
                                }
                              </td>

                              <td
                                className="pedido-detalhes-subtotal"
                              >
                                {
                                  formatarMoeda(
                                    item.subtotal ??
                                    (
                                      Number(
                                        item.quantidade ??
                                        0,
                                      ) *
                                      Number(
                                        item.valor_unitario ??
                                        0,
                                      )
                                    ),
                                  )
                                }
                                </td>

                              </tr>
                            )
                          },
                        )
                      : (
                          <tr>

                            <td
                              colSpan="5"
                              className="pedido-detalhes-vazio"
                            >
                              Nenhum item encontrado.
                            </td>

                          </tr>
                        )
                  }

                </tbody>

              </table>

            </div>

          </div>


          <div
            className="pedido-detalhes-total"
          >

            <span>
              Valor Total
            </span>

            <strong>
              {
                formatarMoeda(
                  obterValorTotal(
                    pedido,
                  ),
                )
              }
            </strong>

          </div>


          <div
            className="pedido-modal-actions"
          >
            {['pendente','processando'].includes(status) && <button type="button" className="pedido-modal-button danger" disabled={atualizando} onClick={() => onSolicitarOperacao(pedido, 'cancelado')}>Cancelar pedido</button>}
            {['enviado','entregue'].includes(status) && <button type="button" className="pedido-modal-button cancel" disabled={atualizando} onClick={() => onSolicitarOperacao(pedido, 'devolvido')}>Registrar devolução recebida</button>}


            <button
              type="button"
              className="pedido-modal-button cancel"
              onClick={
                onFechar
              }
              disabled={
                atualizando
              }
            >
              Fechar
            </button>


            {
              proximoStatus &&
              (
                <button
                  type="button"
                  className="pedido-modal-button save"
                  disabled={
                    atualizando
                  }
                  onClick={
                    () =>
                      onAvancarStatus(
                        pedido,
                      )
                  }
                >
                  {
                    atualizando
                      ? 'Atualizando...'
                      : `Mover para ${ROTULOS_STATUS[
                          proximoStatus
                        ]}`
                  }
                </button>
              )
            }

          </div>

        </div>

      </div>

    </div>
  )
}


// ============================================================
// MODAL - CONFIRMAR DESPACHO EM LOTE
// ============================================================

function ModalConfirmarDespachoLote({
  aberto,
  quantidade,
  processando,
  onFechar,
  onConfirmar,
}) {
  if (
    !aberto
  ) {
    return null
  }

  return (
    <div
      className="pedido-modal-overlay"
      onMouseDown={
        (
          event,
        ) => {
          if (
            event.target ===
            event.currentTarget &&
            !processando
          ) {
            onFechar()
          }
        }
      }
    >

      <div
        className="pedido-modal pedido-modal-confirmacao"
      >

        <div
          className="pedido-modal-header"
        >

          <div>

            <span
              className="pedido-modal-subtitle"
            >
              DESPACHO EM LOTE
            </span>

            <h3>
              Confirmar Despacho
            </h3>

            <p>
              Os pedidos selecionados
              serão movidos para Enviado.
            </p>

          </div>


          <button
            type="button"
            className="pedido-modal-close"
            onClick={
              onFechar
            }
            disabled={
              processando
            }
            aria-label="Fechar"
          >
            ×
          </button>

        </div>


        <div
          className="pedido-confirmacao-conteudo"
        >

          <div
            className="pedido-confirmacao-icone"
          >
            ⇄
          </div>


          <div
            className="pedido-confirmacao-texto"
          >

            <strong>
              {
                quantidade ===
                1
                  ? '1 pedido selecionado'
                  : `${quantidade} pedidos selecionados`
              }
            </strong>

            <p>
              Esta ação atualizará
              o status dos pedidos
              para <b>Enviado</b>.
            </p>

          </div>


          <div
            className="pedido-modal-actions"
          >

            <button
              type="button"
              className="pedido-modal-button cancel"
              onClick={
                onFechar
              }
              disabled={
                processando
              }
            >
              Cancelar
            </button>


            <button
              type="button"
              className="pedido-modal-button save"
              onClick={
                onConfirmar
              }
              disabled={
                processando
              }
            >
              {
                processando
                  ? 'Despachando...'
                  : 'Confirmar Despacho'
              }
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}



// ============================================================
// LOTE 10C
// CARD COMPACTO DO PIPELINE
// ============================================================

function PedidoPipelineCard({
  pedido,
  selecionado,
  menuAberto,
  atualizandoStatus,
  selecaoLoteAtiva,
  selecionadoLote,
  onSelecionar,
  onAlternarMenu,
  onAbrirDetalhes,
  onAvancarStatus,
  onAlternarSelecaoLote,
}) {
  const codigo =
    obterCodigoPedido(
      pedido,
    )

  const cliente =
    obterCliente(
      pedido,
    )

  const status =
    normalizarStatus(
      pedido.status,
    )

  const quantidade =
    obterQuantidadeItens(
      pedido,
    )

  const valor =
    obterValorTotal(
      pedido,
    )

  const proximoStatus =
    PROXIMO_STATUS[
      status
    ]

  const atualizando =
    atualizandoStatus ===
    codigo

  const elegivelParaLote =
    status ===
      'pendente' ||
    status ===
      'processando'

  const prioridade =
    valor >=
    1500
      ? {
          rotulo:
            'Alta',
          classe:
            'alta',
        }
      : valor >=
        500
        ? {
            rotulo:
              'Média',
            classe:
              'media',
          }
        : {
            rotulo:
              'Baixa',
            classe:
              'baixa',
          }

  const data =
    pedido.criado_em ??
    pedido.data_criacao ??
    pedido.data ??
    null

  const statusRodape = {
    pendente:
      'Aguardando processamento',

    processando:
      'Em processamento',

    enviado:
      'Em trânsito para entrega',

    entregue:
      'Pedido concluído',
  }[
    status
  ]

  return (
    <article
      className={
        [
          'pedidos10-order-card',
          selecionado
            ? 'tracking-selected'
            : '',
          selecaoLoteAtiva
            ? 'batch-mode'
            : '',
          selecionadoLote
            ? 'batch-selected'
            : '',
          (
            selecaoLoteAtiva &&
            !elegivelParaLote
          )
            ? 'batch-disabled'
            : '',
        ]
          .filter(
            Boolean,
          )
          .join(
            ' ',
          )
      }
      onClick={
        () =>
          onSelecionar(
            pedido,
          )
      }
    >

      <div
        className="pedidos10-order-top"
      >

        <div
          className="pedidos10-order-code-row"
        >

          {
            selecaoLoteAtiva &&
            elegivelParaLote &&
            (
              <button
                type="button"
                className={
                  `pedido-lote-check ${
                    selecionadoLote
                      ? 'selecionado'
                      : ''
                  }`
                }
                onClick={
                  (
                    event,
                  ) => {
                    event.stopPropagation()

                    onAlternarSelecaoLote(
                      codigo,
                    )
                  }
                }
              >
                {
                  selecionadoLote
                    ? '✓'
                    : ''
                }
              </button>
            )
          }


          <strong>
            #{codigo}
          </strong>

        </div>


        <span
          className={
            `pedidos10-priority ${prioridade.classe}`
          }
        >

          <i></i>

          {
            prioridade.rotulo
          }

        </span>

      </div>


      <h4
        title={
          cliente
        }
      >
        {
          cliente
        }
      </h4>


      <div
        className="pedidos10-order-meta"
      >

        <span>

          <b>
            <ClipboardIcon
              size={12}
            />
          </b>

          {
            quantidade
          } unidades

        </span>


        <span
          title={
            pedido.transportadora ||
            'Transportadora não informada'
          }
        >

          <b>
            <TruckIcon
              size={12}
            />
          </b>

          {
            pedido.transportadora ||
            'Sem transportadora'
          }

        </span>

      </div>


      <strong
        className="pedidos10-order-total"
      >
        {
          formatarMoeda(
            valor,
          )
        }
      </strong>


      <div
        className={
          `pedidos10-order-footer-area ${status}`
        }
      >

        <div
          className="pedidos10-order-footer"
        >

          <span
            className={
              `pedidos10-order-state ${status}`
            }
          >

            <StatusFooterIcon
              status={
                status
              }
            />

            {
              statusRodape
            }

          </span>


          <div
            className="pedido-card-menu-wrap"
          >

            <button
              type="button"
              className="pedido-menu-button"
              aria-label={
                `Ações do pedido ${codigo}`
              }
              aria-expanded={
                menuAberto
              }
              onClick={
                (
                  event,
                ) => {
                  event.stopPropagation()

                  onAlternarMenu(
                    codigo,
                  )
                }
              }
            >
              <MoreIcon
                size={15}
              />
            </button>


            {
              menuAberto &&
              (
                <div
                  className="pedido-card-menu"
                  onClick={
                    (
                      event,
                    ) =>
                      event.stopPropagation()
                  }
                >

                  <button
                    type="button"
                    onClick={
                      () =>
                        onAbrirDetalhes(
                          pedido,
                        )
                    }
                  >
                    <span>
                      ◉
                    </span>

                    Visualizar detalhes
                  </button>


                  {
                    proximoStatus
                      ? (
                          <button
                            type="button"
                            className="avancar"
                            disabled={
                              atualizando
                            }
                            onClick={
                              () =>
                                onAvancarStatus(
                                  pedido,
                                )
                            }
                          >
                            <span>
                              →
                            </span>

                            {
                              atualizando
                                ? 'Atualizando...'
                                : `Mover para ${ROTULOS_STATUS[
                                    proximoStatus
                                  ]}`
                            }
                          </button>
                        )
                      : (
                          <div
                            className="pedido-card-menu-final"
                          >
                            <span>
                              ✓
                            </span>

                            Pedido concluído
                          </div>
                        )
                  }

                </div>
              )
            }

          </div>

        </div>


        <small
          className="pedidos10-created-date"
        >
          {
            formatarData(
              data,
            )
          }
        </small>

      </div>

    </article>
  )
}


// ============================================================
// LOTE 10C
// MAPA / PAINEL DE RASTREAMENTO
// ============================================================




function Pedidos() {
  const [confirmacaoOperacao, setConfirmacaoOperacao] = useState(null)
  // ==========================================================
  // PEDIDOS
  // ==========================================================

  const [
    pedidos,
    setPedidos,
  ] = useState([])

  const [
    carregando,
    setCarregando,
  ] = useState(true)

  const [
    erro,
    setErro,
  ] = useState('')


  // ==========================================================
  // PRODUTOS
  // ==========================================================

  const [
    produtos,
    setProdutos,
  ] = useState([])

  const [
    carregandoProdutos,
    setCarregandoProdutos,
  ] = useState(true)

  const [
    erroProdutos,
    setErroProdutos,
  ] = useState('')


  // ==========================================================
  // CLIENTES
  // ==========================================================

  const [
    clientes,
    setClientes,
  ] = useState([])

  const [
    carregandoClientes,
    setCarregandoClientes,
  ] = useState(true)

  const [
    erroClientes,
    setErroClientes,
  ] = useState('')


  // ==========================================================
  // MODAL NOVO PEDIDO
  // ==========================================================

  const [
    modalNovoPedido,
    setModalNovoPedido,
  ] = useState(false)

  const [
    formulario,
    setFormulario,
  ] = useState(
    criarFormularioInicial(),
  )

  const [
    mensagemFormulario,
    setMensagemFormulario,
  ] = useState('')

  const [
    salvandoPedido,
    setSalvandoPedido,
  ] = useState(false)


  // ==========================================================
  // DETALHES / MENU / STATUS
  // ==========================================================

  const [
    pedidoDetalhes,
    setPedidoDetalhes,
  ] = useState(null)

  const [
    menuPedidoAberto,
    setMenuPedidoAberto,
  ] = useState('')

  const [
    atualizandoStatus,
    setAtualizandoStatus,
  ] = useState('')


  // ==========================================================
  // DESPACHO EM LOTE
  // ==========================================================

  const [
    modoDespachoLote,
    setModoDespachoLote,
  ] = useState(false)

  const [
    pedidosSelecionadosLote,
    setPedidosSelecionadosLote,
  ] = useState([])

  const [
    confirmarDespachoLote,
    setConfirmarDespachoLote,
  ] = useState(false)

  const [
    despachandoLote,
    setDespachandoLote,
  ] = useState(false)


  // ==========================================================
  // TOAST
  // ==========================================================

  const [
    toast,
    setToast,
  ] = useState('')


  // ==========================================================
  // LOTE 10C - PIPELINE / TRACKING
  // ==========================================================

  const [
    buscaPipeline,
    setBuscaPipeline,
  ] = useState('')

  const [
    filtroPipeline,
    setFiltroPipeline,
  ] = useState('todos')

  const [periodoPedidos, setPeriodoPedidos] = useState({ inicio: '', fim: '' })
  const periodoInvalido = invalidPeriod(periodoPedidos)
  function alterarPeriodoPedidos(campo, valor) {
    setPeriodoPedidos(anterior => ({ ...anterior, [campo]: valor }))
    setPedidosSelecionadosLote([])
  }
  function escolherPeriodoPedidos(dias) {
    setPeriodoPedidos(dias ? recentPeriod(dias) : { inicio: '', fim: '' })
    setPedidosSelecionadosLote([])
  }

  const [
    pedidoRastreamentoCodigo,
    setPedidoRastreamentoCodigo,
  ] = useState('')

  const [
    menuPipelineAberto,
    setMenuPipelineAberto,
  ] = useState(false)

  const [
    atualizandoPipeline,
    setAtualizandoPipeline,
  ] = useState(false)


  function mostrarToast(
    mensagem,
  ) {
    setToast(
      mensagem,
    )

    window.setTimeout(
      () => {
        setToast(
          '',
        )
      },
      3500,
    )
  }


  // ==========================================================
  // FECHAR MENU AO CLICAR FORA
  // ==========================================================

  useEffect(
    () => {
      function fecharMenuFora(
        event,
      ) {
        const alvo =
          event.target

        if (
          alvo instanceof Element
        ) {
          if (
            !alvo.closest(
              '.pedido-card-menu-wrap',
            )
          ) {
            setMenuPedidoAberto(
              '',
            )
          }

          if (
            !alvo.closest(
              '.pedidos10-panel-menu-wrap',
            )
          ) {
            setMenuPipelineAberto(
              false,
            )
          }
        }
      }

      document.addEventListener(
        'mousedown',
        fecharMenuFora,
      )

      return () => {
        document.removeEventListener(
          'mousedown',
          fecharMenuFora,
        )
      }
    },
    [],
  )


  // ==========================================================
  // CARREGAR PEDIDOS
  // ==========================================================

  useEffect(
    () => {
      let ativo =
        true

      let consultando = false
      async function carregarPedidos(silencioso = false) {
        if (consultando) return
        consultando = true
        try {
          if (!silencioso) setCarregando(
            true,
          )

          setErro(
            '',
          )

          const dados =
            await listarPedidos()

          if (
            !ativo
          ) {
            return
          }

          setPedidos(
            Array.isArray(
              dados,
            )
              ? dados
              : [],
          )

        } catch (
          erroCarregamento
        ) {
          if (
            !ativo
          ) {
            return
          }

          console.error(
            'Erro ao carregar pedidos:',
            erroCarregamento,
          )

          setErro(
            erroCarregamento.message ||
            'Não foi possível carregar os pedidos.',
          )

        } finally {
          consultando = false
          if (
            ativo
          ) {
            setCarregando(
              false,
            )
          }
        }
      }

      carregarPedidos()
      const timer = setInterval(() => { if (!document.hidden) carregarPedidos(true) }, 5000)

      return () => {
        clearInterval(timer)
        ativo =
          false
      }
    },
    [],
  )


  // ==========================================================
  // MENU DE AÇÕES DO PIPELINE
  // ==========================================================

  async function atualizarPipelinePedidos() {
    try {
      setAtualizandoPipeline(
        true,
      )

      setMenuPipelineAberto(
        false,
      )

      const dados =
        await listarPedidos()

      setPedidos(
        Array.isArray(
          dados,
        )
          ? dados
          : [],
      )

      mostrarToast(
        'Pipeline atualizado com sucesso.',
      )

    } catch (
      erroAtualizacao
    ) {
      console.error(
        'Erro ao atualizar o pipeline:',
        erroAtualizacao,
      )

      mostrarToast(
        erroAtualizacao.message ||
        'Não foi possível atualizar o pipeline.',
      )

    } finally {
      setAtualizandoPipeline(
        false,
      )
    }
  }


  function limparFiltrosPipeline() {
    escolherPeriodoPedidos(0)
    setBuscaPipeline(
      '',
    )

    setFiltroPipeline(
      'todos',
    )

    setMenuPipelineAberto(
      false,
    )

    mostrarToast(
      'Filtros do pipeline limpos.',
    )
  }


  function exportarPipelinePedidos() {
    setMenuPipelineAberto(
      false,
    )

    exportarRelatorioPedidos()
  }


  // ==========================================================
  // CARREGAR PRODUTOS
  // ==========================================================

  useEffect(
    () => {
      let ativo =
        true

      async function carregarProdutos() {
        try {
          setCarregandoProdutos(
            true,
          )

          setErroProdutos(
            '',
          )

          const dados =
            await listarProdutos()

          if (
            !ativo
          ) {
            return
          }

          setProdutos(
            Array.isArray(
              dados,
            )
              ? dados
              : [],
          )

        } catch (
          erroCarregamento
        ) {
          if (
            !ativo
          ) {
            return
          }

          console.error(
            'Erro ao carregar produtos:',
            erroCarregamento,
          )

          setErroProdutos(
            erroCarregamento.message ||
            'Não foi possível carregar os produtos.',
          )

        } finally {
          if (
            ativo
          ) {
            setCarregandoProdutos(
              false,
            )
          }
        }
      }

      carregarProdutos()

      return () => {
        ativo =
          false
      }
    },
    [],
  )


  // ==========================================================
  // CARREGAR CLIENTES
  // ==========================================================

  useEffect(
    () => {
      let ativo =
        true

      async function carregarClientes() {
        try {
          setCarregandoClientes(
            true,
          )

          setErroClientes(
            '',
          )

          const dados =
            await listarClientes()

          if (
            !ativo
          ) {
            return
          }

          setClientes(
            Array.isArray(
              dados,
            )
              ? dados
              : [],
          )

        } catch (
          erroCarregamento
        ) {
          if (
            !ativo
          ) {
            return
          }

          console.error(
            'Erro ao carregar clientes:',
            erroCarregamento,
          )

          setErroClientes(
            erroCarregamento.message ||
            'Não foi possível carregar os clientes.',
          )

        } finally {
          if (
            ativo
          ) {
            setCarregandoClientes(
              false,
            )
          }
        }
      }

      carregarClientes()

      return () => {
        ativo =
          false
      }
    },
    [],
  )


  // ==========================================================
  // CLIENTES ATIVOS
  // ==========================================================

  const clientesAtivos =
    useMemo(
      () =>
        clientes.filter(
          (
            cliente,
          ) =>
            cliente.status ===
            'ativo',
        ),
      [
        clientes,
      ],
    )


  // ==========================================================
  // NOVO PEDIDO
  // ==========================================================

  function abrirModalNovoPedido() {
    setFormulario(
      criarFormularioInicial(),
    )

    setMensagemFormulario(
      '',
    )

    setModalNovoPedido(
      true,
    )
  }


  function fecharModalNovoPedido() {
    if (
      salvandoPedido
    ) {
      return
    }

    setModalNovoPedido(
      false,
    )

    setFormulario(
      criarFormularioInicial(),
    )

    setMensagemFormulario(
      '',
    )
  }


  function alterarCampoFormulario(
    event,
  ) {
    const {
      name,
      value,
    } =
      event.target

    if (
      name ===
      'cliente_codigo'
    ) {
      const clienteSelecionado =
        clientesAtivos.find(
          (
            cliente,
          ) =>
            cliente.codigo ===
            value,
        )

      setFormulario(
        (
          anterior,
        ) => ({
          ...anterior,

          cliente_codigo:
            value,

          cliente_nome:
            clienteSelecionado?.nome ??
            '',

          destino:
            clienteSelecionado
              ? montarDestinoCliente(
                  clienteSelecionado,
                )
              : '',
        }),
      )

      setMensagemFormulario(
        '',
      )

      return
    }

    setFormulario(
      (
        anterior,
      ) => ({
        ...anterior,
        [name]: value,
      }),
    )

    setMensagemFormulario(
      '',
    )
  }


  function alterarItem(
    index,
    campo,
    valor,
  ) {
    if (
      campo ===
      'produto_sku'
    ) {
      const produtoSelecionado =
        produtos.find(
          (
            produto,
          ) =>
            produto.sku ===
            valor,
        )

      const precoVenda =
        Number(
          produtoSelecionado
            ?.preco_venda ??
          0,
        )

      setFormulario(
        (
          anterior,
        ) => ({
          ...anterior,

          itens:
            anterior.itens.map(
              (
                item,
                itemIndex,
              ) =>
                itemIndex ===
                index
                  ? {
                      ...item,

                      produto_sku:
                        valor,

                      valor_unitario:
                        precoVenda > 0
                          ? precoVenda.toFixed(
                              2,
                            )
                          : '',
                    }
                  : item,
            ),
        }),
      )

      if (
        produtoSelecionado &&
        precoVenda <= 0
      ) {
        setMensagemFormulario(
          `O produto ${produtoSelecionado.sku} ainda não possui preço de venda cadastrado. Edite o produto no Estoque antes de concluir o pedido.`,
        )
      } else {
        setMensagemFormulario(
          '',
        )
      }

      return
    }

    setFormulario(
      (
        anterior,
      ) => ({
        ...anterior,

        itens:
          anterior.itens.map(
            (
              item,
              itemIndex,
            ) =>
              itemIndex ===
              index
                ? {
                    ...item,
                    [campo]:
                      valor,
                  }
                : item,
          ),
      }),
    )

    setMensagemFormulario(
      '',
    )
  }


  function adicionarItem() {
    setFormulario(
      (
        anterior,
      ) => ({
        ...anterior,

        itens: [
          ...anterior.itens,
          criarItemVazio(),
        ],
      }),
    )

    setMensagemFormulario(
      '',
    )
  }


  function removerItem(
    index,
  ) {
    setFormulario(
      (
        anterior,
      ) => {
        if (
          anterior.itens.length <=
          1
        ) {
          return anterior
        }

        return {
          ...anterior,

          itens:
            anterior.itens.filter(
              (
                _,
                itemIndex,
              ) =>
                itemIndex !==
                index,
            ),
        }
      },
    )

    setMensagemFormulario(
      '',
    )
  }


  function validarFormulario() {
    const clienteCodigo =
      formulario
        .cliente_codigo
        .trim()

    const cliente =
      formulario
        .cliente_nome
        .trim()

    const destino =
      formulario
        .destino
        .trim()

    if (
      clienteCodigo === '' ||
      cliente === ''
    ) {
      return (
        'Selecione um cliente cadastrado.'
      )
    }

    if (
      destino === ''
    ) {
      return (
        'Informe o destino.'
      )
    }

    if (
      formulario.itens.length ===
      0
    ) {
      return (
        'Adicione pelo menos um item ao pedido.'
      )
    }

    const produtosSelecionados =
      new Set()

    for (
      let index = 0;
      index <
      formulario.itens.length;
      index += 1
    ) {
      const item =
        formulario.itens[
          index
        ]

      const numeroItem =
        index +
        1

      if (
        !item.produto_sku
      ) {
        return (
          `Selecione o produto do item ${numeroItem}.`
        )
      }

      if (
        produtosSelecionados.has(
          item.produto_sku,
        )
      ) {
        return (
          'O mesmo produto não pode ser adicionado duas vezes.'
        )
      }

      produtosSelecionados.add(
        item.produto_sku,
      )

      const quantidade =
        Number(
          item.quantidade,
        )

      if (
        !Number.isInteger(
          quantidade,
        ) ||
        quantidade <=
        0
      ) {
        return (
          `Informe uma quantidade válida no item ${numeroItem}.`
        )
      }

      const produto =
        produtos.find(
          (
            itemProduto,
          ) =>
            itemProduto.sku ===
            item.produto_sku,
        )

      const estoqueDisponivel =
        Number(
          produto?.estoque_disponivel ?? produto?.estoque_atual ??
          0,
        )

      if (
        produto &&
        quantidade >
        estoqueDisponivel
      ) {
        return (
          `Quantidade do item ${numeroItem} maior que o estoque disponível (${estoqueDisponivel} un).`
        )
      }

      const valorUnitario =
        Number(
          item.valor_unitario,
        )

      if (
        item.valor_unitario ===
          '' ||
        Number.isNaN(
          valorUnitario,
        ) ||
        valorUnitario <=
          0
      ) {
        return (
          `O item ${numeroItem} precisa de um preço de venda maior que zero. Revise o cadastro do produto no Estoque.`
        )
      }
    }

    return ''
  }


  async function salvarNovoPedido(
    event,
  ) {
    event.preventDefault()

    const erroValidacao =
      validarFormulario()

    if (
      erroValidacao
    ) {
      setMensagemFormulario(
        erroValidacao,
      )

      return
    }

    const dados = {
      cliente_codigo: formulario.cliente_codigo,
      cliente_nome:
        formulario
          .cliente_nome
          .trim(),

      destino:
        formulario
          .destino
          .trim(),

      itens:
        formulario.itens.map(
          (
            item,
          ) => ({
            produto_sku:
              item.produto_sku,

            quantidade:
              Number(
                item.quantidade,
              ),

            valor_unitario:
              Number(
                item.valor_unitario,
              ),
          }),
        ),
    }

    const transportadora =
      formulario
        .transportadora
        .trim()

    const codigoRastreio =
      formulario
        .codigo_rastreio
        .trim()

    if (
      transportadora
    ) {
      dados.transportadora =
        transportadora
    }

    if (
      codigoRastreio
    ) {
      dados.codigo_rastreio =
        codigoRastreio
    }

    try {
      setSalvandoPedido(
        true,
      )

      setMensagemFormulario(
        '',
      )

      const novoPedido =
        await cadastrarPedido(
          dados,
        )


      // ======================================================
      // ATUALIZAR SALDO DOS PRODUTOS
      // ======================================================
      //
      // O backend já reservou as unidades do pedido.
      // Recarregamos os produtos para que um novo pedido aberto
      // logo em seguida use o saldo atualizado.
      //
      // ======================================================

      try {
        const produtosAtualizados =
          await listarProdutos()

        setProdutos(
          Array.isArray(
            produtosAtualizados,
          )
            ? produtosAtualizados
            : [],
        )

      } catch (
        erroAtualizacaoEstoque
      ) {
        console.error(
          'Pedido cadastrado, mas não foi possível atualizar a lista de produtos:',
          erroAtualizacaoEstoque,
        )
      }


      setPedidos(
        (
          anteriores,
        ) => [
          novoPedido,
          ...anteriores,
        ],
      )

      setModalNovoPedido(
        false,
      )

      setFormulario(
        criarFormularioInicial(),
      )

      mostrarToast(
        `Pedido ${obterCodigoPedido(
          novoPedido,
        )} cadastrado com sucesso. Estoque reservado; a baixa será registrada na expedição.`,
      )

    } catch (
      erroCadastro
    ) {
      console.error(
        'Erro ao cadastrar pedido:',
        erroCadastro,
      )

      setMensagemFormulario(
        erroCadastro.message ||
        'Não foi possível cadastrar o pedido.',
      )

    } finally {
      setSalvandoPedido(
        false,
      )
    }
  }


  // ==========================================================
  // MENU / DETALHES
  // ==========================================================

  function alternarMenuPedido(
    codigo,
  ) {
    setMenuPipelineAberto(
      false,
    )

    setMenuPedidoAberto(
      (
        atual,
      ) =>
        atual ===
        codigo
          ? ''
          : codigo,
    )
  }


  function abrirDetalhesPedido(
    pedido,
  ) {
    setPedidoDetalhes(
      pedido,
    )

    setMenuPedidoAberto(
      '',
    )
  }


  function fecharDetalhesPedido() {
    if (
      atualizandoStatus
    ) {
      return
    }

    setPedidoDetalhes(
      null,
    )
  }


  // ==========================================================
  // ATUALIZAR STATUS
  // ==========================================================

  async function avancarStatusPedido(
    pedido,
    novoStatus,
  ) {
    const codigo =
      obterCodigoPedido(
        pedido,
      )

    setPedidoRastreamentoCodigo(codigo)

    const statusAtual =
      normalizarStatus(
        pedido.status,
      )

    const proximoStatus =
      novoStatus || PROXIMO_STATUS[
        statusAtual
      ]

    if (
      !proximoStatus
    ) {
      return
    }

    try {
      setAtualizandoStatus(
        codigo,
      )

      setMenuPedidoAberto(
        '',
      )

      const resposta =
        await atualizarStatusPedido(
          codigo,
          proximoStatus,
        )

      try { setProdutos(await listarProdutos()) }
      catch { mostrarToast('Pedido atualizado. Reabra a tela para atualizar os saldos disponíveis.') }

      const pedidoAtualizado = {
        ...pedido,
        ...(resposta || {}),
        status:
          resposta?.status ??
          proximoStatus,
      }

      setPedidos(
        (
          anteriores,
        ) =>
          anteriores.map(
            (
              item,
            ) =>
              obterCodigoPedido(
                item,
              ) ===
              codigo
                ? pedidoAtualizado
                : item,
          ),
      )

      setPedidoDetalhes(
        (
          atual,
        ) =>
          atual &&
          obterCodigoPedido(
            atual,
          ) ===
          codigo
            ? pedidoAtualizado
            : atual,
      )

      mostrarToast(
        `${codigo} movido para ${ROTULOS_STATUS[
          proximoStatus
        ]}.`,
      )

    } catch (
      erroStatus
    ) {
      console.error(
        'Erro ao atualizar status:',
        erroStatus,
      )

      mostrarToast(
        erroStatus.message ||
        'Não foi possível atualizar o status.',
      )

    } finally {
      setAtualizandoStatus(
        '',
      )
    }
  }


  // ==========================================================
  // EXPORTAR RELATÓRIO CSV
  // ==========================================================

  function escaparCsv(
    valor,
  ) {
    const texto = String(
      valor ??
      '',
    )

    return (
      `"${texto.replaceAll(
        '"',
        '""',
      )}"`
    )
  }


  function exportarRelatorioPedidos() {
    if (
      pedidosPipeline.length ===
      0
    ) {
      mostrarToast(
        'Não há pedidos para exportar.',
      )

      return
    }

    const cabecalho = [
      'Código',
      'Cliente',
      'Status',
      'Destino',
      'Transportadora',
      'Código de Rastreio',
      'Quantidade de Itens',
      'Valor Total',
      'Criado em',
      'Atualizado em',
    ]

    const linhas =
      pedidosPipeline.map(
        (
          pedido,
        ) => [
          obterCodigoPedido(
            pedido,
          ),
          obterCliente(
            pedido,
          ),
          obterRotuloStatus(
            pedido.status,
          ),
          obterDestino(
            pedido,
          ),
          pedido.transportadora ??
          '',
          pedido.codigo_rastreio ??
          '',
          obterQuantidadeItens(
            pedido,
          ),
          obterValorTotal(
            pedido,
          )
            .toFixed(
              2,
            )
            .replace(
              '.',
              ',',
            ),
          formatarDataHora(
            pedido.criado_em,
          ),
          formatarDataHora(
            pedido.atualizado_em,
          ),
        ],
      )

    const conteudo = [
      cabecalho,
      ...linhas,
    ]
      .map(
        (
          linha,
        ) =>
          linha
            .map(
              escaparCsv,
            )
            .join(
              ';',
            ),
      )
      .join(
        '\n',
      )

    const blob =
      new Blob(
        [
          '\uFEFF',
          conteudo,
        ],
        {
          type:
            'text/csv;charset=utf-8;',
        },
      )

    const url =
      URL.createObjectURL(
        blob,
      )

    const link =
      document.createElement(
        'a',
      )

    const hoje =
      new Date()
        .toISOString()
        .slice(
          0,
          10,
        )

    link.href =
      url

    link.download =
      `relatorio-pedidos-${hoje}.csv`

    document.body.appendChild(
      link,
    )

    link.click()

    link.remove()

    URL.revokeObjectURL(
      url,
    )

    mostrarToast(
      'Relatório de pedidos exportado com sucesso.',
    )
  }


  // ==========================================================
  // DESPACHO EM LOTE
  // ==========================================================

  function alternarModoDespachoLote() {
    setMenuPedidoAberto(
      '',
    )

    if (
      modoDespachoLote
    ) {
      setModoDespachoLote(
        false,
      )

      setPedidosSelecionadosLote(
        [],
      )

      setConfirmarDespachoLote(
        false,
      )

      return
    }

    setModoDespachoLote(
      true,
    )

    setPedidosSelecionadosLote(
      [],
    )
  }


  function alternarSelecaoLote(
    codigo,
  ) {
    setPedidosSelecionadosLote(
      (
        anteriores,
      ) =>
        anteriores.includes(
          codigo,
        )
          ? anteriores.filter(
              (
                item,
              ) =>
                item !==
                codigo,
            )
          : [
              ...anteriores,
              codigo,
            ],
    )
  }


  function selecionarTodosParaLote() {
    const codigos =
      pedidosPipeline
        .filter(
          (
            pedido,
          ) => {
            const status =
              normalizarStatus(
                pedido.status,
              )

            return (
              status ===
                'pendente' ||
              status ===
                'processando'
            )
          },
        )
        .map(
          obterCodigoPedido,
        )

    setPedidosSelecionadosLote(
      codigos,
    )
  }


  function limparSelecaoLote() {
    setPedidosSelecionadosLote(
      [],
    )
  }


  function abrirConfirmacaoDespachoLote() {
    if (
      pedidosSelecionadosLote.length ===
      0
    ) {
      mostrarToast(
        'Selecione pelo menos um pedido para despachar.',
      )

      return
    }

    setConfirmarDespachoLote(
      true,
    )
  }


  function fecharConfirmacaoDespachoLote() {
    if (
      despachandoLote
    ) {
      return
    }

    setConfirmarDespachoLote(
      false,
    )
  }


  async function executarDespachoLote() {
    const selecionados =
      pedidosPipeline.filter(
        (
          pedido,
        ) => {
          const codigo =
            obterCodigoPedido(
              pedido,
            )

          const status =
            normalizarStatus(
              pedido.status,
            )

          return (
            pedidosSelecionadosLote.includes(
              codigo,
            ) &&
            (
              status ===
                'pendente' ||
              status ===
                'processando'
            )
          )
        },
      )

    if (
      selecionados.length ===
      0
    ) {
      setConfirmarDespachoLote(
        false,
      )

      mostrarToast(
        'Nenhum pedido elegível foi selecionado.',
      )

      return
    }

    try {
      setDespachandoLote(
        true,
      )

      const resultados =
        await Promise.allSettled(
          selecionados.map(
            async (
              pedido,
            ) => {
              const codigo =
                obterCodigoPedido(
                  pedido,
                )

              const resposta =
                await atualizarStatusPedido(
                  codigo,
                  'enviado',
                )

              return {
                codigo,

                pedidoAtualizado: {
                  ...pedido,
                  ...(resposta || {}),
                  status:
                    resposta?.status ??
                    'enviado',
                },
              }
            },
          ),
        )

      const atualizados =
        new Map()

      let sucessos =
        0

      let falhas =
        0

      resultados.forEach(
        (
          resultado,
        ) => {
          if (
            resultado.status ===
            'fulfilled'
          ) {
            atualizados.set(
              resultado.value.codigo,
              resultado.value
                .pedidoAtualizado,
            )

            sucessos +=
              1
          } else {
            falhas +=
              1

            console.error(
              'Erro no despacho em lote:',
              resultado.reason,
            )
          }
        },
      )

      if (
        sucessos >
        0
      ) {
        setPedidos(
          (
            anteriores,
          ) =>
            anteriores.map(
              (
                pedido,
              ) => {
                const codigo =
                  obterCodigoPedido(
                    pedido,
                  )

                return (
                  atualizados.get(
                    codigo,
                  ) ??
                  pedido
                )
              },
            ),
        )
      }

      setConfirmarDespachoLote(
        false,
      )

      setPedidosSelecionadosLote(
        [],
      )

      if (
        falhas ===
        0
      ) {
        setModoDespachoLote(
          false,
        )

        mostrarToast(
          sucessos ===
          1
            ? '1 pedido despachado com sucesso.'
            : `${sucessos} pedidos despachados com sucesso.`,
        )
      } else {
        mostrarToast(
          `${sucessos} concluído(s) e ${falhas} falha(s) no despacho.`,
        )
      }

    } finally {
      setDespachandoLote(
        false,
      )
    }
  }


  // ==========================================================
  // STATUS NORMALIZADO
  // ==========================================================

  const pedidosNormalizados =
    useMemo(
      () => {
        return pedidos.map(
          (
            pedido,
          ) => ({
            ...pedido,

            statusNormalizado:
              normalizarStatus(
                pedido.status,
              ),
          }),
        )
      },
      [
        pedidos,
      ],
    )


  // ==========================================================
  // LOTE 10C - FILTRO E PEDIDO SELECIONADO
  // ==========================================================

  const pedidosPipeline =
    (
      () => {
        const termo =
          normalizarBuscaPedido(
            buscaPipeline,
          )

        return pedidosNormalizados.filter(
          (
            pedido,
          ) => {
            const statusOk =
              orderInPeriod(pedido, periodoPedidos) && (
              filtroPipeline ===
                'todos' ||
              pedido.statusNormalizado ===
                filtroPipeline)

            if (
              !statusOk
            ) {
              return false
            }

            if (
              !termo
            ) {
              return true
            }

            const conteudo =
              normalizarBuscaPedido(
                [
                  obterCodigoPedido(
                    pedido,
                  ),
                  obterCliente(
                    pedido,
                  ),
                  obterDestino(
                    pedido,
                  ),
                  pedido.transportadora,
                  pedido.codigo_rastreio,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    ' ',
                  ),
              )

            return conteudo.includes(
              termo,
            )
          },
        )
      }
    )()


  const pedidoRastreamento =
    useMemo(
      () => {
        return (
          pedidosPipeline.find(
            (
              pedido,
            ) =>
              obterCodigoPedido(
                pedido,
              ) ===
              pedidoRastreamentoCodigo,
          ) ||
          pedidosPipeline.find(
            (
              pedido,
            ) =>
              pedido.statusNormalizado ===
              'enviado',
          ) ||
          pedidosPipeline.find(
            (
              pedido,
            ) =>
              pedido.statusNormalizado ===
              'processando',
          ) ||
          pedidosPipeline[0] ||
          null
        )
      },
      [
        pedidosPipeline,
        pedidoRastreamentoCodigo,
      ],
    )


  function selecionarPedidoRastreamento(
    pedido,
  ) {
    setPedidoRastreamentoCodigo(
      obterCodigoPedido(
        pedido,
      ),
    )
  }


  // ==========================================================
  // KPIS
  // ==========================================================

  


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main
      className="content pedidos-page pedidos10-page"
    >

      {
        toast &&
        (
          <div
            className="pedido-toast"
          >

            <span>
              ✓
            </span>

            {toast}

          </div>
        )
      }


      <header
        className="pedidos10-page-header"
      >

        <div>

          <h2>
            Pedidos
          </h2>

          <p>
            Gerencie todo o ciclo de vida dos pedidos, do processamento à entrega, com reserva de estoque e etapas registradas.
          </p>

        </div>


        <div
          className="pedidos10-page-actions"
        >

          <button
            type="button"
            className="pedidos-button primary"
            onClick={
              abrirModalNovoPedido
            }
            disabled={
              modoDespachoLote
            }
          >
            <span>
              ＋
            </span>

            Novo Pedido
          </button>


          <button
            type="button"
            className={
              `pedidos-button secondary ${
                modoDespachoLote
                  ? 'active'
                  : ''
              }`
            }
            onClick={
              alternarModoDespachoLote
            }
            disabled={
              despachandoLote
            }
          >
            <span>
              ◇
            </span>

            {
              modoDespachoLote
                ? 'Cancelar Lote'
                : 'Expedição em Lote'
            }
          </button>


          <button
            type="button"
            className="pedidos-button secondary"
            onClick={
              exportarRelatorioPedidos
            }
            disabled={
              pedidos.length ===
              0
            }
          >
            <span>
              ⇩
            </span>

            Exportar Relatórios
          </button>


          {
            modoDespachoLote &&
            (
              <button
                type="button"
                className="pedidos-button lote-confirmar"
                onClick={
                  abrirConfirmacaoDespachoLote
                }
                disabled={
                  pedidosSelecionadosLote.length ===
                    0 ||
                  despachandoLote
                }
              >
                {
                  despachandoLote
                    ? 'Despachando...'
                    : `Enviar (${pedidosSelecionadosLote.length})`
                }
              </button>
            )
          }

        </div>

      </header>


      {
        modoDespachoLote &&
        (
          <div
            className="pedido-lote-toolbar pedidos10-batch-toolbar"
          >

            <div>

              <strong>
                Expedição em lote
              </strong>

              <span>
                Selecione pedidos pendentes ou em processamento.
              </span>

            </div>


            <div
              className="pedido-lote-toolbar-acoes"
            >

              <span
                className="pedido-lote-contador"
              >
                {
                  pedidosSelecionadosLote.length
                } selecionado(s)
              </span>


              <button
                type="button"
                onClick={
                  selecionarTodosParaLote
                }
              >
                Selecionar todos
              </button>


              <button
                type="button"
                onClick={
                  limparSelecaoLote
                }
                disabled={
                  pedidosSelecionadosLote.length ===
                  0
                }
              >
                Limpar
              </button>

            </div>

          </div>
        )
      }


      {
        erro &&
        (
          <div
            className="pedidos-error"
          >
            {erro}
          </div>
        )
      }


      <section
        className="pedidos10-workspace"
      >

        <section
          className="pedidos10-pipeline-panel"
        >

          <header
            className="pedidos10-pipeline-header"
          >

            <div
              className="pedidos10-panel-title"
            >

              <div
                className="pedidos10-panel-icon"
              >
                ▣
              </div>


              <div>

                <h3>
                  Pipeline de Pedidos
                </h3>

                <p>
                  Visualize e gerencie seus pedidos por status no fluxo operacional.
                </p>

              </div>

            </div>


            <div
              className="pedidos10-pipeline-tools"
            >

              <div
                className="pedidos10-search"
              >

                <span>
                  ⌕
                </span>

                <input
                  type="text"
                  value={
                    buscaPipeline
                  }
                  onChange={
                    (
                      event,
                    ) =>
                      setBuscaPipeline(
                        event.target.value,
                      )
                  }
                  placeholder="Buscar pedido ou cliente..."
                />

              </div>


              <select
                value={
                  filtroPipeline
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFiltroPipeline(
                      event.target.value,
                    )
                }
              >

                <option value="todos">
                  Todos os pedidos
                </option>

                <option value="pendente">
                  Pendentes
                </option>

                <option value="processando">
                  Em processamento
                </option>

                <option value="enviado">
                  Enviados
                </option>

                <option value="cancelado">Cancelados</option><option value="devolvido">Devolvidos</option><option value="entregue">
                  Entregues
                </option>

              </select>


              <div
                className="pedidos10-panel-menu-wrap"
              >

                <button
                  type="button"
                  className="pedidos10-panel-menu"
                  aria-label="Mais ações do pipeline"
                  aria-expanded={
                    menuPipelineAberto
                  }
                  onClick={
                    (
                      event,
                    ) => {
                      event.stopPropagation()

                      setMenuPedidoAberto(
                        '',
                      )

                      setMenuPipelineAberto(
                        (
                          aberto,
                        ) =>
                          !aberto,
                      )
                    }
                  }
                >
                  <MoreIcon
                    size={16}
                  />
                </button>


                {
                  menuPipelineAberto &&
                  (
                    <div
                      className="pedidos10-panel-dropdown"
                    >

                      <button
                        type="button"
                        onClick={
                          atualizarPipelinePedidos
                        }
                        disabled={
                          atualizandoPipeline
                        }
                      >

                        <span>
                          <RefreshIcon
                            size={15}
                          />
                        </span>

                        <div>
                          <strong>
                            {
                              atualizandoPipeline
                                ? 'Atualizando...'
                                : 'Atualizar pipeline'
                            }
                          </strong>

                          <small>
                            Recarrega os pedidos da API
                          </small>
                        </div>

                      </button>


                      <button
                        type="button"
                        onClick={
                          limparFiltrosPipeline
                        }
                        disabled={
                          buscaPipeline ===
                            '' &&
                          filtroPipeline ===
                            'todos' && !periodoPedidos.inicio && !periodoPedidos.fim
                        }
                      >

                        <span>
                          <ClearFiltersIcon
                            size={15}
                          />
                        </span>

                        <div>
                          <strong>
                            Limpar filtros
                          </strong>

                          <small>
                            Remove busca, status e período
                          </small>
                        </div>

                      </button>


                      <button
                        type="button"
                        onClick={
                          exportarPipelinePedidos
                        }
                      >

                        <span>
                          <DownloadIcon
                            size={15}
                          />
                        </span>

                        <div>
                          <strong>
                            Exportar pedidos
                          </strong>

                          <small>
                            Gera o relatório em CSV
                          </small>
                        </div>

                      </button>

                    </div>
                  )
                }

              </div>

            </div>

          </header>


          <div className="lf-order-period-filter">
            <strong>Data de criação</strong>
            <label>De<input type="date" aria-label="Data inicial dos pedidos" value={periodoPedidos.inicio} onChange={event => alterarPeriodoPedidos('inicio', event.target.value)} /></label>
            <label>Até<input type="date" aria-label="Data final dos pedidos" value={periodoPedidos.fim} onChange={event => alterarPeriodoPedidos('fim', event.target.value)} /></label>
            <div className="lf-order-period-shortcuts" role="group" aria-label="Atalhos de período">
              <button type="button" onClick={() => escolherPeriodoPedidos(7)}>7 dias</button>
              <button type="button" onClick={() => escolherPeriodoPedidos(30)}>30 dias</button>
              <button type="button" onClick={() => escolherPeriodoPedidos(90)}>90 dias</button>
              <button type="button" onClick={() => escolherPeriodoPedidos(0)}>Todos os períodos</button>
            </div>
            {periodoInvalido ? <p role="alert" className="lf-order-period-error">A data inicial deve ser anterior ou igual à data final.</p> : <p>{pedidosPipeline.length} de {pedidos.length} pedidos encontrados{periodoPedidos.inicio || periodoPedidos.fim ? ' no período escolhido' : ' · todos os períodos'}. O histórico permanece salvo.</p>}
          </div>
          <div
            className="pedidos10-kanban"
          >

            {
              COLUNAS.map(
                (
                  coluna,
                ) => {
                  const pedidosColuna =
                    pedidosPipeline.filter(
                      (
                        pedido,
                      ) =>
                        pedido.statusNormalizado ===
                        coluna.id,
                    )

                  const textosColuna = {
                    pendente:
                      'Aguardando processamento',

                    processando:
                      'Separação e conferência',

                    enviado:
                      'Em trânsito para entrega',

                    entregue:
                      'Pedido concluído com sucesso',
                  }

                  return (
                    <article
                      key={
                        coluna.id
                      }
                      className={
                        `pedidos10-kanban-column ${coluna.classe}`
                      }
                    >

                      <header
                        className="pedidos10-kanban-column-header"
                      >

                        <div
                          className="pedidos10-kanban-column-title"
                        >

                          <div
                            className="pedidos10-kanban-status-icon"
                          >
                            <StatusColumnIcon
                              status={
                                coluna.id
                              }
                            />
                          </div>


                          <div>

                            <h4>
                              {
                                coluna.titulo
                              }
                            </h4>

                            <span>
                              {
                                textosColuna[
                                  coluna.id
                                ]
                              }
                            </span>

                          </div>

                        </div>


                        <strong>
                          {
                            pedidosColuna.length
                          }
                        </strong>

                      </header>


                      <div
                        className="pedidos10-kanban-content"
                      >

                        {
                          carregando
                            ? (
                                <div
                                  className="kanban-empty"
                                >
                                  Carregando...
                                </div>
                              )
                            : pedidosColuna.length >
                              0
                              ? pedidosColuna.map(
                                  (
                                    pedido,
                                  ) => {
                                    const codigo =
                                      obterCodigoPedido(
                                        pedido,
                                      )

                                    return (
                                      <PedidoPipelineCard
                                        key={
                                          codigo
                                        }
                                        pedido={
                                          pedido
                                        }
                                        selecionado={
                                          pedidoRastreamento &&
                                          obterCodigoPedido(
                                            pedidoRastreamento,
                                          ) ===
                                          codigo
                                        }
                                        menuAberto={
                                          menuPedidoAberto ===
                                          codigo
                                        }
                                        atualizandoStatus={
                                          atualizandoStatus
                                        }
                                        selecaoLoteAtiva={
                                          modoDespachoLote
                                        }
                                        selecionadoLote={
                                          pedidosSelecionadosLote.includes(
                                            codigo,
                                          )
                                        }
                                        onSelecionar={
                                          selecionarPedidoRastreamento
                                        }
                                        onAlternarMenu={
                                          alternarMenuPedido
                                        }
                                        onAbrirDetalhes={
                                          abrirDetalhesPedido
                                        }
                                        onAvancarStatus={
                                          avancarStatusPedido
                                        }
                                        onAlternarSelecaoLote={
                                          alternarSelecaoLote
                                        }
                                      />
                                    )
                                  },
                                )
                              : (
                                  <div
                                    className="kanban-empty"
                                  >
                                    Nenhum pedido
                                  </div>
                                )
                        }

                      </div>

                    </article>
                  )
                },
              )
            }

          </div>

        </section>


        <OperationalTracking
          onNovaEntrega={codigo => {
            setPedidoRastreamentoCodigo(codigo)
            atualizarPipelinePedidos()
            mostrarToast(`Entrega ${codigo} criada para hoje. Use um período que inclua hoje para visualizá-la.`)
          }}
          pedido={
            pedidoRastreamento
          }
          onAbrirDetalhes={
            abrirDetalhesPedido
          }
        />

      </section>



      {pedidosPipeline.some(p => ['cancelado','devolvido'].includes(p.status)) && <details className="lf-closed-orders"><summary>Cancelamentos e devoluções ({pedidosPipeline.filter(p => ['cancelado','devolvido'].includes(p.status)).length})</summary><div>{pedidosPipeline.filter(p => ['cancelado','devolvido'].includes(p.status)).map(pedido => <button type="button" key={pedido.codigo} onClick={() => abrirDetalhesPedido(pedido)}>{pedido.codigo} · {ROTULOS_STATUS[pedido.status]} · {pedido.cliente_nome}</button>)}</div></details>}
      <Dialog open={Boolean(confirmacaoOperacao)} title={confirmacaoOperacao?.status === 'devolvido' ? 'Confirmar devolução integral recebida' : 'Confirmar cancelamento'} onClose={() => setConfirmacaoOperacao(null)}>
        <p>{confirmacaoOperacao?.status === 'devolvido' ? 'Confirme apenas se todas as unidades deste pedido retornaram fisicamente e podem ser reintegradas ao estoque. Esta ação registra a entrada uma única vez.' : 'O pedido será encerrado e as unidades reservadas serão liberadas. Em pedidos antigos com baixa antecipada, o saldo será estornado.'}</p>
        <p><strong>{confirmacaoOperacao?.pedido.codigo}</strong> · {confirmacaoOperacao?.pedido.cliente_nome}</p>
        <button type="button" className="pedido-modal-button cancel" onClick={() => setConfirmacaoOperacao(null)}>Voltar</button>
        <button type="button" className="pedido-modal-button save" disabled={Boolean(atualizandoStatus)} onClick={async () => { await avancarStatusPedido(confirmacaoOperacao.pedido, confirmacaoOperacao.status); setConfirmacaoOperacao(null) }}>Confirmar</button>
      </Dialog>

      <ModalConfirmarDespachoLote
        aberto={
          confirmarDespachoLote
        }
        quantidade={
          pedidosSelecionadosLote.length
        }
        processando={
          despachandoLote
        }
        onFechar={
          fecharConfirmacaoDespachoLote
        }
        onConfirmar={
          executarDespachoLote
        }
      />


      <ModalDetalhesPedido
        pedido={
          pedidoDetalhes
        }
        produtos={
          produtos
        }
        atualizando={
          Boolean(
            atualizandoStatus,
          )
        }
        onFechar={
          fecharDetalhesPedido
        }
        onAvancarStatus={
          avancarStatusPedido
        }
        onSolicitarOperacao={(pedido, status) => setConfirmacaoOperacao({pedido, status})}
      />


      <ModalNovoPedido
        aberto={
          modalNovoPedido
        }
        formulario={
          formulario
        }
        clientes={
          clientesAtivos
        }
        carregandoClientes={
          carregandoClientes
        }
        erroClientes={
          erroClientes
        }
        produtos={
          produtos
        }
        carregandoProdutos={
          carregandoProdutos
        }
        erroProdutos={
          erroProdutos
        }
        mensagem={
          mensagemFormulario
        }
        salvando={
          salvandoPedido
        }
        onAlterarCampo={
          alterarCampoFormulario
        }
        onAlterarItem={
          alterarItem
        }
        onAdicionarItem={
          adicionarItem
        }
        onRemoverItem={
          removerItem
        }
        onFechar={
          fecharModalNovoPedido
        }
        onSalvar={
          salvarNovoPedido
        }
      />

    </main>
  )
}


export default Pedidos
