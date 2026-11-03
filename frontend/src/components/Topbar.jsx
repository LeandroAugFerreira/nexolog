import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router-dom'


const ROTAS_BUSCA = [
  {
    titulo: 'Painel',
    descricao: 'Painel e indicadores gerais',
    rota: '/',
    termos: [
      'dashboard',
      'painel',
      'inicio',
      'indicadores',
      'kpi',
    ],
  },
  {
    titulo: 'Estoque',
    descricao: 'Produtos, estoque e movimentações',
    rota: '/estoque',
    termos: [
      'estoque',
      'produto',
      'produtos',
      'movimentacao',
      'movimentações',
      'inventario',
      'inventário',
      'sku',
      'categoria',
    ],
  },
  {
    titulo: 'Pedidos',
    descricao: 'Pedidos, tracking e expedição',
    rota: '/pedidos',
    termos: [
      'pedido',
      'pedidos',
      'tracking',
      'expedicao',
      'expedição',
      'despacho',
      'entrega',
    ],
  },
  {
    titulo: 'Fornecedores',
    descricao: 'Cadastro e gestão de fornecedores',
    rota: '/fornecedores',
    termos: [
      'fornecedor',
      'fornecedores',
      'parceiro',
      'cnpj',
    ],
  },
  {
    titulo: 'Clientes',
    descricao: 'Cadastro, contatos e endereços',
    rota: '/clientes',
    termos: [
      'cliente',
      'clientes',
      'cpf',
      'cnpj',
      'endereco',
      'endereço',
    ],
  },
  {
    titulo: 'Relatórios',
    descricao: 'Indicadores, relatórios e auditoria',
    rota: '/relatorios',
    termos: [
      'relatorio',
      'relatórios',
      'auditoria',
      'audit',
      'csv',
      'pdf',
      'lead time',
    ],
  },
  {
    titulo: 'Usuários',
    descricao: 'Usuários, perfis e acessos',
    rota: '/usuarios',
    somenteAdministrador: true,
    termos: [
      'usuario',
      'usuários',
      'perfil',
      'acesso',
      'administrador',
      'gerente',
      'operador',
    ],
  },
]


function normalizarTexto(
  valor,
) {
  return String(
    valor || '',
  )
    .normalize(
      'NFD',
    )
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .toLowerCase()
    .trim()
}


function iniciais(
  nome,
) {
  const partes =
    String(
      nome || '',
    )
      .trim()
      .split(
        /\s+/,
      )
      .filter(
        Boolean,
      )

  if (
    partes.length ===
    0
  ) {
    return 'U'
  }

  return partes[0]
    .slice(
      0,
      1,
    )
    .toUpperCase()
}


function rotuloPerfil(
  perfil,
) {
  const rotulos = {
    administrador:
      'Administrador do Sistema',
    gerente:
      'Gerente de Operações',
    operador:
      'Operador',
    consulta:
      'Consulta',
  }

  return (
    rotulos[
      perfil
    ] ||
    perfil ||
    'Usuário'
  )
}



function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6"
      />

      <path
        d="m16 16 4 4"
      />
    </svg>
  )
}


function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M6 9a6 6 0 0 1 12 0c0 6 2.5 6 2.5 7.5H3.5C3.5 15 6 15 6 9Z"
      />

      <path
        d="M10 20h4"
      />
    </svg>
  )
}



function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M8 12h8M13 9l3 3-3 3"
      />
    </svg>
  )
}


