function definirIcone(
    categoria,
  ) {
    const icones = {
      'Papéis e Impressão':
        '📄',

      'Cadernos, Agendas e Blocos':
        '📓',

      'Canetas e Escrita':
        '🖊️',

      'Lápis, Lapiseiras e Grafites':
        '✏️',

      'Marca-textos e Marcadores':
        '🖍️',

      'Desenho, Pintura e Colorir':
        '🎨',

      'Borrachas, Apontadores e Corretivos':
        '🧽',

      'Colas, Fitas e Adesivos':
        '🧷',

      'Corte, Régua e Geometria':
        '📐',

      'Pastas, Arquivos e Organização':
        '🗂️',

      'Etiquetas e Identificação':
        '🏷️',

      'Grampeamento, Perfuração e Clips':
        '📎',

      'Notas Autoadesivas e Marcadores de Página':
        '🗒️',

      'Calculadoras e Acessórios de Escritório':
        '🧮',

      'Escolar, Estojos e Kits':
        '🎒',

      Embalagens:
        '📦',

      Paletização:
        '🪵',

      Identificação:
        '🏷️',

      EPI:
        '🧤',

      Equipamentos:
        '🛠️',
    }

    return (
      icones[
        categoria
      ] ??
      '📦'
    )
  }

function converterProdutoApi(
    produtoApi,
  ) {
    const estoqueAtual =
      Number(
        produtoApi.estoque_atual,
      )

    const estoqueMinimo =
      Number(
        produtoApi.estoque_minimo,
      )

    const estoqueDisponivel = Number(produtoApi.estoque_disponivel ?? estoqueAtual)
    const estoqueBaixo = estoqueDisponivel <= 0 || estoqueDisponivel < estoqueMinimo

    return {
      sku:
        produtoApi.sku,

      nome:
        produtoApi.nome,

      categoria:
        produtoApi.categoria,

      marca:
        produtoApi.marca ??
        '',

      especificacao:
        produtoApi.especificacao ??
        '',

      gtinEan:
        produtoApi.gtin_ean ??
        '',

      estoqueAtual,
      estoqueReservado: Number(produtoApi.estoque_reservado || 0),
      estoqueDisponivel,

      estoqueMinimo,

      custoUnitario:
        Number(
          produtoApi.custo_unitario ??
          0,
        ),

      margemLucroPercentual:
        Number(
          produtoApi.margem_lucro_percentual ??
          0,
        ),

      ncm:
        produtoApi.ncm ??
        '',

      regimeTributario:
        produtoApi.regime_tributario ??
        'lucro_presumido',

      ufReferencia:
        produtoApi.uf_referencia ??
        'SP',

      referenciaFiscal:
        produtoApi.referencia_fiscal ??
        'Brasil 2026 / referência SP',

      calculoAutomatico:
        produtoApi.calculo_preco_automatico !==
        false,

      precoVendaManual:
        produtoApi.preco_venda_manual ===
        null ||
        produtoApi.preco_venda_manual ===
        undefined
          ? ''
          : Number(
              produtoApi.preco_venda_manual,
            ),

      aliquotaIcms:
        Number(
          produtoApi.aliquota_icms ??
          0,
        ),

      aliquotaPis:
        Number(
          produtoApi.aliquota_pis ??
          0,
        ),

      aliquotaCofins:
        Number(
          produtoApi.aliquota_cofins ??
          0,
        ),

      aliquotaIpi:
        Number(
          produtoApi.aliquota_ipi ??
          0,
        ),

      aliquotaSimples:
        Number(
          produtoApi.aliquota_simples ??
          0,
        ),

      aliquotaCbs:
        Number(
          produtoApi.aliquota_cbs ??
          0,
        ),

      aliquotaIbs:
        Number(
          produtoApi.aliquota_ibs ??
          0,
        ),

      valorMargem:
        Number(
          produtoApi.valor_margem ??
          0,
        ),

      baseComercial:
        Number(
          produtoApi.base_comercial ??
          0,
        ),

      valorIcms:
        Number(
          produtoApi.valor_icms ??
          0,
        ),

      valorPis:
        Number(
          produtoApi.valor_pis ??
          0,
        ),

      valorCofins:
        Number(
          produtoApi.valor_cofins ??
          0,
        ),

      valorIpi:
        Number(
          produtoApi.valor_ipi ??
          0,
        ),

      valorSimples:
        Number(
          produtoApi.valor_simples ??
          0,
        ),

      valorCbs:
        Number(
          produtoApi.valor_cbs ??
          0,
        ),

      valorIbs:
        Number(
          produtoApi.valor_ibs ??
          0,
        ),

      precoVenda:
        Number(
          produtoApi.preco_venda ??
          0,
        ),

      status:
        estoqueBaixo
          ? 'Estoque Baixo'
          : 'Em Estoque',

      classe:
        estoqueBaixo
          ? 'warning'
          : 'ok',

      icone:
        definirIcone(
          produtoApi.categoria,
        ),

      criadoEm:
        produtoApi.criado_em,

      atualizadoEm:
        produtoApi.atualizado_em,
    }
  }

function formatarDataApi(
    dataApi,
  ) {
    if (
      !dataApi
    ) {
      return '-'
    }

    const data =
      new Date(
        dataApi,
      )

    if (
      Number.isNaN(
        data.getTime(),
      )
    ) {
      return String(
        dataApi,
      )
    }

    return data.toLocaleString(
      'pt-BR',
      {
        day:
          '2-digit',

        month:
          'short',

        year:
          'numeric',

        hour:
          '2-digit',

        minute:
          '2-digit',
      },
    )
  }

function converterMovimentacaoApi(
    movimentacaoApi,
  ) {
    const entrada =
      movimentacaoApi.tipo ===
      'entrada'

    return {
      id:
        movimentacaoApi.id,

      produtoSku:
        movimentacaoApi.produto_sku,

      produto:
        movimentacaoApi.produto_nome,

      tipo:
        entrada
          ? 'Entrada'
          : 'Saída',

      classe:
        movimentacaoApi.tipo,

      quantidade:
        entrada
          ? `+ ${movimentacaoApi.quantidade} un`
          : `- ${movimentacaoApi.quantidade} un`,

      origem:
        String(
          movimentacaoApi.origem ??
          '',
        )
          .trim()
          .toLowerCase() ===
        'estoque final'
          ? 'Estoque Principal'
          : movimentacaoApi.origem,

      destino:
        String(
          movimentacaoApi.destino ??
          '',
        )
          .trim()
          .toLowerCase() ===
        'estoque final'
          ? 'Estoque Principal'
          : movimentacaoApi.destino,

      saldoAnterior:
        Number(
          movimentacaoApi.saldo_anterior,
        ),

      saldoPosterior:
        Number(
          movimentacaoApi.saldo_posterior,
        ),

      criadoEm:
        movimentacaoApi.criado_em,

      data:
        formatarDataApi(
          movimentacaoApi.criado_em,
        ),
    }
  }

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'



import ModalNovoProduto
  from '../components/estoque/ModalNovoProduto'

import ModalMovimentacao
  from '../components/estoque/ModalMovimentacao'

import ModalImportacao
  from '../components/estoque/ModalImportacao'

import MenuProduto
  from '../components/estoque/MenuProduto'

import {
  cadastrarProdutoApi,
  editarProdutoApi,
  excluirProdutoApi,
  importarProdutosApi,
  listarMovimentacoes,
  listarProdutos,
  registrarMovimentacaoApi,
} from '../services/api'

import {
  TODAS_CATEGORIAS,
} from '../data/catalogoPapelaria'


import { rotuloCategoria } from '../data/categorias'
import './Estoque.css'
import './Operational.css'


