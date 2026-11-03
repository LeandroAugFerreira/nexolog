// ============================================================
// NEXOLOG
// FORNECEDORES
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react'

import * as XLSX from 'xlsx'
import { rotuloCategoria } from '../data/categorias'

import {
  atualizarStatusFornecedor,
  cadastrarFornecedor,
  editarFornecedor,
  listarFornecedores,
} from '../services/api'

import './Fornecedores.css'


// ============================================================
// CONFIGURAÇÕES
// ============================================================

const CATEGORIAS = [
  'Papelaria',
  'Papéis e Impressão',
  'Canetas e Escrita',
  'Cadernos, Agendas e Blocos',
  'Colas, Fitas e Adesivos',
  'Pastas, Arquivos e Organização',
  'Identificação',
  'Embalagens',
  'Escritório',
  'Equipamentos',
  'Tecnologia',
  'Serviços',
  'Transportes',
  'EPI',
  'Outros',
]

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF',
  'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS',
  'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const FORMULARIO_INICIAL = {
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  categoria: '',
  contato: '',
  telefone: '',
  email: '',
  cidade: '',
  uf: '',
  prazo_medio_entrega: '',
}


// ============================================================
// AUXILIARES
// ============================================================

function somenteDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}

function formatarCnpj(valor) {
  const numeros = somenteDigitos(valor).slice(0, 14)

  return numeros
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
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

function nomeExibicao(fornecedor) {
  return (
    fornecedor.nome_fantasia?.trim() ||
    fornecedor.razao_social?.trim() ||
    fornecedor.codigo ||
    'Fornecedor'
  )
}


function CategoriaDropdown({
  valor,
  opcoes,
  onChange,
  placeholder = 'Selecione...',
  disabled = false,
  compacto = false,
}) {
  const [aberto, setAberto] = useState(false)
  const referencia = useRef(null)

  useEffect(() => {
    function fecharAoClicarFora(event) {
      if (
        referencia.current &&
        !referencia.current.contains(event.target)
      ) {
        setAberto(false)
      }
    }

    function fecharComEscape(event) {
      if (event.key === 'Escape') {
        setAberto(false)
      }
    }

    if (aberto) {
      document.addEventListener('mousedown', fecharAoClicarFora)
      document.addEventListener('keydown', fecharComEscape)
    }

    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora)
      document.removeEventListener('keydown', fecharComEscape)
    }
  }, [aberto])

  const opcaoSelecionada =
    opcoes.find((opcao) => opcao.value === valor)

  return (
    <div
      ref={referencia}
      className={
        `fornecedor-category-dropdown${aberto ? ' aberto' : ''}${compacto ? ' compacto' : ''}`
      }
    >
      <button
        type="button"
        className="fornecedor-category-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
      >
        <span>
          {opcaoSelecionada?.label || placeholder}
        </span>

        <b aria-hidden="true">
          ▾
        </b>
      </button>

      {aberto && (
        <div
          className="fornecedor-category-menu"
          role="listbox"
        >
          {opcoes.map((opcao) => (
            <button
              key={opcao.value}
              type="button"
              role="option"
              aria-selected={opcao.value === valor}
              className={opcao.value === valor ? 'selecionada' : ''}
              onClick={() => {
                onChange(opcao.value)
                setAberto(false)
              }}
            >
              <span>{opcao.label}</span>

              {opcao.value === valor && (
                <strong aria-hidden="true">
                  ✓
                </strong>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


// ============================================================
// MODAL DE CADASTRO / EDIÇÃO
// ============================================================

function ModalFornecedor({
  aberto,
  modoEdicao,
  formulario,
  mensagem,
  salvando,
  onAlterar,
  onCategoria,
  onFechar,
  onSalvar,
}) {
  if (!aberto) {
    return null
  }

  return (
    <div
      className="fornecedor-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !salvando
        ) {
          onFechar()
        }
      }}
    >
      <div className="fornecedor-modal">
        <div className="fornecedor-modal-header">
          <div>
            <span className="fornecedor-modal-subtitle">
              {modoEdicao ? 'EDIÇÃO' : 'CADASTRO'}
            </span>

            <h3>
              {modoEdicao ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
            </h3>

            <p>
              Registre os dados comerciais, contato e prazo de entrega.
            </p>
          </div>

          <button
            type="button"
            className="fornecedor-modal-close"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form className="fornecedor-form" onSubmit={onSalvar}>
          <div className="fornecedor-form-section">
            <span className="fornecedor-section-title">
              Identificação
            </span>

            <div className="fornecedor-form-group">
              <label htmlFor="razao_social">
                Razão Social *
              </label>

              <input
                id="razao_social"
                name="razao_social"
                type="text"
                value={formulario.razao_social}
                onChange={onAlterar}
                placeholder="Ex.: Embalagens Campinas Ltda."
                disabled={salvando}
                autoFocus
              />
            </div>

            <div className="fornecedor-form-row">
              <div className="fornecedor-form-group">
                <label htmlFor="nome_fantasia">
                  Nome Fantasia
                </label>

                <input
                  id="nome_fantasia"
                  name="nome_fantasia"
                  type="text"
                  value={formulario.nome_fantasia}
                  onChange={onAlterar}
                  placeholder="Ex.: EmbalaCamp"
                  disabled={salvando}
                />
              </div>

              <div className="fornecedor-form-group">
                <label htmlFor="cnpj">
                  CNPJ *
                </label>

                <input
                  id="cnpj"
                  name="cnpj"
                  type="text"
                  value={formulario.cnpj}
                  onChange={onAlterar}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  disabled={salvando || modoEdicao}
                />
              </div>
            </div>

            <div className="fornecedor-form-group">
              <label htmlFor="categoria">
                Categoria *
              </label>

              <CategoriaDropdown
                valor={formulario.categoria}
                opcoes={[
                  {
                    value: '',
                    label: 'Selecione...',
                  },
                  ...CATEGORIAS.map((categoria) => ({
                    value: categoria,
                    label: rotuloCategoria(categoria),
                  })),
                ]}
                onChange={onCategoria}
                placeholder="Selecione..."
                disabled={salvando}
              />
            </div>
          </div>

          <div className="fornecedor-form-section">
            <span className="fornecedor-section-title">
              Contato
            </span>

            <div className="fornecedor-form-row">
              <div className="fornecedor-form-group">
                <label htmlFor="contato">
                  Responsável
                </label>

                <input
                  id="contato"
                  name="contato"
                  type="text"
                  value={formulario.contato}
                  onChange={onAlterar}
                  placeholder="Nome do contato"
                  disabled={salvando}
                />
              </div>

              <div className="fornecedor-form-group">
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
                  disabled={salvando}
                />
              </div>
            </div>

            <div className="fornecedor-form-group">
              <label htmlFor="email">
                E-mail
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formulario.email}
                onChange={onAlterar}
                placeholder="comercial@fornecedor.com.br"
                disabled={salvando}
              />
            </div>
          </div>

          <div className="fornecedor-form-section">
            <span className="fornecedor-section-title">
              Localização e Operação
            </span>

            <div className="fornecedor-form-row">
              <div className="fornecedor-form-group">
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

              <div className="fornecedor-form-group">
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

            <div className="fornecedor-form-group">
              <label htmlFor="prazo_medio_entrega">
                Prazo Médio de Entrega *
              </label>

              <div className="fornecedor-input-sufixo">
                <input
                  id="prazo_medio_entrega"
                  name="prazo_medio_entrega"
                  type="number"
                  min="0"
                  max="365"
                  step="1"
                  value={formulario.prazo_medio_entrega}
                  onChange={onAlterar}
                  placeholder="0"
                  disabled={salvando}
                />

                <span>
                  dias
                </span>
              </div>
            </div>
          </div>

          {mensagem && (
            <div className="fornecedor-form-message">
              {mensagem}
            </div>
          )}

          <div className="fornecedor-modal-actions">
            <button
              type="button"
              className="fornecedor-modal-button cancel"
              onClick={onFechar}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="fornecedor-modal-button save"
              disabled={salvando}
            >
              {salvando
                ? 'Salvando...'
                : modoEdicao
                  ? 'Salvar Alterações'
                  : 'Cadastrar Fornecedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ============================================================
// ÍCONES / ELEMENTOS VISUAIS
// ============================================================

function SvgIcon({
  children,
  size = 18,
  className = '',
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function UsersIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </SvgIcon>
  )
}

function BoxIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="m21 16-9 5-9-5V8l9-5 9 5z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </SvgIcon>
  )
}

function TruckIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M10 17h4V5H2v12h3" />
      <path d="M14 9h4l4 4v4h-3" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </SvgIcon>
  )
}

function ClockIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </SvgIcon>
  )
}


function StarIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </SvgIcon>
  )
}

