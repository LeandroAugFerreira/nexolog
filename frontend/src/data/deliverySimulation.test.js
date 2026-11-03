import test from 'node:test'
import assert from 'node:assert/strict'
import { createSimulation, startSimulation, pauseSimulation, snapshotSimulation, routePosition, ROUTE, routeDistance } from './deliverySimulation.js'

test('Início e avanço automático usam relógio acelerado', () => {
  const initial = createSimulation(30000)
  assert.equal(snapshotSimulation(initial, 1000).events.length, 0)
  const started = startSimulation(initial, 1000)
  const snapshot = snapshotSimulation(started, 16000, 80)
  assert.equal(snapshot.progress, 0.5)
  assert.equal(snapshot.travelledKm, 40)
  assert.equal(snapshot.remainingMinutes, 60)
  assert.equal(snapshot.events.length, 3)
  assert.equal(initial.startedAt, null)
})
test('Pausa congela o progresso e continuar conserva o trecho percorrido', () => {
  const state = startSimulation(createSimulation(30000), 0)
  const paused = pauseSimulation(state, 9000)
  assert.equal(snapshotSimulation(paused, 90000).progress, 0.3)
  const resumed = startSimulation(paused, 90000)
  assert.equal(snapshotSimulation(resumed, 96000).progress, 0.5)
})
test('Conclusão limita progresso e gera entrega somente simulada', () => {
  const state = startSimulation(createSimulation(30000), 0)
  const snapshot = snapshotSimulation(state, 60000)
  assert.equal(snapshot.progress, 1)
  assert.equal(snapshot.running, false)
  assert.equal(snapshot.completed, true)
  assert.equal(snapshot.remainingMinutes, 0)
  assert.equal(snapshot.events.length, 5)
  assert.match(snapshot.events.at(-1).description, /status real.*inalterado/)
  assert.deepEqual(startSimulation(state, 60000), state)
})
test('Relógio retrocedendo não cria distância negativa', () => {
  const state = startSimulation(createSimulation(30000), 10000)
  assert.equal(snapshotSimulation(state, 0).progress, 0)
})
test('Estado serializado continua após recarregar sem depender de contador de quadros', () => {
  const state = JSON.parse(JSON.stringify(startSimulation(createSimulation(30000), 1000)))
  assert.equal(snapshotSimulation(state, 25000).progress, 0.8)
  assert.equal(snapshotSimulation(state, 35000).completed, true)
})
test('Posição do veículo respeita as pontas e interpola a rota', () => {
  assert.deepEqual(routePosition(-1), ROUTE[0])
  assert.deepEqual(routePosition(2), ROUTE.at(-1))
  const point = routePosition(0.5)
  assert.ok(point[0] > ROUTE[0][0] && point[0] < ROUTE.at(-1)[0])
  assert.equal(routeDistance('PED-002'), routeDistance('PED-002'))
  assert.ok(routeDistance('PED-002') >= 32 && routeDistance('PED-002') <= 128)
})
