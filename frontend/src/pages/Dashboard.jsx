import { pedidoValido } from '../data/reportMetrics'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  listarMovimentacoes,
  listarPedidos,
  listarProdutos,
} from '../services/api'


const ROTULOS_STATUS = {
  pendente: 'Pendente',
  processando: 'Em Processamento',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  devolvido: 'Devolvido',
}


function numero(
  valor,
) {
  const convertido =
    Number(
      valor || 0,
    )

  return Number.isFinite(
    convertido,
  )
    ? convertido
    : 0
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
    numero(
      valor,
    ),
  )
}


function formatarMoedaCompacta(
  valor,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    },
  ).format(
    numero(
      valor,
    ),
  )
}


function formatarData(
  valor,
) {
  const data =
    new Date(
      valor,
    )

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(
    data,
  )
}


function formatarDataCabecalho() {
  const texto =
    new Intl.DateTimeFormat(
      'pt-BR',
      {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      },
    ).format(
      new Date(),
    )

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  )
}


function normalizarStatus(
  valor,
) {
  const status =
    String(
      valor || '',
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
    status === 'processing' ||
    status === 'em_processamento'
  ) {
    return 'processando'
  }

  if (
    status === 'shipped'
  ) {
    return 'enviado'
  }

  if (
    status === 'delivered'
  ) {
    return 'entregue'
  }

  if (
    status === 'pending'
  ) {
    return 'pendente'
  }

  return (
    ROTULOS_STATUS[
      status
    ]
      ? status
      : 'pendente'
  )
}


function classeStatus(
  valor,
) {
  const status =
    normalizarStatus(
      valor,
    )

  return (
    status === 'enviado' ||
    status === 'entregue'
  )
    ? 'shipped'
    : 'pending'
}


function dataValida(
  valor,
) {
  const data =
    new Date(
      valor,
    )

  return Number.isNaN(
    data.getTime(),
  )
    ? null
    : data
}


function inicioDoDia(
  valor,
) {
  const data =
    new Date(
      valor,
    )

  data.setHours(
    0,
    0,
    0,
    0,
  )

  return data
}


function fimDoDia(
  valor,
) {
  const data =
    new Date(
      valor,
    )

  data.setHours(
    23,
    59,
    59,
    999,
  )

  return data
}


async function obterDadosDashboard() {
  const [
    dadosProdutos,
    dadosMovimentacoes,
    dadosPedidos,
  ] =
    await Promise.all([
      listarProdutos(),
      listarMovimentacoes(),
      listarPedidos(),
    ])

  return {
    produtos:
      Array.isArray(
        dadosProdutos,
      )
        ? dadosProdutos
        : [],

    movimentacoes:
      Array.isArray(
        dadosMovimentacoes,
      )
        ? dadosMovimentacoes
        : [],

    pedidos:
      Array.isArray(
        dadosPedidos,
      )
        ? dadosPedidos
        : [],
  }
}


function estaEntre(
  valor,
  inicio,
  fim,
) {
  const data =
    dataValida(
      valor,
    )

  return (
    data !== null &&
    data >= inicio &&
    data <= fim
  )
}


function calcularVariacao(
  atual,
  anterior,
) {
  if (
    anterior === 0
  ) {
    return atual === 0
      ? '0%'
      : 'Novo'
  }

  const percentual =
    (
      (
        atual -
        anterior
      ) /
      Math.abs(
        anterior,
      )
    ) *
    100

  const sinal =
    percentual >
    0
      ? '+'
      : ''

  return (
    `${sinal}${percentual.toFixed(
      0,
    )}%`
  )
}


function normalizarSparkline(
  valores,
) {
  const lista =
    valores.map(
      (
        valor,
      ) =>
        Math.max(
          0,
          numero(
            valor,
          ),
        ),
    )

  const maximo =
    Math.max(
      0,
      ...lista,
    )

  if (
    maximo ===
    0
  ) {
    return lista.map(
      () =>
        18,
    )
  }

  return lista.map(
    (
      valor,
    ) =>
      18 +
      (
        valor /
        maximo
      ) *
      72,
  )
}



function criarBucketsMensais(
  quantidadeMeses = 12,
) {
  const hoje =
    new Date()

  const meses = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ]

  const buckets = []

  for (
    let deslocamento =
      quantidadeMeses -
      1;
    deslocamento >= 0;
    deslocamento -= 1
  ) {
    const inicioBucket =
      new Date(
        hoje.getFullYear(),
        hoje.getMonth() -
          deslocamento,
        1,
        0,
        0,
        0,
        0,
      )

    const fimBucket =
      new Date(
        hoje.getFullYear(),
        hoje.getMonth() -
          deslocamento +
          1,
        0,
        23,
        59,
        59,
        999,
      )

    if (
      deslocamento ===
      0
    ) {
      fimBucket.setTime(
        hoje.getTime(),
      )
    }

    const mes =
      meses[
        inicioBucket.getMonth()
      ]

    const ano =
      String(
        inicioBucket.getFullYear(),
      ).slice(
        -2,
      )

    buckets.push({
      inicio:
        inicioBucket,

      fim:
        fimBucket,

      data:
        `${mes}/${ano}`,

      entradas:
        0,

      saidas:
        0,
    })
  }

  return buckets
}


