// ============================================================
// NEXOLOG
// CLIENTES
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'

import {
  atualizarStatusCliente,
  cadastrarCliente,
  editarCliente,
  listarClientes,
} from '../services/api'

import './Clientes.css'
import './ReferencePages.css'
import { Icon, Pagination } from '../components/ReferenceUI'


// ============================================================
// CONFIGURAÇÕES
// ============================================================

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF',
  'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS',
  'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const FORMULARIO_INICIAL = {
  nome: '',
  tipo: 'pessoa_juridica',
  documento: '',
  telefone: '',
  email: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
}


// ============================================================
// AUXILIARES
// ============================================================


function GraficoCliente({ valores, meses, titulo, barras = false }) {
  const maximo = Math.max(1, ...valores)
  const pontos = valores.map((valor, indice) => [4 + indice * 15, 34 - valor / maximo * 28])
  const linha = pontos.map(ponto => ponto.join(',')).join(' ')
  const descricao = meses.map((mes, indice) => mes + ': ' + valores[indice]).join('; ')
  return <svg className="cliente-kpi-chart" viewBox="0 0 84 38" role="img" aria-label={titulo + '. ' + descricao}>
    <title>{titulo}: {descricao}</title>
    {barras ? valores.map((valor, indice) => <rect key={indice} x={4 + indice * 13} y={34 - valor / maximo * 28} width="8" height={valor / maximo * 28} rx="2" fill="currentColor" />) : <>
      <polygon points={linha + ' 79,36 4,36'} fill="currentColor" opacity=".12" />
      <polyline points={linha} fill="none" stroke="currentColor" strokeWidth="2" />
      {pontos.map(([x, y], indice) => <circle key={indice} cx={x} cy={y} r="2" fill="currentColor" />)}
    </>}
  </svg>
}

function somenteDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}


function rotuloTipo(tipo) {
  return tipo === 'pessoa_fisica'
    ? 'Pessoa Física'
    : 'Pessoa Jurídica'
}


function rotuloDocumento(tipo) {
  return tipo === 'pessoa_fisica'
    ? 'CPF'
    : 'CNPJ'
}


function formatarDocumento(valor, tipo) {
  const numeros = somenteDigitos(valor)

  if (tipo === 'pessoa_fisica') {
    return numeros
      .slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
  }

  return numeros
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}


function formatarCep(valor) {
  return somenteDigitos(valor)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2')
}


function formatarTelefone(valor) {
  const numeros = somenteDigitos(valor).slice(0, 11)

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  return numeros
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}


function formatarData(valor) {
  if (!valor) {
    return '—'
  }

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return String(valor)
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  ).format(data)
}


function textoSeguro(valor, fallback = 'Não informado') {
  const texto = String(valor ?? '').trim()

  return texto || fallback
}


function enderecoCompleto(cliente) {
  const primeiraLinha = [
    cliente.logradouro,
    cliente.numero,
  ]
    .filter(Boolean)
    .join(', ')

  const segundaLinha = [
    cliente.bairro,
    cliente.cidade,
    cliente.uf,
  ]
    .filter(Boolean)
    .join(' - ')

  return (
    [primeiraLinha, segundaLinha]
      .filter(Boolean)
      .join(' • ') ||
    'Endereço não informado'
  )
}


// ============================================================
// MODAL DE CADASTRO / EDIÇÃO
// ============================================================

