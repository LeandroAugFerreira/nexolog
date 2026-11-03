import {
  NavLink,
} from 'react-router-dom'

import logisticsArt
  from '../assets/logiflow-road.png'


function BrandMark() {
  return (
    <svg
      className="brand-mark-svg"
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <polygon
        points="32,4 56,18 32,32 8,18"
        className="brand-face brand-face-top"
      />

      <polygon
        points="8,18 32,32 32,60 8,46"
        className="brand-face brand-face-left"
      />

      <polygon
        points="56,18 32,32 32,60 56,46"
        className="brand-face brand-face-right"
      />

      <path
        d="M22 23L32 29L42 23V34L32 40L22 34Z"
        className="brand-cut"
      />
    </svg>
  )
}


function MenuIcon({
  tipo,
}) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  const paths = {
    dashboard: (
      <>
        <path
          {...common}
          d="M4 11.5 12 5l8 6.5v8.2a1.3 1.3 0 0 1-1.3 1.3H5.3A1.3 1.3 0 0 1 4 19.7Z"
        />
        <path
          {...common}
          d="M9 21v-6h6v6"
        />
      </>
    ),

    estoque: (
      <>
        <path
          {...common}
          d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"
        />
        <path
          {...common}
          d="m4 7.5 8 4.5 8-4.5M12 12v9"
        />
      </>
    ),

    pedidos: (
      <>
        <path
          {...common}
          d="M6 3h9l3 3v15H6Z"
        />
        <path
          {...common}
          d="M15 3v4h4M9 11h6M9 15h6"
        />
      </>
    ),

    fornecedores: (
      <>
        <path
          {...common}
          d="M3 8h11v9H3zM14 11h4l3 3v3h-7z"
        />
        <circle
          {...common}
          cx="7"
          cy="19"
          r="2"
        />
        <circle
          {...common}
          cx="18"
          cy="19"
          r="2"
        />
      </>
    ),

    clientes: (
      <>
        <circle
          {...common}
          cx="9"
          cy="8"
          r="3"
        />
        <circle
          {...common}
          cx="17"
          cy="9"
          r="2.5"
        />
        <path
          {...common}
          d="M3.5 20c.6-4.1 2.5-6 5.5-6s4.9 1.9 5.5 6M14 15c3.2-.6 5.5.9 6.5 4"
        />
      </>
    ),

    relatorios: (
      <>
        <path
          {...common}
          d="M4 21V11M10 21V5M16 21v-8M22 21V8"
        />
        <path
          {...common}
          d="M2 21h22"
        />
      </>
    ),

    usuarios: (
      <>
        <circle
          {...common}
          cx="12"
          cy="8"
          r="4"
        />
        <path
          {...common}
          d="M4 21c.7-4.6 3.4-7 8-7s7.3 2.4 8 7"
        />
      </>
    ),
  }

  return (
    <svg
      className="menu-icon-svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {paths[tipo]}
    </svg>
  )
}


function Sidebar({
  usuario,
  onNavigate,
}) {
  const administrador =
    usuario?.perfil ===
    'administrador'

  const itens = [
    {
      rota: '/',
      label: 'Dashboard',
      tipo: 'dashboard',
      end: true,
    },
    {
      rota: '/estoque',
      label: 'Estoque',
      tipo: 'estoque',
    },
    {
      rota: '/pedidos',
      label: 'Pedidos',
      tipo: 'pedidos',
    },
    {
      rota: '/fornecedores',
      label: 'Fornecedores',
      tipo: 'fornecedores',
    },
    {
      rota: '/clientes',
      label: 'Clientes',
      tipo: 'clientes',
    },
    {
      rota: '/relatorios',
      label: 'Relatórios',
      tipo: 'relatorios',
    },
  ]

  if (
    administrador
  ) {
    itens.push({
      rota: '/usuarios',
      label: 'Usuários',
      tipo: 'usuarios',
    })
  }

  return (
    <aside className="sidebar" id="lf-main-navigation">

      <div className="brand">

        <div className="brand-icon">
          <BrandMark />
        </div>

        <div className="brand-copy">

          <h1>
            Nexo<span>Log</span>
          </h1>

          <p className="brand-subtitle brand-subtitle-blue">
            LOGÍSTICA QUE IMPULSIONA
          </p>

        </div>

      </div>


      <nav className="menu">

        {
          itens.map(
            (
              item,
            ) => (
              <NavLink
                onClick={onNavigate}
                aria-label={item.label}
                title={item.label}
                key={
                  item.rota
                }
                to={
                  item.rota
                }
                end={
                  item.end
                }
                className={({
                  isActive,
                }) =>
                  isActive
                    ? 'menu-item active'
                    : 'menu-item'
                }
              >

                <span className="menu-icon">
                  <MenuIcon
                    tipo={
                      item.tipo
                    }
                  />
                </span>

                <span>
                  {
                    item.label
                  }
                </span>

              </NavLink>
            ),
          )
        }

      </nav>


      <div className="sidebar-art">

        <img
          className="sidebar-art-image sidebar-art-image-blue"
          src={
            logisticsArt
          }
          alt=""
          aria-hidden="true"
        />

        <div className="sidebar-art-overlay"></div>

      </div>


      <div className="sidebar-footer">

        <p className="sidebar-footer-copy sidebar-footer-copy-blue">
          Uma logística
          <br />
          mais inteligente
          <br />
          para um amanhã melhor
        </p>

        <div className="footer-line"></div>

        <div className="sidebar-version-block">

          <small>
            NexoLog v1.0.0
          </small>

          <small>
            © 2024 NexoLog. Todos os direitos reservados.
          </small>

        </div>

      </div>

    </aside>
  )
}


export default Sidebar