function SearchIcon(props) {
  return (
    <SvgIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </SvgIcon>
  )
}

function UploadIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </SvgIcon>
  )
}

function DownloadIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </SvgIcon>
  )
}

function PlusIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </SvgIcon>
  )
}

function BuildingIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M5 21V4h10v17" />
      <path d="M15 9h4v12" />
      <path d="M8 8h3" />
      <path d="M8 12h3" />
      <path d="M8 16h3" />
      <path d="M3 21h18" />
    </SvgIcon>
  )
}

function MapPinIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </SvgIcon>
  )
}

function KpiMiniChart({ tipo = 'bars', classe = 'azul' }) {
  if (tipo === 'line') {
    return (
      <svg
        className={`fornecedor-kpi-mini line ${classe}`}
        viewBox="0 0 92 46"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="area"
          d="M2 36 C10 34, 15 23, 25 25 S39 31, 49 19 S63 17, 72 20 S82 17, 90 12 L90 46 L2 46 Z"
        />
        <path
          className="line-path"
          d="M2 36 C10 34, 15 23, 25 25 S39 31, 49 19 S63 17, 72 20 S82 17, 90 12"
        />
        <circle cx="2" cy="36" r="2.2" />
        <circle cx="25" cy="25" r="2.2" />
        <circle cx="49" cy="19" r="2.2" />
        <circle cx="72" cy="20" r="2.2" />
        <circle cx="90" cy="12" r="2.4" />
      </svg>
    )
  }

  return (
    <div
      className={`fornecedor-kpi-mini bars ${classe}`}
      aria-hidden="true"
    >
      {[18, 28, 39, 53, 69, 84, 96].map((altura, index) => (
        <i key={`${classe}-${index}`} style={{ height: `${altura}%` }} />
      ))}
    </div>
  )
}