function ModalCliente({
  embutido = false,
  aberto,
  modoEdicao,
  formulario,
  mensagem,
  salvando,
  consultandoCep,
  mensagemCep,
  tipoMensagemCep,
  onAlterar,
  onFechar,
  onSalvar,
}) {
  if (!aberto) {
    return null
  }

  const documentoLabel =
    rotuloDocumento(formulario.tipo)

  const documentoPlaceholder =
    formulario.tipo === 'pessoa_fisica'
      ? '000.000.000-00'
      : '00.000.000/0000-00'

  return (
    <div
      className={embutido ? "cliente-inline-panel" : "cliente-modal-overlay"}
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !salvando && !embutido
        ) {
          onFechar()
        }
      }}
    >
      <div className="cliente-modal">
        <div className="cliente-modal-header">
          <div>
            <span className="cliente-modal-subtitle">
              {modoEdicao ? 'EDIÇÃO' : 'CADASTRO'}
            </span>

            <h3>
              {modoEdicao ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h3>

            <p>
              Registre os dados cadastrais, contato e endereço de entrega.
            </p>
          </div>

          <button
            type="button"
            className="cliente-modal-close"
            onClick={onFechar}
            disabled={salvando}
            aria-label={embutido ? "Limpar formulário" : "Fechar"}
          >
            {embutido ? '↺' : '×'}
          </button>
        </div>

        <form className="cliente-form" onSubmit={onSalvar}>
          <div className="cliente-form-section">
            <span className="cliente-section-title">
              Identificação
            </span>

            <div className="cliente-form-group">
              <label htmlFor="nome">
                Nome / Razão Social *
              </label>

              <input
                id="nome"
                name="nome"
                type="text"
                value={formulario.nome}
                onChange={onAlterar}
                placeholder="Ex.: Comercial Nova Campinas"
                disabled={salvando}
                autoFocus={!embutido}
              />
            </div>

            <div className="cliente-form-row">
              <div className="cliente-form-group">
                <label htmlFor="tipo">
                  Tipo *
                </label>

                <select
                  id="tipo"
                  name="tipo"
                  value={formulario.tipo}
                  onChange={onAlterar}
                  disabled={salvando || modoEdicao}
                >
                  <option value="pessoa_juridica">
                    Pessoa Jurídica
                  </option>

                  <option value="pessoa_fisica">
                    Pessoa Física
                  </option>
                </select>
              </div>

              <div className="cliente-form-group">
                <label htmlFor="documento">
                  {documentoLabel} *
                </label>

                <input
                  id="documento"
                  name="documento"
                  type="text"
                  value={formulario.documento}
                  onChange={onAlterar}
                  placeholder={documentoPlaceholder}
                  maxLength={
                    formulario.tipo === 'pessoa_fisica'
                      ? 14
                      : 18
                  }
                  disabled={salvando || modoEdicao}
                />
              </div>
            </div>
          </div>


          <div className="cliente-form-section">
            <span className="cliente-section-title">
              Contato
            </span>

            <div className="cliente-form-row">
              <div className="cliente-form-group">
                <label htmlFor="telefone">
                  Telefone
                </label>

                <input
                  id="telefone"
                  name="telefone"
                  type="text"
                  value={formulario.telefone}
                  onChange={onAlterar}
                  placeholder="(19) 99999-9999"
                  maxLength={15}
                  disabled={salvando}
                />
              </div>

              <div className="cliente-form-group">
                <label htmlFor="email">
                  E-mail
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formulario.email}
                  onChange={onAlterar}
                  placeholder="cliente@email.com"
                  disabled={salvando}
                />
              </div>
            </div>
          </div>


          <div className="cliente-form-section">
            <span className="cliente-section-title">
              Endereço de Entrega
            </span>

            <div className="cliente-form-row endereco-principal">
              <div className="cliente-form-group cep">
                <label htmlFor="cep">
                  CEP
                </label>

                <input
                  id="cep"
                  name="cep"
                  type="text"
                  value={formulario.cep}
                  onChange={onAlterar}
                  placeholder="00000-000"
                  maxLength={9}
                  disabled={salvando}
                />

                {
                  (
                    consultandoCep ||
                    mensagemCep
                  ) &&
                  (
                    <small
                      className={
                        `cliente-cep-status ${
                          consultandoCep
                            ? 'consultando'
                            : tipoMensagemCep
                        }`
                      }
                    >
                      {
                        consultandoCep
                          ? 'Consultando CEP...'
                          : mensagemCep
                      }
                    </small>
                  )
                }
              </div>

              <div className="cliente-form-group logradouro">
                <label htmlFor="logradouro">
                  Logradouro *
                </label>

                <input
                  id="logradouro"
                  name="logradouro"
                  type="text"
                  value={formulario.logradouro}
                  onChange={onAlterar}
                  placeholder="Rua, avenida..."
                  disabled={salvando}
                />
              </div>

              <div className="cliente-form-group numero">
                <label htmlFor="numero">
                  Número
                </label>

                <input
                  id="numero"
                  name="numero"
                  type="text"
                  value={formulario.numero}
                  onChange={onAlterar}
                  placeholder="123"
                  disabled={salvando}
                />
              </div>
            </div>

            <div className="cliente-form-row">
              <div className="cliente-form-group">
                <label htmlFor="bairro">
                  Bairro
                </label>

                <input
                  id="bairro"
                  name="bairro"
                  type="text"
                  value={formulario.bairro}
                  onChange={onAlterar}
                  placeholder="Ex.: Centro"
                  disabled={salvando}
                />
              </div>

              <div className="cliente-form-group">
                <label htmlFor="complemento">
                  Complemento
                </label>

                <input
                  id="complemento"
                  name="complemento"
                  type="text"
                  value={formulario.complemento}
                  onChange={onAlterar}
                  placeholder="Sala, bloco, referência..."
                  disabled={salvando}
                />
              </div>
            </div>

            <div className="cliente-form-row">
              <div className="cliente-form-group">
                <label htmlFor="cidade">
                  Cidade *
                </label>

                <input
                  id="cidade"
                  name="cidade"
                  type="text"
                  value={formulario.cidade}
                  onChange={onAlterar}
                  placeholder="Ex.: Campinas"
                  disabled={salvando}
                />
              </div>

              <div className="cliente-form-group">
                <label htmlFor="uf">
                  UF *
                </label>

                <select
                  id="uf"
                  name="uf"
                  value={formulario.uf}
                  onChange={onAlterar}
                  disabled={salvando}
                >
                  <option value="">
                    Selecione...
                  </option>

                  {UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>


          {mensagem && (
            <div className="cliente-form-message">
              {mensagem}
            </div>
          )}


          <div className="cliente-modal-actions">
            <button
              type="button"
              className="cliente-modal-button cancel"
              onClick={onFechar}
              disabled={salvando}
            >
              {embutido ? 'Limpar' : 'Cancelar'}
            </button>

            <button
              type="submit"
              className="cliente-modal-button save"
              disabled={salvando}
            >
              {salvando
                ? 'Salvando...'
                : modoEdicao
                  ? 'Salvar Alterações'
                  : 'Salvar Cliente'}
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

function ModalDetalhesCliente({
  cliente,
  alterandoStatus,
  onFechar,
  onEditar,
  onAlternarStatus,
}) {
  if (!cliente) {
    return null
  }

  const ativo =
    cliente.status === 'ativo'

  return (
    <div
      className="cliente-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !alterandoStatus
        ) {
          onFechar()
        }
      }}
    >
      <div className="cliente-modal cliente-modal-detalhes">
        <div className="cliente-modal-header">
          <div>
            <span className="cliente-modal-subtitle">
              {cliente.codigo}
            </span>

            <h3>
              Detalhes do Cliente
            </h3>

            <p>
              Informações cadastrais, contato e endereço.
            </p>
          </div>

          <button
            type="button"
            className="cliente-modal-close"
            onClick={onFechar}
            disabled={alterandoStatus}
            aria-label="Fechar"
          >
            <Icon name="user" size={25} />
          </button>
        </div>

        <div className="cliente-detalhes-conteudo">
          <div className="cliente-detalhes-topo">
            <div className="cliente-detalhes-identificacao">
              <div className="cliente-detalhes-avatar">
                {cliente.nome.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>
                  {cliente.nome}
                </strong>

                <span>
                  {rotuloTipo(cliente.tipo)}
                </span>
              </div>
            </div>

            <span
              className={`cliente-status-badge ${cliente.status}`}
            >
              {ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>


          <div className="cliente-detalhes-grid">
            <div className="cliente-detalhe-card">
              <span>{rotuloDocumento(cliente.tipo)}</span>
              <strong>
                {formatarDocumento(
                  cliente.documento,
                  cliente.tipo,
                )}
              </strong>
            </div>

            <div className="cliente-detalhe-card">
              <span>Telefone</span>
              <strong>
                {textoSeguro(cliente.telefone)}
              </strong>
            </div>

            <div className="cliente-detalhe-card">
              <span>E-mail</span>
              <strong>
                {textoSeguro(cliente.email)}
              </strong>
            </div>

            <div className="cliente-detalhe-card">
              <span>CEP</span>
              <strong>
                {cliente.cep
                  ? formatarCep(cliente.cep)
                  : 'Não informado'}
              </strong>
            </div>

            <div className="cliente-detalhe-card cliente-detalhe-card-wide">
              <span>Endereço de Entrega</span>
              <strong>
                {enderecoCompleto(cliente)}
              </strong>

              {cliente.complemento && (
                <small>
                  Complemento: {cliente.complemento}
                </small>
              )}
            </div>

            <div className="cliente-detalhe-card">
              <span>Cadastrado em</span>
              <strong>
                {formatarData(cliente.criado_em)}
              </strong>
            </div>

            <div className="cliente-detalhe-card">
              <span>Atualizado em</span>
              <strong>
                {formatarData(cliente.atualizado_em)}
              </strong>
            </div>
          </div>


          <div className="cliente-modal-actions">
            <button
              type="button"
              className="cliente-modal-button cancel"
              onClick={onFechar}
              disabled={alterandoStatus}
            >
              Fechar
            </button>

            <button
              type="button"
              className="cliente-modal-button secondary"
              onClick={() => onEditar(cliente)}
              disabled={alterandoStatus}
            >
              Editar Cadastro
            </button>

            <button
              type="button"
              className={
                `cliente-modal-button ${
                  ativo ? 'danger' : 'activate'
                }`
              }
              onClick={() => onAlternarStatus(cliente)}
              disabled={alterandoStatus}
            >
              {alterandoStatus
                ? 'Atualizando...'
                : ativo
                  ? 'Inativar'
                  : 'Ativar'}
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

function Clientes() {
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [statusFiltro, setStatusFiltro] = useState('todos')
  const [cidadeFiltro, setCidadeFiltro] = useState('todas')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [ordem, setOrdem] = useState('codigo')
  const [direcao, setDirecao] = useState(1)

  const [modalFormulario, setModalFormulario] = useState(true)
  const [clienteEdicao, setClienteEdicao] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)
  const [mensagemFormulario, setMensagemFormulario] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [consultandoCep, setConsultandoCep] = useState(false)
  const [mensagemCep, setMensagemCep] = useState('')
  const [tipoMensagemCep, setTipoMensagemCep] = useState('')

  const ultimoCepConsultadoRef = useRef('')

  const [clienteDetalhes, setClienteDetalhes] = useState(null)
  const [menuAberto, setMenuAberto] = useState('')
  const [alterandoStatus, setAlterandoStatus] = useState('')

  const [toast, setToast] = useState('')


  // ==========================================================
  // CARREGAR CLIENTES
  // ==========================================================

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        setCarregando(true)
        setErro('')

        const dados = await listarClientes()

        if (!ativo) {
          return
        }

        setClientes(
          Array.isArray(dados)
            ? dados
            : [],
        )
      } catch (error) {
        if (!ativo) {
          return
        }

        console.error(
          'Erro ao carregar clientes:',
          error,
        )

        setErro(
          error.message ||
          'Não foi possível carregar os clientes.',
        )
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    carregar()

    return () => {
      ativo = false
    }
  }, [])


  // ==========================================================
  // FECHAR MENU AO CLICAR FORA
  // ==========================================================

  useEffect(() => {
    function fecharMenu(event) {
      if (
        event.target instanceof Element &&
        !event.target.closest('.cliente-menu-wrap')
      ) {
        setMenuAberto('')
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
  }, [])


  // ==========================================================
  // TOAST
  // ==========================================================

  function mostrarToast(mensagem) {
    setToast(mensagem)

    window.setTimeout(() => {
      setToast('')
    }, 3500)
  }


  // ==========================================================
  // FILTROS
  // ==========================================================

  const clientesFiltrados = useMemo(() => {
    const termo =
      busca
        .trim()
        .toLowerCase()

    return clientes.filter((cliente) => {
      const correspondeBusca =
        termo === '' ||
        [
          cliente.codigo,
          cliente.nome,
          cliente.documento,
          cliente.telefone,
          cliente.email,
          cliente.logradouro,
          cliente.bairro,
          cliente.cidade,
          cliente.uf,
          cliente.cep,
        ]
          .filter(Boolean)
          .some((valor) =>
            String(valor)
              .toLowerCase()
              .includes(termo),
          )

      const correspondeTipo =
        tipoFiltro === 'todos' ||
        cliente.tipo === tipoFiltro

      const correspondeStatus =
        statusFiltro === 'todos' ||
        cliente.status === statusFiltro

      return (
        correspondeBusca &&
        correspondeTipo &&
        correspondeStatus && (cidadeFiltro === 'todas' || cliente.cidade === cidadeFiltro)
      )
    })
  }, [
    clientes,
    busca,
    tipoFiltro,
    statusFiltro,
    cidadeFiltro,
  ])


  const cidadesDisponiveis = [...new Set(clientes.map(cliente => cliente.cidade).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(clientesFiltrados.length / porPagina)))
  const clientesVisiveis = [...clientesFiltrados].sort((a, b) => String(a[ordem] || '').localeCompare(String(b[ordem] || ''), 'pt-BR', { numeric: true }) * direcao).slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)
  function ordenar(campo) {
    setDirecao(ordem === campo ? -direcao : 1)
    setOrdem(campo)
    setPagina(1)
  }

  // ==========================================================
  // KPIS
  // ==========================================================

  const graficos = useMemo(() => {
    const registros = clientes.map(cliente => ({ cliente, data: new Date(cliente.criado_em) })).filter(item => item.cliente.criado_em && !Number.isNaN(item.data.getTime()))
    const ultimaData = registros.length ? new Date(Math.max(...registros.map(item => item.data.getTime()))) : new Date()
    const periodos = Array.from({ length: 6 }, (_, indice) => new Date(ultimaData.getFullYear(), ultimaData.getMonth() - 5 + indice, 1))
    const grupos = periodos.map(mes => registros.filter(item => item.data.getFullYear() === mes.getFullYear() && item.data.getMonth() === mes.getMonth()).map(item => item.cliente))
    const meses = periodos.map(mes => mes.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }))
    return {
      meses,
      total: grupos.map(grupo => grupo.length),
      ativos: grupos.map(grupo => grupo.filter(cliente => cliente.status === 'ativo').length),
      inativos: grupos.map(grupo => grupo.filter(cliente => cliente.status !== 'ativo').length),
      cidades: grupos.map(grupo => new Set(grupo.filter(cliente => cliente.cidade && cliente.uf).map(cliente => cliente.cidade.trim().toLowerCase() + '-' + cliente.uf)).size),
    }
  }, [clientes])

  const indicadores = useMemo(() => {
    const ativos =
      clientes.filter(
        (cliente) =>
          cliente.status === 'ativo',
      ).length

    const inativos =
      clientes.length -
      ativos

    const cidades =
      new Set(
        clientes
          .filter((cliente) =>
            cliente.cidade &&
            cliente.uf,
          )
          .map((cliente) =>
            `${cliente.cidade.trim().toLowerCase()}-${cliente.uf}`,
          ),
      ).size

    return {
      total: clientes.length,
      ativos,
      inativos,
      cidades,
    }
  }, [clientes])


  // ==========================================================
  // FORMULÁRIO
  // ==========================================================

  function abrirNovoCliente() {
    setClienteEdicao(null)
    setFormulario({
      ...FORMULARIO_INICIAL,
    })
    setMensagemFormulario('')
    setMensagemCep('')
    setTipoMensagemCep('')
    setConsultandoCep(false)

    ultimoCepConsultadoRef.current = ''

    setModalFormulario(true)
    setMenuAberto('')
    window.requestAnimationFrame(() => {
      document.getElementById('nome')?.focus()
    })
  }


  function abrirEditarCliente(cliente) {
    setClienteDetalhes(null)
    setClienteEdicao(cliente)

    setFormulario({
      nome: cliente.nome ?? '',
      tipo: cliente.tipo ?? 'pessoa_juridica',
      documento: formatarDocumento(
        cliente.documento,
        cliente.tipo,
      ),
      telefone: formatarTelefone(
        cliente.telefone ?? '',
      ),
      email: cliente.email ?? '',
      cep: formatarCep(
        cliente.cep ?? '',
      ),
      logradouro: cliente.logradouro ?? '',
      numero: cliente.numero ?? '',
      complemento: cliente.complemento ?? '',
      bairro: cliente.bairro ?? '',
      cidade: cliente.cidade ?? '',
      uf: cliente.uf ?? '',
    })

    setMensagemFormulario('')
    setMensagemCep('')
    setTipoMensagemCep('')
    setConsultandoCep(false)

    ultimoCepConsultadoRef.current =
      somenteDigitos(
        cliente.cep ?? '',
      )

    setModalFormulario(true)
    setMenuAberto('')
  }


  function fecharFormulario() {
    if (salvando) {
      return
    }

    setModalFormulario(true)
    setClienteEdicao(null)
    setFormulario({
      ...FORMULARIO_INICIAL,
    })
    setMensagemFormulario('')
    setMensagemCep('')
    setTipoMensagemCep('')
    setConsultandoCep(false)

    ultimoCepConsultadoRef.current = ''
  }


  function alterarFormulario(event) {
    const {
      name,
      value,
    } = event.target

    setFormulario((anterior) => {
      if (name === 'tipo') {
        return {
          ...anterior,
          tipo: value,
          documento: '',
        }
      }

      if (name === 'documento') {
        return {
          ...anterior,
          documento: formatarDocumento(
            value,
            anterior.tipo,
          ),
        }
      }

      if (name === 'telefone') {
        return {
          ...anterior,
          telefone: formatarTelefone(value),
        }
      }

      if (name === 'cep') {
        return {
          ...anterior,
          cep: formatarCep(value),
        }
      }

      return {
        ...anterior,
        [name]: value,
      }
    })

    setMensagemFormulario('')

    if (
      name === 'cep'
    ) {
      const cep =
        somenteDigitos(value)

      setMensagemCep('')
      setTipoMensagemCep('')

      if (
        cep.length < 8
      ) {
        ultimoCepConsultadoRef.current = ''
      }

      if (
        cep.length === 8 &&
        ultimoCepConsultadoRef.current !== cep
      ) {
        consultarCep(
          cep,
        )
      }
    }
  }


  // ==========================================================
  // CONSULTAR CEP - VIACEP
  // ==========================================================

  async function consultarCep(
    cepInformado,
  ) {
    const cep =
      somenteDigitos(
        cepInformado,
      )

    if (
      cep.length !== 8
    ) {
      return
    }

    ultimoCepConsultadoRef.current =
      cep

    try {
      setConsultandoCep(
        true,
      )

      setMensagemCep('')
      setTipoMensagemCep('')

      const resposta =
        await fetch(
          `https://viacep.com.br/ws/${cep}/json/`,
        )

      if (
        !resposta.ok
      ) {
        throw new Error(
          'Não foi possível consultar o CEP.',
        )
      }

      const dados =
        await resposta.json()

      if (
        dados.erro
      ) {
        setMensagemCep(
          'CEP não encontrado. Preencha o endereço manualmente.',
        )

        setTipoMensagemCep(
          'erro',
        )

        return
      }

      setFormulario(
        (
          anterior,
        ) => {
          if (
            somenteDigitos(
              anterior.cep,
            ) !==
            cep
          ) {
            return anterior
          }

          return {
            ...anterior,

            cep:
              formatarCep(
                dados.cep ??
                cep,
              ),

            logradouro:
              dados.logradouro ||
              anterior.logradouro,

            bairro:
              dados.bairro ||
              anterior.bairro,

            cidade:
              dados.localidade ||
              anterior.cidade,

            uf:
              dados.uf ||
              anterior.uf,

            complemento:
              anterior.complemento ||
              dados.complemento ||
              '',
          }
        },
      )

      setMensagemCep(
        'Endereço localizado. Informe apenas o número e confira os dados.',
      )

      setTipoMensagemCep(
        'sucesso',
      )

    } catch (
      error
    ) {
      console.error(
        'Erro ao consultar CEP:',
        error,
      )

      setMensagemCep(
        'Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.',
      )

      setTipoMensagemCep(
        'erro',
      )

    } finally {
      setConsultandoCep(
        false,
      )
    }
  }


  function validarFormulario() {
    if (!formulario.nome.trim()) {
      return 'Informe o nome ou razão social.'
    }

    const documento =
      somenteDigitos(formulario.documento)

    const tamanhoEsperado =
      formulario.tipo === 'pessoa_fisica'
        ? 11
        : 14

    if (documento.length !== tamanhoEsperado) {
      return formulario.tipo === 'pessoa_fisica'
        ? 'Informe um CPF com 11 dígitos.'
        : 'Informe um CNPJ com 14 dígitos.'
    }

    if (
      formulario.email.trim() &&
      (
        !formulario.email.includes('@') ||
        !formulario.email
          .split('@')
          .at(-1)
          .includes('.')
      )
    ) {
      return 'Informe um e-mail válido.'
    }

    if (!formulario.logradouro.trim()) {
      return 'Informe o logradouro.'
    }

    if (!formulario.cidade.trim()) {
      return 'Informe a cidade.'
    }

    if (!formulario.uf) {
      return 'Selecione a UF.'
    }

    const cep =
      somenteDigitos(formulario.cep)

    if (
      cep &&
      cep.length !== 8
    ) {
      return 'Informe um CEP com 8 dígitos.'
    }

    return ''
  }


  async function salvarCliente(event) {
    event.preventDefault()

    const mensagemValidacao =
      validarFormulario()

    if (mensagemValidacao) {
      setMensagemFormulario(
        mensagemValidacao,
      )
      return
    }

    const dados = {
      nome:
        formulario.nome.trim(),

      tipo:
        formulario.tipo,

      documento:
        somenteDigitos(
          formulario.documento,
        ),

      telefone:
        formulario.telefone.trim() || null,

      email:
        formulario.email.trim() || null,

      cep:
        somenteDigitos(
          formulario.cep,
        ) || null,

      logradouro:
        formulario.logradouro.trim(),

      numero:
        formulario.numero.trim() || null,

      complemento:
        formulario.complemento.trim() || null,

      bairro:
        formulario.bairro.trim() || null,

      cidade:
        formulario.cidade.trim(),

      uf:
        formulario.uf,
    }

    try {
      setSalvando(true)
      setMensagemFormulario('')

      if (clienteEdicao) {
        const atualizado =
          await editarCliente(
            clienteEdicao.codigo,
            dados,
          )

        setClientes((anteriores) =>
          anteriores.map((cliente) =>
            cliente.codigo === atualizado.codigo
              ? atualizado
              : cliente,
          ),
        )

        mostrarToast(
          `Cliente ${atualizado.codigo} atualizado com sucesso.`,
        )
      } else {
        const novo =
          await cadastrarCliente(
            dados,
          )

        setClientes((anteriores) => [
          novo,
          ...anteriores,
        ])

        mostrarToast(
          `Cliente ${novo.codigo} cadastrado com sucesso.`,
        )
      }

      setModalFormulario(true)
      setClienteEdicao(null)
      setFormulario({
        ...FORMULARIO_INICIAL,
      })
    } catch (error) {
      console.error(
        'Erro ao salvar cliente:',
        error,
      )

      setMensagemFormulario(
        error.message ||
        'Não foi possível salvar o cliente.',
      )
    } finally {
      setSalvando(false)
    }
  }


  // ==========================================================
  // DETALHES / STATUS
  // ==========================================================

  function abrirDetalhes(cliente) {
    setClienteDetalhes(cliente)
    setMenuAberto('')
  }


  function fecharDetalhes() {
    if (alterandoStatus) {
      return
    }

    setClienteDetalhes(null)
  }


  async function alternarStatus(cliente) {
    const novoStatus =
      cliente.status === 'ativo'
        ? 'inativo'
        : 'ativo'

    try {
      setAlterandoStatus(cliente.codigo)
      setMenuAberto('')

      const atualizado =
        await atualizarStatusCliente(
          cliente.codigo,
          novoStatus,
        )

      setClientes((anteriores) =>
        anteriores.map((item) =>
          item.codigo === atualizado.codigo
            ? atualizado
            : item,
        ),
      )

      setClienteDetalhes((atual) =>
        atual?.codigo === atualizado.codigo
          ? atualizado
          : atual,
      )

      mostrarToast(
        `${atualizado.codigo} ${
          novoStatus === 'ativo'
            ? 'ativado'
            : 'inativado'
        } com sucesso.`,
      )
    } catch (error) {
      console.error(
        'Erro ao alterar status do cliente:',
        error,
      )

      mostrarToast(
        error.message ||
        'Não foi possível alterar o status.',
      )
    } finally {
      setAlterandoStatus('')
    }
  }


  // ==========================================================
  // EXPORTAR CSV
  // ==========================================================

  function exportarCsv() {
    if (clientesFiltrados.length === 0) {
      mostrarToast(
        'Não há clientes para exportar.',
      )
      return
    }

    const escapar = (valor) =>
      `"${String(valor ?? '').replaceAll('"', '""')}"`

    const linhas = [
      [
        'Código',
        'Nome / Razão Social',
        'Tipo',
        'CPF/CNPJ',
        'Telefone',
        'E-mail',
        'CEP',
        'Logradouro',
        'Número',
        'Complemento',
        'Bairro',
        'Cidade',
        'UF',
        'Status',
      ],
      ...clientesVisiveis.map((cliente) => [
        cliente.codigo,
        cliente.nome,
        rotuloTipo(cliente.tipo),
        formatarDocumento(
          cliente.documento,
          cliente.tipo,
        ),
        cliente.telefone ?? '',
        cliente.email ?? '',
        cliente.cep
          ? formatarCep(cliente.cep)
          : '',
        cliente.logradouro,
        cliente.numero ?? '',
        cliente.complemento ?? '',
        cliente.bairro ?? '',
        cliente.cidade,
        cliente.uf,
        cliente.status === 'ativo'
          ? 'Ativo'
          : 'Inativo',
      ]),
    ]

    const conteudo =
      linhas
        .map((linha) =>
          linha
            .map(escapar)
            .join(';'),
        )
        .join('\n')

    const blob =
      new Blob(
        [
          '\uFEFF',
          conteudo,
        ],
        {
          type: 'text/csv;charset=utf-8;',
        },
      )

    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement('a')

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
      `clientes-${dataArquivo}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)

    mostrarToast(
      `${clientesFiltrados.length} cliente(s) exportado(s) com os filtros atuais.`,
    )
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="content clientes-page reference-page">
      {toast && (
        <div className="cliente-toast">
          <span>✓</span>
          {toast}
        </div>
      )}


      <header className="clientes-page-header">
        <div>
          <h2>
            Clientes
          </h2>

          <p>
            Gerencie o cadastro e o relacionamento com seus clientes. Acompanhe contatos e endereços de entrega.
          </p>
        </div>

        <div className="clientes-actions">
          <button
            type="button"
            className="clientes-button secondary"
            onClick={exportarCsv}
          >
            <Icon name="download" size={17} /> Exportar Cadastro
          </button>

          <button
            type="button"
            className="clientes-button primary"
            onClick={abrirNovoCliente}
          >
            <Icon name="plus" size={18} /> Novo Cliente
          </button>
        </div>
      </header>


      <section className="clientes-kpis">
        <article className="cliente-kpi">
          <div className="cliente-kpi-icon total">
            <Icon name="users" size={25} />
          </div>

          <div>
            <span>Total de Clientes</span>
            <strong>{indicadores.total}</strong>
            <small>Cadastros · 6 meses</small>
            <GraficoCliente valores={graficos.total} meses={graficos.meses} titulo="Cadastros por mês" barras={true} />
          </div>
        </article>

        <article className="cliente-kpi">
          <div className="cliente-kpi-icon ativos">
            <Icon name="check" size={25} />
          </div>

          <div>
            <span>Ativos</span>
            <strong>{indicadores.ativos}</strong>
            <small>Cadastros · 6 meses</small>
            <GraficoCliente valores={graficos.ativos} meses={graficos.meses} titulo="Cadastros atualmente ativos por mês" barras={false} />
          </div>
        </article>

        <article className="cliente-kpi">
          <div className="cliente-kpi-icon inativos">
            <Icon name="user" size={25} />
          </div>

          <div>
            <span>Inativos</span>
            <strong>{indicadores.inativos}</strong>
            <small>Cadastros · 6 meses</small>
            <GraficoCliente valores={graficos.inativos} meses={graficos.meses} titulo="Cadastros atualmente inativos por mês" barras={true} />
          </div>
        </article>

        <article className="cliente-kpi">
          <div className="cliente-kpi-icon cidades">
            <Icon name="pin" size={25} />
          </div>

          <div>
            <span>Cidades Atendidas</span>
            <strong>{indicadores.cidades}</strong>
            <small>Cadastros · 6 meses</small>
            <GraficoCliente valores={graficos.cidades} meses={graficos.meses} titulo="Cidades dos cadastros por mês" barras={false} />
          </div>
        </article>
      </section>


      <div className="lf-workspace">
      <section className="clientes-table-card">
        <div className="clientes-table-header">
          <span className="lf-heading-icon"><Icon name="users" size={25} /></span>
          <div>
            <h3>
              Lista de Clientes
            </h3>

            <span>
              {clientesFiltrados.length} registro(s) encontrado(s)
            </span>
          </div>
        </div>


        <div className="clientes-toolbar">
          <div className="clientes-search">
            <Icon name="search" size={18} />

            <input
              type="text"
              value={busca}
              onChange={(event) =>
                { setBusca(event.target.value); setPagina(1) }
              }
              placeholder="Buscar por nome, CPF/CNPJ, e-mail ou cidade..."
              aria-label="Buscar clientes"
            />
          </div>

          <select aria-label="Filtrar por tipo de cliente"
            value={tipoFiltro}
            onChange={(event) =>
              { setTipoFiltro(event.target.value); setPagina(1) }
            }
          >
            <option value="todos">
              Todos os tipos
            </option>

            <option value="pessoa_juridica">
              Pessoa Jurídica
            </option>

            <option value="pessoa_fisica">
              Pessoa Física
            </option>
          </select>

          <select aria-label="Filtrar clientes por status"
            value={statusFiltro}
            onChange={(event) =>
              { setStatusFiltro(event.target.value); setPagina(1) }
            }
          >
            <option value="todos">
              Todos os status
            </option>

            <option value="ativo">
              Ativos
            </option>

            <option value="inativo">
              Inativos
            </option>
          </select>

          <select aria-label="Filtrar por cidade" value={cidadeFiltro} onChange={event => { setCidadeFiltro(event.target.value); setPagina(1) }}>
            <option value="todas">Todas as cidades</option>
            {cidadesDisponiveis.map(cidade => <option key={cidade} value={cidade}>{cidade}</option>)}
          </select>
          <span className="clientes-resultado">
            {clientesFiltrados.length} resultado(s)
          </span>
        </div>


        {erro && (
          <div className="clientes-error">
            {erro}
          </div>
        )}


        <div className="clientes-table-wrapper" role="region" aria-label="Lista de clientes" tabIndex={0}>
          <table className="clientes-table">
            <thead>
              <tr>
                <th aria-sort={ordem === 'codigo' ? (direcao === 1 ? 'ascending' : 'descending') : 'none'}><button className="lf-sort" onClick={() => ordenar('codigo')}>Código ↕</button></th>
                <th aria-sort={ordem === 'nome' ? (direcao === 1 ? 'ascending' : 'descending') : 'none'}><button className="lf-sort" onClick={() => ordenar('nome')}>Cliente ↕</button></th>
                <th>CPF/CNPJ</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>CEP</th>
                <th>Cidade</th>
                <th>Status</th>
                <th className="cliente-acoes-coluna"><span aria-label="Ações">•••</span></th>
              </tr>
            </thead>

            <tbody>
              {carregando && (
                <tr>
                  <td colSpan="9" className="cliente-vazio">
                    Carregando clientes...
                  </td>
                </tr>
              )}

              {!carregando &&
                !erro &&
                clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="9" className="cliente-vazio">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}

              {!carregando &&
                !erro &&
                clientesVisiveis.map((cliente) => {
                  const ativo =
                    cliente.status === 'ativo'

                  return (
                    <tr key={cliente.codigo}>
                      <td className="lf-code">{cliente.codigo}</td>
                      <td><button type="button" className="lf-row-select" title={cliente.nome} onClick={() => abrirDetalhes(cliente)}>{cliente.nome}</button></td>
                      <td className="cliente-muted" title={formatarDocumento(cliente.documento, cliente.tipo)}>{formatarDocumento(cliente.documento, cliente.tipo)}</td>
                      <td title={cliente.telefone}>{textoSeguro(cliente.telefone, '—')}</td>
                      <td title={cliente.email}>{textoSeguro(cliente.email, '—')}</td>
                      <td>{formatarCep(cliente.cep) || '—'}</td>
                      <td title={`${cliente.cidade || ""} - ${cliente.uf || ""}`}>{textoSeguro(cliente.cidade, '—')}{cliente.uf ? ` - ${cliente.uf}` : ''}</td>
                      <td><span className={`cliente-status ${cliente.status}`}>{ativo ? 'Ativo' : 'Inativo'}</span></td>
                      <td className="cliente-acoes">
                        <div className="cliente-menu-wrap">
                          <button
                            type="button"
                            className="cliente-menu-button"
                            aria-label={`Ações de ${cliente.nome}`} aria-expanded={menuAberto === cliente.codigo}
                            onClick={(event) => {
                              event.stopPropagation()

                              setMenuAberto((atual) =>
                                atual === cliente.codigo
                                  ? ''
                                  : cliente.codigo,
                              )
                            }}
                          >
                            •••
                          </button>

                          {menuAberto === cliente.codigo && (
                            <div className="cliente-menu">
                              <button
                                type="button"
                                onClick={() =>
                                  abrirDetalhes(cliente)
                                }
                              >
                                Visualizar detalhes
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  abrirEditarCliente(cliente)
                                }
                              >
                                Editar cadastro
                              </button>

                              <button
                                type="button"
                                className={
                                  ativo
                                    ? 'danger'
                                    : 'activate'
                                }
                                disabled={
                                  alterandoStatus ===
                                  cliente.codigo
                                }
                                onClick={() =>
                                  alternarStatus(cliente)
                                }
                              >
                                {alterandoStatus === cliente.codigo
                                  ? 'Atualizando...'
                                  : ativo
                                    ? 'Inativar'
                                    : 'Ativar'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
        <Pagination total={clientesFiltrados.length} page={paginaAtual} pageSize={porPagina} onPage={setPagina} onPageSize={setPorPagina} noun="clientes" />
      </section>

      <ModalCliente
        embutido
        aberto={modalFormulario}
        modoEdicao={Boolean(clienteEdicao)}
        formulario={formulario}
        mensagem={mensagemFormulario}
        salvando={salvando}
        consultandoCep={consultandoCep}
        mensagemCep={mensagemCep}
        tipoMensagemCep={tipoMensagemCep}
        onAlterar={alterarFormulario}
        onFechar={fecharFormulario}
        onSalvar={salvarCliente}
      />
      </div>


      <ModalDetalhesCliente
        cliente={clienteDetalhes}
        alterandoStatus={Boolean(alterandoStatus)}
        onFechar={fecharDetalhes}
        onEditar={abrirEditarCliente}
        onAlternarStatus={alternarStatus}
      />
    </main>
  )
}


export default Clientes
