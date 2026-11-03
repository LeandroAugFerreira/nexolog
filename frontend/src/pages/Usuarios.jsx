// ============================================================
// NEXOLOG
// USUÁRIOS
// ============================================================

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  atualizarStatusUsuario,
  cadastrarUsuario,
  editarUsuario,
  listarUsuarios,
  listarAuditoria,
} from '../services/api'

import './Usuarios.css'
import './ReferencePages.css'
import { Icon, Pagination, Dialog } from '../components/ReferenceUI'


// ============================================================
// CONFIGURAÇÕES
// ============================================================

const PERFIS = [
  {
    valor: 'administrador',
    rotulo: 'Administrador',
  },
  {
    valor: 'gerente',
    rotulo: 'Gerente',
  },
  {
    valor: 'operador',
    rotulo: 'Operador',
  },
  {
    valor: 'consulta',
    rotulo: 'Consulta',
  },
]

const FORMULARIO_INICIAL = {
  nome: '',
  email: '',
  cargo: '',
  perfil: 'operador',
  senha: '',
}


// ============================================================
// AUXILIARES
// ============================================================

function rotuloPerfil(
  perfil,
) {
  return (
    PERFIS.find(
      (
        item,
      ) =>
        item.valor ===
        perfil,
    )?.rotulo ??
    'Operador'
  )
}


function formatarData(
  valor,
) {
  if (
    !valor
  ) {
    return '—'
  }

  const data =
    new Date(
      valor,
    )

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return String(
      valor,
    )
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(
    data,
  )
}


function formatarDataHora(
  valor,
) {
  if (
    !valor
  ) {
    return 'Ainda não registrado'
  }

  const data =
    new Date(
      valor,
    )

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return String(
      valor,
    )
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(
    data,
  )
}


function iniciaisUsuario(
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

  if (
    partes.length ===
    1
  ) {
    return partes[0]
      .slice(
        0,
        1,
      )
      .toUpperCase()
  }

  return (
    (
      partes[0][0] +
      partes[
        partes.length -
        1
      ][0]
    )
      .toUpperCase()
  )
}


// ============================================================
// MODAL DE CADASTRO / EDIÇÃO
// ============================================================

