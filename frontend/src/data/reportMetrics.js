// Giro em unidades reconstruído a partir do saldo atual e das movimentações.
// É uma estimativa; o sistema ainda não possui snapshots de estoque por dia.
export function calcularGiro(produtos, movimentacoes, buckets) {
  if (!buckets.length || !produtos.length) return []
  const saldoAtual = produtos.reduce((soma, produto) => soma + Number(produto.estoque_atual || 0), 0)
  const skus = new Set(produtos.map(p => p.sku))
  const validas = movimentacoes.filter(item => skus.has(item.produto_sku) && ['entrada', 'saida'].includes(item.tipo) && Number.isFinite(new Date(item.criado_em).getTime()))
  const impacto = item => Number(item.quantidade || 0) * (item.tipo === 'entrada' ? 1 : -1)
  const inicio = new Date(buckets[0].inicio)
  const posterioresInicio = validas.filter(item => new Date(item.criado_em) >= inicio).reduce((soma, item) => soma + impacto(item), 0)
  const saldoInicial = saldoAtual - posterioresInicio
  return buckets.map(bucket => {
    const fim = new Date(bucket.fim)
    const posteriores = validas.filter(item => new Date(item.criado_em) > fim).reduce((soma, item) => soma + impacto(item), 0)
    const saldoFinal = saldoAtual - posteriores
    const saidas = validas.filter(item => item.tipo === 'saida' && new Date(item.criado_em) >= inicio && new Date(item.criado_em) <= fim).reduce((soma, item) => soma + Number(item.quantidade || 0), 0)
    const medio = (saldoInicial + saldoFinal) / 2
    return { label: bucket.label, giro: saldoInicial < 0 || saldoFinal < 0 || medio <= 0 ? null : Number((saidas / medio).toFixed(3)) }
  })
}

export function calcularTempos(pedidos) {
  const mapa = new Map()
  pedidos.filter(pedido => pedido.status === 'entregue').forEach(pedido => {
    const inicio = new Date(pedido.criado_em).getTime()
    if (!pedido.entregue_em) return
    const fim = new Date(pedido.entregue_em).getTime()
    if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim < inicio) return
    const nome = pedido.transportadora || 'Sem transportadora'
    const atual = mapa.get(nome) || { soma: 0, quantidade: 0 }
    atual.soma += (fim - inicio) / 3600000
    atual.quantidade += 1
    mapa.set(nome, atual)
  })
  return [...mapa].map(([nome, valor]) => ({ nome, horas: Number((valor.soma / valor.quantidade).toFixed(1)), quantidade: valor.quantidade })).sort((a, b) => a.horas - b.horas)
}

export const pedidoValido = pedido => !['cancelado', 'devolvido'].includes(pedido.status)