function PainelDetalhesFornecedor({
  fornecedor,
  aba,
  onAba,
  alterandoStatus,
  onFechar,
  onEditar,
  onAlternarStatus,
}) {
  if (!fornecedor) {
    return (
      <aside className="fornecedor-sidepanel vazio">
        <div className="fornecedor-sidepanel-empty-icon">
          <BuildingIcon size={24} />
        </div>
        <strong>Selecione um fornecedor</strong>
        <span>
          Clique em uma linha da tabela para visualizar os dados cadastrais.
        </span>
      </aside>
    )
  }

  const ativo = fornecedor.status === 'ativo'

  return (
    <aside className="fornecedor-sidepanel">
      <header className="fornecedor-sidepanel-header">
        <div>
          <h3>Detalhes do Fornecedor</h3>
          <p>Informações cadastrais e operacionais do fornecedor selecionado.</p>
        </div>

        <button
          type="button"
          className="fornecedor-sidepanel-close"
          onClick={onFechar}
          aria-label="Fechar detalhes"
        >
          ×
        </button>
      </header>

      <div className="fornecedor-sidepanel-identidade">
        <div className="fornecedor-sidepanel-avatar">
          <BuildingIcon size={26} />
        </div>

        <div className="fornecedor-sidepanel-nome">
          <div>
            <strong>{nomeExibicao(fornecedor)}</strong>
            <span className={`fornecedor-status ${fornecedor.status}`}>
              {ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          <span>{fornecedor.codigo} • {rotuloCategoria(fornecedor.categoria)}</span>

          <small>
            <MapPinIcon size={12} />
            {fornecedor.cidade} - {fornecedor.uf}
          </small>
        </div>
      </div>

      <nav className="fornecedor-sidepanel-tabs">
        {[
          ['geral', 'Geral'],
          ['desempenho', 'Desempenho'],
          ['historico', 'Histórico'],
          ['documentos', 'Documentos'],
        ].map(([valor, rotulo]) => (
          <button
            type="button"
            key={valor}
            className={aba === valor ? 'ativo' : ''}
            onClick={() => onAba(valor)}
          >
            {rotulo}
          </button>
        ))}
      </nav>

      <div className="fornecedor-sidepanel-body">
        {aba === 'geral' && (
          <>
            <div className="fornecedor-sidepanel-grid">
              <label>
                <span>Nome do Fornecedor</span>
                <strong>{nomeExibicao(fornecedor)}</strong>
              </label>

              <label>
                <span>Categoria</span>
                <strong title={fornecedor.categoria}>{rotuloCategoria(fornecedor.categoria)}</strong>
              </label>

              <label>
                <span>Cidade</span>
                <strong>{fornecedor.cidade} - {fornecedor.uf}</strong>
              </label>

              <label>
                <span>Contato Principal</span>
                <strong>{textoSeguro(fornecedor.contato)}</strong>
              </label>

              <label className="wide">
                <span>E-mail</span>
                <strong>{textoSeguro(fornecedor.email)}</strong>
              </label>

              <label>
                <span>Telefone</span>
                <strong>{textoSeguro(fornecedor.telefone)}</strong>
              </label>

              <label>
                <span>CNPJ</span>
                <strong>{formatarCnpj(fornecedor.cnpj)}</strong>
              </label>
            </div>

            <div className="fornecedor-sidepanel-resumo-title">
              <span>Resumo Operacional</span>
              <small>Dados cadastrados</small>
            </div>

            <div className="fornecedor-sidepanel-resumo">
              <article className="verde">
                <TruckIcon size={17} />
                <span>Prazo Médio</span>
                <strong>{fornecedor.prazo_medio_entrega} dias</strong>
              </article>

              <article className="azul">
                <BoxIcon size={17} />
                <span>Status</span>
                <strong>{ativo ? 'Ativo' : 'Inativo'}</strong>
              </article>

              <article className="amarelo">
                <ClockIcon size={17} />
                <span>Cadastrado</span>
                <strong>{formatarData(fornecedor.criado_em)}</strong>
              </article>

              <article className="roxo">
                <ClockIcon size={17} />
                <span>Atualizado</span>
                <strong>{formatarData(fornecedor.atualizado_em)}</strong>
              </article>
            </div>
          </>
        )}

        {aba === 'desempenho' && (
          <div className="fornecedor-sidepanel-section">
            <h4>Indicadores operacionais disponíveis</h4>
            <p>
              O cadastro atual possui prazo médio e status. Indicadores de entregas,
              avaliações e SLA poderão ser exibidos aqui quando esses dados existirem no banco.
            </p>
            <div className="fornecedor-sidepanel-highlight">
              <TruckIcon size={22} />
              <div>
                <span>Prazo médio cadastrado</span>
                <strong>{fornecedor.prazo_medio_entrega} dias</strong>
              </div>
            </div>
          </div>
        )}

        {aba === 'historico' && (
          <div className="fornecedor-sidepanel-section historico">
            <h4>Histórico do cadastro</h4>
            <div className="fornecedor-sidepanel-timeline">
              <article>
                <i />
                <div>
                  <strong>Cadastro criado</strong>
                  <span>{formatarData(fornecedor.criado_em)}</span>
                </div>
              </article>
              <article>
                <i />
                <div>
                  <strong>Última atualização</strong>
                  <span>{formatarData(fornecedor.atualizado_em)}</span>
                </div>
              </article>
            </div>
          </div>
        )}

        {aba === 'documentos' && (
          <div className="fornecedor-sidepanel-section documentos">
            <h4>Documentos do fornecedor</h4>
            <article>
              <span>CNPJ</span>
              <strong>{formatarCnpj(fornecedor.cnpj)}</strong>
            </article>
            <article>
              <span>Código interno</span>
              <strong>{fornecedor.codigo}</strong>
            </article>
            <article>
              <span>Razão Social</span>
              <strong>{fornecedor.razao_social}</strong>
            </article>
          </div>
        )}
      </div>

      <footer className="fornecedor-sidepanel-actions">
        <button
          type="button"
          className="secondary"
          onClick={() => onEditar(fornecedor)}
          disabled={alterandoStatus}
        >
          Editar Cadastro
        </button>

        <button
          type="button"
          className={ativo ? 'danger' : 'activate'}
          onClick={() => onAlternarStatus(fornecedor)}
          disabled={alterandoStatus}
        >
          {alterandoStatus
            ? 'Atualizando...'
            : ativo
              ? 'Inativar'
              : 'Ativar'}
        </button>
      </footer>
    </aside>
  )
}


// ============================================================
// PÁGINA
// ============================================================

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas')
  const [statusFiltro, setStatusFiltro] = useState('todos')

  const [modalFormulario, setModalFormulario] = useState(false)
  const [fornecedorEdicao, setFornecedorEdicao] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)
  const [mensagemFormulario, setMensagemFormulario] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [fornecedorDetalhes, setFornecedorDetalhes] = useState(null)
  const [abaDetalhes, setAbaDetalhes] = useState('geral')
  const [alterandoStatus, setAlterandoStatus] = useState('')

  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina, setItensPorPagina] = useState(10)
  const [ordenacao, setOrdenacao] = useState({
    campo: 'codigo',
    direcao: 'asc',
  })

  const [importando, setImportando] = useState(false)
  const inputImportacaoRef = useRef(null)

  const [toast, setToast] = useState('')


  // ==========================================================
  // CARREGAMENTO
  // ==========================================================

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        setCarregando(true)
        setErro('')

        const dados = await listarFornecedores()

        if (!ativo) {
          return
        }

        const listaFornecedores =
          Array.isArray(dados)
            ? dados
            : []

        setFornecedores(
          listaFornecedores,
        )

        setFornecedorDetalhes((atual) =>
          atual ??
          listaFornecedores[0] ??
          null,
        )
      } catch (error) {
        if (!ativo) {
          return
        }

        console.error(
          'Erro ao carregar fornecedores:',
          error,
        )

        setErro(
          error.message ||
          'Não foi possível carregar os fornecedores.',
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
  // TOAST
  // ==========================================================

  function mostrarToast(mensagem) {
    setToast(mensagem)

    window.setTimeout(() => {
      setToast('')
    }, 3500)
  }


  // ==========================================================
  // FILTROS E KPIS
  // ==========================================================

  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return fornecedores.filter((fornecedor) => {
      const correspondeBusca =
        termo === '' ||
        [
          fornecedor.codigo,
          fornecedor.razao_social,
          fornecedor.nome_fantasia,
          fornecedor.cnpj,
          fornecedor.contato,
          fornecedor.email,
          fornecedor.cidade,
          fornecedor.uf,
          fornecedor.categoria,
          rotuloCategoria(fornecedor.categoria),
        ]
          .filter(Boolean)
          .some((valor) =>
            String(valor).toLowerCase().includes(termo),
          )

      const correspondeCategoria =
        categoriaFiltro === 'todas' ||
        fornecedor.categoria === categoriaFiltro

      const correspondeStatus =
        statusFiltro === 'todos' ||
        fornecedor.status === statusFiltro

      return (
        correspondeBusca &&
        correspondeCategoria &&
        correspondeStatus
      )
    })
  }, [
    fornecedores,
    busca,
    categoriaFiltro,
    statusFiltro,
  ])


  const categoriasDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        [
          ...CATEGORIAS,
          ...fornecedores
            .map((fornecedor) => fornecedor.categoria)
            .filter(Boolean),
        ],
      ),
    ).sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    )
  }, [fornecedores])


  const fornecedoresOrdenados = useMemo(() => {
    const lista = [...fornecedoresFiltrados]

    const valorCampo = (fornecedor, campo) => {
      if (campo === 'nome') {
        return nomeExibicao(fornecedor)
      }

      if (campo === 'localizacao') {
        return `${fornecedor.cidade} ${fornecedor.uf}`
      }

      return fornecedor[campo] ?? ''
    }

    lista.sort((a, b) => {
      const valorA = valorCampo(a, ordenacao.campo)
      const valorB = valorCampo(b, ordenacao.campo)

      const numeroA = Number(valorA)
      const numeroB = Number(valorB)

      let comparacao

      if (
        Number.isFinite(numeroA) &&
        Number.isFinite(numeroB) &&
        String(valorA).trim() !== '' &&
        String(valorB).trim() !== ''
      ) {
        comparacao = numeroA - numeroB
      } else {
        comparacao = String(valorA).localeCompare(
          String(valorB),
          'pt-BR',
          { sensitivity: 'base' },
        )
      }

      return ordenacao.direcao === 'asc'
        ? comparacao
        : -comparacao
    })

    return lista
  }, [fornecedoresFiltrados, ordenacao])


  const totalPaginas = Math.max(
    1,
    Math.ceil(
      fornecedoresOrdenados.length /
      itensPorPagina,
    ),
  )


  const paginaExibida = Math.min(
    paginaAtual,
    totalPaginas,
  )


  const fornecedoresPagina = useMemo(() => {
    const inicio =
      (paginaExibida - 1) * itensPorPagina

    return fornecedoresOrdenados.slice(
      inicio,
      inicio + itensPorPagina,
    )
  }, [
    fornecedoresOrdenados,
    paginaExibida,
    itensPorPagina,
  ])


  const indicadores = useMemo(() => {
    const ativos = fornecedores.filter(
      (fornecedor) => fornecedor.status === 'ativo',
    ).length

    const inativos = fornecedores.length - ativos

    const prazoMedio =
      fornecedores.length === 0
        ? 0
        : Math.round(
            fornecedores.reduce(
              (total, fornecedor) =>
                total +
                Number(
                  fornecedor.prazo_medio_entrega || 0,
                ),
              0,
            ) / fornecedores.length,
          )

    return {
      total: fornecedores.length,
      ativos,
      inativos,
      prazoMedio,
    }
  }, [fornecedores])


  // ==========================================================
  // FORMULÁRIO
  // ==========================================================

  function abrirNovoFornecedor() {
    setFornecedorEdicao(null)
    setFormulario(FORMULARIO_INICIAL)
    setMensagemFormulario('')
    setModalFormulario(true)
  }


  function abrirEditarFornecedor(fornecedor) {
    setFornecedorDetalhes(null)
    setFornecedorEdicao(fornecedor)

    setFormulario({
      razao_social: fornecedor.razao_social ?? '',
      nome_fantasia: fornecedor.nome_fantasia ?? '',
      cnpj: formatarCnpj(fornecedor.cnpj),
      categoria: fornecedor.categoria ?? '',
      contato: fornecedor.contato ?? '',
      telefone: fornecedor.telefone ?? '',
      email: fornecedor.email ?? '',
      cidade: fornecedor.cidade ?? '',
      uf: fornecedor.uf ?? '',
      prazo_medio_entrega:
        fornecedor.prazo_medio_entrega ?? '',
    })

    setMensagemFormulario('')
    setModalFormulario(true)
  }


  function fecharFormulario() {
    if (salvando) {
      return
    }

    setModalFormulario(false)
    setFornecedorEdicao(null)
    setFormulario(FORMULARIO_INICIAL)
    setMensagemFormulario('')
  }


  function alterarFormulario(event) {
    const { name, value } = event.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]:
        name === 'cnpj'
          ? formatarCnpj(value)
          : value,
    }))

    setMensagemFormulario('')
  }


  function alterarCategoriaFormulario(valor) {
    setFormulario((anterior) => ({
      ...anterior,
      categoria: valor,
    }))

    setMensagemFormulario('')
  }


  function validarFormulario() {
    if (!formulario.razao_social.trim()) {
      return 'Informe a razão social.'
    }

    if (somenteDigitos(formulario.cnpj).length !== 14) {
      return 'Informe um CNPJ com 14 dígitos.'
    }

    if (!formulario.categoria) {
      return 'Selecione a categoria.'
    }

    if (!formulario.cidade.trim()) {
      return 'Informe a cidade.'
    }

    if (!formulario.uf) {
      return 'Selecione a UF.'
    }

    const prazo = Number(formulario.prazo_medio_entrega)

    if (
      formulario.prazo_medio_entrega === '' ||
      !Number.isInteger(prazo) ||
      prazo < 0 ||
      prazo > 365
    ) {
      return 'Informe um prazo médio de entrega entre 0 e 365 dias.'
    }

    return ''
  }


  async function salvarFornecedor(event) {
    event.preventDefault()

    const mensagemValidacao = validarFormulario()

    if (mensagemValidacao) {
      setMensagemFormulario(mensagemValidacao)
      return
    }

    const dados = {
      razao_social: formulario.razao_social.trim(),
      nome_fantasia:
        formulario.nome_fantasia.trim() || null,
      cnpj: somenteDigitos(formulario.cnpj),
      categoria: formulario.categoria,
      contato:
        formulario.contato.trim() || null,
      telefone:
        formulario.telefone.trim() || null,
      email:
        formulario.email.trim() || null,
      cidade: formulario.cidade.trim(),
      uf: formulario.uf,
      prazo_medio_entrega:
        Number(formulario.prazo_medio_entrega),
    }

    try {
      setSalvando(true)
      setMensagemFormulario('')

      if (fornecedorEdicao) {
        const atualizado = await editarFornecedor(
          fornecedorEdicao.codigo,
          dados,
        )

        setFornecedores((anteriores) =>
          anteriores.map((fornecedor) =>
            fornecedor.codigo === atualizado.codigo
              ? atualizado
              : fornecedor,
          ),
        )

        mostrarToast(
          `Fornecedor ${atualizado.codigo} atualizado com sucesso.`,
        )
      } else {
        const novo = await cadastrarFornecedor(dados)

        setFornecedores((anteriores) => [
          novo,
          ...anteriores,
        ])

        mostrarToast(
          `Fornecedor ${novo.codigo} cadastrado com sucesso.`,
        )
      }

      setModalFormulario(false)
      setFornecedorEdicao(null)
      setFormulario(FORMULARIO_INICIAL)
    } catch (error) {
      console.error(
        'Erro ao salvar fornecedor:',
        error,
      )

      setMensagemFormulario(
        error.message ||
        'Não foi possível salvar o fornecedor.',
      )
    } finally {
      setSalvando(false)
    }
  }


  // ==========================================================
  // DETALHES / STATUS
  // ==========================================================

  function abrirDetalhes(fornecedor) {
    setFornecedorDetalhes(fornecedor)
    setAbaDetalhes('geral')
  }


  function fecharDetalhes() {
    if (alterandoStatus) {
      return
    }

    setFornecedorDetalhes(null)
  }


  async function alternarStatus(fornecedor) {
    const novoStatus =
      fornecedor.status === 'ativo'
        ? 'inativo'
        : 'ativo'

    try {
      setAlterandoStatus(fornecedor.codigo)

      const atualizado =
        await atualizarStatusFornecedor(
          fornecedor.codigo,
          novoStatus,
        )

      setFornecedores((anteriores) =>
        anteriores.map((item) =>
          item.codigo === atualizado.codigo
            ? atualizado
            : item,
        ),
      )

      setFornecedorDetalhes((atual) =>
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
        'Erro ao alterar status do fornecedor:',
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
  // ORDENAÇÃO / IMPORTAÇÃO
  // ==========================================================

  function ordenarPor(campo) {
    setOrdenacao((atual) => ({
      campo,
      direcao:
        atual.campo === campo &&
        atual.direcao === 'asc'
          ? 'desc'
          : 'asc',
    }))
  }


  function indicadorOrdenacao(campo) {
    if (ordenacao.campo !== campo) {
      return '↕'
    }

    return ordenacao.direcao === 'asc'
      ? '↑'
      : '↓'
  }


  function normalizarChave(valor) {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  }


  async function importarFornecedores(event) {
    const arquivo = event.target.files?.[0]

    event.target.value = ''

    if (!arquivo) {
      return
    }

    try {
      setImportando(true)

      const buffer = await arquivo.arrayBuffer()
      const workbook = XLSX.read(buffer)
      const primeiraAba = workbook.Sheets[workbook.SheetNames[0]]
      const linhas = XLSX.utils.sheet_to_json(
        primeiraAba,
        { defval: '' },
      )

      if (linhas.length === 0) {
        mostrarToast('O arquivo não possui fornecedores para importar.')
        return
      }

      let importados = 0
      let ignorados = 0

      for (const linhaOriginal of linhas) {
        const linha = {}

        Object.entries(linhaOriginal).forEach(([chave, valor]) => {
          linha[normalizarChave(chave)] = valor
        })

        const razaoSocial = String(
          linha.razao_social ??
          linha.fornecedor ??
          linha.nome ??
          '',
        ).trim()

        const cnpj = somenteDigitos(
          linha.cnpj ?? '',
        )

        const cidade = String(
          linha.cidade ?? '',
        ).trim()

        const uf = String(
          linha.uf ?? '',
        ).trim().toUpperCase()

        const categoria = String(
          linha.categoria ?? 'Outros',
        ).trim() || 'Outros'

        const prazo = Number(
          linha.prazo_medio ??
          linha.prazo_medio_entrega ??
          linha.prazo ??
          0,
        )

        if (
          !razaoSocial ||
          cnpj.length !== 14 ||
          !cidade ||
          uf.length !== 2
        ) {
          ignorados += 1
          continue
        }

        try {
          const novo = await cadastrarFornecedor({
            razao_social: razaoSocial,
            nome_fantasia:
              String(
                linha.nome_fantasia ?? '',
              ).trim() || null,
            cnpj,
            categoria,
            contato:
              String(
                linha.contato ?? '',
              ).trim() || null,
            telefone:
              String(
                linha.telefone ?? '',
              ).trim() || null,
            email:
              String(
                linha.e_mail ??
                linha.email ??
                '',
              ).trim() || null,
            cidade,
            uf,
            prazo_medio_entrega:
              Number.isFinite(prazo)
                ? Math.max(0, Math.round(prazo))
                : 0,
          })

          const statusArquivo = String(
            linha.status ?? '',
          ).trim().toLowerCase()

          let final = novo

          if (
            statusArquivo === 'inativo' &&
            novo.status !== 'inativo'
          ) {
            final = await atualizarStatusFornecedor(
              novo.codigo,
              'inativo',
            )
          }

          setFornecedores((anteriores) => [
            final,
            ...anteriores,
          ])

          importados += 1
        } catch (erroLinha) {
          console.error(
            'Fornecedor ignorado na importação:',
            erroLinha,
          )
          ignorados += 1
        }
      }

      mostrarToast(
        `${importados} fornecedor(es) importado(s)` +
        `${ignorados ? ` • ${ignorados} ignorado(s)` : ''}.`,
      )
    } catch (error) {
      console.error('Erro ao importar fornecedores:', error)
      mostrarToast(
        'Não foi possível importar o arquivo de fornecedores.',
      )
    } finally {
      setImportando(false)
    }
  }


  // ==========================================================
  // EXPORTAR CSV
  // ==========================================================

  function exportarCsv() {
    if (fornecedoresFiltrados.length === 0) {
      mostrarToast(
        'Não há fornecedores para exportar.',
      )
      return
    }

    const escapar = (valor) =>
      `"${String(valor ?? '').replaceAll('"', '""')}"`

    const linhas = [
      [
        'Código',
        'Razão Social',
        'Nome Fantasia',
        'CNPJ',
        'Categoria',
        'Contato',
        'Telefone',
        'E-mail',
        'Cidade',
        'UF',
        'Prazo Médio',
        'Status',
      ],
      ...fornecedoresFiltrados.map((fornecedor) => [
        fornecedor.codigo,
        fornecedor.razao_social,
        fornecedor.nome_fantasia ?? '',
        formatarCnpj(fornecedor.cnpj),
        fornecedor.categoria,
        fornecedor.contato ?? '',
        fornecedor.telefone ?? '',
        fornecedor.email ?? '',
        fornecedor.cidade,
        fornecedor.uf,
        fornecedor.prazo_medio_entrega,
        fornecedor.status === 'ativo'
          ? 'Ativo'
          : 'Inativo',
      ]),
    ]

    const conteudo = linhas
      .map((linha) =>
        linha.map(escapar).join(';'),
      )
      .join('\n')

    const blob = new Blob(
      ['\uFEFF', conteudo],
      {
        type: 'text/csv;charset=utf-8;',
      },
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    const dataArquivo =
      new Date()
        .toISOString()
        .slice(
          0,
          10,
        )

    link.download =
      `fornecedores-${dataArquivo}.csv`

    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)

    mostrarToast(
      `${fornecedoresFiltrados.length} fornecedor(es) exportado(s) com os filtros atuais.`,
    )
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="content fornecedores-page fornecedores-v2">
      {toast && (
        <div className="fornecedor-toast">
          <span>✓</span>
          {toast}
        </div>
      )}

      <input
        ref={inputImportacaoRef}
        className="fornecedores-import-input"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={importarFornecedores}
      />

      <header className="fornecedores-page-header">
        <div>
          <h2>Fornecedores</h2>
          <p>
            Gerencie sua base de parceiros, acompanhe contatos, prazos e mantenha um relacionamento estratégico.
          </p>
        </div>

        <div className="fornecedores-actions">
          <button
            type="button"
            className="fornecedores-button primary"
            onClick={abrirNovoFornecedor}
          >
            <PlusIcon size={17} />
            Novo Fornecedor
          </button>

          <button
            type="button"
            className="fornecedores-button secondary"
            onClick={() => inputImportacaoRef.current?.click()}
            disabled={importando}
          >
            <UploadIcon size={17} />
            {importando ? 'Importando...' : 'Importar (Excel/CSV)'}
          </button>

          <button
            type="button"
            className="fornecedores-button secondary"
            onClick={exportarCsv}
          >
            <DownloadIcon size={17} />
            Exportar Lista
          </button>
        </div>
      </header>

      <section className="fornecedores-kpis">
        <article
          className="fornecedor-kpi azul"
          onClick={() => {
            setStatusFiltro('todos')
            setCategoriaFiltro('todas')
            setPaginaAtual(1)
          }}
        >
          <div className="fornecedor-kpi-icon total">
            <UsersIcon size={23} />
          </div>

          <div className="fornecedor-kpi-copy">
            <span>Total de Fornecedores</span>
            <strong>{indicadores.total}</strong>

            <div className="fornecedor-kpi-comparativo">
              <b>↑ +12%</b>
              <small>vs. mês anterior</small>
            </div>
          </div>

          <KpiMiniChart classe="azul" />
        </article>

        <article
          className="fornecedor-kpi verde"
          onClick={() => {
            setStatusFiltro('ativo')
            setPaginaAtual(1)
          }}
        >
          <div className="fornecedor-kpi-icon ativos">
            <BoxIcon size={23} />
          </div>

          <div className="fornecedor-kpi-copy">
            <span>Fornecedores Ativos</span>
            <strong>{indicadores.ativos}</strong>

            <div className="fornecedor-kpi-comparativo">
              <b>↑ +9%</b>
              <small>vs. mês anterior</small>
            </div>
          </div>

          <KpiMiniChart classe="verde" />
        </article>

        <article className="fornecedor-kpi ciano">
          <div className="fornecedor-kpi-icon entregas">
            <TruckIcon size={23} />
          </div>

          <div className="fornecedor-kpi-copy">
            <span>Entregas no Prazo</span>
            <strong>92,5%</strong>

            <div className="fornecedor-kpi-comparativo">
              <b>↓ +4,2 p.p.</b>
              <small>vs. mês anterior</small>
            </div>
          </div>

          <KpiMiniChart tipo="line" classe="ciano" />
        </article>

        <article className="fornecedor-kpi amarelo">
          <div className="fornecedor-kpi-icon avaliacao">
            <StarIcon size={23} />
          </div>

          <div className="fornecedor-kpi-copy">
            <span>Avaliação Média</span>
            <strong>4,6</strong>

            <div className="fornecedor-kpi-comparativo">
              <b>↓ +0,3</b>
              <small>vs. mês anterior</small>
            </div>
          </div>

          <KpiMiniChart classe="amarelo" />
        </article>
      </section>

      <section className="fornecedores-workspace">
        <div className="fornecedores-list-card">
          <header className="fornecedores-list-header">
            <div>
              <h3>Lista de Fornecedores</h3>
              <p>Visualize e gerencie todos os fornecedores cadastrados no sistema.</p>
            </div>

            <div className="fornecedores-toolbar">
              <div className="fornecedores-search">
                <SearchIcon size={16} />
                <input
                  type="text"
                  value={busca}
                  onChange={(event) => {
                    setBusca(event.target.value)
                    setPaginaAtual(1)
                  }}
                  placeholder="Buscar fornecedor, CNPJ, categoria..."
                />
              </div>

              <CategoriaDropdown
                valor={categoriaFiltro}
                opcoes={[
                  {
                    value: 'todas',
                    label: 'Todas as categorias',
                  },
                  ...categoriasDisponiveis.map((categoria) => ({
                    value: categoria,
                    label: rotuloCategoria(categoria),
                  })),
                ]}
                onChange={(valor) => {
                  setCategoriaFiltro(valor)
                  setPaginaAtual(1)
                }}
                compacto
              />

              <select
                value={statusFiltro}
                onChange={(event) => {
                  setStatusFiltro(event.target.value)
                  setPaginaAtual(1)
                }}
              >
                <option value="todos">Todos os status</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>
          </header>

          {erro && (
            <div className="fornecedores-error">{erro}</div>
          )}

          <div className="fornecedores-table-wrapper">
            <table className="fornecedores-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" onClick={() => ordenarPor('codigo')}>
                      Código <span>{indicadorOrdenacao('codigo')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => ordenarPor('nome')}>
                      Fornecedor <span>{indicadorOrdenacao('nome')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => ordenarPor('categoria')}>
                      Categoria <span>{indicadorOrdenacao('categoria')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => ordenarPor('localizacao')}>
                      Cidade <span>{indicadorOrdenacao('localizacao')}</span>
                    </button>
                  </th>
                  <th>Contato</th>
                  <th>Telefone</th>
                  <th>
                    <button type="button" onClick={() => ordenarPor('status')}>
                      Status <span>{indicadorOrdenacao('status')}</span>
                    </button>
                  </th>
                  <th>
                    <button type="button" onClick={() => ordenarPor('prazo_medio_entrega')}>
                      Prazo <span>{indicadorOrdenacao('prazo_medio_entrega')}</span>
                    </button>
                  </th>
                </tr>
              </thead>

              <tbody>
                {carregando && (
                  <tr>
                    <td colSpan="8" className="fornecedor-vazio">
                      Carregando fornecedores...
                    </td>
                  </tr>
                )}

                {!carregando && !erro && fornecedoresPagina.length === 0 && (
                  <tr>
                    <td colSpan="8" className="fornecedor-vazio">
                      Nenhum fornecedor encontrado.
                    </td>
                  </tr>
                )}

                {!carregando && !erro && fornecedoresPagina.map((fornecedor) => {
                  const ativo = fornecedor.status === 'ativo'
                  const selecionado = fornecedorDetalhes?.codigo === fornecedor.codigo

                  return (
                    <tr
                      key={fornecedor.codigo}
                      className={selecionado ? 'selecionado' : ''}
                      onClick={() => abrirDetalhes(fornecedor)}
                    >
                      <td className="fornecedor-codigo-tabela">
                        {fornecedor.codigo}
                      </td>

                      <td>
                        <div className="fornecedor-nome-tabela">
                          <strong>{nomeExibicao(fornecedor)}</strong>
                          <span>{fornecedor.razao_social}</span>
                        </div>
                      </td>

                      <td>
                        <span className="fornecedor-categoria-badge" title={fornecedor.categoria}>
                          {rotuloCategoria(fornecedor.categoria)}
                        </span>
                      </td>

                      <td className="fornecedor-muted">
                        {fornecedor.cidade} - {fornecedor.uf}
                      </td>

                      <td>
                        <div className="fornecedor-contato-cell">
                          <strong>{textoSeguro(fornecedor.contato, 'Sem responsável')}</strong>
                          <span>{textoSeguro(fornecedor.email, 'Sem e-mail')}</span>
                        </div>
                      </td>

                      <td className="fornecedor-muted">
                        {textoSeguro(fornecedor.telefone, '—')}
                      </td>

                      <td>
                        <span className={`fornecedor-status ${fornecedor.status}`}>
                          {ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td className="fornecedor-prazo">
                        {fornecedor.prazo_medio_entrega} dias
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <footer className="fornecedores-list-footer">
            <span>
              Mostrando {fornecedoresOrdenados.length === 0 ? 0 : (paginaExibida - 1) * itensPorPagina + 1}
              {' a '}
              {Math.min(paginaExibida * itensPorPagina, fornecedoresOrdenados.length)}
              {' de '}
              {fornecedoresOrdenados.length} fornecedor(es)
            </span>

            <div className="fornecedores-paginacao">
              <button
                type="button"
                disabled={paginaExibida === 1}
                onClick={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
              >
                ‹
              </button>

              {Array.from({ length: Math.min(totalPaginas, 5) }, (_, index) => {
                const numero = index + 1
                return (
                  <button
                    type="button"
                    key={numero}
                    className={paginaExibida === numero ? 'ativo' : ''}
                    onClick={() => setPaginaAtual(numero)}
                  >
                    {numero}
                  </button>
                )
              })}

              <button
                type="button"
                disabled={paginaExibida === totalPaginas}
                onClick={() => setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))}
              >
                ›
              </button>

              <select
                value={itensPorPagina}
                onChange={(event) => {
                  setItensPorPagina(Number(event.target.value))
                  setPaginaAtual(1)
                }}
                aria-label="Itens por página"
              >
                <option value="10">10 por página</option>
                <option value="20">20 por página</option>
                <option value="50">50 por página</option>
              </select>
            </div>
          </footer>
        </div>

        <PainelDetalhesFornecedor
          fornecedor={fornecedorDetalhes}
          aba={abaDetalhes}
          onAba={setAbaDetalhes}
          alterandoStatus={Boolean(alterandoStatus)}
          onFechar={fecharDetalhes}
          onEditar={abrirEditarFornecedor}
          onAlternarStatus={alternarStatus}
        />
      </section>

      <ModalFornecedor
        aberto={modalFormulario}
        modoEdicao={Boolean(fornecedorEdicao)}
        formulario={formulario}
        mensagem={mensagemFormulario}
        salvando={salvando}
        onAlterar={alterarFormulario}
        onCategoria={alterarCategoriaFormulario}
        onFechar={fecharFormulario}
        onSalvar={salvarFornecedor}
      />
    </main>
  )
}


export default Fornecedores
