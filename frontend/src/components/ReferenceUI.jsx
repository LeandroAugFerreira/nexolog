import { useEffect, useRef } from 'react'

export function Icon({ name, size = 20 }) {
  const paths = {
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    user: <><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/></>,
    search: <><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
    shield: <><path d="m12 3 9 4v6c0 5-9 9-9 9S3 18 3 13V7l9-4Z"/><path d="m8 12 3 3 5-6"/></>,
    crown: <path d="m3 5 5 5 4-7 4 7 5-5-2 14H5L3 5Zm2 17h14"/>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    file: <><path d="M14 2H5v20h14V7l-5-5Zm0 0v5h5M8 12h8M8 16h8"/></>,
    chart: <><path d="M4 20V4M4 20h17M7 15l5-6 4 3 5-8"/></>,
    truck: <><path d="M3 5h12v12H3V5Zm12 5h4l3 4v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    pie: <><path d="M21 12h-9V3a9 9 0 1 0 9 9Z"/><path d="M15 3a9 9 0 0 1 6 6h-6V3Z"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.file}</svg>
}

export function Dialog({ open, title, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (open && !ref.current.open) ref.current.showModal()
    if (!open && ref.current.open) ref.current.close()
  }, [open])
  return <dialog ref={ref} className="lf-log-dialog lf-panel" aria-label={title} onCancel={onClose} onClick={event => { if (event.target === ref.current) onClose() }}>
    <div className="lf-panel-head"><h3>{title}</h3><button type="button" onClick={onClose} aria-label={`Fechar ${title}`}>Fechar ×</button></div>
    {children}
  </dialog>
}

export function Pagination({ total, page, pageSize, onPage, onPageSize, noun = 'registros' }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages)
  const start = Math.max(1, Math.min(current - 2, pages - 4))
  const visible = Array.from({ length: Math.min(5, pages) }, (_, index) => start + index)
  return <footer className="lf-pagination">
    <span role="status">{total ? `Mostrando ${(current - 1) * pageSize + 1} a ${Math.min(current * pageSize, total)} de ${total} ${noun}` : `Nenhum ${noun.replace(/s$/, '')} encontrado`}</span>
    <nav aria-label={`Paginação de ${noun}`}>
      <button type="button" aria-label="Página anterior" disabled={current === 1} onClick={() => onPage(current - 1)}>‹</button>
      {visible.map(number => <button type="button" key={number} aria-label={`Página ${number}`} aria-current={number === current ? 'page' : undefined} onClick={() => onPage(number)}>{number}</button>)}
      <button type="button" aria-label="Próxima página" disabled={current === pages} onClick={() => onPage(current + 1)}>›</button>
    </nav>
    <select aria-label={`Quantidade de ${noun} por página`} value={pageSize} onChange={event => { onPageSize(Number(event.target.value)); onPage(1) }}>
      {[10, 20, 50].map(size => <option key={size} value={size}>{size} por página</option>)}
    </select>
  </footer>
}