function criarBuckets(
  dias,
  quantidadeDesejada = 16,
) {
  if (
    dias >=
    365
  ) {
    return criarBucketsMensais(
      12,
    )
  }

  const hoje =
    inicioDoDia(
      new Date(),
    )

  const quantidade =
    Math.min(
      quantidadeDesejada,
      dias,
    )

  const tamanho =
    Math.ceil(
      dias /
      quantidade,
    )

  const inicio =
    new Date(
      hoje,
    )

  inicio.setDate(
    inicio.getDate() -
    (
      tamanho *
      quantidade
    ) +
    1,
  )

  const buckets = []

  for (
    let indice = 0;
    indice < quantidade;
    indice += 1
  ) {
    const inicioBucket =
      new Date(
        inicio,
      )

    inicioBucket.setDate(
      inicioBucket.getDate() +
      (
        indice *
        tamanho
      ),
    )

    const fimBucket =
      new Date(
        inicioBucket,
      )

    fimBucket.setDate(
      fimBucket.getDate() +
      tamanho -
      1,
    )

    buckets.push({
      inicio:
        inicioDoDia(
          inicioBucket,
        ),

      fim:
        fimDoDia(
          fimBucket,
        ),

      data:
        new Intl.DateTimeFormat(
          'pt-BR',
          dias >= 180
            ? {
                month: 'short',
              }
            : {
                day: '2-digit',
                month: 'short',
              },
        ).format(
          inicioBucket,
        ),

      entradas: 0,
      saidas: 0,
    })
  }

  return buckets
}


function montarFluxo(
  movimentacoes,
  dias,
) {
  const buckets =
    criarBuckets(
      dias,
    )

  movimentacoes.forEach(
    (
      movimentacao,
    ) => {
      const data =
        dataValida(
          movimentacao.criado_em,
        )

      if (
        !data
      ) {
        return
      }

      const bucket =
        buckets.find(
          (
            item,
          ) =>
            data >= item.inicio &&
            data <= item.fim,
        )

      if (
        !bucket
      ) {
        return
      }

      if (
        String(
          movimentacao.tipo,
        ).toLowerCase() ===
        'entrada'
      ) {
        bucket.entradas +=
          numero(
            movimentacao.quantidade,
          )
      } else {
        bucket.saidas +=
          numero(
            movimentacao.quantidade,
          )
      }
    },
  )

  return buckets.map(
    (
      item,
    ) => ({
      data:
        item.data,

      dataCompleta:
        formatarData(
          item.fim,
        ),

      entradas:
        item.entradas,

      saidas:
        item.saidas,
    }),
  )
}


function MiniBars({
  valores,
  classe = '',
}) {
  return (
    <div
      className={
        `kpi-bars ${classe}`
      }
      aria-hidden="true"
    >
      {
        valores.map(
          (
            altura,
            index,
          ) => (
            <span
              key={
                index
              }
              style={{
                height:
                  `${altura}%`,
              }}
            ></span>
          ),
        )
      }
    </div>
  )
}



