// Relógio acelerado de demonstração. Nenhuma função grava no backend.
export const ROUTE = [[48,265],[105,265],[131,214],[202,214],[227,172],[317,172],[360,116],[431,116],[469,62],[550,62]]
export const STAGES = [
  { progress: 0, title: 'Pedido coletado', description: 'Veículo saiu para a rota demonstrativa.' },
  { progress: 0.12, title: 'Saída do centro de distribuição', description: 'Carga liberada na simulação.' },
  { progress: 0.28, title: 'Em rota', description: 'Veículo avançando automaticamente pelo trajeto.' },
  { progress: 0.8, title: 'Próxima parada: destino', description: 'Aproximação final da entrega simulada.' },
  { progress: 1, title: 'Entrega simulada concluída', description: 'O status real do pedido permanece inalterado.' },
]
export const createSimulation = (durationMs = 90000) => ({ durationMs, elapsedMs: 0, startedAt: null, originAt: null, initiated: false })
const elapsed = (state, now) => Math.min(state.durationMs, Math.max(0, state.elapsedMs + (state.startedAt == null ? 0 : Math.max(0, now - state.startedAt))))
export function startSimulation(state, now) {
  if (elapsed(state, now) >= state.durationMs || state.startedAt != null) return state
  return { ...state, initiated: true, originAt: state.originAt ?? now, startedAt: now }
}
export function pauseSimulation(state, now) {
  return { ...state, elapsedMs: elapsed(state, now), startedAt: null }
}
export function snapshotSimulation(state, now, distanceKm = 80) {
  const progress = elapsed(state, now) / state.durationMs
  const virtualMinutes = distanceKm / 40 * 60
  const events = state.initiated ? STAGES.filter(stage => stage.progress <= progress).map(stage => ({ ...stage,
    at: state.originAt + stage.progress * virtualMinutes * 60000 })) : []
  return { progress, events, completed: progress >= 1, running: state.startedAt != null && progress < 1,
    travelledKm: distanceKm * progress, remainingMinutes: Math.ceil(virtualMinutes * (1 - progress)),
    eta: state.originAt == null ? null : state.originAt + virtualMinutes * 60000,
    clock: state.originAt == null ? null : state.originAt + progress * virtualMinutes * 60000 }
}
export function routePosition(progress) {
  const lengths = ROUTE.slice(1).map((point, index) => Math.hypot(point[0] - ROUTE[index][0], point[1] - ROUTE[index][1]))
  let distance = lengths.reduce((sum, length) => sum + length, 0) * Math.max(0, Math.min(1, progress))
  for (let index = 0; index < lengths.length; index += 1) {
    if (distance <= lengths[index]) {
      const ratio = distance / lengths[index]
      return ROUTE[index].map((coordinate, axis) => coordinate + (ROUTE[index + 1][axis] - coordinate) * ratio)
    }
    distance -= lengths[index]
  }
  return ROUTE.at(-1)
}
export const routeDistance = code => 32 + [...String(code)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 97
