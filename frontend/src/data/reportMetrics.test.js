import assert from 'node:assert/strict'
import { calcularGiro, calcularTempos } from './reportMetrics.js'

const buckets = [{ inicio: '2026-09-01T00:00:00Z', fim: '2026-09-30T23:59:59Z', label: 'Setembro' }]
const movs = [
  { tipo: 'saida', quantidade: 40, criado_em: '2026-09-10T12:00:00Z' },
  { tipo: 'entrada', quantidade: 20, criado_em: '2026-10-01T12:00:00Z' },
]
// Atual 80, setembro encerrou com 60, começou com 100; giro 40/80.
assert.equal(calcularGiro([{ estoque_atual: 80 }], movs, buckets)[0].giro, 0.5)
assert.deepEqual(calcularGiro([], movs, buckets), [])
assert.equal(calcularGiro([{ estoque_atual: 0 }], [], buckets)[0].giro, null)
assert.equal(calcularGiro([{ estoque_atual: 0 }], [{ tipo: 'entrada', quantidade: 10, criado_em: '2026-09-02' }], buckets)[0].giro, null)

const tempos = calcularTempos([
  { status: 'entregue', transportadora: 'A', criado_em: '2026-09-01T00:00:00Z', entregue_em: '2026-09-01T00:30:00Z' },
  { status: 'entregue', transportadora: 'A', criado_em: '2026-09-01T00:00:00Z', entregue_em: '2026-09-01T01:30:00Z' },
  { status: 'pendente', transportadora: 'A', criado_em: '2026-09-01T00:00:00Z', entregue_em: '2026-09-10T00:00:00Z' },
  { status: 'entregue', transportadora: 'B', criado_em: 'inválida', entregue_em: 'inválida' },
  { status: 'entregue', transportadora: 'B', criado_em: '2026-09-02', entregue_em: '2026-09-01' },
])
assert.deepEqual(tempos, [{ nome: 'A', horas: 1, quantidade: 2 }])
assert.deepEqual(calcularTempos([]), [])
assert.deepEqual(calcularTempos([{status:'entregue',criado_em:'2026-09-01',atualizado_em:'2026-09-02'}]), [])
assert.deepEqual(calcularTempos([{status:'entregue',transportadora:'C',criado_em:'2026-09-01T00:00:00Z',entregue_em:'2026-09-01T01:00:00Z',atualizado_em:'2026-10-01T00:00:00Z'}]), [{nome:'C',horas:1,quantidade:1}])
console.log('Métricas: 8 verificações aprovadas (giro, ausência de dados, datas inválidas, pedidos entregues e média).')
