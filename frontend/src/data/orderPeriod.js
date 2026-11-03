export function localDate(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export const invalidPeriod = period => Boolean(period.inicio && period.fim && period.inicio > period.fim)
export function orderInPeriod(order, period) {
  if (invalidPeriod(period)) return false
  if (!period.inicio && !period.fim) return true
  if (!order.criado_em) return false
  const date = localDate(order.criado_em)
  return Boolean(date && (!period.inicio || date >= period.inicio) && (!period.fim || date <= period.fim))
}
export function recentPeriod(days, now = new Date()) {
  const from = new Date(now)
  from.setDate(from.getDate() - days + 1)
  return { inicio: localDate(from), fim: localDate(now) }
}
