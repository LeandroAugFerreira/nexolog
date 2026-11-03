import { Icon } from '../ReferenceUI'
import { useState } from 'react'
import DeliverySimulator from './DeliverySimulator'
import ConnectedTracking from './ConnectedTracking'
const STATUS = { pendente: 'Pendente', processando: 'Em processamento', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado', devolvido: 'Devolvido' }
const data = value => value ? new Date(value).toLocaleString('pt-BR') : 'Não registrada'

export default function OperationalTracking({ pedido, onAbrirDetalhes, onNovaEntrega }) {
  const [mode, setMode] = useState('simulation')
  if (!pedido) return <aside className="pedidos10-tracking-panel"><div className="pedidos10-tracking-empty">Selecione um pedido para acompanhar as etapas registradas.</div></aside>
  if (pedido.rastreamento_simulado) return <ConnectedTracking key={pedido.codigo} pedido={pedido} onAbrirDetalhes={onAbrirDetalhes} onNovaEntrega={onNovaEntrega}/>
  const eventos = [...(pedido.eventos || [])].reverse()
  return <aside className="pedidos10-tracking-panel lf-operational-tracking">
    <header><Icon name="truck" size={24} /><div><h3>Acompanhamento da entrega</h3><p>Simulação automática e registros da operação.</p></div></header>
    <div className="lf-order-summary"><strong>{pedido.codigo}</strong><span>{STATUS[pedido.status] || pedido.status}</span><p>{pedido.cliente_nome}</p><b>{Number(pedido.valor_total).toLocaleString('pt-BR', {style:'currency',currency:'BRL'})}</b></div>
    <div className="lf-tracking-tabs" role="group" aria-label="Modo de acompanhamento"><button type="button" aria-pressed={mode === 'simulation'} onClick={() => setMode('simulation')}>Simulação automática</button><button type="button" aria-pressed={mode === 'operation'} onClick={() => setMode('operation')}>Registros reais</button></div>
    {mode === 'simulation' ? <DeliverySimulator key={pedido.codigo} pedido={pedido} /> : <>
    <dl><div><dt>Destino</dt><dd>{pedido.destino}</dd></div><div><dt>Transportadora</dt><dd>{pedido.transportadora || 'Não informada'}</dd></div><div><dt>Código de rastreio</dt><dd>{pedido.codigo_rastreio || 'Não informado'}</dd></div><div><dt>Expedição</dt><dd>{data(pedido.enviado_em)}</dd></div><div><dt>Entrega</dt><dd>{data(pedido.entregue_em)}</dd></div></dl>
    <p className="lf-operation-note">O status é atualizado pela equipe. A localização e a previsão da transportadora ainda não estão integradas.</p>
    <h4>Histórico de etapas</h4>
    {eventos.length ? <ol className="lf-order-events">{eventos.map(evento => <li key={evento.id}><strong>{evento.descricao}</strong><time>{data(evento.criado_em)}</time></li>)}</ol> : <p className="lf-operation-note">Pedido anterior à atualização. Não há horários históricos confirmados para exibir.</p>}
    </>}
    <button type="button" className="pedido-modal-button cancel" onClick={() => onAbrirDetalhes(pedido)}>Ver detalhes do pedido</button>
  </aside>
}
