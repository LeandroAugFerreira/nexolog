import { useEffect, useId, useState } from 'react'
import { Icon, Dialog } from '../ReferenceUI'
import { obterRastreamento, criarEntregaDemonstrativa } from '../../services/api'
import { ROUTE, routePosition } from '../../data/deliverySimulation'
import './ConnectedTracking.css'

const hora = value => value ? new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Após a expedição'
const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const titles = { criado: 'Pedido registrado', processando: 'Separação e conferência', enviado: 'Expedido', entregue: 'Entregue', cancelado: 'Cancelado', devolvido: 'Devolvido', sim_coletado: 'Pedido coletado', sim_saiu_cd: 'Saiu do centro de distribuição', sim_em_rota: 'Em rota', sim_proxima_parada: 'Próxima parada' }

export default function ConnectedTracking({ pedido, onAbrirDetalhes, onNovaEntrega }) {
  const [snapshot, setSnapshot] = useState(null)
  const [clock, setClock] = useState(() => Date.now())
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(1)
  const [criando, setCriando] = useState(false)
  const [detalhes, setDetalhes] = useState(false)
  const uid = useId().replaceAll(':', '')
  useEffect(() => {
    let ativo = true
    let consultando = false
    async function atualizar() {
      if (consultando) return
      consultando = true
      try {
        const dados = await obterRastreamento(pedido.codigo)
        if (ativo) { setSnapshot({ ...dados, recebido: Date.now() }); setError('') }
      } catch (e) { if (ativo) setError(e.message || 'Não foi possível atualizar a entrega.') }
      finally { consultando = false }
    }
    atualizar()
    const poll = setInterval(atualizar, 3000)
    const frames = setInterval(() => setClock(Date.now()), 150)
    return () => { ativo = false; clearInterval(poll); clearInterval(frames) }
  }, [pedido.codigo])
  const advancing = snapshot?.ativo && pedido.status === 'enviado' && !error
  const progress = Math.min(1, (snapshot?.progresso || 0) + (advancing ? Math.max(0, clock - snapshot.recebido) / (snapshot.duracao_segundos * 1000) : 0))
  const [x, y] = routePosition(progress)
  const distance = snapshot?.distancia_km || pedido.rastreamento_simulado.distancia_km
  const label = pedido.status === 'cancelado' ? 'Cancelado' : pedido.status === 'devolvido' ? 'Devolvido' : progress >= 1 ? 'Entregue' : progress >= .8 ? 'Próxima parada' : pedido.status === 'enviado' ? 'Em rota' : 'Aguardando expedição'
  const eventos = [...(pedido.eventos || [])].reverse()
  async function novaEntrega() {
    setCriando(true)
    try { const nova = await criarEntregaDemonstrativa(pedido.codigo); onNovaEntrega(nova.codigo) }
    catch (e) { setError(e.message || 'Não foi possível criar outra entrega.') }
    finally { setCriando(false) }
  }
  return <aside className="pedidos10-tracking-panel lf-connected-tracking" aria-label="Rastreamento integrado da entrega">
    <header><Icon name="truck" size={26} /><div><h3>Rastreamento de Entrega em Tempo Real</h3><p>Acompanhe a rota e as etapas da entrega.</p></div></header>
    <div className="lf-connected-order"><div><strong>Pedido #{pedido.codigo}</strong><span>{label}</span></div><p>{pedido.cliente_nome}</p><small>{pedido.itens.reduce((n, item) => n + item.quantidade, 0)} unidades · {money(pedido.valor_total)}</small></div>
    <div className="lf-connected-map">
      <svg viewBox="0 0 600 330" role="img" aria-label={`Mapa esquemático da entrega simulada: ${Math.round(progress * 100)}% do trajeto`}>
        <defs><pattern id={`${uid}-streets`} width="76" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)"><rect width="76" height="60" fill="#071a2b"/><path d="M0 0H76V60 M20 0V60 M0 30H76" fill="none" stroke="#184058" strokeWidth="1"/><path d="M0 8H76" fill="none" stroke="#0c2a41" strokeWidth="10"/></pattern><filter id={`${uid}-glow`}><feGaussianBlur stdDeviation="5" /></filter></defs>
        <rect width="600" height="330" fill={`url(#${uid}-streets)`}/>
        <g transform={`translate(${300 * (1-zoom)},${165 * (1-zoom)}) scale(${zoom})`}>
          <path d="M0 260L100 220 190 278 325 203 378 102 520 86 600 128 M54 0L159 88 239 24 362 158 482 222 560 330" fill="none" stroke="#244b63" strokeWidth="8"/>
          <path d="M0 125Q155 155 238 96T600 185" fill="none" stroke="#12426b" strokeWidth="11" opacity=".7"/>
          <text x="22" y="197" fill="#bfd1e1" fontSize="18">CD São Paulo</text><text x="358" y="40" fill="#9ebacf" fontSize="15">Destino</text><text x="162" y="296" fill="#a7c5da" fontSize="21">{pedido.destino}</text>
          <polyline points={ROUTE.map(p => p.join(',')).join(' ')} fill="none" stroke="#00d9ff" strokeWidth="8" opacity=".35" filter={`url(#${uid}-glow)`}/>
          <polyline points={ROUTE.map(p => p.join(',')).join(' ')} fill="none" stroke="#00d9ff" strokeWidth="3"/>
          <circle cx="48" cy="265" r="6" fill="#83f7ff"/><path d="M550 44c-15 0-23 19 0 40 23-21 15-40 0-40Z" fill="#ff507b"/><circle cx="550" cy="57" r="6" fill="#681d3a"/>
          <circle cx={x} cy={y} r="25" fill="#00ccff" opacity=".35" filter={`url(#${uid}-glow)`}/>
          <g transform={`translate(${x-18},${y-13})`} fill="#00ddff" stroke="#082139" strokeWidth="2"><rect width="24" height="22" rx="3"/><path d="M24 7H31L37 15V22H24Z"/><circle cx="8" cy="23" r="4"/><circle cx="29" cy="23" r="4"/></g>
          <g transform={`translate(${Math.min(425, Math.max(12, x-60))},${y < 105 ? y+26 : Math.max(15, y-74)})`}><rect width="135" height="49" rx="7" fill="#052238" stroke="#00cfff"/><text x="10" y="19" fill="#54e8ff" fontSize="12">{label}</text><text x="10" y="37" fill="#bce7f5" fontSize="12">KM {Math.round(progress * distance)} de {distance}</text></g>
        </g>
      </svg>
      <div className="lf-connected-zoom"><button type="button" aria-label="Ampliar mapa" disabled={zoom >= 1.5} onClick={() => setZoom(z => Math.min(1.5,z+.25))}>+</button><button type="button" aria-label="Reduzir mapa" disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1,z-.25))}>−</button></div>
      <small>SIMULAÇÃO PERSISTENTE · MAPA ESQUEMÁTICO · SEM GPS</small>
    </div>
    <div className="lf-connected-info"><div><Icon name="users" size={19}/><small>Motorista</small><strong>{snapshot?.motorista || pedido.rastreamento_simulado.motorista}</strong></div><div><Icon name="truck" size={19}/><small>Transportadora</small><strong>{pedido.transportadora || 'NexoLog Express'}</strong></div><div><Icon name="clock" size={19}/><small>Previsão simulada</small><strong>{hora(snapshot?.previsao)}</strong></div></div>
    <div className="lf-connected-history-heading"><h4>Histórico de Rastreamento</h4><span><i/> {snapshot?.ativo ? 'Atualizando automaticamente' : 'Histórico registrado'}</span></div>
    {error && <p role="alert" className="lf-connected-error">{error}</p>}
    {snapshot?.erro && <p role="alert" className="lf-connected-error">{snapshot.erro}</p>}
    <ol className="lf-connected-events" tabIndex={0} aria-label="Histórico de Rastreamento">{eventos.map(evento => <li key={evento.id}><span className="lf-connected-event-icon"><Icon name={evento.tipo === 'entregue' ? 'check' : evento.tipo.includes('rota') ? 'truck' : 'clock'} size={16}/></span><div><strong>{titles[evento.tipo] || 'Atualização de transporte'}</strong><p>{evento.descricao.replace('[SIMULADO] ', '')}</p></div><time>{new Date(evento.criado_em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</time></li>)}</ol>
    <button type="button" className="lf-connected-details" onClick={() => setDetalhes(true)}><Icon name="file" size={15}/> Ver detalhes completos do rastreamento</button>
    <Dialog open={detalhes} title={`Rastreamento ${pedido.codigo}`} onClose={() => setDetalhes(false)}>
      <p className="lf-connected-note">Entrega simulada e persistida na base demonstrativa. As etapas alimentam os relatórios e a auditoria. Rota sem GPS.</p>
      <p>{pedido.cliente_nome} · {pedido.destino}</p><p>Transportadora: {pedido.transportadora} · Código: {pedido.codigo_rastreio || 'Aguardando expedição'}</p>
      <ol className="lf-connected-events">{eventos.map(evento => <li key={evento.id}><span className="lf-connected-event-icon"><Icon name="clock" size={16}/></span><div><strong>{titles[evento.tipo] || evento.tipo}</strong><p>{evento.descricao}</p></div><time>{new Date(evento.criado_em).toLocaleString('pt-BR')}</time></li>)}</ol>
      <button type="button" className="lf-connected-details" onClick={() => {setDetalhes(false);onAbrirDetalhes(pedido)}}>Ver pedido e itens</button>
      {['entregue','cancelado','devolvido'].includes(pedido.status) && <button type="button" className="lf-connected-details" disabled={criando} onClick={novaEntrega}>{criando ? 'Criando entrega...' : 'Simular outra entrega hoje'}</button>}
    </Dialog>
  </aside>
}