function EstoqueGlyph({
  children,
  size = 20,
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
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


function PlusGlyph() {
  return (
    <EstoqueGlyph size={18}>
      <path d="M12 5v14M5 12h14" />
    </EstoqueGlyph>
  )
}


function UploadGlyph() {
  return (
    <EstoqueGlyph size={18}>
      <path d="M12 16V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M5 14v5h14v-5" />
    </EstoqueGlyph>
  )
}


function SwapGlyph() {
  return (
    <EstoqueGlyph size={19}>
      <path d="M4 7h14" />
      <path d="m15 4 3 3-3 3" />
      <path d="M20 17H6" />
      <path d="m9 14-3 3 3 3" />
    </EstoqueGlyph>
  )
}


function CubeGlyph() {
  return (
    <EstoqueGlyph size={23}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
    </EstoqueGlyph>
  )
}


function SearchGlyph() {
  return (
    <EstoqueGlyph size={17}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </EstoqueGlyph>
  )
}





// ==========================================================
// PRECIFICAÇÃO - REFERÊNCIAS DE TELA
// ==========================================================

const PRECIFICACAO_PADRAO = {
  lucro_presumido: {
    aliquotaIcms: '18',
    aliquotaPis: '0.65',
    aliquotaCofins: '3',
    aliquotaIpi: '0',
    aliquotaSimples: '0',
    aliquotaCbs: '0.9',
    aliquotaIbs: '0.1',
  },

  lucro_real: {
    aliquotaIcms: '18',
    aliquotaPis: '1.65',
    aliquotaCofins: '7.6',
    aliquotaIpi: '0',
    aliquotaSimples: '0',
    aliquotaCbs: '0.9',
    aliquotaIbs: '0.1',
  },

  simples_nacional: {
    aliquotaIcms: '0',
    aliquotaPis: '0',
    aliquotaCofins: '0',
    aliquotaIpi: '0',
    aliquotaSimples: '',
    aliquotaCbs: '0',
    aliquotaIbs: '0',
  },

  manual: {
    aliquotaIcms: '18',
    aliquotaPis: '0.65',
    aliquotaCofins: '3',
    aliquotaIpi: '0',
    aliquotaSimples: '0',
    aliquotaCbs: '0.9',
    aliquotaIbs: '0.1',
  },
}


function converterDecimal(
  valor,
) {
  const normalizado = String(
    valor ?? '',
  )
    .trim()
    .replace(
      ',',
      '.',
    )

  if (
    normalizado === ''
  ) {
    return Number.NaN
  }

  return Number(
    normalizado,
  )
}


// ==========================================================
// TOAST DE FEEDBACK
// ==========================================================

function ToastFeedback({
  toast,
  onFechar,
}) {
  if (
    !toast
  ) {
    return null
  }

  const sucesso =
    toast.tipo ===
    'sucesso'

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position:
          'fixed',

        top:
          '22px',

        right:
          '22px',

        zIndex:
          3000,

        width:
          'min(380px, calc(100vw - 44px))',

        display:
          'flex',

        alignItems:
          'center',

        gap:
          '12px',

        padding:
          '13px 14px',

        border:
          sucesso
            ? '1px solid rgba(52, 211, 153, 0.40)'
            : '1px solid rgba(251, 113, 133, 0.40)',

        borderRadius:
          '11px',

        background:
          'linear-gradient(145deg, #111c2e, #0b1628)',

        boxShadow:
          '0 18px 45px rgba(0, 0, 0, 0.38)',

        color:
          '#e2e8f0',

        fontSize:
          '11px',
      }}
    >

      <div
        style={{
          width:
            '30px',

          height:
            '30px',

          display:
            'flex',

          alignItems:
            'center',

          justifyContent:
            'center',

          flexShrink:
            0,

          borderRadius:
            '8px',

          border:
            sucesso
              ? '1px solid rgba(52, 211, 153, 0.30)'
              : '1px solid rgba(251, 113, 133, 0.30)',

          background:
            sucesso
              ? 'rgba(16, 185, 129, 0.11)'
              : 'rgba(225, 29, 72, 0.10)',

          color:
            sucesso
              ? '#34d399'
              : '#fb7185',

          fontSize:
            '16px',

          fontWeight:
            800,
        }}
      >
        {
          sucesso
            ? '✓'
            : '!'
        }
      </div>


      <div
        style={{
          minWidth:
            0,

          flex:
            1,
        }}
      >

        <strong
          style={{
            display:
              'block',

            marginBottom:
              '2px',

            color:
              sucesso
                ? '#34d399'
                : '#fb7185',

            fontSize:
              '10px',

            letterSpacing:
              '0.2px',
          }}
        >
          {
            sucesso
              ? 'Operação concluída'
              : 'Atenção'
          }
        </strong>


        <span
          style={{
            color:
              '#cbd5e1',

            lineHeight:
              1.4,
          }}
        >
          {
            toast.mensagem
          }
        </span>

      </div>


      <button
        type="button"
        onClick={
          onFechar
        }
        aria-label="Fechar notificação"
        style={{
          width:
            '26px',

          height:
            '26px',

          display:
            'flex',

          alignItems:
            'center',

          justifyContent:
            'center',

          flexShrink:
            0,

          border:
            '1px solid #334155',

          borderRadius:
            '7px',

          background:
            '#0b1628',

          color:
            '#94a3b8',

          fontSize:
            '16px',

          cursor:
            'pointer',
        }}
      >
        ×
      </button>

    </div>
  )
}


// ==========================================================
// MENU E DETALHES DA MOVIMENTAÇÃO
// ==========================================================

function MenuMovimentacao({
  movimentacao,
}) {
  const [
    menuAberto,
    setMenuAberto,
  ] = useState(false)

  const [
    detalhesAbertos,
    setDetalhesAbertos,
  ] = useState(false)

  const menuRef =
    useRef(null)


  useEffect(() => {
    function fecharAoClicarFora(
      event,
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target,
        )
      ) {
        setMenuAberto(
          false,
        )
      }
    }


    document.addEventListener(
      'mousedown',
      fecharAoClicarFora,
    )


    return () => {
      document.removeEventListener(
        'mousedown',
        fecharAoClicarFora,
      )
    }
  }, [])


  if (
    !movimentacao
  ) {
    return null
  }


  const variacao =
    movimentacao.saldoPosterior -
    movimentacao.saldoAnterior


  function formatarVariacao() {
    if (
      variacao > 0
    ) {
      return `+ ${variacao.toLocaleString(
        'pt-BR',
      )} un`
    }


    if (
      variacao < 0
    ) {
      return `- ${Math.abs(
        variacao,
      ).toLocaleString(
        'pt-BR',
      )} un`
    }


    return '0 un'
  }


  function abrirDetalhes() {
    setMenuAberto(
      false,
    )

    setDetalhesAbertos(
      true,
    )
  }


  function fecharDetalhes() {
    setDetalhesAbertos(
      false,
    )
  }


  return (
    <>
      <div
        className="menu-produto-wrapper"
        ref={
          menuRef
        }
      >

        <button
          type="button"
          className={
            `menu-produto-trigger ${
              menuAberto
                ? 'active'
                : ''
            }`
          }
          onClick={() =>
            setMenuAberto(
              (
                anterior,
              ) =>
                !anterior,
            )
          }
          title="Ações da movimentação"
          aria-label="Ações da movimentação"
        >
          •••
        </button>


        {
          menuAberto && (

            <div className="menu-produto-dropdown">

              <button
                type="button"
                className="menu-produto-item"
                onClick={
                  abrirDetalhes
                }
              >
                <span>
                  ◉
                </span>

                Visualizar detalhes
              </button>

            </div>

          )
        }

      </div>


      {
        detalhesAbertos && (

          <div
            className="produto-modal-overlay"
            onMouseDown={
              (
                event,
              ) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  fecharDetalhes()
                }
              }
            }
          >

            <div className="produto-detalhes-modal">

              <div className="produto-modal-header">

                <div>

                  <span className="produto-modal-subtitle">
                    MOVIMENTAÇÃO #{movimentacao.id}
                  </span>

                  <h3>
                    Detalhes da Movimentação
                  </h3>

                  <p>
                    Registro histórico de entrada ou saída de estoque.
                  </p>

                </div>


                <button
                  type="button"
                  className="produto-modal-close"
                  onClick={
                    fecharDetalhes
                  }
                  aria-label="Fechar"
                >
                  ×
                </button>

              </div>


              <div className="produto-detalhes-conteudo">

                <div className="produto-detalhes-topo">

                  <div className="produto-detalhes-icone">
                    {
                      movimentacao.classe ===
                      'entrada'
                        ? '↓'
                        : '↑'
                    }
                  </div>


                  <div>

                    <span className="produto-detalhes-sku">
                      {
                        movimentacao.produtoSku
                      }
                    </span>


                    <h4>
                      {
                        movimentacao.produto
                      }
                    </h4>


                    <span className="produto-detalhes-categoria">
                      {
                        movimentacao.data
                      }
                    </span>

                  </div>

                </div>


                <div className="produto-detalhes-grid">

                  <div className="produto-detalhe-card">

                    <span>
                      Tipo de Movimentação
                    </span>


                    <strong>

                      <span
                        className={
                          `movimentacao-badge ${movimentacao.classe}`
                        }
                      >

                        {
                          movimentacao.classe ===
                          'entrada'
                            ? '↓'
                            : '↑'
                        }

                        {
                          movimentacao.tipo
                        }

                      </span>

                    </strong>

                  </div>


                  <div className="produto-detalhe-card">

                    <span>
                      Quantidade
                    </span>


                    <strong
                      className={
                        movimentacao.classe ===
                        'entrada'
                          ? 'quantidade-entrada'
                          : 'quantidade-saida'
                      }
                    >
                      {
                        movimentacao.quantidade
                      }
                    </strong>

                  </div>


                  <div className="produto-detalhe-card">

                    <span>
                      Origem
                    </span>


                    <strong>
                      {
                        movimentacao.origem
                      }
                    </strong>

                  </div>


                  <div className="produto-detalhe-card">

                    <span>
                      Destino
                    </span>


                    <strong>
                      {
                        movimentacao.destino
                      }
                    </strong>

                  </div>


                  <div className="produto-detalhe-card">

                    <span>
                      Saldo Anterior
                    </span>


                    <strong>
                      {
                        movimentacao
                          .saldoAnterior
                          .toLocaleString(
                            'pt-BR',
                          )
                      } un
                    </strong>

                  </div>


                  <div className="produto-detalhe-card">

                    <span>
                      Saldo Posterior
                    </span>


                    <strong>
                      {
                        movimentacao
                          .saldoPosterior
                          .toLocaleString(
                            'pt-BR',
                          )
                      } un
                    </strong>

                  </div>


                  <div className="produto-detalhe-card">

                    <span>
                      Variação do Estoque
                    </span>


                    <strong
                      className={
                        variacao > 0
                          ? 'quantidade-entrada'
                          : variacao < 0
                            ? 'quantidade-saida'
                            : ''
                      }
                    >
                      {
                        formatarVariacao()
                      }
                    </strong>

                  </div>


                  <div className="produto-detalhe-card">

                    <span>
                      Identificador
                    </span>


                    <strong>
                      #{
                        movimentacao.id
                      }
                    </strong>

                  </div>

                </div>

              </div>


              <div className="produto-detalhes-actions">

                <button
                  type="button"
                  className="produto-modal-button cancel"
                  onClick={
                    fecharDetalhes
                  }
                >
                  Fechar
                </button>

              </div>

            </div>

          </div>

        )
      }

    </>
  )
}


// ==========================================================
// PÁGINA ESTOQUE
// ==========================================================