function Topbar({
  apiOnline,
  usuario,
  onLogout,
}) {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const placeholdersBusca = {
    '/':
      'Buscar pedidos, estoque, clientes...',
    '/estoque':
      'Buscar produtos, SKU, categorias, fornecedores...',
    '/pedidos':
      'Buscar pedidos, clientes, transportadoras...',
    '/fornecedores':
      'Buscar fornecedores, CNPJ, cidade...',
    '/clientes':
      'Buscar clientes, CPF/CNPJ, cidade...',
    '/relatorios':
      'Buscar relatórios, pedidos, clientes, produtos...',
    '/usuarios':
      'Buscar usuários, perfis e acessos...',
  }

  const placeholderBusca =
    placeholdersBusca[
      location.pathname
    ] ||
    'Buscar em todo o NexoLog...'

  const searchRef =
    useRef(null)

  const inputRef =
    useRef(null)

  const perfilRef =
    useRef(null)

  const [
    busca,
    setBuscaEstado,
  ] = useState('')

  const [
    buscaAtiva,
    setBuscaAtivaEstado,
  ] = useState(false)

  const [
    indiceAtivo,
    setIndiceAtivo,
  ] = useState(0)

  const [
    perfilAberto,
    setPerfilAberto,
  ] = useState(false)


  const setBusca = useCallback(value => { setBuscaEstado(value); setIndiceAtivo(0) }, [])
  const setBuscaAtiva = useCallback(value => { setBuscaAtivaEstado(value); setIndiceAtivo(0) }, [])

  const rotasPermitidas =
    useMemo(
      () =>
        ROTAS_BUSCA.filter(
          (
            item,
          ) =>
            !item.somenteAdministrador ||
            usuario?.perfil ===
              'administrador',
        ),
      [
        usuario,
      ],
    )


  const resultados =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            busca,
          )

        if (
          termo ===
          ''
        ) {
          return rotasPermitidas
        }

        return rotasPermitidas
          .filter(
            (
              item,
            ) =>
              normalizarTexto(
                item.titulo,
              ).includes(
                termo,
              ) ||
              normalizarTexto(
                item.descricao,
              ).includes(
                termo,
              ) ||
              item.termos.some(
                (
                  palavra,
                ) =>
                  normalizarTexto(
                    palavra,
                  ).includes(
                    termo,
                  ) ||
                  termo.includes(
                    normalizarTexto(
                      palavra,
                    ),
                  ),
              ),
          )
      },
      [
        busca,
        rotasPermitidas,
      ],
    )


  useEffect(
    () => {
      function fecharMenus(
        event,
      ) {
        if (
          searchRef.current &&
          !searchRef.current.contains(
            event.target,
          )
        ) {
          setBuscaAtiva(
            false,
          )
        }

        if (
          perfilRef.current &&
          !perfilRef.current.contains(
            event.target,
          )
        ) {
          setPerfilAberto(
            false,
          )
        }
      }

      document.addEventListener(
        'mousedown',
        fecharMenus,
      )

      return () => {
        document.removeEventListener(
          'mousedown',
          fecharMenus,
        )
      }
    },
    [setBuscaAtiva],
  )


  useEffect(
    () => {
      function atalhoBusca(
        event,
      ) {
        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key.toLowerCase() ===
            'k'
        ) {
          event.preventDefault()

          setPerfilAberto(
            false,
          )

          inputRef.current?.focus()

          setBuscaAtiva(
            true,
          )
        }
      }

      window.addEventListener(
        'keydown',
        atalhoBusca,
      )

      return () => {
        window.removeEventListener(
          'keydown',
          atalhoBusca,
        )
      }
    },
    [setBuscaAtiva],
  )


  function abrirRota(
    rota,
  ) {
    navigate(
      rota,
    )

    setBusca(
      '',
    )

    setBuscaAtiva(
      false,
    )

    setPerfilAberto(
      false,
    )
  }


  function focarBusca() {
    setPerfilAberto(
      false,
    )

    setBuscaAtiva(
      true,
    )

    inputRef.current?.focus()
  }


  function tratarTeclado(
    event,
  ) {
    if (
      event.key ===
      'ArrowDown'
    ) {
      event.preventDefault()

      if (
        resultados.length ===
        0
      ) {
        return
      }

      setIndiceAtivo(
        (
          atual,
        ) =>
          (
            atual +
            1
          ) %
          resultados.length,
      )
    }

    if (
      event.key ===
      'ArrowUp'
    ) {
      event.preventDefault()

      if (
        resultados.length ===
        0
      ) {
        return
      }

      setIndiceAtivo(
        (
          atual,
        ) =>
          (
            atual -
            1 +
            resultados.length
          ) %
          resultados.length,
      )
    }

    if (
      event.key ===
        'Enter' &&
      resultados.length >
        0
    ) {
      event.preventDefault()

      abrirRota(
        resultados[
          indiceAtivo
        ]?.rota ??
        resultados[0].rota,
      )
    }

    if (
      event.key ===
      'Escape'
    ) {
      setBuscaAtiva(
        false,
      )

      inputRef.current?.blur()
    }
  }


  return (
    <header className="topbar">

      <div
        className="global-search"
        ref={
          searchRef
        }
      >

        <div
          className={
            `search-wrapper ${
              buscaAtiva
                ? 'active'
                : ''
            }`
          }
        >

          <span
            className="search-icon"
          >
            <SearchIcon />
          </span>

          <input
            ref={
              inputRef
            }
            type="text"
            value={
              busca
            }
            placeholder={
              placeholderBusca
            }
            onFocus={
              () => {
                setBuscaAtiva(
                  true,
                )

                setPerfilAberto(
                  false,
                )
              }
            }
            onChange={
              (
                event,
              ) => {
                setBusca(
                  event.target.value,
                )

                setBuscaAtiva(
                  true,
                )
              }
            }
            onKeyDown={
              tratarTeclado
            }
            aria-label="Busca global do NexoLog"
            aria-expanded={
              buscaAtiva
            }
          />

          {
            busca
              ? (
                  <button
                    type="button"
                    className="global-search-clear"
                    onClick={
                      () => {
                        setBusca(
                          '',
                        )

                        focarBusca()
                      }
                    }
                    aria-label="Limpar busca"
                  >
                    ×
                  </button>
                )
              : (
                  <button
                    type="button"
                    className="search-shortcut"
                    onMouseDown={
                      (
                        event,
                      ) =>
                        event.preventDefault()
                    }
                    onClick={
                      focarBusca
                    }
                    title="Abrir busca rápida"
                    aria-label="Abrir busca rápida com Control K"
                  >
                    <kbd>
                      Ctrl K
                    </kbd>
                  </button>
                )
          }

        </div>


        {
          buscaAtiva &&
          (
            <div
              className="global-search-results"
            >

              <div
                className="global-search-results-header"
              >

                <div>

                  <strong>
                    {
                      busca.trim()
                        ? 'Resultados'
                        : 'Navegação rápida'
                    }
                  </strong>

                  <span>
                    ↑ ↓ para navegar • Enter para abrir
                  </span>

                </div>

                <span>
                  Esc fecha
                </span>

              </div>


              {
                resultados.length >
                  0
                  ? resultados.map(
                      (
                        item,
                        index,
                      ) => (
                        <button
                          type="button"
                          key={
                            item.rota
                          }
                          className={
                            `global-search-result ${
                              index ===
                              indiceAtivo
                                ? 'active'
                                : ''
                            }`
                          }
                          onMouseEnter={
                            () =>
                              setIndiceAtivo(
                                index,
                              )
                          }
                          onClick={
                            () =>
                              abrirRota(
                                item.rota,
                              )
                          }
                        >

                          <div
                            className="global-search-result-index"
                          >
                            {
                              String(
                                index +
                                1,
                              ).padStart(
                                2,
                                '0',
                              )
                            }
                          </div>

                          <div
                            className="global-search-result-copy"
                          >

                            <strong>
                              {item.titulo}
                            </strong>

                            <span>
                              {item.descricao}
                            </span>

                          </div>

                          <span
                            className="global-search-result-arrow"
                          >
                            <ArrowIcon />
                          </span>

                        </button>
                      ),
                    )
                  : (
                      <div
                        className="global-search-empty"
                      >
                        Nenhuma área encontrada para “{busca}”.
                      </div>
                    )
              }

            </div>
          )
        }

      </div>


      <div className="topbar-right">

        


        <button
          type="button"
          className="notification-button"
          title="Abrir relatórios e auditoria"
          aria-label="Abrir relatórios e auditoria"
          onClick={
            () =>
              navigate(
                '/relatorios',
              )
          }
        >

          <BellIcon />

          <span className="notification-dot"></span>

        </button>


        <div
          className="topbar-divider"
        ></div>


        <div
          className="topbar-profile-wrap"
          ref={
            perfilRef
          }
        >

          <button
            type="button"
            className="user-profile user-profile-button"
            onClick={
              () => {
                setBuscaAtiva(
                  false,
                )

                setPerfilAberto(
                  (
                    atual,
                  ) =>
                    !atual,
                )
              }
            }
            title="Opções do usuário"
            aria-expanded={
              perfilAberto
            }
          >

            <div className="avatar">
              {
                iniciais(
                  usuario?.nome,
                )
              }
            </div>


            <div className="user-info">

              <strong>
                {
                  usuario?.nome ||
                  'Usuário'
                }
              </strong>

              <span>
                {
                  usuario?.cargo ||
                  rotuloPerfil(
                    usuario?.perfil,
                  )
                }
              </span>

            </div>


            <span className="profile-arrow">
              ⌄
            </span>

          </button>


          {
            perfilAberto &&
            (
              <div
                className="topbar-profile-menu"
              >

                <div
                  className="topbar-profile-summary"
                >

                  <strong>
                    {
                      usuario?.nome
                    }
                  </strong>

                  <span>
                    {
                      usuario?.email
                    }
                  </span>

                  <small>
                    {
                      rotuloPerfil(
                        usuario?.perfil,
                      )
                    }
                  </small>

                </div>


                <div
                  className={
                    apiOnline
                      ? 'profile-api-status online'
                      : 'profile-api-status offline'
                  }
                >
                  <span></span>

                  {
                    apiOnline
                      ? 'API online'
                      : 'API offline'
                  }
                </div>

                {
                  usuario?.perfil ===
                    'administrador' &&
                  (
                    <button
                      type="button"
                      onClick={
                        () =>
                          abrirRota(
                            '/usuarios',
                          )
                      }
                    >
                      Gestão de Usuários
                    </button>
                  )
                }


                <button
                  type="button"
                  className="logout"
                  onClick={
                    onLogout
                  }
                >
                  Sair do NexoLog
                </button>

              </div>
            )
          }

        </div>

      </div>

    </header>
  )
}


export default Topbar
