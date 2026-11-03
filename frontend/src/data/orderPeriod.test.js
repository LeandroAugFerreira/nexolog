import assert from 'node:assert/strict'
import test from 'node:test'
import { localDate, invalidPeriod, orderInPeriod, recentPeriod } from './orderPeriod.js'
test('Sem datas mantém todos os pedidos, incluindo legados sem data', () => {
  assert.equal(orderInPeriod({}, {inicio:'',fim:''}), true)
  assert.equal(orderInPeriod({criado_em:'2001-01-01'}, {inicio:'',fim:''}), true)
})
test('Intervalo inclui o primeiro e o último dia inteiros', () => {
  const period = {inicio:'2026-09-01',fim:'2026-09-30'}
  assert.equal(orderInPeriod({criado_em:'2026-09-01T00:00:00'}, period), true)
  assert.equal(orderInPeriod({criado_em:'2026-09-30T23:59:59'}, period), true)
  assert.equal(orderInPeriod({criado_em:'2026-08-31T23:59:59'}, period), false)
  assert.equal(orderInPeriod({criado_em:'2026-10-01T00:00:00'}, period), false)
})
test('Permite filtrar a partir de uma data ou até uma data', () => {
  assert.equal(orderInPeriod({criado_em:'2026-09-20T12:00:00'}, {inicio:'2026-09-10',fim:''}), true)
  assert.equal(orderInPeriod({criado_em:'2026-09-20T12:00:00'}, {inicio:'',fim:'2026-09-19'}), false)
})
test('Intervalo invertido não exibe resultados enganosos', () => {
  const period = {inicio:'2026-10-01',fim:'2026-09-01'}
  assert.equal(invalidPeriod(period), true)
  assert.equal(orderInPeriod({criado_em:'2026-09-15'}, period), false)
})
test('Datas ausentes ou inválidas não entram em período escolhido', () => {
  assert.equal(orderInPeriod({}, {inicio:'2026-09-01',fim:''}), false)
  assert.equal(orderInPeriod({criado_em:'inválida'}, {inicio:'',fim:'2026-09-30'}), false)
})
test('Atalho de 30 dias atravessa o mês e inclui o dia atual', () => {
  const now = new Date(2026,9,2,12)
  assert.deepEqual(recentPeriod(30,now), {inicio:'2026-09-03',fim:'2026-10-02'})
  assert.equal(localDate(now), '2026-10-02')
  assert.equal(now.getDate(), 2)
})
