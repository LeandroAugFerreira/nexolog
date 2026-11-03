import {
  useEffect,
  useState,
} from 'react'

import {
  cadastrarUsuarioPublicoApi,
  loginApi,
  obterAcessoDemo,
  obterConfiguracaoAcesso,
} from '../services/api'

import './Login.css'


const CADASTRO_INICIAL = {
  nome: '',
  email: '',
  cargo: '',
  senha: '',
  confirmarSenha: '',
}


function Login({
  onLogin,
}) {
  const [
    modo,
    setModo,
  ] = useState(
    'login',
  )

  const [
    email,
    setEmail,
  ] = useState('')

  const [
    senha,
    setSenha,
  ] = useState('')

  const [
    cadastro,
    setCadastro,
  ] = useState({
    ...CADASTRO_INICIAL,
  })

  const [configuracao, setConfiguracao] = useState({ demo: false, cadastro_publico: false })

  const [
    emailDemo,
    setEmailDemo,
  ] = useState('')

  const [
    senhaDemo,
    setSenhaDemo,
  ] = useState(
    '',
  )

  const [
    carregando,
    setCarregando,
  ] = useState(false)

  const [
    mensagem,
    setMensagem,
  ] = useState('')


  useEffect(
    () => {
      let ativo =
        true

      async function carregarAcessoDemo() {
        try {
          const config = await obterConfiguracaoAcesso()
          if (!ativo) return
          setConfiguracao(config)
          if (!config.demo) return
          const dados = await obterAcessoDemo()

          if (
            !ativo
          ) {
            return
          }

          setEmailDemo(
            dados?.email ||
            '',
          )

          setSenhaDemo(
            dados?.senha_inicial ||
            '',
          )
        } catch {
          // A tela continua utilizável mesmo se a API estiver offline.
        }
      }

      carregarAcessoDemo()

      return () => {
        ativo =
          false
      }
    },
    [],
  )


  function usarDemo() {
    setEmail(
      emailDemo,
    )

    setSenha(
      senhaDemo,
    )

    setMensagem(
      '',
    )
  }


  function abrirCadastro() {
    setModo(
      'cadastro',
    )

    setMensagem(
      '',
    )

    setCadastro({
      ...CADASTRO_INICIAL,
      email,
    })
  }


  function voltarLogin() {
    setModo(
      'login',
    )

    setMensagem(
      '',
    )
  }


  function alterarCadastro(
    event,
  ) {
    const {
      name,
      value,
    } =
      event.target

    setCadastro(
      (
        anterior,
      ) => ({
        ...anterior,
        [name]:
          value,
      }),
    )

    setMensagem(
      '',
    )
  }


  async function entrar(
    event,
  ) {
    event.preventDefault()

    if (
      !email.trim() ||
      !senha
    ) {
      setMensagem(
        'Informe e-mail e senha.',
      )

      return
    }

    try {
      setCarregando(
        true,
      )

      setMensagem(
        '',
      )

      const resposta =
        await loginApi(
          email
            .trim()
            .toLowerCase(),
          senha,
        )

      onLogin(
        resposta.usuario,
      )

    } catch (
      error
    ) {
      setMensagem(
        error.message ||
        'Não foi possível realizar o login.',
      )

    } finally {
      setCarregando(
        false,
      )
    }
  }


  async function cadastrar(
    event,
  ) {
    event.preventDefault()

    const nome =
      cadastro.nome.trim()

    const emailCadastro =
      cadastro.email
        .trim()
        .toLowerCase()

    const cargo =
      cadastro.cargo.trim()

    if (
      !nome
    ) {
      setMensagem(
        'Informe o nome completo.',
      )

      return
    }

    if (
      !emailCadastro ||
      !emailCadastro.includes(
        '@',
      ) ||
      !emailCadastro
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
      setMensagem(
        'Informe um e-mail válido.',
      )

      return
    }

    if (
      !cargo
    ) {
      setMensagem(
        'Informe o cargo.',
      )

      return
    }

    if (
      cadastro.senha.length <
      8
    ) {
      setMensagem(
        'A senha deve possuir pelo menos 8 caracteres.',
      )

      return
    }

    if (
      cadastro.senha !==
      cadastro.confirmarSenha
    ) {
      setMensagem(
        'A confirmação de senha não confere.',
      )

      return
    }

    try {
      setCarregando(
        true,
      )

      setMensagem(
        '',
      )

      await cadastrarUsuarioPublicoApi({
        nome,
        email:
          emailCadastro,
        cargo,
        senha:
          cadastro.senha,
      })

      const resposta =
        await loginApi(
          emailCadastro,
          cadastro.senha,
        )

      onLogin(
        resposta.usuario,
      )

    } catch (
      error
    ) {
      setMensagem(
        error.message ||
        'Não foi possível criar o usuário.',
      )

    } finally {
      setCarregando(
        false,
      )
    }
  }


  const cadastroAtivo =
    modo ===
    'cadastro'


  return (
    <main
      className="login-page"
    >

      <section
        className="login-brand-panel"
      >

        <div
          className="login-brand"
        >

          <div
            className="login-brand-icon"
          >
            ◈
          </div>

          <div>

            <h1>
              Nexo<span>Log</span>
            </h1>

            <p>
              LOGÍSTICA QUE IMPULSIONA
            </p>

          </div>

        </div>


        <div
          className="login-brand-copy"
        >

          <span>
            SISTEMA DE GESTÃO LOGÍSTICA
          </span>

          <h2>
            Controle sua operação
            <br />
            em um único fluxo.
          </h2>

          <p>
            Estoque, pedidos, clientes, fornecedores,
            relatórios e auditoria integrados ao mesmo banco.
          </p>

        </div>


        <div
          className="login-feature-grid"
        >

          <div>
            <strong>
              Estoque
            </strong>
            <span>
              Movimentações e alertas em tempo real
            </span>
          </div>

          <div>
            <strong>
              Pedidos
            </strong>
            <span>
              Reserva, expedição e acompanhamento
            </span>
          </div>

          <div>
            <strong>
              Auditoria
            </strong>
            <span>
              Histórico de ações por usuário
            </span>
          </div>

          <div>
            <strong>
              Dados
            </strong>
            <span>
              Dashboard e relatórios operacionais
            </span>
          </div>

        </div>

      </section>


      <section
        className="login-form-panel"
      >

        <div
          className={
            `login-card ${
              cadastroAtivo
                ? 'cadastro'
                : ''
            }`
          }
        >

          <div
            className="login-card-header"
          >

            <span>
              {
                cadastroAtivo
                  ? 'NOVO USUÁRIO'
                  : 'ACESSO AO SISTEMA'
              }
            </span>

            <h2>
              {
                cadastroAtivo
                  ? 'Criar conta no NexoLog'
                  : 'Bem-vindo ao NexoLog'
              }
            </h2>

            <p>
              {
                cadastroAtivo
                  ? 'Cadastre seus dados para acessar o ambiente.'
                  : 'Entre com as credenciais do usuário cadastrado.'
              }
            </p>

          </div>


          {
            cadastroAtivo
              ? (
                  <form
                    className="login-form"
                    onSubmit={
                      cadastrar
                    }
                  >

                    <div
                      className="login-form-group"
                    >

                      <label
                        htmlFor="cadastro-nome"
                      >
                        Nome Completo
                      </label>

                      <input
                        id="cadastro-nome"
                        name="nome"
                        type="text"
                        value={
                          cadastro.nome
                        }
                        onChange={
                          alterarCadastro
                        }
                        placeholder="Ex.: Mariana Costa"
                        disabled={
                          carregando
                        }
                        autoFocus
                        autoComplete="name"
                      />

                    </div>


                    <div
                      className="login-form-group"
                    >

                      <label
                        htmlFor="cadastro-email"
                      >
                        E-mail
                      </label>

                      <input
                        id="cadastro-email"
                        name="email"
                        type="email"
                        value={
                          cadastro.email
                        }
                        onChange={
                          alterarCadastro
                        }
                        placeholder="usuario@empresa.com.br"
                        disabled={
                          carregando
                        }
                        autoComplete="email"
                      />

                    </div>


                    <div
                      className="login-form-group"
                    >

                      <label
                        htmlFor="cadastro-cargo"
                      >
                        Cargo
                      </label>

                      <input
                        id="cadastro-cargo"
                        name="cargo"
                        type="text"
                        value={
                          cadastro.cargo
                        }
                        onChange={
                          alterarCadastro
                        }
                        placeholder="Ex.: Analista Administrativo"
                        disabled={
                          carregando
                        }
                        autoComplete="organization-title"
                      />

                    </div>


                    <div
                      className="login-form-row"
                    >

                      <div
                        className="login-form-group"
                      >

                        <label
                          htmlFor="cadastro-senha"
                        >
                          Senha
                        </label>

                        <input
                          id="cadastro-senha"
                          name="senha"
                          type="password"
                          value={
                            cadastro.senha
                          }
                          onChange={
                            alterarCadastro
                          }
                          placeholder="Mínimo de 8 caracteres"
                          disabled={
                            carregando
                          }
                          autoComplete="new-password"
                        />

                      </div>


                      <div
                        className="login-form-group"
                      >

                        <label
                          htmlFor="cadastro-confirmar-senha"
                        >
                          Confirmar Senha
                        </label>

                        <input
                          id="cadastro-confirmar-senha"
                          name="confirmarSenha"
                          type="password"
                          value={
                            cadastro.confirmarSenha
                          }
                          onChange={
                            alterarCadastro
                          }
                          placeholder="Repita a senha"
                          disabled={
                            carregando
                          }
                          autoComplete="new-password"
                        />

                      </div>

                    </div>


                    <div
                      className="login-profile-info"
                    >
                      A conta será criada com o perfil
                      <strong> Consulta</strong>.
                      Um administrador poderá alterar esse perfil depois.
                    </div>


                    {
                      mensagem &&
                      (
                        <div
                          className="login-message"
                        >
                          ⚠ {mensagem}
                        </div>
                      )
                    }


                    <button
                      type="submit"
                      className="login-submit"
                      disabled={
                        carregando
                      }
                    >
                      {
                        carregando
                          ? 'Criando conta...'
                          : 'Criar usuário e entrar'
                      }
                    </button>


                    <button
                      type="button"
                      className="login-secondary-button"
                      onClick={
                        voltarLogin
                      }
                      disabled={
                        carregando
                      }
                    >
                      ← Voltar para o login
                    </button>

                  </form>
                )
              : (
                  <>
                    <form
                      className="login-form"
                      onSubmit={
                        entrar
                      }
                    >

                      <div
                        className="login-form-group"
                      >

                        <label
                          htmlFor="login-email"
                        >
                          E-mail
                        </label>

                        <input
                          id="login-email"
                          type="email"
                          value={
                            email
                          }
                          onChange={
                            (
                              event,
                            ) =>
                              setEmail(
                                event.target.value,
                              )
                          }
                          placeholder="usuario@empresa.com.br"
                          disabled={
                            carregando
                          }
                          autoFocus
                          autoComplete="username"
                        />

                      </div>


                      <div
                        className="login-form-group"
                      >

                        <label
                          htmlFor="login-senha"
                        >
                          Senha
                        </label>

                        <input
                          id="login-senha"
                          type="password"
                          value={
                            senha
                          }
                          onChange={
                            (
                              event,
                            ) =>
                              setSenha(
                                event.target.value,
                              )
                          }
                          placeholder="Digite sua senha"
                          disabled={
                            carregando
                          }
                          autoComplete="current-password"
                        />

                      </div>


                      {
                        mensagem &&
                        (
                          <div
                            className="login-message"
                          >
                            ⚠ {mensagem}
                          </div>
                        )
                      }


                      <button
                        type="submit"
                        className="login-submit"
                        disabled={
                          carregando
                        }
                      >
                        {
                          carregando
                            ? 'Entrando...'
                            : 'Entrar no NexoLog'
                        }
                      </button>


                      {configuracao.cadastro_publico && <button
                        type="button"
                        className="login-secondary-button"
                        onClick={
                          abrirCadastro
                        }
                        disabled={
                          carregando
                        }
                      >
                        + Criar novo usuário
                      </button>}

                    </form>


                    {configuracao.demo && <div
                      className="login-demo"
                    >

                      <div>

                        <span>
                          ACESSO DE DEMONSTRAÇÃO
                        </span>

                        <strong>
                          Portfólio
                        </strong>

                      </div>

                      <p>
                        {
                          emailDemo
                            ? `E-mail: ${emailDemo}`
                            : 'Carregando usuário administrador...'
                        }
                        <br />
                        Senha inicial: {senhaDemo}
                      </p>

                      <button
                        type="button"
                        onClick={
                          usarDemo
                        }
                        disabled={
                          !emailDemo ||
                          carregando
                        }
                      >
                        Usar acesso demo
                      </button>

                    </div>}
                  </>
                )
          }


          <div
            className="login-footer"
          >
            NexoLog • {configuracao.demo ? 'Ambiente demonstrativo' : 'Gestão operacional'}
          </div>

        </div>

      </section>

    </main>
  )
}


export default Login