function MiniLine({
  valores,
}) {
  const pontos =
    valores.map(
      (
        valor,
        index,
      ) => {
        const x =
          valores.length <=
          1
            ? 0
            : (
                index /
                (
                  valores.length -
                  1
                )
              ) *
              100

        const y =
          100 -
          valor

        return {
          x,
          y,
        }
      },
    )

  const caminho =
    pontos.map(
      (
        ponto,
        indice,
      ) => {
        if (
          indice === 0
        ) {
          return `M ${ponto.x} ${ponto.y}`
        }

        const anterior =
          pontos[
            indice - 1
          ]

        const controleX =
          (anterior.x + ponto.x) /
          2

        return `C ${controleX} ${anterior.y}, ${controleX} ${ponto.y}, ${ponto.x} ${ponto.y}`
      },
    )
    .join(
      ' ',
    )

  const area =
    `${caminho} L 100 100 L 0 100 Z`

  return (
    <svg
      className="kpi-line"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="kpiRevenueArea"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="var(--success)"
            stopOpacity="0.42"
          />
          <stop
            offset="100%"
            stopColor="var(--success)"
            stopOpacity="0"
          />
        </linearGradient>

        <filter
          id="kpiRevenueGlow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur
            stdDeviation="2.2"
            result="blur"
          />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d={area}
        fill="url(#kpiRevenueArea)"
      />

      <path
        d={caminho}
        fill="none"
        stroke="var(--success)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        filter="url(#kpiRevenueGlow)"
      />

      {
        pontos.map(
          (
            ponto,
            index,
          ) => (
            <g
              key={index}
            >
              <circle
                cx={ponto.x}
                cy={ponto.y}
                r="4.2"
                fill="rgba(21, 28, 56, 0.92)"
              />
              <circle
                cx={ponto.x}
                cy={ponto.y}
                r="2.7"
                fill="var(--success)"
              />
            </g>
          ),
        )
      }
    </svg>
  )
}


function KpiGlyph({
  tipo,
}) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  const shapes = {
    pedidos: (
      <>
        <path
          {...common}
          d="M3 5h2l2 10h10l2-7H6"
        />
        <circle
          {...common}
          cx="9"
          cy="19"
          r="1.5"
        />
        <circle
          {...common}
          cx="17"
          cy="19"
          r="1.5"
        />
      </>
    ),

    receita: (
      <>
        <path
          {...common}
          d="M12 2v20M16.5 6.5C15.4 5.5 14 5 12 5c-2.8 0-4.5 1.3-4.5 3.2 0 4.8 9 2.4 9 7.2 0 2.1-1.8 3.6-4.8 3.6-2 0-3.7-.6-4.9-1.7"
        />
      </>
    ),

    alerta: (
      <>
        <path
          {...common}
          d="M12 3 22 20H2Z"
        />
        <path
          {...common}
          d="M12 9v5M12 17.2h.01"
        />
      </>
    ),

    remessas: (
      <>
        <path
          {...common}
          d="M3 7h11v10H3zM14 10h4l3 3v4h-7z"
        />
        <circle
          {...common}
          cx="7"
          cy="19"
          r="2"
        />
        <circle
          {...common}
          cx="18"
          cy="19"
          r="2"
        />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {
        shapes[
          tipo
        ]
      }
    </svg>
  )
}


function DashboardIcon({
  children,
  size = 18,
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}


function CalendarGlyph() {
  return (
    <DashboardIcon size={18}>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
      />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </DashboardIcon>
  )
}


function SunGlyph() {
  return (
    <DashboardIcon size={18}>
      <circle
        cx="12"
        cy="12"
        r="4"
      />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
    </DashboardIcon>
  )
}


function FlowGlyph() {
  return (
    <DashboardIcon size={20}>
      <path d="M4 20V13" />
      <path d="M10 20V8" />
      <path d="M16 20V4" />
      <path d="M22 20V10" />
    </DashboardIcon>
  )
}


function DocumentGlyph() {
  return (
    <DashboardIcon size={19}>
      <path d="M6 3h9l3 3v15H6Z" />
      <path d="M15 3v4h4M9 11h6M9 15h6" />
    </DashboardIcon>
  )
}


function BellGlyph() {
  return (
    <DashboardIcon size={19}>
      <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 6 2.5 7.5H3.5C3.5 15 6 15 6 9Z" />
      <path d="M10 20h4" />
    </DashboardIcon>
  )
}


function AlertGlyph() {
  return (
    <DashboardIcon size={16}>
      <path d="M12 3 22 20H2Z" />
      <path d="M12 9v5M12 17h.01" />
    </DashboardIcon>
  )
}





function DashboardFlowTooltip({
  active,
  payload,
  label,
}) {
  if (
    !active ||
    !payload ||
    payload.length ===
      0
  ) {
    return null
  }

  const entradas =
    payload.find(
      (
        item,
      ) =>
        item.dataKey ===
        'entradas',
    )

  const saidas =
    payload.find(
      (
        item,
      ) =>
        item.dataKey ===
        'saidas',
    )

  const formatarNumero =
    (
      valor,
    ) =>
      new Intl.NumberFormat(
        'pt-BR',
      ).format(
        Number(
          valor ||
          0,
        ),
      )

  const dataCompleta =
    payload?.[0]?.payload
      ?.dataCompleta ||
    label

  return (
    <div
      className="dashboard-flow-tooltip"
    >

      <div
        className="dashboard-flow-tooltip-label"
      >
        {
          dataCompleta
        }
      </div>


      <div
        className="dashboard-flow-tooltip-row entrada"
      >

        <span
          className="dashboard-flow-tooltip-dot"
        ></span>

        <span>
          Entradas
        </span>

        <strong>
          {
            formatarNumero(
              entradas?.value,
            )
          }
        </strong>

      </div>


      <div
        className="dashboard-flow-tooltip-row saida"
      >

        <span
          className="dashboard-flow-tooltip-dot"
        ></span>

        <span>
          Saídas
        </span>

        <strong>
          {
            formatarNumero(
              saidas?.value,
            )
          }
        </strong>

      </div>

    </div>
  )
}


function DashboardFlowDot({
  cx,
  cy,
  tipo,
}) {
  if (
    cx == null ||
    cy == null
  ) {
    return null
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r="3.7"
      className={
        `dashboard-flow-dot dashboard-flow-dot-${tipo}`
      }
    />
  )
}


function DashboardFlowActiveDot({
  cx,
  cy,
  tipo,
}) {
  if (
    cx == null ||
    cy == null
  ) {
    return null
  }

  return (
    <g
      className={
        `dashboard-flow-active-dot dashboard-flow-active-dot-${tipo}`
      }
    >

      <circle
        cx={cx}
        cy={cy}
        r="8.2"
        className="dashboard-flow-active-halo"
      />

      <circle
        cx={cx}
        cy={cy}
        r="5.2"
        className="dashboard-flow-active-core"
      />

    </g>
  )
}


function Dashboard({
  usuario,
}) {
  const navigate =
    useNavigate()

  const [
    produtos,
    setProdutos,
  ] = useState([])

  const [
    movimentacoes,
    setMovimentacoes,
  ] = useState([])

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

  const [
    periodoGrafico,
    setPeriodoGrafico,
  ] = useState(30)

  const [
    menuKpiAberto,
    setMenuKpiAberto,
  ] = useState(null)


  async function recarregarDashboard() {
    try {
      setCarregando(
        true,
      )

      setErro(
        '',
      )

      const dados =
        await obterDadosDashboard()

      setProdutos(
        dados.produtos,
      )

      setMovimentacoes(
        dados.movimentacoes,
      )

      setPedidos(
        dados.pedidos,
      )
    } catch (
      error
    ) {
      console.error(
        'Erro ao carregar Dashboard:',
        error,
      )

      setErro(
        'Não foi possível atualizar os indicadores pela API.',
      )
    } finally {
      setCarregando(
        false,
      )
    }
  }


  useEffect(() => {
    let ativo = true
    async function carregarInicial() {
      try {
        const dados = await obterDadosDashboard()
        if (!ativo) return
        setProdutos(dados.produtos)
        setMovimentacoes(dados.movimentacoes)
        setPedidos(dados.pedidos)
      } catch {
        if (ativo) setErro('Não foi possível carregar os indicadores pela API.')
      } finally { if (ativo) setCarregando(false) }
    }
    carregarInicial()
    const timer = setInterval(() => { if (!document.hidden) carregarInicial() }, 15000)
    return () => { ativo = false; clearInterval(timer) }
  }, [])


  useEffect(
    () => {
      function aoClicarFora(
        evento,
      ) {
        if (
          !evento.target.closest(
            '.dashboard-kpi-menu-wrapper',
          )
        ) {
          setMenuKpiAberto(
            null,
          )
        }
      }

      function aoPressionarTecla(
        evento,
      ) {
        if (
          evento.key === 'Escape'
        ) {
          setMenuKpiAberto(
            null,
          )
        }
      }

      document.addEventListener(
        'mousedown',
        aoClicarFora,
      )

      document.addEventListener(
        'keydown',
        aoPressionarTecla,
      )

      return () => {
        document.removeEventListener(
          'mousedown',
          aoClicarFora,
        )

        document.removeEventListener(
          'keydown',
          aoPressionarTecla,
        )
      }
    },
    [],
  )


  const periodos =
    useMemo(
      () => {
        const hoje =
          fimDoDia(
            new Date(),
          )

        const atualInicio =
          inicioDoDia(
            new Date(),
          )

        atualInicio.setDate(
          atualInicio.getDate() -
          29,
        )

        const anteriorFim =
          new Date(
            atualInicio,
          )

        anteriorFim.setMilliseconds(
          -1,
        )

        const anteriorInicio =
          inicioDoDia(
            anteriorFim,
          )

        anteriorInicio.setDate(
          anteriorInicio.getDate() -
          29,
        )

        return {
          hoje,
          atualInicio,
          anteriorInicio,
          anteriorFim,
        }
      },
      [],
    )


  const resumo =
    useMemo(
      () => {
        const pedidosAtuais =
          pedidos.filter(
            (
              pedido,
            ) =>
              estaEntre(
                pedido.criado_em,
                periodos.atualInicio,
                periodos.hoje,
              ),
          )

        const pedidosAnteriores =
          pedidos.filter(
            (
              pedido,
            ) =>
              estaEntre(
                pedido.criado_em,
                periodos.anteriorInicio,
                periodos.anteriorFim,
              ),
          )

        const receitaAtual =
          pedidosAtuais.reduce(
            (
              soma,
              pedido,
            ) =>
              soma +
              numero(
                pedidoValido(pedido) ? pedido.valor_total : 0,
              ),
            0,
          )

        const receitaAnterior =
          pedidosAnteriores.reduce(
            (
              soma,
              pedido,
            ) =>
              soma +
              numero(
                pedidoValido(pedido) ? pedido.valor_total : 0,
              ),
            0,
          )

        const estoqueBaixo =
          produtos.filter(
            (
              produto,
            ) =>
              numero(
                produto.estoque_disponivel ?? produto.estoque_atual,
              ) <=
              numero(
                produto.estoque_minimo,
              ),
          )

        const remessasPendentes =
          pedidos.filter(
            (
              pedido,
            ) => {
              const status =
                normalizarStatus(
                  pedido.status,
                )

              return (
                status === 'pendente' ||
                status === 'processando'
              )
            },
          )

        return {
          pedidosAtuais,
          pedidosAnteriores,
          receitaAtual,
          receitaAnterior,
          estoqueBaixo,
          remessasPendentes,
        }
      },
      [
        pedidos,
        produtos,
        periodos,
      ],
    )


  const miniGraficos =
    useMemo(
      () => {
        const buckets =
          criarBuckets(
            30,
            7,
          )

        const pedidosBuckets =
          buckets.map(
            (
              bucket,
            ) =>
              pedidos.filter(
                (
                  pedido,
                ) =>
                  estaEntre(
                    pedido.criado_em,
                    bucket.inicio,
                    bucket.fim,
                  ),
              ),
          )

        const quantidadePedidos =
          pedidosBuckets.map(
            (
              lista,
            ) =>
              lista.length,
          )

        const receita =
          pedidosBuckets.map(
            (
              lista,
            ) =>
              lista.reduce(
                (
                  soma,
                  pedido,
                ) =>
                  soma +
                  numero(
                    pedidoValido(pedido) ? pedido.valor_total : 0,
                  ),
                0,
              ),
          )

        const pendentes =
          pedidosBuckets.map(
            (
              lista,
            ) =>
              lista.filter(
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
              ).length,
          )

        const estoque =
          resumo.estoqueBaixo
            .slice(
              0,
              7,
            )
            .map(
              (
                produto,
              ) =>
                numero(
                  produto.estoque_disponivel ?? produto.estoque_atual,
                ),
            )

        while (
          estoque.length <
          7
        ) {
          estoque.push(
            resumo.estoqueBaixo.length,
          )
        }

        return {
          pedidos:
            normalizarSparkline(
              quantidadePedidos,
            ),

          receita:
            normalizarSparkline(
              receita,
            ),

          estoque:
            normalizarSparkline(
              estoque,
            ),

          pendentes:
            normalizarSparkline(
              pendentes,
            ),
        }
      },
      [
        pedidos,
        resumo.estoqueBaixo,
      ],
    )



  const indicadores =
    useMemo(
      () => [
        {
          titulo:
            'Total de Pedidos',
          valor:
            carregando
              ? '…'
              : new Intl.NumberFormat(
                  'pt-BR',
                ).format(
                  pedidos.length,
                ),
          variacao:
            calcularVariacao(
              resumo.pedidosAtuais.length,
              resumo.pedidosAnteriores.length,
            ),
          descricao:
            'vs. mês anterior',
          tipo:
            'pedidos',
          classe:
            'accent',
          grafico:
            miniGraficos.pedidos,
          graficoTipo:
            'bars',
          menuDestino:
            '/pedidos',
          menuRotulo:
            'Abrir pedidos',
        },
        {
          titulo:
            'Valor dos Pedidos',
          valor:
            carregando
              ? '…'
              : formatarMoedaCompacta(
                  pedidos.reduce(
                    (
                      soma,
                      pedido,
                    ) =>
                      soma +
                      numero(
                        pedidoValido(pedido) ? pedido.valor_total : 0,
                      ),
                    0,
                  ),
                ),
          variacao:
            calcularVariacao(
              resumo.receitaAtual,
              resumo.receitaAnterior,
            ),
          descricao:
            'vs. mês anterior',
          tipo:
            'receita',
          classe:
            'success',
          grafico:
            miniGraficos.receita,
          graficoTipo:
            'line',
          menuDestino:
            '/relatorios',
          menuRotulo:
            'Abrir relatórios',
        },
        {
          titulo:
            'Itens com Estoque Baixo',
          valor:
            carregando
              ? '…'
              : String(
                  resumo.estoqueBaixo.length,
                ),
          variacao:
            '+33%',
          descricao:
            'vs. mês anterior',
          tipo:
            'alerta',
          classe:
            'warning',
          grafico:
            miniGraficos.estoque,
          graficoTipo:
            'bars',
          menuDestino:
            '/estoque',
          menuRotulo:
            'Abrir estoque',
        },
        {
          titulo:
            'Remessas Pendentes',
          valor:
            carregando
              ? '…'
              : String(
                  resumo.remessasPendentes.length,
                ),
          variacao:
            '+6%',
          descricao:
            'vs. mês anterior',
          tipo:
            'remessas',
          classe:
            'accent',
          grafico:
            miniGraficos.pendentes,
          graficoTipo:
            'bars',
          menuDestino:
            '/pedidos',
          menuRotulo:
            'Abrir pedidos',
        },
      ],
      [
        carregando,
        pedidos,
        resumo,
        miniGraficos,
      ],
    )


  const fluxoEstoque =
    useMemo(
      () =>
        montarFluxo(
          movimentacoes,
          periodoGrafico,
        ),
      [
        movimentacoes,
        periodoGrafico,
      ],
    )


  const pedidosRecentes =
    useMemo(
      () =>
        [
          ...pedidos,
        ]
          .sort(
            (
              a,
              b,
            ) =>
              (
                dataValida(
                  b.criado_em,
                )?.getTime() ||
                0
              ) -
              (
                dataValida(
                  a.criado_em,
                )?.getTime() ||
                0
              ),
          )
          .slice(
            0,
            5,
          )
          .map(
            (
              pedido,
            ) => {
              const status =
                normalizarStatus(
                  pedido.status,
                )

              return {
                id:
                  `#${pedido.codigo}`,
                cliente:
                  pedido.cliente_nome,
                status:
                  ROTULOS_STATUS[
                    status
                  ],
                classe:
                  classeStatus(
                    status,
                  ),
                data:
                  formatarData(
                    pedido.criado_em,
                  ),
                total:
                  formatarMoeda(
                    pedidoValido(pedido) ? pedido.valor_total : 0,
                  ),
              }
            },
          ),
      [
        pedidos,
      ],
    )


  const alertas =
    useMemo(
      () =>
        resumo.estoqueBaixo
          .slice()
          .sort(
            (
              a,
              b,
            ) => {
              const minimoA =
                numero(
                  a.estoque_minimo,
                )

              const minimoB =
                numero(
                  b.estoque_minimo,
                )

              const proporcaoA =
                minimoA >
                0
                  ? numero(
                      a.estoque_atual,
                    ) /
                    minimoA
                  : 1

              const proporcaoB =
                minimoB >
                0
                  ? numero(
                      b.estoque_atual,
                    ) /
                    minimoB
                  : 1

              return (
                proporcaoA -
                proporcaoB
              )
            },
          )
          .slice(
            0,
            5,
          )
          .map(
            (
              produto,
              index,
            ) => ({
              produto:
                produto.nome,
              quantidade:
                new Intl.NumberFormat(
                  'pt-BR',
                ).format(
                  numero(
                    produto.estoque_disponivel ?? produto.estoque_atual,
                  ),
                ),
              minimo:
                new Intl.NumberFormat(
                  'pt-BR',
                ).format(
                  numero(
                    produto.estoque_minimo,
                  ),
                ),
              tempo:
                index < 4
                  ? `há ${(index + 1) * 2} horas`
                  : 'há 1 dia',
            }),
          ),
      [
        resumo.estoqueBaixo,
      ],
    )



  function abrirMenuKpi(
    titulo,
  ) {
    setMenuKpiAberto(
      (
        atual,
      ) =>
        atual === titulo
          ? null
          : titulo,
    )
  }


  function executarAcaoKpi(
    indicador,
    acao,
  ) {
    setMenuKpiAberto(
      null,
    )

    if (
      acao ===
      'abrir'
    ) {
      navigate(
        indicador.menuDestino,
      )

      return
    }

    if (
      acao ===
      'atualizar'
    ) {
      recarregarDashboard()
    }
  }


  const primeiroNome =
    String(
      usuario?.nome ||
      'Usuário',
    )
      .trim()
      .split(
        /\s+/,
      )[0]


  return (
    <main
      className="content dashboard-page"
    >

      <header
        className="dashboard-heading"
      >

        <div>

          <h2>
            Painel
          </h2>

          <p>
            {
              erro ||
              `Bem-vindo de volta, ${primeiroNome}! Aqui está o que está acontecendo na sua operação logística hoje.`
            }
          </p>

        </div>


        <div
          className="dashboard-heading-meta"
        >

          <div
            className="dashboard-date"
          >
            <span>
              <CalendarGlyph />
            </span>

            {
              formatarDataCabecalho()
            }
          </div>

          <div
            className="dashboard-heading-divider"
          ></div>

          <div
            className="dashboard-tip"
          >
            <span>
              <SunGlyph />
            </span>

            Mantenha sua cadeia de suprimentos em movimento.
          </div>

        </div>

      </header>


      <section
        className="dashboard-kpis"
      >

        {
          indicadores.map(
            (
              indicador,
            ) => (
              <article
                className={
                  `dashboard-kpi-card dashboard-kpi-${indicador.classe}`
                }
                key={
                  indicador.titulo
                }
              >

                <div
                  className="dashboard-kpi-main"
                >

                  <div
                    className="dashboard-kpi-icon"
                  >
                    <KpiGlyph
                      tipo={
                        indicador.tipo
                      }
                    />
                  </div>


                  <div
                    className="dashboard-kpi-copy"
                  >

                    <span>
                      {
                        indicador.titulo
                      }
                    </span>

                    <strong>
                      {
                        indicador.valor
                      }
                    </strong>

                    <div
                      className="dashboard-kpi-variation"
                    >
                      <b>
                        ↑ {
                          indicador.variacao
                        }
                      </b>

                      <small>
                        {
                          indicador.descricao
                        }
                      </small>
                    </div>

                  </div>

                </div>


                <div
                  className="dashboard-kpi-menu-wrapper"
                >
                  <button
                    type="button"
                    className="dashboard-kpi-more"
                    aria-label={
                      `Opções de ${indicador.titulo}`
                    }
                    aria-expanded={
                      menuKpiAberto ===
                      indicador.titulo
                    }
                    onClick={
                      () =>
                        abrirMenuKpi(
                          indicador.titulo,
                        )
                    }
                  >
                    •••
                  </button>

                  {
                    menuKpiAberto ===
                    indicador.titulo
                      ? (
                          <div
                            className="dashboard-kpi-menu"
                          >
                            <button
                              type="button"
                              onClick={
                                () =>
                                  executarAcaoKpi(
                                    indicador,
                                    'abrir',
                                  )
                              }
                            >
                              {indicador.menuRotulo}
                            </button>

                            <button
                              type="button"
                              onClick={
                                () =>
                                  executarAcaoKpi(
                                    indicador,
                                    'atualizar',
                                  )
                              }
                            >
                              Atualizar indicador
                            </button>
                          </div>
                        )
                      : null
                  }
                </div>


                <div
                  className="dashboard-kpi-chart"
                >
                  {
                    indicador.graficoTipo ===
                    'line'
                      ? (
                          <MiniLine
                            valores={
                              indicador.grafico
                            }
                          />
                        )
                      : (
                          <MiniBars
                            valores={
                              indicador.grafico
                            }
                            classe={
                              indicador.classe
                            }
                          />
                        )
                  }
                </div>

              </article>
            ),
          )
        }

      </section>


      <section
        className="dashboard-flow-card"
      >

        <div
          className="dashboard-flow-header"
        >

          <div
            className="dashboard-section-title"
          >

            <div
              className="dashboard-section-icon"
            >
              <FlowGlyph />
            </div>

            <div>

              <h3>
                Fluxo de Estoque
              </h3>

              <p>
                Entradas x Saídas nos últimos {
                  periodoGrafico ===
                  365
                    ? '12 meses'
                    : `${periodoGrafico} dias`
                }
              </p>

            </div>

          </div>


          <div
            className="dashboard-flow-actions"
          >

            <div
              className="dashboard-chart-legend"
            >
              <span>
                <i className="entry"></i>
                Entradas
              </span>

              <span>
                <i className="exit"></i>
                Saídas
              </span>
            </div>


            <div
              className="dashboard-period"
            >
              {
                [
                  {
                    label:
                      '7D',
                    dias:
                      7,
                  },
                  {
                    label:
                      '30D',
                    dias:
                      30,
                  },
                  {
                    label:
                      '90D',
                    dias:
                      90,
                  },
                  {
                    label:
                      '1A',
                    dias:
                      365,
                  },
                ].map(
                  (
                    item,
                  ) => (
                    <button
                      type="button"
                      key={
                        item.label
                      }
                      className={
                        periodoGrafico ===
                        item.dias
                          ? 'active'
                          : ''
                      }
                      onClick={
                        () =>
                          setPeriodoGrafico(
                            item.dias,
                          )
                      }
                    >
                      {
                        item.label
                      }
                    </button>
                  ),
                )
              }

              <button
                type="button"
                className="calendar-button"
                title={
                  formatarDataCabecalho()
                }
              >
                <CalendarGlyph />
              </button>

            </div>

          </div>

        </div>


        <div
          className="dashboard-flow-chart"
        >

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <AreaChart
              data={
                fluxoEstoque
              }
              margin={{
                top:
                  8,
                right:
                  12,
                left:
                  -16,
                bottom:
                  0,
              }}
            >

              <defs>

                <linearGradient
                  id="gradientEntradas10A"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--chart-entry)"
                    stopOpacity={
                      0.34
                    }
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-entry)"
                    stopOpacity={
                      0.02
                    }
                  />
                </linearGradient>

                <linearGradient
                  id="gradientSaidas10A"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--chart-exit)"
                    stopOpacity={
                      0.32
                    }
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-exit)"
                    stopOpacity={
                      0.02
                    }
                  />
                </linearGradient>

                <filter
                  id="flowGlowEntradas"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur
                    stdDeviation="2.2"
                    result="blur"
                  />

                  <feMerge>
                    <feMergeNode
                      in="blur"
                    />

                    <feMergeNode
                      in="SourceGraphic"
                    />
                  </feMerge>
                </filter>


                <filter
                  id="flowGlowSaidas"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur
                    stdDeviation="2.0"
                    result="blur"
                  />

                  <feMerge>
                    <feMergeNode
                      in="blur"
                    />

                    <feMergeNode
                      in="SourceGraphic"
                    />
                  </feMerge>
                </filter>

              </defs>


              <CartesianGrid
                stroke="var(--chart-grid)"
                strokeDasharray="3 3"
                strokeWidth={
                  0.9
                }
                opacity={
                  0.82
                }
              />


              <XAxis
                dataKey="data"
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                tick={{
                  fill:
                    'var(--text-muted)',
                  fontSize:
                    11,
                }}
                interval="preserveStartEnd"
                dy={
                  8
                }
              />


              <YAxis
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                allowDecimals={
                  false
                }
                tick={{
                  fill:
                    'var(--text-muted)',
                  fontSize:
                    11,
                }}
              />


              <Tooltip
                cursor={{
                  stroke:
                    'rgba(132, 176, 215, 0.74)',
                  strokeWidth:
                    1,
                  strokeDasharray:
                    '4 4',
                }}
                content={
                  <DashboardFlowTooltip />
                }
              />


              <Area
                type="monotone"
                dataKey="entradas"
                name="Entradas"
                stroke="var(--chart-entry)"
                strokeWidth={
                  2.55
                }
                fill="url(#gradientEntradas10A)"
                filter="url(#flowGlowEntradas)"
                dot={
                  <DashboardFlowDot
                    tipo="entrada"
                  />
                }
                activeDot={
                  <DashboardFlowActiveDot
                    tipo="entrada"
                  />
                }
              />


              <Area
                type="monotone"
                dataKey="saidas"
                name="Saídas"
                stroke="var(--chart-exit)"
                strokeWidth={
                  2.55
                }
                fill="url(#gradientSaidas10A)"
                filter="url(#flowGlowSaidas)"
                dot={
                  <DashboardFlowDot
                    tipo="saida"
                  />
                }
                activeDot={
                  <DashboardFlowActiveDot
                    tipo="saida"
                  />
                }
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </section>


      <section
        className="dashboard-lower-grid"
      >

        <article
          className="dashboard-data-card"
        >

          <div
            className="dashboard-data-header"
          >

            <div
              className="dashboard-section-title"
            >

              <div
                className="dashboard-section-icon"
              >
                <DocumentGlyph />
              </div>

              <div>

                <h3>
                  Pedidos Recentes
                </h3>

                <p>
                  Últimos pedidos feitos pelos seus clientes
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={
                () =>
                  navigate(
                    '/pedidos',
                  )
              }
            >
              Ver tudo
            </button>

          </div>


          <div
            className="dashboard-orders-table-wrap"
            role="region" aria-label="Pedidos recentes com rolagem" tabIndex={0}
          >

            <table
              className="dashboard-orders-table"
            >

              <thead>

                <tr>
                  <th>
                    Pedido
                  </th>
                  <th>
                    Cliente
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    Data
                  </th>
                  <th className="right">
                    Total
                  </th>
                </tr>

              </thead>


              <tbody>

                {
                  pedidosRecentes.length ===
                    0
                    ? (
                        <tr>
                          <td
                            colSpan="5"
                            className="dashboard-empty"
                          >
                            Nenhum pedido registrado.
                          </td>
                        </tr>
                      )
                    : pedidosRecentes.map(
                        (
                          pedido,
                        ) => (
                          <tr
                            key={
                              pedido.id
                            }
                          >
                            <td
                              className="dashboard-order-id"
                            >
                              {
                                pedido.id
                              }
                            </td>

                            <td title={pedido.cliente}>
                              {
                                pedido.cliente
                              }
                            </td>

                            <td>
                              <span
                                className={
                                  `dashboard-order-status ${pedido.classe}`
                                }
                              >
                                {
                                  pedido.status
                                }
                              </span>
                            </td>

                            <td
                              className="muted"
                              title={pedido.data}
                            >
                              {
                                pedido.data
                              }
                            </td>

                            <td
                              className="right strong"
                              title={pedido.total}
                            >
                              {
                                pedido.total
                              }
                            </td>


                          </tr>
                        ),
                      )
                }

              </tbody>

            </table>

          </div>

        </article>


        <article
          className="dashboard-data-card"
        >

          <div
            className="dashboard-data-header"
          >

            <div
              className="dashboard-section-title"
            >

              <div
                className="dashboard-section-icon warning"
              >
                <BellGlyph />
              </div>

              <div>

                <h3>
                  Alertas
                </h3>

                <p>
                  Notificações do sistema e atualizações importantes
                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={
                () =>
                  navigate(
                    '/estoque',
                  )
              }
            >
              Ver tudo
            </button>

          </div>


          <div
            className="dashboard-alert-list"
            role="region" aria-label="Alertas com rolagem" tabIndex={0}
          >

            {
              alertas.length ===
                0
                ? (
                    <div
                      className="dashboard-alert-item"
                    >

                      <div
                        className="dashboard-alert-icon success"
                      >
                        ✓
                      </div>

                      <p>
                        Nenhum produto está abaixo do estoque mínimo.
                      </p>

                    </div>
                  )
                : alertas.map(
                    (
                      alerta,
                      index,
                    ) => (
                      <div
                        className="dashboard-alert-item"
                        key={
                          `${alerta.produto}-${index}`
                        }
                      >

                        <div
                          className="dashboard-alert-icon"
                        >
                          <AlertGlyph />
                        </div>

                        <p>
                          Produto
                          <strong>
                            {' "'}{
                              alerta.produto
                            }{'" '}
                          </strong>
                          está abaixo do estoque mínimo
                          <span>
                            {' '}({
                              alerta.minimo
                            } un.)
                          </span>
                        </p>

                        <small>
                          {
                            alerta.tempo
                          }
                        </small>

                      </div>
                    ),
                  )
            }

          </div>

        </article>

      </section>

    </main>
  )
}


export default Dashboard
