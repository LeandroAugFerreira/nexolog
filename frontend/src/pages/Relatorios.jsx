// ============================================================
// NEXOLOG
// RELATÓRIOS & AUDITORIA
// ============================================================

import { rotuloCategoria } from '../data/categorias'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'


import {
  listarRelatorios,
  obterRelatorio,
  salvarRelatorio,
  listarAuditoria,
  listarMovimentacoes,
  listarPedidos,
  listarProdutos,
} from '../services/api'

import './Relatorios.css'
import './ReferencePages.css'
import { Icon } from '../components/ReferenceUI'
import { calcularGiro, calcularTempos, pedidoValido } from '../data/reportMetrics'


// ============================================================
// CONFIGURAÇÕES
// ============================================================





// ============================================================
// AUXILIARES
// ============================================================

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
      valor || 0,
    ),
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

  const data =
    new Date(
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


function normalizarStatus(
  status,
) {
  const valor =
    String(
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

  if (valor === 'cancelado' || valor === 'devolvido') return valor
  return 'pendente'
}


function estaNoPeriodo(
  valorData,
  periodo,
) {
  if (
    periodo === 'todos'
  ) {
    return true
  }

  if (
    !valorData
  ) {
    return false
  }

  const data =
    new Date(
      valorData,
    )

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return false
  }

  const hoje =
    new Date()

  if (String(periodo).startsWith('ano-')) return data.getFullYear() === Number(periodo.slice(4))

  const dias =
    Number(
      periodo,
    )

  const inicio =
    new Date(
      hoje,
    )

  inicio.setDate(
    inicio.getDate() - dias,
  )

  inicio.setHours(
    0,
    0,
    0,
    0,
  )

  return (
    data >= inicio
  )
}


function rotuloPeriodo(
  periodo,
) {
  if (String(periodo).startsWith('ano-')) {
    const ano = periodo.slice(4)
    return { titulo: `Ano ${ano}`, descricao: `no ano de ${ano}`, arquivo: `ano-${ano}` }
  }
  if (
    periodo ===
    'todos'
  ) {
    return {
      titulo:
        'Todo o período',

      descricao:
        'em todo o período',

      arquivo:
        'todo-periodo',
    }
  }

  const dias =
    Number(
      periodo,
    )

  return {
    titulo:
      `Últimos ${dias} dias`,

    descricao:
      `nos últimos ${dias} dias`,

    arquivo:
      `${dias}-dias`,
  }
}


function diferencaDias(
  inicio,
  fim,
) {
  if (
    !inicio ||
    !fim
  ) {
    return 0
  }

  const dataInicio =
    new Date(
      inicio,
    )

  const dataFim =
    new Date(
      fim,
    )

  if (
    Number.isNaN(
      dataInicio.getTime(),
    ) ||
    Number.isNaN(
      dataFim.getTime(),
    )
  ) {
    return 0
  }

  const diferenca =
    Math.max(
      0,
      dataFim.getTime() -
      dataInicio.getTime(),
    )

  return (
    diferenca /
    (
      1000 *
      60 *
      60 *
      24
    )
  )
}


function escaparCsv(
  valor,
) {
  return (
    `"${String(
      valor ?? '',
    ).replaceAll(
      '"',
      '""',
    )}"`
  )
}


function baixarTexto(
  conteudo,
  nomeArquivo,
  tipo =
    'text/csv;charset=utf-8;',
) {
  const blob =
    new Blob(
      [
        '\uFEFF',
        conteudo,
      ],
      {
        type: tipo,
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

  link.href =
    url

  link.download =
    nomeArquivo

  document.body.appendChild(
    link,
  )

  link.click()

  link.remove()

  URL.revokeObjectURL(
    url,
  )
}





// ============================================================
// GRÁFICO DE BARRAS - FLUXO DE ESTOQUE
// ============================================================




// ============================================================
// GRÁFICO DE STATUS
// ============================================================




// ============================================================
// GRÁFICO - VALOR POR CLIENTE
// ============================================================





// ============================================================
// LOTE 12 - GRÁFICOS DO MOCKUP AZUL
// ============================================================

function TooltipGrafico({
  active,
  payload,
  label,
  sufixo = '',
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null
  }

  return (
    <div
      className="relatorio-chart-tooltip"
    >
      <strong>
        {label}
      </strong>

      {
        payload.map(
          (
            item,
          ) => (
            <span
              key={
                item.dataKey
              }
            >
              {item.name}: <b>{item.value}{sufixo}</b>
            </span>
          ),
        )
      }
    </div>
  )
}


function GraficoGiroEstoque({
  dados,
}) {
  return (
    <div
      className="relatorio-visual-chart"
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={
            dados
          }
          margin={{
            top: 12,
            right: 12,
            left: -18,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient
              id="relatorioGiroFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="var(--accent)"
                stopOpacity="0.24"
              />
              <stop
                offset="100%"
                stopColor="var(--accent)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="var(--chart-grid)"
            strokeDasharray="2 2"
            vertical
            opacity={0.52}
          />

          <XAxis
            dataKey="label"
            tick={{
              fill: 'var(--text-muted)',
              fontSize: 9,
            }}
            axisLine={{
              stroke: 'var(--border)',
            }}
            tickLine={false}
          />

          <YAxis
            domain={[0, 'auto']}
            tick={{
              fill: 'var(--text-muted)',
              fontSize: 9,
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            content={
              <TooltipGrafico />
            }
          />

          <Area
            type="monotone"
            dataKey="giro"
            name="Giro"
            stroke="var(--accent)"
            strokeWidth={2.3}
            fill="url(#relatorioGiroFill)"
            dot={{
              r: 3,
              fill: 'var(--accent)',
              strokeWidth: 0,
            }}
            activeDot={{
              r: 5,
              fill: 'var(--accent)',
              stroke: 'var(--text-main)',
              strokeWidth: 1.5,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}


function GraficoTempoTransportadora({
  dados,
}) {
  return (
    <div
      className="relatorio-visual-chart"
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={
            dados
          }
          margin={{
            top: 18,
            right: 8,
            left: -16,
            bottom: 0,
          }}
        >
          <CartesianGrid
            stroke="var(--chart-grid)"
            strokeDasharray="2 2"
            vertical={false}
            opacity={0.52}
          />

          <XAxis
            dataKey="nome"
            interval={0}
            angle={-25}
            textAnchor="end"
            height={42}
            tickMargin={6}
            tickFormatter={nome => nome.length > 13 ? `${nome.slice(0, 12)}…` : nome}
            tick={{
              fill: 'var(--text-muted)',
              fontSize: 8,
            }}
            axisLine={{
              stroke: 'var(--border)',
            }}
            tickLine={false}
          />

          <YAxis
            tick={{
              fill: 'var(--text-muted)',
              fontSize: 9,
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            content={
              <TooltipGrafico
                sufixo="h"
              />
            }
          />

          <Bar
            dataKey="horas"
            name="Tempo"
            radius={[4, 4, 0, 0]}
          >
            {
              dados.map(
                (
                  item,
                  index,
                ) => (
                  <Cell
                    key={
                      item.nome
                    }
                    fill={
                      [
                        '#1fd7c5',
                        '#2678ef',
                        '#2e8cff',
                        '#7747ed',
                        '#3587f0',
                      ][
                        index % 5
                      ]
                    }
                  />
                ),
              )
            }
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


function GraficoReceitaCategoria({
  dados,
  total,
}) {
  const cores = [
    '#00bff5',
    '#7138ee',
    '#16c9cf',
    '#ffb23a',
    '#91a6c0',
  ]

  return (
    <div
      className="relatorio-receita-layout"
    >
      <div
        className="relatorio-donut-wrap"
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart>
            <Pie
              data={
                dados
              }
              dataKey="valor"
              nameKey="nome"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="78%"
              paddingAngle={0}
              stroke="none"
            >
              {
                dados.map(
                  (
                    item,
                    index,
                  ) => (
                    <Cell
                      key={
                        item.nome
                      }
                      fill={
                        cores[
                          index %
                          cores.length
                        ]
                      }
                    />
                  ),
                )
              }
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div
          className="relatorio-donut-center"
        >
          <strong>
            {
              formatarMoeda(
                total,
              )
                .replace(
                  ',00',
                  '',
                )
            }
          </strong>

          <span>
            Total
          </span>
        </div>
      </div>

      <div
        className="relatorio-receita-legenda"
        role="region" aria-label="Valores por categoria" tabIndex={0}
      >
        {
          dados.map(
            (
              item,
              index,
            ) => (
              <div
                key={
                  item.nome
                }
              >
                <i
                  style={{
                    background:
                      cores[
                        index %
                        cores.length
                      ],
                  }}
                />

                <span title={item.nome}>
                  {item.nome === 'Demais categorias' ? item.nome : rotuloCategoria(item.nome)}
                </span>

                <b>
                  {item.percentual}%
                </b>

                <small>
                  {
                    formatarMoeda(
                      item.valor,
                    )
                  }
                </small>
              </div>
            ),
          )
        }
      </div>
    </div>
  )
}


// ============================================================
// PÁGINA
// ============================================================

function Relatorios() {
  const [historicoExpandido, setHistoricoExpandido] = useState(false)
  const [auditoriaExpandida, setAuditoriaExpandida] = useState(false)

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
    auditoria,
    setAuditoria,
  ] = useState([])

  const [
    periodo,
    setPeriodo,
  ] = useState('30')

  const [
    carregando,
    setCarregando,
  ] = useState(true)

  const [
    erro,
    setErro,
  ] = useState('')

  const [
    toast,
    setToast,
  ] = useState('')

  const [historico, setHistorico] = useState([])
  const [exportando, setExportando] = useState(false)


  // ==========================================================
  // TOAST
  // ==========================================================

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
  // CARREGAR DADOS
  // ==========================================================

  useEffect(
    () => {
      let ativo =
        true

      let consultando = false
      async function carregar(silencioso = false) {
        if (consultando) return
        consultando = true
        try {
          if (!silencioso) setCarregando(
            true,
          )

          setErro(
            '',
          )

          const resultados =
            await Promise.allSettled([
              listarProdutos(),
              listarMovimentacoes(),
              listarPedidos(),
              listarAuditoria(),
              listarRelatorios(),
            ])

          if (
            !ativo
          ) {
            return
          }

          const [
            resultadoProdutos,
            resultadoMovimentacoes,
            resultadoPedidos,
            resultadoAuditoria,
            resultadoHistorico,
          ] =
            resultados

          setProdutos(
            resultadoProdutos.status ===
              'fulfilled' &&
            Array.isArray(
              resultadoProdutos.value,
            )
              ? resultadoProdutos.value
              : [],
          )

          setMovimentacoes(
            resultadoMovimentacoes.status ===
              'fulfilled' &&
            Array.isArray(
              resultadoMovimentacoes.value,
            )
              ? resultadoMovimentacoes.value
              : [],
          )

          setPedidos(
            resultadoPedidos.status ===
              'fulfilled' &&
            Array.isArray(
              resultadoPedidos.value,
            )
              ? resultadoPedidos.value
              : [],
          )





          setAuditoria(
            resultadoAuditoria.status ===
              'fulfilled' &&
            Array.isArray(
              resultadoAuditoria.value,
            )
              ? resultadoAuditoria.value
              : [],
          )

          setHistorico(resultadoHistorico.status === 'fulfilled' && Array.isArray(resultadoHistorico.value) ? resultadoHistorico.value : [])

          const falhas =
            resultados.filter(
              (
                resultado,
              ) =>
                resultado.status ===
                'rejected',
            )

          if (
            falhas.length >
            0
          ) {
            console.error(
              'Falhas ao carregar relatórios:',
              falhas,
            )

            setErro(
              'Algumas fontes de dados não puderam ser carregadas.',
            )
          }

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

      carregar()
      const timer = setInterval(() => { if (!document.hidden) carregar(true) }, 15000)

      return () => {
        clearInterval(timer)
        ativo =
          false
      }
    },
    [],
  )


  const periodoSelecionado =
    useMemo(
      () =>
        rotuloPeriodo(
          periodo,
        ),
      [
        periodo,
      ],
    )


  // ==========================================================
  // DADOS FILTRADOS
  // ==========================================================

  const pedidosPeriodo =
    useMemo(
      () =>
        pedidos.filter(
          (
            pedido,
          ) =>
            estaNoPeriodo(
              pedido.criado_em,
              periodo,
            ),
        ),
      [
        pedidos,
        periodo,
      ],
    )


  const movimentacoesPeriodo =
    useMemo(
      () =>
        movimentacoes.filter(
          (
            movimentacao,
          ) =>
            estaNoPeriodo(
              movimentacao.criado_em,
              periodo,
            ),
        ),
      [
        movimentacoes,
        periodo,
      ],
    )


  // ==========================================================
  // KPIS
  // ==========================================================

  const indicadores =
    useMemo(
      () => {
        const valorPedidos =
          pedidosPeriodo.reduce(
            (
              soma,
              pedido,
            ) =>
              soma +
              Number(
                (pedidoValido(pedido) ? pedido.valor_total : 0) ||
                0,
              ),
            0,
          )

        const entregues =
          pedidosPeriodo.filter(
            (
              pedido,
            ) =>
              normalizarStatus(
                pedido.status,
              ) ===
              'entregue',
          )

        const leadTimes =
          entregues.filter(pedido => pedido.entregue_em)
            .map(
              (
                pedido,
              ) =>
                diferencaDias(
                  pedido.criado_em,
                  pedido.entregue_em,
                ),
            )
            .filter(
              (
                valor,
              ) =>
                Number.isFinite(
                  valor,
                ),
            )

        const leadTimeMedio =
          leadTimes.length >
          0
            ? (
                leadTimes.reduce(
                  (
                    soma,
                    valor,
                  ) =>
                    soma +
                    valor,
                  0,
                ) /
                leadTimes.length
              )
            : 0

        const estoqueCritico =
          produtos.filter(
            (
              produto,
            ) =>
              Number(
                (produto.estoque_disponivel ?? produto.estoque_atual) ||
                0,
              ) <=
              Number(
                produto.estoque_minimo ||
                0,
              ),
          ).length

        return {
          valorPedidos,
          entregues:
            entregues.length,
          movimentacoes:
            movimentacoesPeriodo.length,
          leadTimeMedio,
          estoqueCritico,
        }
      },
      [
        pedidosPeriodo,
        movimentacoesPeriodo,
        produtos,
      ],
    )


  // ==========================================================
  // FLUXO DE ESTOQUE - PERÍODO SELECIONADO
  // ==========================================================

  const fluxoEstoque =
    useMemo(
      () => {
        const hoje =
          new Date()

        hoje.setHours(
          23,
          59,
          59,
          999,
        )

        let inicioPeriodo =
          new Date(
            hoje,
          )

        let totalDias =
          periodo ===
          'todos'
            ? 30
            : Number(
                periodo,
              )

        const ano = String(periodo).startsWith('ano-') ? Number(periodo.slice(4)) : null
        if (ano) {
          const fimAno = new Date(ano, 11, 31, 23, 59, 59, 999)
          if (fimAno < hoje) hoje.setTime(fimAno.getTime())
          inicioPeriodo = new Date(ano, 0, 1)
          totalDias = Math.max(1, Math.ceil((hoje - inicioPeriodo) / 86400000))
        }

        if (
          periodo ===
          'todos'
        ) {
          const datasValidas =
            movimentacoesPeriodo
              .map(
                (
                  movimentacao,
                ) =>
                  new Date(
                    movimentacao.criado_em,
                  ),
              )
              .filter(
                (
                  data,
                ) =>
                  !Number.isNaN(
                    data.getTime(),
                  ),
              )

          if (
            datasValidas.length >
            0
          ) {
            inicioPeriodo =
              new Date(
                Math.min(
                  ...datasValidas.map(
                    (
                      data,
                    ) =>
                      data.getTime(),
                  ),
                ),
              )

            inicioPeriodo.setHours(
              0,
              0,
              0,
              0,
            )

            totalDias =
              Math.max(
                1,
                Math.ceil(
                  (
                    hoje.getTime() -
                    inicioPeriodo.getTime()
                  ) /
                  (
                    1000 *
                    60 *
                    60 *
                    24
                  ),
                ) +
                1,
              )
          } else {
            inicioPeriodo.setDate(
              inicioPeriodo.getDate() -
              29,
            )

            inicioPeriodo.setHours(
              0,
              0,
              0,
              0,
            )
          }
        } else if (!ano) {
          inicioPeriodo.setDate(
            inicioPeriodo.getDate() -
            totalDias +
            1,
          )

          inicioPeriodo.setHours(
            0,
            0,
            0,
            0,
          )
        }

        const quantidadeBuckets =
          Math.min(
            15,
            totalDias,
          )

        const diasPorBucket =
          Math.max(
            1,
            Math.ceil(
              totalDias /
              quantidadeBuckets,
            ),
          )

        const buckets = []

        for (
          let indice = 0;
          indice < quantidadeBuckets;
          indice += 1
        ) {
          const inicioBucket =
            new Date(
              inicioPeriodo,
            )

          inicioBucket.setDate(
            inicioBucket.getDate() +
            (
              indice *
              diasPorBucket
            ),
          )

          if (
            inicioBucket >
            hoje
          ) {
            break
          }

          const fimBucket =
            new Date(
              inicioBucket,
            )

          fimBucket.setDate(
            fimBucket.getDate() +
            diasPorBucket -
            1,
          )

          if (
            fimBucket >
            hoje
          ) {
            fimBucket.setTime(
              hoje.getTime(),
            )
          }

          fimBucket.setHours(
            23,
            59,
            59,
            999,
          )

          const formatarDiaMes =
            (
              data,
            ) =>
              `${String(
                data.getDate(),
              ).padStart(
                2,
                '0',
              )}/${String(
                data.getMonth() +
                1,
              ).padStart(
                2,
                '0',
              )}`

          const label =
            diasPorBucket ===
            1
              ? formatarDiaMes(
                  inicioBucket,
                )
              : `${formatarDiaMes(
                  inicioBucket,
                )}–${formatarDiaMes(
                  fimBucket,
                )}`

          buckets.push({
            chave:
              `${indice}`,

            inicio:
              inicioBucket,

            fim:
              fimBucket,

            label,

            entrada:
              0,

            saida:
              0,
          })
        }

        movimentacoesPeriodo.forEach(
          (
            movimentacao,
          ) => {
            const data =
              new Date(
                movimentacao.criado_em,
              )

            if (
              Number.isNaN(
                data.getTime(),
              )
            ) {
              return
            }

            const bucket =
              buckets.find(
                (
                  item,
                ) =>
                  data >=
                    item.inicio &&
                  data <=
                    item.fim,
              )

            if (
              !bucket
            ) {
              return
            }

            const quantidade =
              Number(
                movimentacao.quantidade ||
                0,
              )

            if (
              movimentacao.tipo ===
              'entrada'
            ) {
              bucket.entrada +=
                quantidade
            }

            if (
              movimentacao.tipo ===
              'saida'
            ) {
              bucket.saida +=
                quantidade
            }
          },
        )

        return buckets
      },
      [
        movimentacoesPeriodo,
        periodo,
      ],
    )


  // ==========================================================
  // STATUS DOS PEDIDOS
  // ==========================================================

  const statusPedidos =
    useMemo(
      () => {
        const resultado = {
          pendente: 0,
          processando: 0,
          enviado: 0,
          entregue: 0,
        }

        pedidosPeriodo.filter(pedidoValido).forEach(
          (
            pedido,
          ) => {
            const status =
              normalizarStatus(
                pedido.status,
              )

            resultado[
              status
            ] +=
              1
          },
        )

        return resultado
      },
      [
        pedidosPeriodo,
      ],
    )


  // ==========================================================
  // VALOR POR CLIENTE
  // ==========================================================

  



// ==========================================================
// AUDITORIA / EVENTOS OPERACIONAIS
// ==========================================================

const eventosAuditoria =
  useMemo(
    () =>
      auditoria
        .filter(
          (
            registro,
          ) =>
            estaNoPeriodo(
              registro.criado_em,
              periodo,
            ),
        )
        .map(
          (
            registro,
          ) => {
            const acaoFormatada =
              String(
                registro.acao ||
                'evento',
              )
                .replaceAll(
                  '_',
                  ' ',
                )
                .replace(
                  /^./,
                  (
                    letra,
                  ) =>
                    letra.toUpperCase(),
                )

            const modulo =
              registro.modulo
                ? `${registro.modulo} • `
                : ''

            const referencia =
              registro.registro_referencia
                ? ` • ${registro.registro_referencia}`
                : ''

            return {
              id:
                `audit-${registro.id}`,

              usuario:
                registro.usuario_nome ||
                'Sistema',

              acao:
                `${modulo}${acaoFormatada}`,

              timestamp:
                registro.criado_em,

              detalhes:
                registro.detalhes ||
                `${registro.entidade || 'Registro'}${referencia}`,
            }
          },
        )
        .sort(
          (
            a,
            b,
          ) =>
            new Date(
              b.timestamp,
            ) -
            new Date(
              a.timestamp,
            ),
        )
        .slice(
          0,
          50,
        ),
    [
      auditoria,
      periodo,
    ],
  )



  // ==========================================================
  // DADOS VISUAIS DO MOCKUP
  // ==========================================================

  const giroEstoqueVisual = useMemo(() => movimentacoesPeriodo.length ? calcularGiro(produtos, movimentacoes, fluxoEstoque) : [], [produtos, movimentacoes, movimentacoesPeriodo, fluxoEstoque])
  const tempoTransportadoras = useMemo(() => calcularTempos(pedidosPeriodo.map(pedido => ({ ...pedido, status: normalizarStatus(pedido.status) }))), [pedidosPeriodo])
  const tempoMedioHoras = tempoTransportadoras.length ? tempoTransportadoras.reduce((soma, item) => soma + item.horas * item.quantidade, 0) / tempoTransportadoras.reduce((soma, item) => soma + item.quantidade, 0) : null

  const receitaCategorias =
    useMemo(
      () => {
        const produtoCategoria =
          new Map(
            produtos.map(
              (
                produto,
              ) => [
                produto.sku,
                produto.categoria ||
                'Outros',
              ],
            ),
          )

        const mapa =
          new Map()

        pedidosPeriodo.filter(pedidoValido).forEach(
          (
            pedido,
          ) => {
            const itens =
              Array.isArray(
                pedido.itens,
              )
                ? pedido.itens
                : []

            if (
              itens.length ===
              0
            ) {
              mapa.set(
                'Outros',
                (
                  mapa.get(
                    'Outros',
                  ) ||
                  0
                ) +
                Number(
                  (pedidoValido(pedido) ? pedido.valor_total : 0) ||
                  0,
                ),
              )

              return
            }

            itens.forEach(
              (
                item,
              ) => {
                const categoria =
                  produtoCategoria.get(
                    item.produto_sku,
                  ) ||
                  'Outros'

                const valor =
                  Number(
                    item.subtotal ??
                    (
                      Number(
                        item.quantidade ||
                        0,
                      ) *
                      Number(
                        item.valor_unitario ||
                        0,
                      )
                    ),
                  )

                mapa.set(
                  categoria,
                  (
                    mapa.get(
                      categoria,
                    ) ||
                    0
                  ) +
                  valor,
                )
              },
            )
          },
        )

        const total =
          Array.from(
            mapa.values(),
          ).reduce(
            (
              soma,
              valor,
            ) =>
              soma +
              valor,
            0,
          ) ||
          indicadores.valorPedidos ||
          1

        const ordenado =
          Array.from(
            mapa.entries(),
          )
            .map(
              (
                [
                  nome,
                  valor,
                ],
              ) => ({
                nome,
                valor,
              }),
            )
            .sort(
              (
                a,
                b,
              ) =>
                b.valor -
                a.valor,
            )

        const principais =
          ordenado.slice(
            0,
            4,
          )

        const outros =
          ordenado.slice(
            4,
          ).reduce(
            (
              soma,
              item,
            ) =>
              soma +
              item.valor,
            0,
          )

        if (
          outros >
          0
        ) {
          principais.push({
            nome:
              'Demais categorias',
            valor:
              outros,
          })
        }

        const base = principais

        return base.map(
          (
            item,
          ) => ({
            ...item,
            percentual:
              Math.round(
                (
                  item.valor /
                  total
                ) *
                100,
              ),
          }),
        )
      },
      [
        pedidosPeriodo,
        produtos,
        indicadores.valorPedidos,
      ],
    )


  const historicoVisual = useMemo(() => historicoExpandido ? historico : historico.slice(0, 8), [historico, historicoExpandido])

  // ==========================================================
  // HISTÓRICO DE RELATÓRIOS
  // ==========================================================

  async function salvarHistorico(registro) {
    const salvo = await salvarRelatorio({nome: registro.nome, arquivo: registro.arquivo,
      periodo: periodoSelecionado.titulo, conteudo: registro.conteudo})
    setHistorico(anteriores => [salvo, ...anteriores])
    return salvo
  }


  // ==========================================================
  // EXPORTAR RESUMO CSV
  // ==========================================================

  async function exportarResumoCsv() {
    if (carregando || erro || exportando) {
      mostrarToast(erro ? 'Algumas fontes falharam. Recarregue a tela antes de exportar.' : 'Aguarde o carregamento completo dos dados para exportar.')
      return
    }
    const linhas = [
      [
        'Período',
        periodoSelecionado.titulo,
      ],
      [],
      [
        'Indicador',
        'Valor',
      ],
      [
        'Valor dos Pedidos',
        indicadores.valorPedidos
          .toFixed(
            2,
          )
          .replace(
            '.',
            ',',
          ),
      ],
      [
        'Pedidos Entregues',
        indicadores.entregues,
      ],
      [
        'Movimentações de Estoque',
        indicadores.movimentacoes,
      ],
      [
        'Lead Time Médio (dias)',
        tempoMedioHoras == null ? 'Sem entregas com data confirmada' : (tempoMedioHoras / 24).toLocaleString('pt-BR', { maximumFractionDigits: 1 }),
      ],
      [
        'Produtos em Estoque Crítico',
        indicadores.estoqueCritico,
      ],
      [],
      [
        'Status',
        'Quantidade',
      ],
      [
        'Pendente',
        statusPedidos.pendente,
      ],
      [
        'Em Processamento',
        statusPedidos.processando,
      ],
      [
        'Enviado',
        statusPedidos.enviado,
      ],
      [
        'Entregue',
        statusPedidos.entregue,
      ],
    ]

    linhas.push(
      [],
      ['Giro de estoque estimado (unidades)', giroEstoqueVisual.at(-1)?.giro?.toLocaleString('pt-BR', { maximumFractionDigits: 3 }) ?? 'Indisponível'],
      ['Tempo médio de atendimento (horas)', tempoMedioHoras?.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) ?? 'Sem entregas com data confirmada'],
      [],
      ['Categoria', 'Valor dos pedidos', 'Participação (%)'],
      ...receitaCategorias.map(item => [item.nome, item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), item.percentual]),
    )

    const conteudo =
      linhas
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

    const data =
      new Date()

    const nomeArquivo =
      `relatorio-executivo-${periodoSelecionado.arquivo}-${data
        .toISOString()
        .slice(
          0,
          10,
        )}.csv`

    setExportando(true)
    try {
    const salvo = await salvarHistorico({
      nome:
        `Relatório Executivo • ${periodoSelecionado.titulo}`,

      formato:
        'CSV',

      gerado_em:
        data.toISOString(),

      arquivo:
        nomeArquivo,

      conteudo,
    })

    baixarTexto(salvo.conteudo, salvo.arquivo)

    mostrarToast(
      'Relatório executivo exportado com sucesso.',
    )
    } catch (error) { mostrarToast(error.message || 'Não foi possível gerar o relatório.') }
    finally { setExportando(false) }
  }


  // ==========================================================
  // EXPORTAR AUDITORIA CSV
  // ==========================================================

  async function exportarAuditoriaCsv() {
    if (exportando) return
    if (
      eventosAuditoria.length ===
      0
    ) {
      mostrarToast(
        'Não há eventos de auditoria no período selecionado.',
      )

      return
    }

    const linhas = [
      [
        'Usuário',
        'Ação',
        'Data/Hora',
        'Detalhes',
      ],
      ...eventosAuditoria.map(
        (
          evento,
        ) => [
          evento.usuario,
          evento.acao,
          formatarDataHora(
            evento.timestamp,
          ),
          evento.detalhes,
        ],
      ),
    ]

    const conteudo =
      linhas
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

    const data =
      new Date()

    const nomeArquivo =
      `audit-log-${periodoSelecionado.arquivo}-${data
        .toISOString()
        .slice(
          0,
          10,
        )}.csv`

    setExportando(true)
    try {
    const salvo = await salvarHistorico({
      nome:
        `Audit Log • ${periodoSelecionado.titulo}`,

      formato:
        'CSV',

      gerado_em:
        data.toISOString(),

      arquivo:
        nomeArquivo,

      conteudo,
    })

    baixarTexto(salvo.conteudo, salvo.arquivo)
    mostrarToast(
      'Audit Log exportado com sucesso.',
    )
    } catch (error) { mostrarToast(error.message || 'Não foi possível gerar o relatório.') }
    finally { setExportando(false) }
  }


  // ==========================================================
  // REBAIXAR RELATÓRIO DO HISTÓRICO
  // ==========================================================

  async function baixarHistorico(registro) {
    try {
      const salvo = await obterRelatorio(registro.id)
      baixarTexto(salvo.conteudo, salvo.arquivo)
      mostrarToast(`${salvo.nome} baixado novamente.`)
    } catch (error) { mostrarToast(error.message || 'Não foi possível baixar o relatório.') }
  }


  // ==========================================================
  // PDF / IMPRESSÃO
  // ==========================================================

  function imprimirRelatorio() {
    window.print()
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main
      className="content relatorios-page relatorios-reference-page"
    >

      {
        toast &&
        (
          <div
            className="relatorio-toast"
          >
            <span>✓</span>
            {toast}
          </div>
        )
      }


      <header
        className="relatorios-page-header"
      >

        <div>
          <h2>
            Relatórios e Auditoria
          </h2>

          <p>
            Acompanhe os principais indicadores, gere relatórios e monitore toda a rastreabilidade do sistema.
          </p>
        </div>


        <div
          className="relatorios-actions"
        >

          <select
            aria-label="Período dos relatórios"
            value={
              periodo
            }
            onChange={
              (
                event,
              ) =>
                setPeriodo(
                  event.target.value,
                )
            }
            className="relatorios-periodo"
          >
            <option value="7">
              Últimos 7 dias
            </option>

            <option value="30">
              Últimos 30 dias
            </option>

            <option value="90">
              Últimos 90 dias
            </option>

            <option value="todos">
              Todo o período
            </option>
            <option value="ano-2024">Ano 2024</option>
            <option value="ano-2025">Ano 2025</option>
            <option value="ano-2026">Ano 2026</option>
          </select>


          <button
            type="button"
            className="relatorios-button primary"
            onClick={
              exportarResumoCsv
            }
          >
            <Icon name="download" size={17} /> Exportar Dashboard
          </button>

        </div>

      </header>


      {
        erro &&
        (
          <div
            className="relatorios-error"
          >
            {erro}
          </div>
        )
      }


      <section
        className="relatorios-reference-charts"
        aria-label="Indicadores do período" aria-busy={carregando}
      >

        <article
          className="relatorio-reference-card giro"
        >
          <header>
            <div
              className="relatorio-reference-title"
            >
              <span
                className="relatorio-reference-icon"
              >
                <Icon name="chart" size={25} />
              </span>

              <div>
                <h3>
                  Taxa de Giro de Estoque
                </h3>

                <p>
                  Saídas ÷ estoque médio estimado, em unidades.
                </p>
              </div>
            </div>

            <button type="button" aria-label="Exportar resumo de giro de estoque" disabled={exportando} onClick={exportarResumoCsv}><Icon name="download" size={16} /></button>
          </header>

          <div
            className="relatorio-reference-metric"
          >
            <strong>
              {
                giroEstoqueVisual.at(-1)?.giro != null
                  ? giroEstoqueVisual.at(-1).giro.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 3 })
                  : '—'
              }
            </strong>

            <div>
              <b>Estimativa</b>
              <span>no período selecionado</span>
            </div>
          </div>

          {carregando ? <div className="lf-chart-empty" role="status">Carregando indicadores...</div> : giroEstoqueVisual.some(item => item.giro != null) ? (
          <GraficoGiroEstoque
            dados={
              giroEstoqueVisual
            }
          />
          ) : <div className="lf-chart-empty">Sem movimentações ou saldo suficiente para estimar o giro.</div>}
        </article>


        <article
          className="relatorio-reference-card atendimento"
        >
          <header>
            <div
              className="relatorio-reference-title"
            >
              <span
                className="relatorio-reference-icon"
              >
                <Icon name="truck" size={25} />
              </span>

              <div>
                <h3>
                  Tempo médio até a entrega
                </h3>

                <p title="Pedidos sem data de entrega confirmada não entram na média.">
                  Da criação à entrega confirmada, em horas.
                </p>
              </div>
            </div>

            <button type="button" aria-label="Exportar resumo de atendimento de pedidos" disabled={exportando} onClick={exportarResumoCsv}><Icon name="download" size={16} /></button>
          </header>

          <div
            className="relatorio-reference-metric"
          >
            <strong>
              {
                tempoMedioHoras == null ? '—' : `${tempoMedioHoras.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h`
              }
            </strong>

            <div>
              <b>{tempoTransportadoras.reduce((soma, item) => soma + item.quantidade, 0)} com entrega confirmada</b>
              <span>no período selecionado</span>
            </div>
          </div>

          {carregando ? <div className="lf-chart-empty" role="status">Carregando indicadores...</div> : tempoTransportadoras.length > 0 ? (
          <GraficoTempoTransportadora
            dados={
              tempoTransportadoras
            }
          />
          ) : <div className="lf-chart-empty">Nenhum pedido entregue com data confirmada no período.</div>}
        </article>


        <article
          className="relatorio-reference-card receita"
        >
          <header>
            <div
              className="relatorio-reference-title"
            >
              <span
                className="relatorio-reference-icon"
              >
                <Icon name="pie" size={25} />
              </span>

              <div>
                <h3>
                  Valor dos pedidos por categoria
                </h3>

                <p>
                  Valor dos pedidos por categoria. Cancelamentos e devoluções são excluídos.
                </p>
              </div>
            </div>

            <button type="button" aria-label="Exportar resumo de receita por categoria" disabled={exportando} onClick={exportarResumoCsv}><Icon name="download" size={16} /></button>
          </header>

          <div
            className="relatorio-reference-metric"
          >
            <strong>
              {
                formatarMoeda(
                  indicadores.valorPedidos,
                )
              }
            </strong>

            <div>
              <b>{pedidosPeriodo.filter(pedidoValido).length} pedidos válidos</b>
              <span>no período selecionado</span>
            </div>
          </div>

          {carregando ? <div className="lf-chart-empty" role="status">Carregando indicadores...</div> : receitaCategorias.length > 0 ? (
          <GraficoReceitaCategoria
            dados={
              receitaCategorias
            }
            total={
              indicadores.valorPedidos
            }
          />
          ) : <div className="lf-chart-empty">Nenhum pedido no período selecionado.</div>}
        </article>

      </section>


      <div className="lf-report-context"><span><Icon name="clock" size={15} /> {periodoSelecionado.titulo}</span><span>Histórico de exportações salvo no banco de dados.</span><button type="button" className="relatorio-link-button" onClick={imprimirRelatorio}>Imprimir / PDF</button><button type="button" className="relatorio-link-button" onClick={exportarAuditoriaCsv}>Exportar auditoria CSV</button></div>
      <section
        className="relatorios-reference-bottom"
      >

        <article
          className="relatorio-reference-table-card"
        >
          <header>
            <div
              className="relatorio-reference-title"
            >
              <span
                className="relatorio-reference-icon"
              ><Icon name="file" size={24} /></span>

              <div>
                <h3>
                  Histórico de Relatórios Gerados
                </h3>

                <p>
                  Visualize e baixe os relatórios gerados no sistema.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="relatorio-link-button"
              onClick={() => setHistoricoExpandido(!historicoExpandido)}
              aria-expanded={historicoExpandido}
            >
              {historicoExpandido ? 'Ver menos' : 'Ver todos'}
            </button>
          </header>

          <div
            className="relatorio-table-wrapper"
            role="region" aria-label="Histórico de relatórios com rolagem" tabIndex={0}
          >
            <table
              className="relatorio-table relatorio-reference-table"
            >
              <thead>
                <tr>
                  <th>Nome do Relatório</th>
                  <th>Data de Geração</th>
                  <th>Formato</th>
                  <th>Download</th>
                </tr>
              </thead>

              <tbody>
                {
                  historicoVisual.length === 0 && <tr><td colSpan="4" className="relatorio-vazio">Nenhum relatório gerado no sistema. Exporte o dashboard para iniciar o histórico.</td></tr>
                }
                {
                  historicoVisual.map(
                    (
                      registro,
                    ) => (
                      <tr
                        key={
                          registro.id
                        }
                      >
                        <td>
                          <span
                            className={
                              `relatorio-file-icon ${String(
                                registro.formato,
                              ).toLowerCase()}`
                            }
                          >
                            ▤
                          </span>

                          <div className="relatorio-history-name">
                            <strong title={registro.nome}>{registro.nome}</strong>
                            <small title={registro.periodo}>{registro.periodo || 'CSV'}</small>
                          </div>
                        </td>

                        <td>
                          {
                            formatarDataHora(
                              registro.gerado_em,
                            )
                          }
                        </td>

                        <td>
                          <span
                            className={
                              `relatorio-formato-badge ${String(
                                registro.formato,
                              ).toLowerCase()}`
                            }
                          >
                            {registro.formato}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="relatorio-download-button"
                            onClick={
                              () =>
                                baixarHistorico(
                                  registro,
                                )
                            }
                          >
                            <Icon name="download" size={14} /> Baixar
                          </button>
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
          className="relatorio-reference-table-card"
        >
          <header>
            <div
              className="relatorio-reference-title"
            >
              <span
                className="relatorio-reference-icon"
              ><Icon name="shield" size={24} /></span>

              <div>
                <h3>
                  Log de Auditoria de Dados
                </h3>

                <p>
                  Acompanhe todas as ações realizadas no sistema.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="relatorio-link-button"
              onClick={() => setAuditoriaExpandida(!auditoriaExpandida)}
              aria-expanded={auditoriaExpandida}
            >
              {auditoriaExpandida ? 'Ver menos' : 'Ver todos'}
            </button>
          </header>

          <div
            className="relatorio-table-wrapper"
            role="region" aria-label="Log de auditoria com rolagem" tabIndex={0}
          >
            <table
              className="relatorio-table relatorio-reference-table audit"
            >
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Ação</th>
                  <th>Data/Hora</th>
                  <th>Detalhes</th>
                </tr>
              </thead>

              <tbody>
                {
                  eventosAuditoria
                    .slice(
                      0,
                      auditoriaExpandida ? eventosAuditoria.length : 8,
                    )
                    .map(
                      (
                        evento,
                        index,
                      ) => (
                        <tr
                          key={
                            evento.id
                          }
                        >
                          <td>
                            <span
                              className={
                                `relatorio-user-avatar avatar-${index % 5}`
                              }
                            >
                              {
                                String(
                                  evento.usuario ||
                                  'S',
                                )
                                  .trim()
                                  .charAt(
                                    0,
                                  )
                                  .toUpperCase()
                              }
                            </span>

                            <strong>
                              {evento.usuario}
                            </strong>
                          </td>

                          <td>
                            {evento.acao}
                          </td>

                          <td>
                            {
                              formatarDataHora(
                                evento.timestamp,
                              )
                            }
                          </td>

                          <td>
                            {evento.detalhes}
                          </td>
                        </tr>
                      ),
                    )
                }

                {
                  eventosAuditoria.length ===
                  0 &&
                  (
                    <tr>
                      <td
                        colSpan="4"
                        className="relatorio-vazio"
                      >
                        Nenhum evento de auditoria encontrado no período.
                      </td>
                    </tr>
                  )
                }
              </tbody>
            </table>
          </div>
        </article>

      </section>

    </main>
  )

}


export default Relatorios