function ModalUsuario({
  aberto,
  modoEdicao,
  formulario,
  mensagem,
  salvando,
  onAlterar,
  onFechar,
  onSalvar,
}) {
  if (
    !aberto
  ) {
    return null
  }

  return (
    <div
      className="usuario-modal-overlay"
      onMouseDown={
        (
          event,
        ) => {
          if (
            event.target ===
            event.currentTarget &&
            !salvando
          ) {
            onFechar()
          }
        }
      }
    >

      <div
        className="usuario-modal"
      >

        <div
          className="usuario-modal-header"
        >

          <div>

            <span
              className="usuario-modal-subtitle"
            >
              {
                modoEdicao
                  ? 'EDIÇÃO'
                  : 'CADASTRO'
              }
            </span>

            <h3>
              {
                modoEdicao
                  ? 'Editar Usuário'
                  : 'Cadastrar Usuário'
              }
            </h3>

            <p>
              Defina os dados do usuário e seu perfil de acesso.
            </p>

          </div>


          <button
            type="button"
            className="usuario-modal-close"
            onClick={
              onFechar
            }
            disabled={
              salvando
            }
            aria-label="Fechar"
          >
            ×
          </button>

        </div>


        <form
          className="usuario-form"
          onSubmit={
            onSalvar
          }
        >

          <div
            className="usuario-form-section"
          >

            <span
              className="usuario-section-title"
            >
              Identificação
            </span>


            <div
              className="usuario-form-group"
            >

              <label
                htmlFor="nome"
              >
                Nome Completo *
              </label>

              <input
                id="nome"
                name="nome"
                type="text"
                value={
                  formulario.nome
                }
                onChange={
                  onAlterar
                }
                placeholder="Ex.: Leandro Augusto Ferreira"
                disabled={
                  salvando
                }
                autoFocus
              />

            </div>


            <div
              className="usuario-form-group"
            >

              <label
                htmlFor="email"
              >
                E-mail *
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={
                  formulario.email
                }
                onChange={
                  onAlterar
                }
                placeholder="usuario@empresa.com.br"
                disabled={
                  salvando
                }
              />

            </div>


            <div
              className="usuario-form-group"
            >

              <label
                htmlFor="senha"
              >
                {
                  modoEdicao
                    ? 'Nova Senha'
                    : 'Senha Inicial *'
                }
              </label>

              <input
                id="senha"
                name="senha"
                type="password"
                value={
                  formulario.senha
                }
                onChange={
                  onAlterar
                }
                placeholder={
                  modoEdicao
                    ? 'Deixe em branco para manter a senha atual'
                    : 'Mínimo de 8 caracteres'
                }
                disabled={
                  salvando
                }
                autoComplete="new-password"
              />

              <small
                className="usuario-form-hint"
              >
                {
                  modoEdicao
                    ? 'Preencha somente se desejar redefinir a senha deste usuário.'
                    : 'O usuário utilizará esta senha no primeiro acesso.'
                }
              </small>

            </div>

          </div>


          <div
            className="usuario-form-section"
          >

            <span
              className="usuario-section-title"
            >
              Função e Acesso
            </span>


            <div
              className="usuario-form-row"
            >

              <div
                className="usuario-form-group"
              >

                <label
                  htmlFor="cargo"
                >
                  Cargo *
                </label>

                <input
                  id="cargo"
                  name="cargo"
                  type="text"
                  value={
                    formulario.cargo
                  }
                  onChange={
                    onAlterar
                  }
                  placeholder="Ex.: Gerente de Operações"
                  disabled={
                    salvando
                  }
                />

              </div>


              <div
                className="usuario-form-group"
              >

                <label
                  htmlFor="perfil"
                >
                  Perfil de Acesso *
                </label>

                <select
                  id="perfil"
                  name="perfil"
                  value={
                    formulario.perfil
                  }
                  onChange={
                    onAlterar
                  }
                  disabled={
                    salvando
                  }
                >

                  {
                    PERFIS.map(
                      (
                        perfil,
                      ) => (
                        <option
                          key={
                            perfil.valor
                          }
                          value={
                            perfil.valor
                          }
                        >
                          {
                            perfil.rotulo
                          }
                        </option>
                      ),
                    )
                  }

                </select>

              </div>

            </div>


            <div
              className="usuario-perfis-info"
            >

              <div>
                <strong>
                  Administrador
                </strong>
                <span>
                  Acesso completo ao sistema.
                </span>
              </div>

              <div>
                <strong>
                  Gerente
                </strong>
                <span>
                  Gestão operacional e relatórios.
                </span>
              </div>

              <div>
                <strong>
                  Operador
                </strong>
                <span>
                  Rotinas de estoque e pedidos.
                </span>
              </div>

              <div>
                <strong>
                  Consulta
                </strong>
                <span>
                  Visualização sem alterações.
                </span>
              </div>

            </div>

          </div>


          {
            mensagem &&
            (
              <div
                className="usuario-form-message"
              >
                {mensagem}
              </div>
            )
          }


          <div
            className="usuario-modal-actions"
          >

            <button
              type="button"
              className="usuario-modal-button cancel"
              onClick={
                onFechar
              }
              disabled={
                salvando
              }
            >
              Cancelar
            </button>


            <button
              type="submit"
              className="usuario-modal-button save"
              disabled={
                salvando
              }
            >
              {
                salvando
                  ? 'Salvando...'
                  : modoEdicao
                    ? 'Salvar Alterações'
                    : 'Cadastrar Usuário'
              }
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}


// ============================================================
// MODAL DE DETALHES
// ============================================================

function ModalDetalhesUsuario({
  usuario,
  alterandoStatus,
  onFechar,
  onEditar,
  onAlternarStatus,
}) {
  if (
    !usuario
  ) {
    return null
  }

  const ativo =
    usuario.status ===
    'ativo'

  return (
    <div
      className="usuario-modal-overlay"
      onMouseDown={
        (
          event,
        ) => {
          if (
            event.target ===
            event.currentTarget &&
            !alterandoStatus
          ) {
            onFechar()
          }
        }
      }
    >

      <div
        className="usuario-modal usuario-modal-detalhes"
      >

        <div
          className="usuario-modal-header"
        >

          <div>

            <span
              className="usuario-modal-subtitle"
            >
              {
                usuario.codigo
              }
            </span>

            <h3>
              Detalhes do Usuário
            </h3>

            <p>
              Informações cadastrais e perfil de acesso.
            </p>

          </div>


          <button
            type="button"
            className="usuario-modal-close"
            onClick={
              onFechar
            }
            disabled={
              alterandoStatus
            }
            aria-label="Fechar"
          >
            ×
          </button>

        </div>


        <div
          className="usuario-detalhes-conteudo"
        >

          <div
            className="usuario-detalhes-topo"
          >

            <div
              className="usuario-detalhes-identificacao"
            >

              <div
                className="usuario-detalhes-avatar"
              >
                {
                  iniciaisUsuario(
                    usuario.nome,
                  )
                }
              </div>


              <div>

                <strong>
                  {
                    usuario.nome
                  }
                </strong>

                <span>
                  {
                    usuario.cargo
                  }
                </span>

              </div>

            </div>


            <span
              className={
                `usuario-status-badge ${usuario.status}`
              }
            >
              {
                ativo
                  ? 'Ativo'
                  : 'Inativo'
              }
            </span>

          </div>


          <div
            className="usuario-detalhes-grid"
          >

            <div
              className="usuario-detalhe-card"
            >
              <span>
                E-mail
              </span>

              <strong>
                {
                  usuario.email
                }
              </strong>
            </div>


            <div
              className="usuario-detalhe-card"
            >
              <span>
                Perfil de Acesso
              </span>

              <strong
                className={
                  `usuario-perfil-texto ${usuario.perfil}`
                }
              >
                {
                  rotuloPerfil(
                    usuario.perfil,
                  )
                }
              </strong>
            </div>


            <div
              className="usuario-detalhe-card"
            >
              <span>
                Último Acesso
              </span>

              <strong>
                {
                  formatarDataHora(
                    usuario.ultimo_acesso,
                  )
                }
              </strong>
            </div>


            <div
              className="usuario-detalhe-card"
            >
              <span>
                Cadastrado em
              </span>

              <strong>
                {
                  formatarData(
                    usuario.criado_em,
                  )
                }
              </strong>
            </div>


            <div
              className="usuario-detalhe-card"
            >
              <span>
                Atualizado em
              </span>

              <strong>
                {
                  formatarData(
                    usuario.atualizado_em,
                  )
                }
              </strong>
            </div>

          </div>


          <div
            className="usuario-modal-actions"
          >

            <button
              type="button"
              className="usuario-modal-button cancel"
              onClick={
                onFechar
              }
              disabled={
                alterandoStatus
              }
            >
              Fechar
            </button>


            <button
              type="button"
              className="usuario-modal-button secondary"
              onClick={
                () =>
                  onEditar(
                    usuario,
                  )
              }
              disabled={
                alterandoStatus
              }
            >
              Editar Cadastro
            </button>


            <button
              type="button"
              className={
                `usuario-modal-button ${
                  ativo
                    ? 'danger'
                    : 'activate'
                }`
              }
              onClick={
                () =>
                  onAlternarStatus(
                    usuario,
                  )
              }
              disabled={
                alterandoStatus
              }
            >
              {
                alterandoStatus
                  ? 'Atualizando...'
                  : ativo
                    ? 'Inativar'
                    : 'Ativar'
              }
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}


// ============================================================
// PÁGINA
// ============================================================

function Usuarios() {
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [selecionado, setSelecionado] = useState('')
  const [auditoria, setAuditoria] = useState([])
  const [erroAuditoria, setErroAuditoria] = useState('')
  const [logsAbertos, setLogsAbertos] = useState(false)
  useEffect(() => {
    let ativo = true
    listarAuditoria().then(dados => { if (ativo) setAuditoria(Array.isArray(dados) ? dados : []) }).catch(error => { if (ativo) setErroAuditoria(error.message || 'Não foi possível carregar a atividade.') })
    return () => { ativo = false }
  }, [])

  const [
    usuarios,
    setUsuarios,
  ] = useState([])

  const [
    carregando,
    setCarregando,
  ] = useState(true)

  const [
    erro,
    setErro,
  ] = useState('')

  const [
    busca,
    setBusca,
  ] = useState('')

  const [
    perfilFiltro,
    setPerfilFiltro,
  ] = useState('todos')

  const [
    statusFiltro,
    setStatusFiltro,
  ] = useState('todos')

  const [
    modalFormulario,
    setModalFormulario,
  ] = useState(false)

  const [
    usuarioEdicao,
    setUsuarioEdicao,
  ] = useState(null)

  const [
    formulario,
    setFormulario,
  ] = useState(
    FORMULARIO_INICIAL,
  )

  const [
    mensagemFormulario,
    setMensagemFormulario,
  ] = useState('')

  const [
    salvando,
    setSalvando,
  ] = useState(false)

  const [
    usuarioDetalhes,
    setUsuarioDetalhes,
  ] = useState(null)

  const [
    menuAberto,
    setMenuAberto,
  ] = useState('')

  const [
    alterandoStatus,
    setAlterandoStatus,
  ] = useState('')

  const [
    toast,
    setToast,
  ] = useState('')


  // ==========================================================
  // CARREGAR
  // ==========================================================

  useEffect(
    () => {
      let ativo =
        true

      async function carregar() {
        try {
          setCarregando(
            true,
          )

          setErro(
            '',
          )

          const dados =
            await listarUsuarios()

          if (
            !ativo
          ) {
            return
          }

          setUsuarios(
            Array.isArray(
              dados,
            )
              ? dados
              : [],
          )

        } catch (
          error
        ) {
          if (
            !ativo
          ) {
            return
          }

          console.error(
            'Erro ao carregar usuários:',
            error,
          )

          setErro(
            error.message ||
            'Não foi possível carregar os usuários.',
          )

        } finally {
          if (
            ativo
          ) {
            setCarregando(
              false,
            )
          }
        }
      }

      carregar()

      return () => {
        ativo =
          false
      }
    },
    [],
  )


  // ==========================================================
  // FECHAR MENU FORA
  // ==========================================================

  useEffect(
    () => {
      function fecharMenu(
        event,
      ) {
        if (
          event.target instanceof Element &&
          !event.target.closest(
            '.usuario-menu-wrap',
          )
        ) {
          setMenuAberto(
            '',
          )
        }
      }

      document.addEventListener(
        'mousedown',
        fecharMenu,
      )

      return () => {
        document.removeEventListener(
          'mousedown',
          fecharMenu,
        )
      }
    },
    [],
  )


  // ==========================================================
  // TOAST
  // ==========================================================

  function mostrarToast(
    mensagem,
  ) {
    setToast(
      mensagem,
    )

    window.setTimeout(
      () => {
        setToast(
          '',
        )
      },
      3500,
    )
  }


  // ==========================================================
  // FILTROS
  // ==========================================================

  const usuariosFiltrados =
    useMemo(
      () => {
        const termo =
          busca
            .trim()
            .toLowerCase()

        return usuarios.filter(
          (
            usuario,
          ) => {
            const correspondeBusca =
              termo === '' ||
              [
                usuario.codigo,
                usuario.nome,
                usuario.email,
                usuario.cargo,
                usuario.perfil,
              ]
                .filter(
                  Boolean,
                )
                .some(
                  (
                    valor,
                  ) =>
                    String(
                      valor,
                    )
                      .toLowerCase()
                      .includes(
                        termo,
                      ),
                )

            const correspondePerfil =
              perfilFiltro ===
                'todos' ||
              usuario.perfil ===
                perfilFiltro

            const correspondeStatus =
              statusFiltro ===
                'todos' ||
              usuario.status ===
                statusFiltro

            return (
              correspondeBusca &&
              correspondePerfil &&
              correspondeStatus
            )
          },
        )
      },
      [
        usuarios,
        busca,
        perfilFiltro,
        statusFiltro,
      ],
    )


  // ==========================================================
  // KPIS
  // ==========================================================

  const indicadores =
    useMemo(
      () => {
        const ativos =
          usuarios.filter(
            (
              usuario,
            ) =>
              usuario.status ===
              'ativo',
          ).length

        const administradores =
          usuarios.filter(
            (
              usuario,
            ) =>
              usuario.perfil ===
              'administrador' &&
              usuario.status ===
              'ativo',
          ).length

        const gestores =
          usuarios.filter(
            (
              usuario,
            ) =>
              (
                usuario.perfil ===
                  'administrador' ||
                usuario.perfil ===
                  'gerente'
              ) &&
              usuario.status ===
                'ativo',
          ).length

        return {
          total:
            usuarios.length,
          ativos,
          administradores,
          gestores,
        }
      },
      [
        usuarios,
      ],
    )


  // ==========================================================
  // FORMULÁRIO
  // ==========================================================

  function abrirNovoUsuario() {
    setUsuarioEdicao(
      null,
    )

    setFormulario({
      ...FORMULARIO_INICIAL,
    })

    setMensagemFormulario(
      '',
    )

    setModalFormulario(
      true,
    )

    setMenuAberto(
      '',
    )
  }


  function abrirEditarUsuario(
    usuario,
  ) {
    setUsuarioDetalhes(
      null,
    )

    setUsuarioEdicao(
      usuario,
    )

    setFormulario({
      nome:
        usuario.nome ??
        '',

      email:
        usuario.email ??
        '',

      cargo:
        usuario.cargo ??
        '',

      perfil:
        usuario.perfil ??
        'operador',

      senha:
        '',
    })

    setMensagemFormulario(
      '',
    )

    setModalFormulario(
      true,
    )

    setMenuAberto(
      '',
    )
  }


  function fecharFormulario() {
    if (
      salvando
    ) {
      return
    }

    setModalFormulario(
      false,
    )

    setUsuarioEdicao(
      null,
    )

    setFormulario({
      ...FORMULARIO_INICIAL,
    })

    setMensagemFormulario(
      '',
    )
  }


  function alterarFormulario(
    event,
  ) {
    const {
      name,
      value,
    } =
      event.target

    setFormulario(
      (
        anterior,
      ) => ({
        ...anterior,
        [name]:
          value,
      }),
    )

    setMensagemFormulario(
      '',
    )
  }


  function validarFormulario() {
    if (
      !formulario.nome.trim()
    ) {
      return (
        'Informe o nome completo.'
      )
    }

    const email =
      formulario.email
        .trim()
        .toLowerCase()

    if (
      !email ||
      !email.includes(
        '@',
      ) ||
      !email
        .split(
          '@',
        )
        .at(
          -1,
        )
        .includes(
          '.',
        )
    ) {
      return (
        'Informe um e-mail válido.'
      )
    }

    if (
      !formulario.cargo.trim()
    ) {
      return (
        'Informe o cargo.'
      )
    }

    const senha =
      formulario.senha

    if (
      !usuarioEdicao &&
      senha.length <
        8
    ) {
      return (
        'A senha inicial deve possuir pelo menos 8 caracteres.'
      )
    }

    if (
      usuarioEdicao &&
      senha &&
      senha.length <
        8
    ) {
      return (
        'A nova senha deve possuir pelo menos 8 caracteres.'
      )
    }

    if (
      !PERFIS.some(
        (
          item,
        ) =>
          item.valor ===
          formulario.perfil,
      )
    ) {
      return (
        'Selecione um perfil de acesso válido.'
      )
    }

    return ''
  }


  async function salvarUsuario(
    event,
  ) {
    event.preventDefault()

    const erroValidacao =
      validarFormulario()

    if (
      erroValidacao
    ) {
      setMensagemFormulario(
        erroValidacao,
      )

      return
    }

    if (
      usuarioEdicao &&
      usuarioEdicao.status ===
        'ativo' &&
      usuarioEdicao.perfil ===
        'administrador' &&
      formulario.perfil !==
        'administrador' &&
      indicadores.administradores <=
        1
    ) {
      setMensagemFormulario(
        'O sistema precisa manter pelo menos um administrador ativo.',
      )

      return
    }

    const dados = {
      nome:
        formulario.nome.trim(),

      email:
        formulario.email
          .trim()
          .toLowerCase(),

      cargo:
        formulario.cargo.trim(),

      perfil:
        formulario.perfil,

      ...(
        formulario.senha
          ? {
              senha:
                formulario.senha,
            }
          : {}
      ),
    }

    try {
      setSalvando(
        true,
      )

      setMensagemFormulario(
        '',
      )

      if (
        usuarioEdicao
      ) {
        const atualizado =
          await editarUsuario(
            usuarioEdicao.codigo,
            dados,
          )

        setUsuarios(
          (
            anteriores,
          ) =>
            anteriores.map(
              (
                usuario,
              ) =>
                usuario.codigo ===
                atualizado.codigo
                  ? atualizado
                  : usuario,
            ),
        )

        mostrarToast(
          `Usuário ${atualizado.codigo} atualizado com sucesso.`,
        )

      } else {
        const novo =
          await cadastrarUsuario(
            dados,
          )

        setUsuarios(
          (
            anteriores,
          ) => [
            novo,
            ...anteriores,
          ],
        )

        mostrarToast(
          `Usuário ${novo.codigo} cadastrado com sucesso.`,
        )
      }

      setModalFormulario(
        false,
      )

      setUsuarioEdicao(
        null,
      )

      setFormulario({
        ...FORMULARIO_INICIAL,
      })

    } catch (
      error
    ) {
      console.error(
        'Erro ao salvar usuário:',
        error,
      )

      setMensagemFormulario(
        error.message ||
        'Não foi possível salvar o usuário.',
      )

    } finally {
      setSalvando(
        false,
      )
    }
  }


  // ==========================================================
  // DETALHES / STATUS
  // ==========================================================

  function abrirDetalhes(
    usuario,
  ) {
    setUsuarioDetalhes(
      usuario,
    )

    setMenuAberto(
      '',
    )
  }


  function fecharDetalhes() {
    if (
      alterandoStatus
    ) {
      return
    }

    setUsuarioDetalhes(
      null,
    )
  }


  async function alternarStatus(
    usuario,
  ) {
    const novoStatus =
      usuario.status ===
        'ativo'
        ? 'inativo'
        : 'ativo'

    if (
      usuario.status ===
        'ativo' &&
      usuario.perfil ===
        'administrador' &&
      indicadores.administradores <=
        1
    ) {
      mostrarToast(
        'Não é possível inativar o último administrador ativo do sistema.',
      )

      setMenuAberto(
        '',
      )

      return
    }

    try {
      setAlterandoStatus(
        usuario.codigo,
      )

      setMenuAberto(
        '',
      )

      const atualizado =
        await atualizarStatusUsuario(
          usuario.codigo,
          novoStatus,
        )

      setUsuarios(
        (
          anteriores,
        ) =>
          anteriores.map(
            (
              item,
            ) =>
              item.codigo ===
              atualizado.codigo
                ? atualizado
                : item,
          ),
      )

      setUsuarioDetalhes(
        (
          atual,
        ) =>
          atual?.codigo ===
          atualizado.codigo
            ? atualizado
            : atual,
      )

      mostrarToast(
        `${atualizado.codigo} ${
          novoStatus ===
            'ativo'
            ? 'ativado'
            : 'inativado'
        } com sucesso.`,
      )

    } catch (
      error
    ) {
      console.error(
        'Erro ao alterar status do usuário:',
        error,
      )

      mostrarToast(
        error.message ||
        'Não foi possível alterar o status.',
      )

    } finally {
      setAlterandoStatus(
        '',
      )
    }
  }


  // ==========================================================
  // EXPORTAR CSV
  // ==========================================================

  function exportarCsv() {
    if (
      usuariosFiltrados.length ===
      0
    ) {
      mostrarToast(
        'Não há usuários para exportar.',
      )

      return
    }

    const escapar =
      (
        valor,
      ) =>
        `"${String(
          valor ??
          '',
        ).replaceAll(
          '"',
          '""',
        )}"`

    const linhas = [
      [
        'Código',
        'Nome',
        'E-mail',
        'Cargo',
        'Perfil',
        'Status',
        'Último Acesso',
        'Criado em',
      ],

      ...usuariosFiltrados.map(
        (
          usuario,
        ) => [
          usuario.codigo,
          usuario.nome,
          usuario.email,
          usuario.cargo,
          rotuloPerfil(
            usuario.perfil,
          ),
          usuario.status ===
            'ativo'
            ? 'Ativo'
            : 'Inativo',
          formatarDataHora(
            usuario.ultimo_acesso,
          ),
          formatarData(
            usuario.criado_em,
          ),
        ],
      ),
    ]

    const conteudo =
      linhas
        .map(
          (
            linha,
          ) =>
            linha
              .map(
                escapar,
              )
              .join(
                ';',
              ),
        )
        .join(
          '\n',
        )

    const blob =
      new Blob(
        [
          '\uFEFF',
          conteudo,
        ],
        {
          type:
            'text/csv;charset=utf-8;',
        },
      )

    const url =
      URL.createObjectURL(
        blob,
      )

    const link =
      document.createElement(
        'a',
      )

    link.href =
      url

    const dataArquivo =
      new Date()
        .toISOString()
        .slice(
          0,
          10,
        )

    link.download =
      `usuarios-${dataArquivo}.csv`

    document.body.appendChild(
      link,
    )

    link.click()

    link.remove()

    URL.revokeObjectURL(
      url,
    )

    mostrarToast(
      `${usuariosFiltrados.length} usuário(s) exportado(s) com os filtros atuais.`,
    )
  }


  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(usuariosFiltrados.length / porPagina)))
  const usuariosVisiveis = usuariosFiltrados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)
  const usuarioSelecionado = usuariosVisiveis.find(item => item.codigo === selecionado) || usuariosVisiveis[0] || null
  const eventosSelecionados = auditoria.filter(evento => evento.usuario_codigo === usuarioSelecionado?.codigo).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
  const logsAcesso = auditoria.filter(evento => evento.modulo === 'auth' || /login|logout|acesso|sessao|sessão/i.test(evento.acao)).sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
  const permissoes = ['Painel', 'Estoque', 'Pedidos', 'Fornecedores', 'Clientes', 'Relatórios', 'Usuários'].map(modulo => {
    const perfil = usuarioSelecionado?.perfil
    let acesso = 'Visualização'
    if (modulo === 'Usuários') acesso = perfil === 'administrador' ? 'Gestão completa' : 'Sem acesso'
    else if (perfil === 'administrador' || perfil === 'gerente') acesso = 'Gestão completa'
    else if (perfil === 'operador' && ['Estoque', 'Pedidos'].includes(modulo)) acesso = 'Operação'
    if (modulo === 'Painel' || modulo === 'Relatórios') acesso = 'Visualização'
    return { modulo, acesso }
  })

  return <main className="content usuarios-page reference-page">
    {toast && <div className="usuario-toast" role="status"><Icon name="check" size={16} />{toast}</div>}
    <header className="usuarios-page-header">
      <div><h2>Usuários</h2><p>Gerencie os acessos, os perfis e acompanhe a atividade dos usuários no sistema.</p></div>
      <div className="usuarios-actions">
        <button type="button" className="usuarios-button primary" onClick={abrirNovoUsuario}><Icon name="plus" size={18} />Novo Usuário</button>
        <button type="button" className="usuarios-button secondary" disabled={!usuarioSelecionado} onClick={() => document.getElementById('permissoes-usuario')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })}><Icon name="shield" size={17} />Perfis e Permissões</button>
        <button type="button" className="usuarios-button secondary" onClick={() => setLogsAbertos(true)}><Icon name="file" size={17} />Logs de Acesso</button>
        <button type="button" className="usuarios-button secondary" onClick={exportarCsv} aria-label="Exportar usuários em CSV"><Icon name="download" size={17} />CSV</button>
      </div>
    </header>
    <section className="usuarios-kpis" aria-label="Indicadores de usuários">
      {[
        ['total', 'users', 'Total de Usuários', indicadores.total, 'Usuários cadastrados'],
        ['admins', 'crown', 'Administradores', indicadores.administradores, 'Administradores ativos'],
        ['gestores', 'user', 'Operadores', usuarios.filter(item => item.perfil === 'operador' && item.status === 'ativo').length, 'Operadores ativos'],
      ].map(([classe, icone, titulo, valor, legenda]) => <article className="usuario-kpi" key={classe}><div className={`usuario-kpi-icon ${classe}`}><Icon name={icone} size={25} /></div><div><span>{titulo}</span><strong>{carregando ? '—' : valor}</strong><small>{legenda}</small></div></article>)}
    </section>
    <div className="lf-workspace">
      <section className="usuarios-table-card">
        <div className="usuarios-table-header"><span className="lf-heading-icon"><Icon name="user" size={25} /></span><div><h3>Lista de Usuários</h3><span>Visualize e gerencie os usuários do sistema.</span></div></div>
        <div className="usuarios-toolbar">
          <div className="usuarios-search"><Icon name="search" size={18} /><input type="search" aria-label="Buscar usuários" value={busca} onChange={event => { setBusca(event.target.value); setPagina(1) }} placeholder="Buscar nome, e-mail ou cargo..." /></div>
          <select aria-label="Filtrar por perfil" value={perfilFiltro} onChange={event => { setPerfilFiltro(event.target.value); setPagina(1) }}><option value="todos">Todos os perfis</option>{PERFIS.map(perfil => <option key={perfil.valor} value={perfil.valor}>{perfil.rotulo}</option>)}</select>
          <select aria-label="Filtrar usuários por status" value={statusFiltro} onChange={event => { setStatusFiltro(event.target.value); setPagina(1) }}><option value="todos">Todos os status</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option></select>
        </div>
        {erro && <div className="usuarios-error" role="alert">{erro}</div>}
        <div className="usuarios-table-wrapper" role="region" aria-label="Lista de usuários com rolagem" tabIndex={0}>
          <table className="usuarios-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Último Acesso</th><th>Cargo</th><th>Ações</th></tr></thead><tbody>
            {(carregando || (!erro && !usuariosVisiveis.length)) && <tr><td colSpan="7" className="usuario-vazio">{carregando ? 'Carregando usuários...' : 'Nenhum usuário encontrado.'}</td></tr>}
            {!carregando && !erro && usuariosVisiveis.map(usuario => <tr key={usuario.codigo} className={usuario.codigo === usuarioSelecionado?.codigo ? 'lf-selected' : ''}>
              <td><button type="button" className="lf-row-select usuario-identidade" aria-label={`Selecionar ${usuario.nome}`} aria-pressed={usuario.codigo === usuarioSelecionado?.codigo} onClick={() => setSelecionado(usuario.codigo)}><span className="usuario-avatar">{iniciaisUsuario(usuario.nome)}</span><span><strong>{usuario.nome}</strong><span className="usuario-codigo">{usuario.codigo}</span></span></button></td>
              <td title={usuario.email}>{usuario.email}</td>
              <td><span className={`usuario-perfil-badge ${usuario.perfil}`}>{rotuloPerfil(usuario.perfil)}</span></td>
              <td><span className={`usuario-status ${usuario.status}`}>{usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
              <td title={formatarDataHora(usuario.ultimo_acesso)}>{formatarDataHora(usuario.ultimo_acesso)}</td>
              <td title={usuario.cargo}>{usuario.cargo || '—'}</td>
              <td className="usuario-acoes"><div className="usuario-menu-wrap">
                <button type="button" className="usuario-menu-button" aria-label={`Ações de ${usuario.nome}`} aria-expanded={menuAberto === usuario.codigo} onClick={event => { event.stopPropagation(); setMenuAberto(menuAberto === usuario.codigo ? '' : usuario.codigo) }}>•••</button>
                {menuAberto === usuario.codigo && <div className="usuario-menu">
                  <button type="button" onClick={() => abrirDetalhes(usuario)}>Visualizar detalhes</button>
                  <button type="button" onClick={() => abrirEditarUsuario(usuario)}>Editar cadastro</button>
                  <button type="button" className={usuario.status === 'ativo' ? 'danger' : 'activate'} disabled={alterandoStatus === usuario.codigo} onClick={() => alternarStatus(usuario)}>{alterandoStatus === usuario.codigo ? 'Atualizando...' : usuario.status === 'ativo' ? 'Inativar' : 'Ativar'}</button>
                </div>}
              </div></td>
            </tr>)}
          </tbody></table>
        </div>
        <Pagination total={usuariosFiltrados.length} page={paginaAtual} pageSize={porPagina} onPage={setPagina} onPageSize={setPorPagina} noun="usuários" />
      </section>
      <aside className="lf-sidebar" aria-label="Detalhes do usuário selecionado" tabIndex={0}>
        <section className="lf-panel">
          <h3><Icon name="check" />Usuários Ativos <strong className="lf-panel-total">{carregando ? '—' : indicadores.ativos}</strong></h3>
          {usuarioSelecionado ? <><div className="lf-selected-user"><div className="lf-user-avatar">{iniciaisUsuario(usuarioSelecionado.nome)}</div><div><strong>{usuarioSelecionado.nome}</strong><span>{usuarioSelecionado.status === 'ativo' ? '● Ativo' : '● Inativo'} · {rotuloPerfil(usuarioSelecionado.perfil)}</span></div></div>
          <dl className="lf-contact-list"><div><dt>E-mail</dt><dd>{usuarioSelecionado.email}</dd></div><div><dt>Cargo</dt><dd>{usuarioSelecionado.cargo || 'Não informado'}</dd></div><div><dt>Membro desde</dt><dd>{formatarData(usuarioSelecionado.criado_em)}</dd></div></dl></> : <p>Selecione um usuário na lista para visualizar seus dados.</p>}
        </section>
        <section className="lf-panel" id="permissoes-usuario">
          <div className="lf-panel-head"><h3><Icon name="shield" />Perfil e Permissões</h3>{usuarioSelecionado && <button type="button" onClick={() => abrirEditarUsuario(usuarioSelecionado)}>Editar perfil</button>}</div>
          {usuarioSelecionado ? <><span className={`usuario-perfil-badge ${usuarioSelecionado.perfil}`}>{rotuloPerfil(usuarioSelecionado.perfil)}</span><ul className="lf-permission-list">{permissoes.map(item => <li key={item.modulo}><span>{item.modulo}</span><small>{item.acesso}</small></li>)}</ul><p style={{ marginTop: 12 }}>Os acessos são definidos pelo perfil cadastrado.</p></> : <p>Nenhum usuário selecionado.</p>}
        </section>
        <section className="lf-panel">
          <div className="lf-panel-head"><h3><Icon name="clock" />Atividade Recente</h3></div>
          {erroAuditoria ? <p role="alert">{erroAuditoria}</p> : eventosSelecionados.length ? <ol className="lf-timeline">{eventosSelecionados.slice(0, 3).map(evento => <li key={evento.id}><strong>{evento.acao.replaceAll('_', ' ')}</strong><small>{formatarDataHora(evento.criado_em)}</small></li>)}</ol> : <p>Nenhuma atividade registrada para este usuário.</p>}
        </section>
      </aside>
    </div>
    <Dialog open={logsAbertos} title="Logs de Acesso" onClose={() => setLogsAbertos(false)}>
      {erroAuditoria ? <p role="alert">{erroAuditoria}</p> : logsAcesso.length ? <table><thead><tr><th>Usuário</th><th>Ação</th><th>Data/Hora</th></tr></thead><tbody>{logsAcesso.map(evento => <tr key={evento.id}><td>{evento.usuario_nome}</td><td>{evento.acao.replaceAll('_', ' ')}</td><td>{formatarDataHora(evento.criado_em)}</td></tr>)}</tbody></table> : <p>Nenhum evento de acesso registrado.</p>}
    </Dialog>
    <ModalUsuario aberto={modalFormulario} modoEdicao={Boolean(usuarioEdicao)} formulario={formulario} mensagem={mensagemFormulario} salvando={salvando} onAlterar={alterarFormulario} onFechar={fecharFormulario} onSalvar={salvarUsuario} />
    <ModalDetalhesUsuario usuario={usuarioDetalhes} alterandoStatus={Boolean(alterandoStatus)} onFechar={fecharDetalhes} onEditar={abrirEditarUsuario} onAlternarStatus={alternarStatus} />
  </main>
}

export default Usuarios