function formatarDataInput(
  data,
) {
  const ano =
    data.getFullYear()

  const mes =
    String(
      data.getMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  const dia =
    String(
      data.getDate(),
    ).padStart(
      2,
      '0',
    )

  return `${ano}-${mes}-${dia}`
}


function obterPeriodoPadraoMovimentacoes() {
  const fim =
    new Date()

  const inicio =
    new Date()

  inicio.setDate(
    inicio.getDate() -
    30,
  )

  return {
    inicio:
      formatarDataInput(
        inicio,
      ),

    fim:
      formatarDataInput(
        fim,
      ),
  }
}


function Estoque() {
  const categoriasPermitidas =
    TODAS_CATEGORIAS


  // ==========================================================
  // TOAST
  // ==========================================================

  const [
    toast,
    setToast,
  ] = useState(null)

  const toastTimerRef =
    useRef(null)


  function fecharToast() {
    if (
      toastTimerRef.current
    ) {
      clearTimeout(
        toastTimerRef.current,
      )

      toastTimerRef.current =
        null
    }

    setToast(
      null,
    )
  }


  function mostrarToast(
    mensagem,
    tipo = 'sucesso',
  ) {
    if (
      toastTimerRef.current
    ) {
      clearTimeout(
        toastTimerRef.current,
      )
    }

    setToast({
      mensagem,
      tipo,
    })

    toastTimerRef.current =
      setTimeout(
        () => {
          setToast(
            null,
          )

          toastTimerRef.current =
            null
        },
        3500,
      )
  }


  useEffect(() => {
    return () => {
      if (
        toastTimerRef.current
      ) {
        clearTimeout(
          toastTimerRef.current,
        )
      }
    }
  }, [])


  // ==========================================================
  // PRODUTOS
  // ==========================================================

  const [
    produtos,
    setProdutos,
  ] = useState([])

  const [
    carregandoProdutos,
    setCarregandoProdutos,
  ] = useState(true)

  const [
    erroCarregamentoProdutos,
    setErroCarregamentoProdutos,
  ] = useState('')


  // ==========================================================
  // MOVIMENTAÇÕES
  // ==========================================================

  const [
    movimentacoes,
    setMovimentacoes,
  ] = useState([])

  const [
    carregandoMovimentacoes,
    setCarregandoMovimentacoes,
  ] = useState(true)

  const [
    erroCarregamentoMovimentacoes,
    setErroCarregamentoMovimentacoes,
  ] = useState('')


  // ==========================================================
  // FILTROS
  // ==========================================================

  const [
    buscaProduto,
    setBuscaProduto,
  ] = useState('')

  const [
    categoriaSelecionada,
    setCategoriaSelecionada,
  ] = useState('todas')

  const [
    tipoMovimentacaoSelecionado,
    setTipoMovimentacaoSelecionado,
  ] = useState('todos')

  const periodoPadraoMovimentacoes =
    useMemo(
      () =>
        obterPeriodoPadraoMovimentacoes(),
      [],
    )

  const [
    dataInicial,
    setDataInicial,
  ] = useState(
    periodoPadraoMovimentacoes.inicio,
  )

  const [
    dataFinal,
    setDataFinal,
  ] = useState(
    periodoPadraoMovimentacoes.fim,
  )


  // ==========================================================
  // MODAIS
  // ==========================================================

  const [
    modalNovoProduto,
    setModalNovoProduto,
  ] = useState(false)

  const [
    modalMovimentacao,
    setModalMovimentacao,
  ] = useState(false)

  const [
    modalImportacao,
    setModalImportacao,
  ] = useState(false)


  // ==========================================================
  // MENSAGENS
  // ==========================================================

  const [
    mensagemFormulario,
    setMensagemFormulario,
  ] = useState('')

  const [
    mensagemMovimentacao,
    setMensagemMovimentacao,
  ] = useState('')


  // ==========================================================
  // IMPORTAÇÃO
  // ==========================================================

  const inputArquivoRef =
    useRef(null)

  const [
    arquivoSelecionado,
    setArquivoSelecionado,
  ] = useState(null)

  const [
    dadosImportacao,
    setDadosImportacao,
  ] = useState([])

  const [
    dadosValidosImportacao,
    setDadosValidosImportacao,
  ] = useState([])

  const [
    linhasInvalidas,
    setLinhasInvalidas,
  ] = useState([])

  const [
    erroImportacao,
    setErroImportacao,
  ] = useState('')

  const [
    colunasEncontradas,
    setColunasEncontradas,
  ] = useState([])

  const [
    colunasAusentes,
    setColunasAusentes,
  ] = useState([])

  const colunasObrigatorias = [
    'Nome do Produto',
    'Categoria',
    'Estoque Atual',
    'Estoque Mínimo',
    'Custo Unitário',
    'Margem (%)',
  ]


  // ==========================================================
  // FORMULÁRIO PRODUTO
  // ==========================================================

  const formularioInicial = {
    nome: '',
    categoria: '',
    marca: '',
    especificacao: '',
    gtinEan: '',
    estoqueAtual: '0',
    estoqueMinimo: '',

    custoUnitario: '',
    calculoAutomatico: true,
    precoVendaManual: '',
    margemLucroPercentual: '30',
    ncm: '',
    regimeTributario: 'lucro_presumido',
    ufReferencia: 'SP',

    aliquotaIcms: '18',
    aliquotaPis: '0.65',
    aliquotaCofins: '3',
    aliquotaIpi: '0',
    aliquotaSimples: '0',
    aliquotaCbs: '0.9',
    aliquotaIbs: '0.1',
  }

  const [
    formularioProduto,
    setFormularioProduto,
  ] = useState(
    formularioInicial,
  )


  // ==========================================================
  // FORMULÁRIO MOVIMENTAÇÃO
  // ==========================================================

  const movimentacaoInicial = {
    tipo: '',
    produtoSku: '',
    quantidade: '',
    origem: '',
    destino: '',
  }

  const [
    formularioMovimentacao,
    setFormularioMovimentacao,
  ] = useState(
    movimentacaoInicial,
  )


  // ==========================================================
  // AUXILIARES
  // ==========================================================

  function normalizarTexto(
    texto,
  ) {
    return String(
      texto ?? '',
    )
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
  }


  function normalizarGtin(
    valor,
  ) {
    return String(
      valor ??
      '',
    )
      .trim()
  }


  function chaveProduto(
    produto,
  ) {
    return [
      normalizarTexto(produto.nome),
      normalizarTexto(produto.marca),
      normalizarTexto(produto.especificacao),
    ].join('|')
  }


  function encontrarProdutoDuplicado(
    dados,
    lista = produtos,
    skuIgnorar = '',
  ) {
    const gtin =
      normalizarGtin(
        dados.gtinEan ??
        dados.gtin_ean,
      )

    const chave =
      chaveProduto({
        nome: dados.nome,
        marca: dados.marca,
        especificacao: dados.especificacao,
      })

    return (
      lista.find(
        (produto) => {
          if (
            skuIgnorar &&
            produto.sku === skuIgnorar
          ) {
            return false
          }

          const gtinProduto =
            normalizarGtin(
              produto.gtinEan,
            )

          if (
            gtin &&
            gtinProduto &&
            gtin === gtinProduto
          ) {
            return true
          }

          return chaveProduto(produto) === chave
        },
      ) ||
      null
    )
  }


  function obterProdutosSemelhantes(
    dados,
  ) {
    const nome =
      normalizarTexto(
        dados.nome,
      )

    if (
      nome.length < 3
    ) {
      return []
    }

    return produtos
      .filter(
        (produto) =>
          normalizarTexto(produto.nome) === nome,
      )
      .slice(0, 4)
  }


  


  


  


  


  // ==========================================================
  // CARREGAR PRODUTOS
  // ==========================================================

  useEffect(() => {
    let componenteAtivo =
      true

    async function carregarProdutosDoBanco() {
      setCarregandoProdutos(
        true,
      )

      setErroCarregamentoProdutos(
        '',
      )

      try {
        const resposta =
          await listarProdutos()

        if (
          !componenteAtivo
        ) {
          return
        }

        setProdutos(
          Array.isArray(
            resposta,
          )
            ? resposta.map(
                converterProdutoApi,
              )
            : [],
        )
      } catch (
        erro
      ) {
        console.error(
          'Erro ao carregar produtos:',
          erro,
        )

        if (
          componenteAtivo
        ) {
          setProdutos(
            [],
          )

          setErroCarregamentoProdutos(
            erro.message ||
            'Não foi possível carregar os produtos.',
          )
        }
      } finally {
        if (
          componenteAtivo
        ) {
          setCarregandoProdutos(
            false,
          )
        }
      }
    }

    carregarProdutosDoBanco()

    return () => {
      componenteAtivo =
        false
    }
  }, [])


  // ==========================================================
  // CARREGAR MOVIMENTAÇÕES
  // ==========================================================

  useEffect(() => {
    let componenteAtivo =
      true

    async function carregarMovimentacoesDoBanco() {
      setCarregandoMovimentacoes(
        true,
      )

      setErroCarregamentoMovimentacoes(
        '',
      )

      try {
        const resposta =
          await listarMovimentacoes()

        if (
          !componenteAtivo
        ) {
          return
        }

        setMovimentacoes(
          Array.isArray(
            resposta,
          )
            ? resposta.map(
                converterMovimentacaoApi,
              )
            : [],
        )
      } catch (
        erro
      ) {
        console.error(
          'Erro ao carregar movimentações:',
          erro,
        )

        if (
          componenteAtivo
        ) {
          setMovimentacoes(
            [],
          )

          setErroCarregamentoMovimentacoes(
            erro.message ||
            'Não foi possível carregar o histórico.',
          )
        }
      } finally {
        if (
          componenteAtivo
        ) {
          setCarregandoMovimentacoes(
            false,
          )
        }
      }
    }

    carregarMovimentacoesDoBanco()

    return () => {
      componenteAtivo =
        false
    }
  }, [])


  // ==========================================================
  // FILTRAR PRODUTOS
  // ==========================================================

  const produtosFiltrados =
    useMemo(() => {
      const termo =
        buscaProduto
          .trim()
          .toLowerCase()

      return produtos.filter(
        (
          produto,
        ) => {
          const correspondeBusca =
            termo === '' ||
            produto.sku
              .toLowerCase()
              .includes(
                termo,
              ) ||
            produto.nome
              .toLowerCase()
              .includes(
                termo,
              ) ||
            produto.categoria
              .toLowerCase()
              .includes(
                termo,
              ) ||
            rotuloCategoria(produto.categoria)
              .toLowerCase()
              .includes(termo) ||
            produto.marca
              .toLowerCase()
              .includes(
                termo,
              ) ||
            produto.especificacao
              .toLowerCase()
              .includes(
                termo,
              ) ||
            produto.gtinEan
              .toLowerCase()
              .includes(
                termo,
              )

          const correspondeCategoria =
            categoriaSelecionada ===
              'todas' ||
            produto.categoria ===
              categoriaSelecionada

          return (
            correspondeBusca &&
            correspondeCategoria
          )
        },
      )
    }, [
      produtos,
      buscaProduto,
      categoriaSelecionada,
    ])


  // ==========================================================
  // FILTRO DE DATAS
  // ==========================================================

  function obterInicioDoDia(
    data,
  ) {
    if (
      !data
    ) {
      return null
    }

    return new Date(
      `${data}T00:00:00`,
    )
  }


  function obterFimDoDia(
    data,
  ) {
    if (
      !data
    ) {
      return null
    }

    return new Date(
      `${data}T23:59:59.999`,
    )
  }


  function alterarDataInicial(
    event,
  ) {
    setDataInicial(
      event.target.value,
    )
  }


  function alterarDataFinal(
    event,
  ) {
    setDataFinal(
      event.target.value,
    )
  }


  function limparPeriodo() {
    setDataInicial(
      '',
    )

    setDataFinal(
      '',
    )
  }


  // ==========================================================
  // FILTRAR MOVIMENTAÇÕES
  // ==========================================================

  const movimentacoesFiltradas =
    useMemo(() => {
      const inicio =
        obterInicioDoDia(
          dataInicial,
        )

      const fim =
        obterFimDoDia(
          dataFinal,
        )

      return movimentacoes.filter(
        (
          movimentacao,
        ) => {
          const correspondeTipo =
            tipoMovimentacaoSelecionado ===
              'todos' ||
            movimentacao.classe ===
              tipoMovimentacaoSelecionado

          if (
            !correspondeTipo
          ) {
            return false
          }

          if (
            !inicio &&
            !fim
          ) {
            return true
          }

          const dataMovimentacao =
            new Date(
              movimentacao.criadoEm,
            )

          if (
            Number.isNaN(
              dataMovimentacao.getTime(),
            )
          ) {
            return false
          }

          if (
            inicio &&
            dataMovimentacao <
              inicio
          ) {
            return false
          }

          if (
            fim &&
            dataMovimentacao >
              fim
          ) {
            return false
          }

          return true
        },
      )
    }, [
      movimentacoes,
      tipoMovimentacaoSelecionado,
      dataInicial,
      dataFinal,
    ])


  // ==========================================================
  // NOVO PRODUTO
  // ==========================================================

  function abrirModalNovoProduto() {
    setFormularioProduto(
      formularioInicial,
    )

    setMensagemFormulario(
      '',
    )

    setModalNovoProduto(
      true,
    )
  }


  function fecharModalNovoProduto() {
    setModalNovoProduto(
      false,
    )

    setFormularioProduto(
      formularioInicial,
    )

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
      type,
      checked,
    } =
      event.target

    const valorCampo =
      type === 'checkbox'
        ? checked
        : value

    if (
      name ===
      'regimeTributario'
    ) {
      const padrao =
        PRECIFICACAO_PADRAO[
          value
        ] ??
        PRECIFICACAO_PADRAO
          .manual

      setFormularioProduto(
        (
          anterior,
        ) => ({
          ...anterior,

          regimeTributario:
            value,

          ...padrao,
        }),
      )

      setMensagemFormulario(
        '',
      )

      return
    }

    if (
      name ===
      'categoria'
    ) {
      setFormularioProduto(
        (
          anterior,
        ) => ({
          ...anterior,

          categoria:
            valorCampo,

          nome:
            '',

          marca:
            '',

          especificacao:
            '',
        }),
      )

      setMensagemFormulario(
        '',
      )

      return
    }

    if (
      name ===
      'nome'
    ) {
      setFormularioProduto(
        (
          anterior,
        ) => ({
          ...anterior,

          nome:
            valorCampo,

          marca:
            '',

          especificacao:
            '',
        }),
      )

      setMensagemFormulario(
        '',
      )

      return
    }

    if (
      name ===
      'marca'
    ) {
      setFormularioProduto(
        (
          anterior,
        ) => ({
          ...anterior,

          marca:
            valorCampo,

          especificacao:
            '',
        }),
      )

      setMensagemFormulario(
        '',
      )

      return
    }

    setFormularioProduto(
      (
        anterior,
      ) => ({
        ...anterior,

        [name]:
          valorCampo,
      }),
    )

    setMensagemFormulario(
      '',
    )
  }


  function validarPrecificacao(
    formulario,
  ) {
    const custoUnitario =
      converterDecimal(
        formulario
          .custoUnitario,
      )

    if (
      !Number.isFinite(
        custoUnitario,
      ) ||
      custoUnitario <= 0
    ) {
      return (
        'Informe um custo unitário maior que zero.'
      )
    }

    const calculoAutomatico =
      formulario
        .calculoAutomatico !==
      false

    if (
      calculoAutomatico
    ) {
      const margem =
        converterDecimal(
          formulario
            .margemLucroPercentual,
        )

      if (
        !Number.isFinite(
          margem,
        ) ||
        margem < 0
      ) {
        return (
          'Informe uma margem sobre custo válida.'
        )
      }
    } else {
      const precoManual =
        converterDecimal(
          formulario
            .precoVendaManual,
        )

      if (
        !Number.isFinite(
          precoManual,
        ) ||
        precoManual <= 0
      ) {
        return (
          'Informe um preço de venda manual maior que zero.'
        )
      }
    }

    const ncm =
      String(
        formulario.ncm ??
        '',
      )
        .replace(
          /\D/g,
          '',
        )

    if (
      ncm !== '' &&
      ncm.length !== 8
    ) {
      return (
        'O NCM deve possuir 8 dígitos quando informado.'
      )
    }

    const uf =
      String(
        formulario.ufReferencia ??
        '',
      )
        .trim()
        .toUpperCase()

    if (
      uf.length !== 2
    ) {
      return (
        'Informe uma UF de referência válida.'
      )
    }

    const camposAliquota = [
      'aliquotaIcms',
      'aliquotaPis',
      'aliquotaCofins',
      'aliquotaIpi',
      'aliquotaCbs',
      'aliquotaIbs',
    ]

    if (
      formulario.regimeTributario ===
      'simples_nacional'
    ) {
      camposAliquota.push(
        'aliquotaSimples',
      )
    }

    for (
      const campo of
      camposAliquota
    ) {
      const valor =
        converterDecimal(
          formulario[
            campo
          ],
        )

      if (
        !Number.isFinite(
          valor,
        ) ||
        valor < 0 ||
        valor > 100
      ) {
        return (
          'Revise as alíquotas utilizadas na formação do preço.'
        )
      }
    }

    if (
      formulario.regimeTributario ===
        'simples_nacional' &&
      converterDecimal(
        formulario.aliquotaSimples,
      ) <= 0
    ) {
      return (
        'Informe a alíquota efetiva do Simples Nacional para a simulação.'
      )
    }

    if (
      !calculoAutomatico
    ) {
      const precoManual =
        converterDecimal(
          formulario.precoVendaManual,
        )

      const aliquotaIpi =
        converterDecimal(
          formulario.aliquotaIpi,
        )

      const taxaPreco =
        formulario.regimeTributario ===
          'simples_nacional'
          ? converterDecimal(
              formulario.aliquotaSimples,
            )
          : (
              converterDecimal(
                formulario.aliquotaIcms,
              ) +
              converterDecimal(
                formulario.aliquotaPis,
              ) +
              converterDecimal(
                formulario.aliquotaCofins,
              )
            )

      const precoSemIpi =
        precoManual /
        (
          1 +
          aliquotaIpi /
          100
        )

      const baseComercial =
        precoSemIpi *
        (
          1 -
          taxaPreco /
          100
        )

      if (
        baseComercial <
        custoUnitario
      ) {
        return (
          'O preço manual informado não cobre o custo e os tributos do cenário.'
        )
      }
    }

    return ''
  }


  function montarDadosPrecificacao(
    formulario,
  ) {
    return {
      custo_unitario:
        converterDecimal(
          formulario
            .custoUnitario,
        ),

      calculo_preco_automatico:
        formulario
          .calculoAutomatico !==
        false,

      preco_venda_manual:
        formulario
          .calculoAutomatico !==
        false
          ? null
          : converterDecimal(
              formulario
                .precoVendaManual,
            ),

      margem_lucro_percentual:
        formulario
          .calculoAutomatico !==
        false
          ? converterDecimal(
              formulario
                .margemLucroPercentual,
            )
          : 0,

      ncm:
        String(
          formulario.ncm ??
          '',
        )
          .replace(
            /\D/g,
            '',
          ) ||
        null,

      regime_tributario:
        formulario
          .regimeTributario,

      uf_referencia:
        String(
          formulario
            .ufReferencia ??
          'SP',
        )
          .trim()
          .toUpperCase(),

      aliquota_icms:
        converterDecimal(
          formulario
            .aliquotaIcms,
        ),

      aliquota_pis:
        converterDecimal(
          formulario
            .aliquotaPis,
        ),

      aliquota_cofins:
        converterDecimal(
          formulario
            .aliquotaCofins,
        ),

      aliquota_ipi:
        converterDecimal(
          formulario
            .aliquotaIpi,
        ),

      aliquota_simples:
        formulario
          .regimeTributario ===
          'simples_nacional'
          ? converterDecimal(
              formulario
                .aliquotaSimples,
            )
          : 0,

      aliquota_cbs:
        converterDecimal(
          formulario
            .aliquotaCbs,
        ),

      aliquota_ibs:
        converterDecimal(
          formulario
            .aliquotaIbs,
        ),
    }
  }


  // ==========================================================
  // CADASTRAR PRODUTO
  // ==========================================================

  async function cadastrarProduto(
    event,
  ) {
    event.preventDefault()

    const nome =
      formularioProduto
        .nome
        .trim()

    const categoria =
      formularioProduto
        .categoria

    const estoqueAtual =
      Number(
        formularioProduto
          .estoqueAtual,
      )

    const estoqueMinimo =
      Number(
        formularioProduto
          .estoqueMinimo,
      )

    if (
      nome === '' ||
      categoria === '' ||
      formularioProduto
        .estoqueAtual === '' ||
      formularioProduto
        .estoqueMinimo === '' ||
      formularioProduto
        .custoUnitario === ''
    ) {
      setMensagemFormulario(
        'Preencha todos os campos obrigatórios.',
      )

      return
    }

    if (
      !Number.isInteger(
        estoqueAtual,
      ) ||
      estoqueAtual < 0 ||
      !Number.isInteger(
        estoqueMinimo,
      ) ||
      estoqueMinimo < 0
    ) {
      setMensagemFormulario(
        'Estoque Inicial e Estoque Mínimo devem ser números inteiros iguais ou maiores que zero.',
      )

      return
    }

    if (
      !categoriasPermitidas.includes(
        categoria,
      )
    ) {
      setMensagemFormulario(
        'Selecione uma categoria válida.',
      )

      return
    }

    const produtoDuplicado =
      encontrarProdutoDuplicado(
        formularioProduto,
      )

    if (
      produtoDuplicado
    ) {
      setMensagemFormulario(
        `Produto já cadastrado como ${produtoDuplicado.sku}. Se chegaram novas unidades, utilize Registrar Movimento > Entrada.`,
      )

      return
    }

    const erroPrecificacao =
      validarPrecificacao(
        formularioProduto,
      )

    if (
      erroPrecificacao
    ) {
      setMensagemFormulario(
        erroPrecificacao,
      )

      return
    }

    try {
      const resposta =
        await cadastrarProdutoApi({
          nome,

          categoria,

          marca:
            formularioProduto.marca.trim() ||
            null,

          especificacao:
            formularioProduto.especificacao.trim() ||
            null,

          gtin_ean:
            normalizarGtin(
              formularioProduto.gtinEan,
            ) ||
            null,

          estoque_atual:
            estoqueAtual,

          estoque_minimo:
            estoqueMinimo,

          ...montarDadosPrecificacao(
            formularioProduto,
          ),
        })

      const novoProduto =
        converterProdutoApi(
          resposta,
        )


      // ======================================================
      // ATUALIZAR HISTÓRICO APÓS O CADASTRO
      // ======================================================
      //
      // Quando há Estoque Inicial maior que zero, o backend
      // registra uma Entrada automática no Estoque Principal.
      //
      // ======================================================

      try {
        const movimentacoesAtualizadas =
          await listarMovimentacoes()

        setMovimentacoes(
          Array.isArray(
            movimentacoesAtualizadas,
          )
            ? movimentacoesAtualizadas.map(
                converterMovimentacaoApi,
              )
            : [],
        )

      } catch (
        erroAtualizacaoHistorico
      ) {
        console.error(
          'Produto cadastrado, mas não foi possível atualizar o histórico:',
          erroAtualizacaoHistorico,
        )
      }


      setProdutos(
        (
          anteriores,
        ) =>
          [
            ...anteriores,

            novoProduto,
          ].sort(
            (
              a,
              b,
            ) =>
              a.sku.localeCompare(
                b.sku,
              ),
          ),
      )

      mostrarToast(
        `Produto ${novoProduto.sku} cadastrado com preço de venda ${novoProduto.precoVenda.toLocaleString(
          'pt-BR',
          {
            style:
              'currency',
            currency:
              'BRL',
          },
        )}.`,
      )

      fecharModalNovoProduto()
    } catch (
      erro
    ) {
      console.error(
        erro,
      )

      setMensagemFormulario(
        erro.message ||
        'Não foi possível cadastrar o produto.',
      )
    }
  }


  // ==========================================================
  // EDITAR PRODUTO
  // ==========================================================

  async function editarProduto(
    sku,
    dadosAtualizados,
  ) {
    try {
      const resposta =
        await editarProdutoApi(
          sku,
          {
            nome:
              dadosAtualizados
                .nome
                .trim(),

            categoria:
              dadosAtualizados
                .categoria,

            marca:
              dadosAtualizados.marca?.trim() ||
              null,

            especificacao:
              dadosAtualizados.especificacao?.trim() ||
              null,

            gtin_ean:
              normalizarGtin(
                dadosAtualizados.gtinEan,
              ) ||
              null,

            estoque_atual:
              dadosAtualizados
                .estoqueAtual,

            estoque_minimo:
              dadosAtualizados
                .estoqueMinimo,

            ...montarDadosPrecificacao(
              dadosAtualizados,
            ),
          },
        )

      const produtoAtualizado =
        converterProdutoApi(
          resposta,
        )

      setProdutos(
        (
          anteriores,
        ) =>
          anteriores.map(
            (
              produto,
            ) =>
              produto.sku ===
              sku
                ? produtoAtualizado
                : produto,
          ),
      )

      mostrarToast(
        `Produto ${sku} atualizado. Preço de venda: ${produtoAtualizado.precoVenda.toLocaleString(
          'pt-BR',
          {
            style:
              'currency',
            currency:
              'BRL',
          },
        )}.`,
      )

      return {
        sucesso:
          true,
      }
    } catch (
      erro
    ) {
      return {
        sucesso:
          false,

        mensagem:
          erro.message ||
          'Não foi possível atualizar o produto.',
      }
    }
  }


  // ==========================================================
  // EXCLUIR PRODUTO
  // ==========================================================

  async function excluirProduto(
    sku,
  ) {
    try {
      await excluirProdutoApi(
        sku,
      )

      setProdutos(
        (
          anteriores,
        ) =>
          anteriores.filter(
            (
              produto,
            ) =>
              produto.sku !==
              sku,
          ),
      )

      mostrarToast(
        `Produto ${sku} excluído com sucesso.`,
      )

      return {
        sucesso:
          true,
      }
    } catch (
      erro
    ) {
      return {
        sucesso:
          false,

        mensagem:
          erro.message ||
          'Não foi possível excluir o produto.',
      }
    }
  }


  // ==========================================================
  // MOVIMENTAÇÃO
  // ==========================================================

  function abrirModalMovimentacao() {
    setFormularioMovimentacao(
      movimentacaoInicial,
    )

    setMensagemMovimentacao(
      '',
    )

    setModalMovimentacao(
      true,
    )
  }


  function fecharModalMovimentacao() {
    setModalMovimentacao(
      false,
    )

    setFormularioMovimentacao(
      movimentacaoInicial,
    )

    setMensagemMovimentacao(
      '',
    )
  }


  function alterarMovimentacao(
    event,
  ) {
    const {
      name,
      value,
    } =
      event.target


    // ========================================================
    // PADRONIZAÇÃO DO ESTOQUE PRINCIPAL
    // ========================================================
    //
    // Entrada:
    //     origem externa -> Estoque Principal
    //
    // Saída:
    //     Estoque Principal -> destino externo
    //
    // ========================================================

    if (
      name ===
      'tipo'
    ) {
      setFormularioMovimentacao(
        (
          anterior,
        ) => ({
          ...anterior,

          tipo:
            value,

          origem:
            value ===
            'saida'
              ? 'Estoque Principal'
              : '',

          destino:
            value ===
            'entrada'
              ? 'Estoque Principal'
              : '',
        }),
      )

      setMensagemMovimentacao(
        '',
      )

      return
    }


    setFormularioMovimentacao(
      (
        anterior,
      ) => ({
        ...anterior,

        [name]:
          value,
      }),
    )

    setMensagemMovimentacao(
      '',
    )
  }


  // ==========================================================
  // REGISTRAR MOVIMENTAÇÃO
  // ==========================================================

  async function registrarMovimentacao(
    event,
  ) {
    event.preventDefault()

    const quantidade =
      Number(
        formularioMovimentacao
          .quantidade,
      )

    const produtoSelecionado =
      produtos.find(
        (
          produto,
        ) =>
          produto.sku ===
          formularioMovimentacao
            .produtoSku,
      )

    if (
      !produtoSelecionado
    ) {
      setMensagemMovimentacao(
        'Produto não encontrado.',
      )

      return
    }

    if (
      !Number.isInteger(
        quantidade,
      ) ||
      quantidade <= 0
    ) {
      setMensagemMovimentacao(
        'Informe uma quantidade válida.',
      )

      return
    }

    try {
      const tipoRegistrado =
        formularioMovimentacao
          .tipo

      const resposta =
        await registrarMovimentacaoApi({
          produto_sku:
            formularioMovimentacao
              .produtoSku,

          tipo:
            tipoRegistrado,

          quantidade,

          origem:
            formularioMovimentacao
              .origem
              .trim(),

          destino:
            formularioMovimentacao
              .destino
              .trim(),
        })

      const novaMovimentacao =
        converterMovimentacaoApi(
          resposta,
        )

      setMovimentacoes(
        (
          anteriores,
        ) => [
          novaMovimentacao,

          ...anteriores,
        ],
      )

      setProdutos(
        (
          anteriores,
        ) =>
          anteriores.map(
            (
              produto,
            ) => {
              if (
                produto.sku !==
                formularioMovimentacao
                  .produtoSku
              ) {
                return produto
              }

              const novoEstoque =
                Number(
                  resposta
                    .saldo_posterior,
                )

              const estoqueBaixo =
                novoEstoque <
                produto.estoqueMinimo

              return {
                ...produto,

                estoqueAtual:
                  novoEstoque,

                status:
                  estoqueBaixo
                    ? 'Estoque Baixo'
                    : 'Em Estoque',

                classe:
                  estoqueBaixo
                    ? 'warning'
                    : 'ok',
              }
            },
          ),
      )

      mostrarToast(
        tipoRegistrado ===
        'entrada'
          ? `Entrada de ${quantidade.toLocaleString(
              'pt-BR',
            )} unidade${
              quantidade ===
              1
                ? ''
                : 's'
            } registrada com sucesso.`
          : `Saída de ${quantidade.toLocaleString(
              'pt-BR',
            )} unidade${
              quantidade ===
              1
                ? ''
                : 's'
            } registrada com sucesso.`,
      )

      fecharModalMovimentacao()
    } catch (
      erro
    ) {
      setMensagemMovimentacao(
        erro.message ||
        'Não foi possível registrar a movimentação.',
      )
    }
  }


  // ==========================================================
  // IMPORTAÇÃO
  // ==========================================================

  function converterNumeroImportacao(
    valor,
  ) {
    if (
      typeof valor ===
      'number'
    ) {
      return valor
    }

    const texto =
      String(
        valor ?? '',
      ).trim()

    if (
      texto === ''
    ) {
      return Number.NaN
    }

    return Number(
      texto.replace(
        ',',
        '.',
      ),
    )
  }


  function normalizarRegimeImportacao(
    valor,
  ) {
    const texto =
      normalizarTexto(
        valor,
      )
        .replaceAll(
          ' ',
          '_',
        )

    if (
      texto ===
        'lucro_presumido' ||
      texto ===
        'presumido'
    ) {
      return (
        'lucro_presumido'
      )
    }

    if (
      texto ===
        'lucro_real' ||
      texto ===
        'real'
    ) {
      return (
        'lucro_real'
      )
    }

    if (
      texto ===
        'simples_nacional' ||
      texto ===
        'simples'
    ) {
      return (
        'simples_nacional'
      )
    }

    if (
      texto ===
      'manual'
    ) {
      return 'manual'
    }

    return (
      'lucro_presumido'
    )
  }


  function obterAliquotaImportacao(
    linha,
    coluna,
    valorPadrao,
  ) {
    const valor =
      linha[
        coluna
      ]

    if (
      valor === undefined ||
      valor === null ||
      String(
        valor,
      ).trim() === ''
    ) {
      return Number(
        valorPadrao,
      )
    }

    return (
      converterNumeroImportacao(
        valor,
      )
    )
  }


  function limparImportacao() {
    setArquivoSelecionado(
      null,
    )

    setDadosImportacao(
      [],
    )

    setDadosValidosImportacao(
      [],
    )

    setLinhasInvalidas(
      [],
    )

    setErroImportacao(
      '',
    )

    setColunasEncontradas(
      [],
    )

    setColunasAusentes(
      [],
    )

    if (
      inputArquivoRef.current
    ) {
      inputArquivoRef.current.value =
        ''
    }
  }


  function abrirSeletorArquivo() {
    inputArquivoRef
      .current
      ?.click()
  }


  function fecharModalImportacao() {
    setModalImportacao(
      false,
    )

    limparImportacao()
  }


  function validarLinhasImportacao(
    dados,
  ) {
    const validos = []
    const invalidos = []

    const produtosExistentes =
      new Set(
        produtos.map(
          (produto) =>
            chaveProduto(produto),
        ),
      )

    const gtinsExistentes =
      new Set(
        produtos
          .map(
            (produto) =>
              normalizarGtin(produto.gtinEan),
          )
          .filter(Boolean),
      )

    const produtosArquivo =
      new Set()

    const gtinsArquivo =
      new Set()

    dados.forEach(
      (
        linha,
        index,
      ) => {
        const nome =
          String(
            linha[
              'Nome do Produto'
            ] ?? '',
          ).trim()

        const categoria =
          String(
            linha[
              'Categoria'
            ] ?? '',
          ).trim()

        const marca =
          String(
            linha['Marca'] ?? '',
          ).trim()

        const especificacao =
          String(
            linha['Especificação'] ??
            linha['Especificacao'] ??
            '',
          ).trim()

        const gtinEan =
          normalizarGtin(
            linha['GTIN/EAN'] ??
            linha['GTIN'] ??
            linha['EAN'] ??
            '',
          )

        const estoqueAtual =
          converterNumeroImportacao(
            linha[
              'Estoque Atual'
            ],
          )

        const estoqueMinimo =
          converterNumeroImportacao(
            linha[
              'Estoque Mínimo'
            ],
          )

        const custoUnitario =
          converterNumeroImportacao(
            linha[
              'Custo Unitário'
            ],
          )

        const margemLucroPercentual =
          converterNumeroImportacao(
            linha[
              'Margem (%)'
            ],
          )

        const regimeTributario =
          normalizarRegimeImportacao(
            linha[
              'Regime Tributário'
            ] ??
            'Lucro Presumido',
          )

        const padrao =
          PRECIFICACAO_PADRAO[
            regimeTributario
          ] ??
          PRECIFICACAO_PADRAO
            .lucro_presumido

        const ncm =
          String(
            linha[
              'NCM'
            ] ??
            '',
          )
            .replace(
              /\D/g,
              '',
            )

        const ufReferencia =
          String(
            linha[
              'UF Referência'
            ] ??
            'SP',
          )
            .trim()
            .toUpperCase()

        const aliquotaIcms =
          obterAliquotaImportacao(
            linha,
            'ICMS (%)',
            padrao.aliquotaIcms ||
              0,
          )

        const aliquotaPis =
          obterAliquotaImportacao(
            linha,
            'PIS (%)',
            padrao.aliquotaPis ||
              0,
          )

        const aliquotaCofins =
          obterAliquotaImportacao(
            linha,
            'COFINS (%)',
            padrao.aliquotaCofins ||
              0,
          )

        const aliquotaIpi =
          obterAliquotaImportacao(
            linha,
            'IPI (%)',
            padrao.aliquotaIpi ||
              0,
          )

        const aliquotaSimples =
          obterAliquotaImportacao(
            linha,
            'Simples (%)',
            padrao.aliquotaSimples ||
              0,
          )

        const aliquotaCbs =
          obterAliquotaImportacao(
            linha,
            'CBS 2026 (%)',
            padrao.aliquotaCbs ||
              0,
          )

        const aliquotaIbs =
          obterAliquotaImportacao(
            linha,
            'IBS 2026 (%)',
            padrao.aliquotaIbs ||
              0,
          )

        const motivos = []

        if (
          nome === ''
        ) {
          motivos.push(
            'nome vazio',
          )
        }

        if (
          !categoriasPermitidas.includes(
            categoria,
          )
        ) {
          motivos.push(
            'categoria inválida',
          )
        }

        if (
          !Number.isInteger(
            estoqueAtual,
          ) ||
          estoqueAtual < 0
        ) {
          motivos.push(
            'estoque atual inválido',
          )
        }

        if (
          !Number.isInteger(
            estoqueMinimo,
          ) ||
          estoqueMinimo < 0
        ) {
          motivos.push(
            'estoque mínimo inválido',
          )
        }

        if (
          !Number.isFinite(
            custoUnitario,
          ) ||
          custoUnitario <= 0
        ) {
          motivos.push(
            'custo unitário inválido',
          )
        }

        if (
          !Number.isFinite(
            margemLucroPercentual,
          ) ||
          margemLucroPercentual < 0
        ) {
          motivos.push(
            'margem inválida',
          )
        }

        if (
          ncm !== '' &&
          ncm.length !== 8
        ) {
          motivos.push(
            'NCM deve possuir 8 dígitos',
          )
        }

        if (
          ufReferencia.length !==
          2
        ) {
          motivos.push(
            'UF de referência inválida',
          )
        }

        const aliquotas = [
          aliquotaIcms,
          aliquotaPis,
          aliquotaCofins,
          aliquotaIpi,
          aliquotaCbs,
          aliquotaIbs,
        ]

        if (
          regimeTributario ===
          'simples_nacional'
        ) {
          aliquotas.push(
            aliquotaSimples,
          )
        }

        if (
          aliquotas.some(
            (
              valor,
            ) =>
              !Number.isFinite(
                valor,
              ) ||
              valor < 0 ||
              valor > 100,
          )
        ) {
          motivos.push(
            'alíquota fiscal inválida',
          )
        }

        if (
          regimeTributario ===
            'simples_nacional' &&
          (
            !Number.isFinite(
              aliquotaSimples,
            ) ||
            aliquotaSimples <= 0
          )
        ) {
          motivos.push(
            'informe a alíquota efetiva do Simples',
          )
        }

        const chave =
          chaveProduto({
            nome,
            marca,
            especificacao,
          })

        if (
          gtinEan &&
          gtinsExistentes.has(gtinEan)
        ) {
          motivos.push(
            'GTIN/EAN já cadastrado',
          )
        }

        if (
          produtosExistentes.has(
            chave,
          )
        ) {
          motivos.push(
            'mesmo produto, marca e especificação já cadastrado',
          )
        }

        if (
          gtinEan &&
          gtinsArquivo.has(gtinEan)
        ) {
          motivos.push(
            'GTIN/EAN duplicado no arquivo',
          )
        }

        if (
          produtosArquivo.has(
            chave,
          )
        ) {
          motivos.push(
            'produto duplicado no arquivo',
          )
        }

        produtosArquivo.add(
          chave,
        )

        if (
          gtinEan
        ) {
          gtinsArquivo.add(gtinEan)
        }

        if (
          motivos.length > 0
        ) {
          invalidos.push({
            linha:
              index + 2,

            motivos,
          })

          return
        }

        validos.push({
          nome,
          categoria,
          marca,
          especificacao,
          gtinEan,
          estoqueAtual,
          estoqueMinimo,

          custoUnitario,
          margemLucroPercentual,
          ncm,
          regimeTributario,
          ufReferencia,

          aliquotaIcms,
          aliquotaPis,
          aliquotaCofins,
          aliquotaIpi,
          aliquotaSimples,
          aliquotaCbs,
          aliquotaIbs,
        })
      },
    )

    return {
      validos,
      invalidos,
    }
  }


  function processarArquivo(
    event,
  ) {
    const arquivo =
      event.target
        .files?.[0]

    if (
      !arquivo
    ) {
      return
    }

    limparImportacao()

    setArquivoSelecionado(
      arquivo,
    )

    const leitor =
      new FileReader()

    leitor.onload =
      async (
        evento,
      ) => {
        try {
          const XLSX = await import('xlsx')

          const workbook =
            XLSX.read(
              evento.target.result,
              {
                type:
                  'array',
              },
            )

          const planilha =
            workbook.Sheets[
              workbook
                .SheetNames[0]
            ]

          const dados =
            XLSX.utils
              .sheet_to_json(
                planilha,
                {
                  defval:
                    '',

                  raw:
                    false,
                },
              )

          if (
            dados.length === 0
          ) {
            setErroImportacao(
              'O arquivo não possui registros.',
            )

            setModalImportacao(
              true,
            )

            return
          }

          const colunas =
            Object.keys(
              dados[0],
            )

          const ausentes =
            colunasObrigatorias.filter(
              (
                coluna,
              ) =>
                !colunas.includes(
                  coluna,
                ),
            )

          setColunasEncontradas(
            colunas,
          )

          setColunasAusentes(
            ausentes,
          )

          setDadosImportacao(
            dados,
          )

          if (
            ausentes.length > 0
          ) {
            setErroImportacao(
              'A estrutura do arquivo não corresponde ao modelo esperado.',
            )

            setModalImportacao(
              true,
            )

            return
          }

          const {
            validos,
            invalidos,
          } =
            validarLinhasImportacao(
              dados,
            )

          setDadosValidosImportacao(
            validos,
          )

          setLinhasInvalidas(
            invalidos,
          )

          if (
            invalidos.length > 0
          ) {
            setErroImportacao(
              'Existem linhas que precisam ser corrigidas antes da importação.',
            )
          } else {
            setErroImportacao(
              '',
            )
          }

          setModalImportacao(
            true,
          )
        } catch (
          erro
        ) {
          console.error(
            erro,
          )

          setErroImportacao(
            'Não foi possível ler o arquivo.',
          )

          setModalImportacao(
            true,
          )
        }
      }

    leitor.readAsArrayBuffer(
      arquivo,
    )
  }


  async function importarProdutos() {
    if (
      erroImportacao !== '' ||
      linhasInvalidas.length > 0 ||
      dadosValidosImportacao.length === 0
    ) {
      return
    }

    const produtosParaApi =
      dadosValidosImportacao.map(
        (
          produto,
        ) => ({
          nome:
            produto.nome,

          categoria:
            produto.categoria,

          marca:
            produto.marca ||
            null,

          especificacao:
            produto.especificacao ||
            null,

          gtin_ean:
            produto.gtinEan ||
            null,

          estoque_atual:
            produto.estoqueAtual,

          estoque_minimo:
            produto.estoqueMinimo,

          custo_unitario:
            produto.custoUnitario,

          margem_lucro_percentual:
            produto.margemLucroPercentual,

          ncm:
            produto.ncm ||
            null,

          regime_tributario:
            produto.regimeTributario,

          uf_referencia:
            produto.ufReferencia,

          aliquota_icms:
            produto.aliquotaIcms,

          aliquota_pis:
            produto.aliquotaPis,

          aliquota_cofins:
            produto.aliquotaCofins,

          aliquota_ipi:
            produto.aliquotaIpi,

          aliquota_simples:
            produto.aliquotaSimples,

          aliquota_cbs:
            produto.aliquotaCbs,

          aliquota_ibs:
            produto.aliquotaIbs,
        }),
      )

    try {
      setErroImportacao(
        '',
      )

      const resposta =
        await importarProdutosApi(
          produtosParaApi,
        )

      const produtosImportados =
        resposta.map(
          converterProdutoApi,
        )

      setProdutos(
        (
          anteriores,
        ) =>
          [
            ...anteriores,

            ...produtosImportados,
          ].sort(
            (
              a,
              b,
            ) =>
              a.sku.localeCompare(
                b.sku,
              ),
          ),
      )

      setBuscaProduto(
        '',
      )

      setCategoriaSelecionada(
        'todas',
      )

      const quantidadeImportada =
        produtosImportados.length

      mostrarToast(
        `${quantidadeImportada} produto${
          quantidadeImportada ===
          1
            ? ''
            : 's'
        } importado${
          quantidadeImportada ===
          1
            ? ''
            : 's'
        } com sucesso.`,
      )

      fecharModalImportacao()
      // A entrada inicial é gravada junto com os produtos no backend.
      // Falha ao atualizar o histórico não transforma uma importação concluída em erro.
      try {
        const historico = await listarMovimentacoes()
        setMovimentacoes(historico.map(converterMovimentacaoApi))
      } catch {
        mostrarToast('Produtos importados. Recarregue a tela para atualizar o histórico de movimentações.')
      }
    } catch (
      erro
    ) {
      console.error(
        'Erro ao importar produtos:',
        erro,
      )

      setErroImportacao(
        erro.message ||
        'Não foi possível importar os produtos.',
      )
    }
  }


  const produtoDuplicadoFormulario =
    encontrarProdutoDuplicado(
      formularioProduto,
    )

  const produtosSemelhantesFormulario =
    obterProdutosSemelhantes(
      formularioProduto,
    )


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="content estoque-page">

      <ToastFeedback
        toast={
          toast
        }
        onFechar={
          fecharToast
        }
      />


      <input
        ref={
          inputArquivoRef
        }
        type="file"
        accept=".xlsx,.xls,.csv"
        className="arquivo-input-oculto"
        onChange={
          processarArquivo
        }
      />


      {/* ======================================================
          CABEÇALHO
      ====================================================== */}

      <header className="estoque-page-header">

        <div className="estoque-page-copy">

          <h2>
            Estoque e Movimentações
          </h2>

          <p>
            Gerencie seu estoque, acompanhe as movimentações e mantenha sua operação sempre em movimento.
          </p>

        </div>


        <div className="estoque-actions">

          <button
            type="button"
            className="estoque-button primary"
            onClick={
              abrirModalNovoProduto
            }
          >

            <span className="estoque-button-icon">
              <PlusGlyph />
            </span>

            <span>
              Novo Produto
            </span>

          </button>


          <button
            type="button"
            className="estoque-button secondary"
            onClick={
              abrirSeletorArquivo
            }
          >

            <span className="estoque-button-icon">
              <UploadGlyph />
            </span>

            <span>
              Importar (Excel/CSV)
            </span>

          </button>


          <button
            type="button"
            className="estoque-button secondary movimentacao-action"
            onClick={
              abrirModalMovimentacao
            }
          >

            <span className="estoque-button-icon">
              <SwapGlyph />
            </span>

            <span>
              Registrar Movimentação
              <small>
                (Entrada/Saída)
              </small>
            </span>

          </button>

        </div>

      </header>


      {/* ======================================================
          PRODUTOS
      ====================================================== */}

      <section className="estoque-card produtos-card">

        <div className="estoque-card-header">

          <div className="estoque-card-title">

            <div className="estoque-card-icon produto">
              <CubeGlyph />
            </div>


            <div>

              <h3>
                Tabela de Produtos em Estoque
              </h3>

              <p>
                Visualize e gerencie todos os produtos do seu estoque.
              </p>

            </div>

          </div>


          <div className="estoque-card-tools">

            <div className="estoque-search">

              <span className="estoque-search-icon">
                <SearchGlyph />
              </span>


              <input
                type="text"
                placeholder="Buscar produto, SKU ou categoria..."
                value={
                  buscaProduto
                }
                onChange={
                  (
                    event,
                  ) =>
                    setBuscaProduto(
                      event.target.value,
                    )
                }
              />

            </div>


            <select
              value={
                categoriaSelecionada
              }
              onChange={
                (
                  event,
                ) =>
                  setCategoriaSelecionada(
                    event.target.value,
                  )
              }
            >

              <option value="todas">
                Todas as categorias
              </option>


              {
                categoriasPermitidas.map(
                  (
                    categoria,
                  ) => (

                    <option
                      key={
                        categoria
                      }
                      value={
                        categoria
                      }
                    >
                      {
                        rotuloCategoria(categoria)
                      }
                    </option>

                  ),
                )
              }

            </select>


            <button
              type="button"
              className="estoque-card-menu-button"
              title="Mais opções"
              aria-label="Mais opções de produtos"
            >
              •••
            </button>

          </div>

        </div>


        <div className="estoque-table-wrapper produtos-table-wrapper">

          <table className="estoque-table produtos-table">

            <thead>

              <tr>

                <th className="produto-icon-column"></th>

                <th>
                  SKU
                  <span className="table-sort">
                    ↕
                  </span>
                </th>

                <th>
                  Nome do Produto
                </th>

                <th>
                  Categoria
                </th>

                <th>
                  Estoque Atual
                  <span className="table-sort">
                    ↕
                  </span>
                </th>

                <th>
                  Estoque Mínimo
                  <span className="table-sort">
                    ↕
                  </span>
                </th>

                <th>
                  Status do Estoque
                  <span className="table-sort">
                    ↕
                  </span>
                </th>

                <th className="acoes-column">
                  •••
                </th>

              </tr>

            </thead>


            <tbody>

              {
                carregandoProdutos && (

                  <tr>

                    <td
                      colSpan="8"
                      className="produto-vazio"
                    >
                      Carregando produtos do banco...
                    </td>

                  </tr>

                )
              }


              {
                !carregandoProdutos &&
                erroCarregamentoProdutos && (

                  <tr>

                    <td
                      colSpan="8"
                      className="produto-vazio"
                    >
                      ⚠ {
                        erroCarregamentoProdutos
                      }
                    </td>

                  </tr>

                )
              }


              {
                !carregandoProdutos &&
                !erroCarregamentoProdutos &&
                produtosFiltrados.map(
                  (
                    produto,
                  ) => (

                    <tr
                      key={
                        produto.sku
                      }
                    >

                      <td className="produto-icon-cell">

                        <span className="produto-table-icon">
                          {
                            produto.icone
                          }
                        </span>

                      </td>


                      <td className="produto-sku">
                        {
                          produto.sku
                        }
                      </td>


                      <td className="produto-nome">

                        <div className="produto-identidade-tabela">

                          <strong
                            title={
                              [
                                produto.nome,
                                produto.marca,
                                produto.especificacao,
                              ]
                                .filter(
                                  Boolean,
                                )
                                .join(
                                  ' • ',
                                )
                            }
                          >
                            {
                              produto.nome
                            }
                          </strong>


                          {
                            (
                              produto.marca ||
                              produto.especificacao
                            ) && (
                              <span
                                title={
                                  [
                                    produto.marca,
                                    produto.especificacao,
                                  ]
                                    .filter(
                                      Boolean,
                                    )
                                    .join(
                                      ' • ',
                                    )
                                }
                              >
                                {
                                  [
                                    produto.marca,
                                    produto.especificacao,
                                  ]
                                    .filter(
                                      Boolean,
                                    )
                                    .join(
                                      ' • ',
                                    )
                                }
                              </span>
                            )
                          }

                        </div>

                      </td>


                      <td
                        className="produto-muted"
                        title={
                          produto.categoria
                        }
                      >
                        {
                          rotuloCategoria(produto.categoria)
                        }
                      </td>


                      <td className="produto-quantidade">
                        {
                          produto
                            .estoqueAtual
                            .toLocaleString(
                              'pt-BR',
                            )
                        } un
                        <small className="lf-stock-breakdown">{produto.estoqueReservado || 0} reservadas · {produto.estoqueDisponivel ?? produto.estoqueAtual} disponíveis</small>
                      </td>


                      <td className="produto-muted">
                        {
                          produto
                            .estoqueMinimo
                            .toLocaleString(
                              'pt-BR',
                            )
                        } un
                      </td>


                      <td>

                        <span
                          className={
                            `estoque-status ${produto.classe}`
                          }
                        >

                          <span className="estoque-status-dot"></span>

                          {
                            produto.status
                          }

                        </span>

                      </td>


                      <td className="produto-acoes">

                        <MenuProduto
                          produto={
                            produto
                          }
                          categoriasPermitidas={
                            categoriasPermitidas
                          }
                          onEditarProduto={
                            editarProduto
                          }
                          onExcluirProduto={
                            excluirProduto
                          }
                        />

                      </td>

                    </tr>

                  ),
                )
              }


              {
                !carregandoProdutos &&
                !erroCarregamentoProdutos &&
                produtosFiltrados
                  .length === 0 && (

                  <tr>

                    <td
                      colSpan="8"
                      className="produto-vazio"
                    >
                      Nenhum produto encontrado.
                    </td>

                  </tr>

                )
              }

            </tbody>

          </table>

        </div>

      </section>


      {/* ======================================================
          HISTÓRICO DE MOVIMENTAÇÕES
      ====================================================== */}

      <section className="estoque-card movimentacoes-card">

        <div className="estoque-card-header">

          <div className="estoque-card-title">

            <div className="estoque-card-icon movimentacao">
              <SwapGlyph />
            </div>


            <div>

              <h3>
                Histórico de Movimentações
              </h3>

              <p>
                Acompanhe todas as entradas e saídas de produtos do seu estoque.
              </p>

            </div>

          </div>


          <div className="estoque-card-tools movimentacoes-tools">

            <div className="estoque-date-range">

              <div className="estoque-date-field">

                <input
                  type="date"
                  value={
                    dataInicial
                  }
                  max={
                    dataFinal ||
                    undefined
                  }
                  onChange={
                    alterarDataInicial
                  }
                  title="Data inicial"
                  aria-label="Data inicial"
                />

              </div>


              <span
                className="estoque-date-arrow"
                aria-hidden="true"
              >
                →
              </span>


              <div className="estoque-date-field">

                <input
                  type="date"
                  value={
                    dataFinal
                  }
                  min={
                    dataInicial ||
                    undefined
                  }
                  onChange={
                    alterarDataFinal
                  }
                  title="Data final"
                  aria-label="Data final"
                />

              </div>

            </div>


            <select
              value={
                tipoMovimentacaoSelecionado
              }
              onChange={
                (
                  event,
                ) =>
                  setTipoMovimentacaoSelecionado(
                    event.target.value,
                  )
              }
            >

              <option value="todos">
                Todos os tipos
              </option>

              <option value="entrada">
                Entradas
              </option>

              <option value="saida">
                Saídas
              </option>

            </select>


            {
              (
                dataInicial ||
                dataFinal
              ) && (

                <button
                  type="button"
                  className="estoque-clear-period"
                  onClick={
                    limparPeriodo
                  }
                  title="Limpar período"
                  aria-label="Limpar período"
                >
                  ×
                </button>

              )
            }


            <button
              type="button"
              className="estoque-card-menu-button"
              title="Mais opções"
              aria-label="Mais opções de movimentações"
            >
              •••
            </button>

          </div>

        </div>


        <div className="estoque-table-wrapper movimentacoes-wrapper">

          <table className="estoque-table movimentacoes-table">

            <thead>

              <tr>

                <th>
                  Data
                  <span className="table-sort">
                    ↕
                  </span>
                </th>

                <th>
                  Tipo de Movimentação
                </th>

                <th>
                  Produto
                </th>

                <th>
                  Quantidade
                  <span className="table-sort">
                    ↕
                  </span>
                </th>

                <th>
                  Origem
                </th>

                <th>
                  Destino
                </th>

                <th className="acoes-column">
                  •••
                </th>

              </tr>

            </thead>


            <tbody>

              {
                carregandoMovimentacoes && (

                  <tr>

                    <td
                      colSpan="7"
                      className="produto-vazio"
                    >
                      Carregando histórico de movimentações...
                    </td>

                  </tr>

                )
              }


              {
                !carregandoMovimentacoes &&
                erroCarregamentoMovimentacoes && (

                  <tr>

                    <td
                      colSpan="7"
                      className="produto-vazio"
                    >
                      ⚠ {
                        erroCarregamentoMovimentacoes
                      }
                    </td>

                  </tr>

                )
              }


              {
                !carregandoMovimentacoes &&
                !erroCarregamentoMovimentacoes &&
                movimentacoesFiltradas.map(
                  (
                    movimentacao,
                  ) => (

                    <tr
                      key={
                        movimentacao.id
                      }
                    >

                      <td className="produto-muted">
                        {
                          movimentacao.data
                        }
                      </td>


                      <td>

                        <span
                          className={
                            `movimentacao-badge ${movimentacao.classe}`
                          }
                        >

                          <span className="movimentacao-arrow">
                            {
                              movimentacao.classe ===
                              'entrada'
                                ? '↓'
                                : '↑'
                            }
                          </span>

                          {
                            movimentacao.tipo
                          }

                        </span>

                      </td>


                      <td
                        className="produto-nome movimentacao-produto"
                        title={
                          movimentacao.produto
                        }
                      >
                        {
                          movimentacao.produto
                        }
                      </td>


                      <td
                        className={
                          movimentacao.classe ===
                          'entrada'
                            ? 'quantidade-entrada'
                            : 'quantidade-saida'
                        }
                      >
                        {
                          movimentacao.quantidade
                        }
                      </td>


                      <td
                        className="produto-muted"
                        title={
                          movimentacao.origem
                        }
                      >
                        {
                          movimentacao.origem
                        }
                      </td>


                      <td
                        className="produto-muted"
                        title={
                          movimentacao.destino
                        }
                      >
                        {
                          movimentacao.destino
                        }
                      </td>


                      <td className="produto-acoes">

                        <MenuMovimentacao
                          movimentacao={
                            movimentacao
                          }
                        />

                      </td>

                    </tr>

                  ),
                )
              }


              {
                !carregandoMovimentacoes &&
                !erroCarregamentoMovimentacoes &&
                movimentacoesFiltradas
                  .length === 0 && (

                  <tr>

                    <td
                      colSpan="7"
                      className="produto-vazio"
                    >
                      Nenhuma movimentação encontrada para os filtros selecionados.
                    </td>

                  </tr>

                )
              }

            </tbody>

          </table>

        </div>

      </section>


      <ModalNovoProduto
        aberto={
          modalNovoProduto
        }
        formularioProduto={
          formularioProduto
        }
        categoriasPermitidas={
          categoriasPermitidas
        }
        produtoDuplicado={
          produtoDuplicadoFormulario
        }
        produtosSemelhantes={
          produtosSemelhantesFormulario
        }
        mensagemFormulario={
          mensagemFormulario
        }
        onFechar={
          fecharModalNovoProduto
        }
        onAlterar={
          alterarFormulario
        }
        onCadastrar={
          cadastrarProduto
        }
      />


      <ModalMovimentacao
        aberto={
          modalMovimentacao
        }
        formularioMovimentacao={
          formularioMovimentacao
        }
        produtos={
          produtos
        }
        mensagemMovimentacao={
          mensagemMovimentacao
        }
        onFechar={
          fecharModalMovimentacao
        }
        onAlterar={
          alterarMovimentacao
        }
        onRegistrar={
          registrarMovimentacao
        }
      />


      <ModalImportacao
        aberto={
          modalImportacao
        }
        arquivoSelecionado={
          arquivoSelecionado
        }
        erroImportacao={
          erroImportacao
        }
        dadosValidosImportacao={
          dadosValidosImportacao
        }
        colunasAusentes={
          colunasAusentes
        }
        linhasInvalidas={
          linhasInvalidas
        }
        colunasEncontradas={
          colunasEncontradas
        }
        dadosImportacao={
          dadosImportacao
        }
        onFechar={
          fecharModalImportacao
        }
        onImportar={
          importarProdutos
        }
      />

    </main>
  )
}


export default Estoque
