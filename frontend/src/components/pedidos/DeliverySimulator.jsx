import { useEffect, useId, useState } from 'react'
import { Icon } from '../ReferenceUI'
import { createSimulation, startSimulation, pauseSimulation, snapshotSimulation, routePosition, routeDistance, ROUTE } from '../../data/deliverySimulation'
import './DeliverySimulator.css'

const time = value => value == null ? '—' : new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
function readState(key) {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(key))
    if (saved && [30000,90000,180000].includes(saved.durationMs) && Number.isFinite(saved.elapsedMs) && saved.elapsedMs >= 0 &&
        (saved.startedAt === null || Number.isFinite(saved.startedAt)) && (saved.originAt === null || Number.isFinite(saved.originAt)) && typeof saved.initiated === 'boolean') return saved
  } catch { /* Armazenamento indisponível: a demonstração continua em memória. */ }
  return createSimulation()
}

export default function DeliverySimulator({ pedido }) {
  const key = `logiflow_delivery_simulation_v1:${pedido.codigo}`
  const [state, setState] = useState(() => readState(key))
  const [now, setNow] = useState(() => Date.now())
  const mapId = useId().replaceAll(':', '')
  const distance = routeDistance(pedido.codigo)
  const snapshot = snapshotSimulation(state, now, distance)
  const [x, y] = routePosition(snapshot.progress)
  useEffect(() => {
    try { window.sessionStorage.setItem(key, JSON.stringify(state)) } catch { /* Sem persistência, sem bloquear o mapa. */ }
  }, [key, state])
  useEffect(() => {
    if (!snapshot.running) return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [snapshot.running])
  const advance = () => {
    const instant = Date.now()
    setNow(instant)
    setState(previous => snapshotSimulation(previous, instant).running ? pauseSimulation(previous, instant) : startSimulation(previous, instant))
  }
  const restart = () => {
    const instant = Date.now()
    setNow(instant)
    setState(previous => startSimulation(createSimulation(previous.durationMs), instant))
  }
  return <section className="lf-delivery-simulator" aria-label="Simulador de entrega">
    <div className="lf-sim-title"><span className="lf-sim-badge">SIMULAÇÃO</span><span>{snapshot.completed ? 'Concluída' : snapshot.running ? 'Em movimento' : state.initiated ? 'Pausada' : 'Pronta para iniciar'}</span></div>
    <p className="lf-sim-notice">Rota e horários demonstrativos. O veículo avança sozinho; a simulação não altera o pedido nem o estoque.</p>
    <div className="lf-sim-map">
      <svg viewBox="0 0 600 330" role="img" aria-label={`Mapa esquemático da entrega simulada: ${Math.round(snapshot.progress * 100)}% do trajeto`}>
        <defs><pattern id={`${mapId}-grid`} width="42" height="42" patternUnits="userSpaceOnUse"><path d="M 42 0 L 0 0 0 42" fill="none" stroke="#17334b" strokeWidth="1" /></pattern><filter id={`${mapId}-glow`}><feGaussianBlur stdDeviation="3" /></filter></defs>
        <rect width="600" height="330" fill="#061625" /><rect width="600" height="330" fill={`url(#${mapId}-grid)`} />
        <path d="M-20 90L250 40L420 250L650 280 M20 350L180 20 M-30 220L610 200 M330 350L460 0" stroke="#274259" strokeWidth="12" fill="none" opacity=".5" />
        <polyline points={ROUTE.map(point => point.join(',')).join(' ')} fill="none" stroke="#255270" strokeWidth="7" strokeLinejoin="round" />
        <polyline points={ROUTE.map(point => point.join(',')).join(' ')} pathLength="100" fill="none" stroke="#00d5fa" strokeWidth="5" strokeDasharray={`${snapshot.progress * 100} 100`} strokeLinejoin="round" />
        <circle cx="48" cy="265" r="7" fill="#00d5fa" /><text x="24" y="300" fill="#adcadc" fontSize="14">Centro de distribuição</text>
        <path d="M550 43C537 43 531 60 550 80C569 60 563 43 550 43Z" fill="#ff5375" /><circle cx="550" cy="56" r="4" fill="#071623" /><text x="495" y="30" fill="#d2e6f5" fontSize="14">Destino</text>
        <circle cx={x} cy={y} r="21" fill="#00c9ee" opacity=".35" filter={`url(#${mapId}-glow)`} />
        <g transform={`translate(${x - 18},${y - 13})`} fill="#00d5fa" stroke="#062334" strokeWidth="2"><rect width="24" height="22" rx="3" /><path d="M24 7H31L37 15V22H24Z" /><circle cx="8" cy="23" r="4" /><circle cx="29" cy="23" r="4" /></g>
        <text x="20" y="28" fill="#91aec6" fontSize="12">MAPA ESQUEMÁTICO • SEM GPS</text>
      </svg>
      <div className="lf-sim-destination"><Icon name="truck" size={16} /><span>{pedido.destino || 'Destino do pedido'}</span></div>
    </div>
    <div className="lf-sim-progress" role="progressbar" aria-label="Progresso da entrega simulada" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(snapshot.progress * 100)}><span style={{width:`${snapshot.progress * 100}%`}} /></div>
    <div className="lf-sim-metrics"><div><small>Trajeto simulado</small><strong>{snapshot.travelledKm.toFixed(1)} / {distance} km</strong></div><div><small>Faltam na simulação</small><strong>{snapshot.remainingMinutes} min</strong></div><div><small>Chegada simulada</small><strong>{time(snapshot.eta)}</strong></div></div>
    <div className="lf-sim-controls"><button type="button" onClick={snapshot.completed ? restart : advance}>{snapshot.completed ? 'Repetir simulação' : snapshot.running ? 'Pausar simulação' : state.initiated ? 'Continuar simulação' : 'Iniciar simulação'}</button>
      <label>Duração<select aria-label="Duração da simulação" value={state.durationMs} disabled={state.initiated} onChange={event => setState(createSimulation(Number(event.target.value)))}><option value={30000}>30 segundos</option><option value={90000}>90 segundos</option><option value={180000}>3 minutos</option></select></label>
      {state.initiated && <button type="button" className="lf-sim-reset" onClick={() => { setNow(Date.now()); setState(createSimulation(state.durationMs)) }}>Limpar simulação</button>}
    </div>
    <h4>Eventos automáticos da simulação <small>Relógio: {time(snapshot.clock)}</small></h4>
    {snapshot.events.length ? <ol className="lf-order-events lf-sim-events">{[...snapshot.events].reverse().map(event => <li key={event.progress}><strong>{event.title}</strong><time>{time(event.at)} · horário simulado</time><span>{event.description}</span></li>)}</ol> : <p>Inicie para acompanhar coleta, saída, trânsito, aproximação e entrega automaticamente.</p>}
  </section>
}
