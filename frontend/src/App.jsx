// ============================================================
// NEXOLOG
// APP PRINCIPAL
// AUTENTICAÇÃO + ROTAS
// ============================================================

import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'

import Sidebar
  from './components/Sidebar'

import Topbar
  from './components/Topbar'

import Login
  from './pages/Login'

const Dashboard = lazy(() => import('./pages/Dashboard'))

const Estoque = lazy(() => import('./pages/Estoque'))

const Pedidos = lazy(() => import('./pages/Pedidos'))

const Fornecedores = lazy(() => import('./pages/Fornecedores'))

const Clientes = lazy(() => import('./pages/Clientes'))

const Relatorios = lazy(() => import('./pages/Relatorios'))

const Usuarios = lazy(() => import('./pages/Usuarios'))

import {
  API_BASE_URL,
  limparToken,
  logoutApi,
  obterToken,
  usuarioAtualApi,
} from './services/api'

import './App.css'
import './Theme.css'
import './Responsive.css'
import './VisualConsistency.css'



function App() {
  const [menuAberto, setMenuAberto] = useState(false)
  const menuButtonRef = useRef(null)
  useEffect(() => {
    if (!menuAberto) return
    const fecharComEscape = event => {
      if (event.key === 'Escape') {
        setMenuAberto(false)
        menuButtonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', fecharComEscape)
    return () => window.removeEventListener('keydown', fecharComEscape)
  }, [menuAberto])
  const navigate =
    useNavigate()

  const [
    apiOnline,
    setApiOnline,
  ] = useState(false)

  const [
    usuario,
    setUsuario,
  ] = useState(null)

  const [
    carregandoSessao,
    setCarregandoSessao,
  ] = useState(true)
  // ==========================================================
  // IDENTIDADE VISUAL ÚNICA - TEMA AZUL
  // ==========================================================

  useEffect(
    () => {
      document
        .documentElement
        .setAttribute(
          'data-theme',
          'blue',
        )

      try {
        window.localStorage.removeItem(
          'logiflow_theme',
        )
      } catch {
        // O tema azul permanece ativo mesmo sem acesso ao storage.
      }
    },
    [],
  )


  // ==========================================================
  // VERIFICAÇÃO DA API
  // ==========================================================

  useEffect(
    () => {
      fetch(
        `${API_BASE_URL}/health`,
      )
        .then(
          (
            response,
          ) => {
            if (
              !response.ok
            ) {
              throw new Error(
                'Erro ao acessar API',
              )
            }

            return response.json()
          },
        )
        .then(
          () => {
            setApiOnline(
              true,
            )
          },
        )
        .catch(
          (
            error,
          ) => {
            console.error(
              'Erro de conexão com a API:',
              error,
            )

            setApiOnline(
              false,
            )
          },
        )
    },
    [],
  )


  // ==========================================================
  // RESTAURAR SESSÃO
  // ==========================================================

  useEffect(
    () => {
      let ativo =
        true

      async function restaurarSessao() {
        const token =
          obterToken()

        if (
          !token
        ) {
          if (
            ativo
          ) {
            setCarregandoSessao(
              false,
            )
          }

          return
        }

        try {
          const atual =
            await usuarioAtualApi()

          if (
            ativo
          ) {
            setUsuario(
              atual,
            )
          }

        } catch (
          error
        ) {
          console.error(
            'Sessão não pôde ser restaurada:',
            error,
          )

          limparToken()

          if (
            ativo
          ) {
            setUsuario(
              null,
            )
          }

        } finally {
          if (
            ativo
          ) {
            setCarregandoSessao(
              false,
            )
          }
        }
      }

      restaurarSessao()

      return () => {
        ativo =
          false
      }
    },
    [],
  )


  // ==========================================================
  // SESSÃO EXPIRADA / NÃO AUTORIZADA
  // ==========================================================

  useEffect(
    () => {
      function encerrarSessaoLocal() {
        setUsuario(
          null,
        )

        navigate(
          '/',
        )
      }

      window.addEventListener(
        'logiflow:unauthorized',
        encerrarSessaoLocal,
      )

      return () => {
        window.removeEventListener(
          'logiflow:unauthorized',
          encerrarSessaoLocal,
        )
      }
    },
    [
      navigate,
    ],
  )


  function concluirLogin(
    usuarioLogado,
  ) {
    setUsuario(
      usuarioLogado,
    )

    setApiOnline(
      true,
    )

    navigate(
      '/',
    )
  }


  async function sair() {
    try {
      await logoutApi()

    } catch (
      error
    ) {
      console.error(
        'Erro ao encerrar sessão:',
        error,
      )

      limparToken()

    } finally {
      setUsuario(
        null,
      )

      navigate(
        '/',
      )
    }
  }


  // ==========================================================
  // CARREGANDO SESSÃO
  // ==========================================================

  if (
    carregandoSessao
  ) {
    return (
      <div
        className="auth-loading"
      >

        <div
          className="auth-loading-logo"
        >
          ◈
        </div>

        <strong>
          NexoLog
        </strong>

        <span>
          Verificando sessão...
        </span>

      </div>
    )
  }


  // ==========================================================
  // LOGIN
  // ==========================================================

  if (
    !usuario
  ) {
    return (
      <Login
        onLogin={
          concluirLogin
        }
      />
    )
  }


  // ==========================================================
  // APLICAÇÃO AUTENTICADA
  // ==========================================================

  return (
    <div className={`app${menuAberto ? ' mobile-menu-open' : ''}`}>

      <button ref={menuButtonRef} type="button" className="lf-menu-toggle"
        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuAberto}
        aria-controls="lf-main-navigation" onClick={() => setMenuAberto(aberto => !aberto)}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d={menuAberto ? 'M6 6L18 18M6 18L18 6' : 'M4 6H20M4 12H20M4 18H20'}/>
        </svg>
      </button>
      {menuAberto && <button type="button" className="lf-menu-backdrop" aria-label="Fechar menu de navegação" onClick={() => setMenuAberto(false)}/>}

      <Sidebar
        onNavigate={() => setMenuAberto(false)}
        usuario={
          usuario
        }
      />


      <div className="main-area">

        <Topbar
          apiOnline={
            apiOnline
          }
          usuario={
            usuario
          }
          onLogout={
            sair
          }
        />


        <Suspense fallback={<main className="content" role="status">Carregando tela...</main>}>
        <Routes>

          <Route
            path="/"
            element={
              <Dashboard
                usuario={
                  usuario
                }
              />
            }
          />


          <Route
            path="/estoque"
            element={
              <Estoque />
            }
          />


          <Route
            path="/pedidos"
            element={
              <Pedidos />
            }
          />


          <Route
            path="/fornecedores"
            element={
              <Fornecedores />
            }
          />


          <Route
            path="/clientes"
            element={
              <Clientes />
            }
          />


          <Route
            path="/relatorios"
            element={
              <Relatorios />
            }
          />


          <Route
            path="/usuarios"
            element={
              usuario.perfil ===
                'administrador'
                ? (
                    <Usuarios />
                  )
                : (
                    <Navigate
                      to="/"
                      replace
                    />
                  )
            }
          />


          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
        </Suspense>

      </div>

    </div>
  )
}


export default App
