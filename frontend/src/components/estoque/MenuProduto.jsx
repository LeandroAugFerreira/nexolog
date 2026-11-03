import { rotuloCategoria } from '../../data/categorias'
import {
  useEffect,
  useRef,
  useState,
} from 'react'


import {
  obterMarcasPorProduto,
  obterProdutosPorCategoria,
  obterVariantesPorProdutoMarca,
} from '../../data/catalogoPapelaria'


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


function numero(
  valor,
) {
  const convertido =
    Number(
      String(
        valor ?? '',
      )
        .replace(
          ',',
          '.',
        ),
    )

  return Number.isFinite(
    convertido,
  )
    ? convertido
    : 0
}


function moeda(
  valor,
) {
  return Number(
    valor || 0,
  ).toLocaleString(
    'pt-BR',
    {
      style:
        'currency',
      currency:
        'BRL',
    },
  )
}


function percentual(
  valor,
) {
  return `${Number(
    valor || 0,
  ).toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    },
  )}%`
}


function nomeRegime(
  regime,
) {
  const rotulos = {
    lucro_presumido:
      'Lucro Presumido',
    lucro_real:
      'Lucro Real',
    simples_nacional:
      'Simples Nacional',
    manual:
      'Configuração Manual',
  }

  return (
    rotulos[
      regime
    ] ||
    regime ||
    '-'
  )
}


function calcularPrevia(
  formulario,
) {
  const custo =
    numero(
      formulario
        .custoUnitario,
    )

  const calculoAutomatico =
    formulario
      .calculoAutomatico !==
    false

  const margemInformada =
    numero(
      formulario
        .margemLucroPercentual,
    )

  const simples =
    formulario
      .regimeTributario ===
      'simples_nacional'

  const icms =
    numero(
      formulario
        .aliquotaIcms,
    )

  const pis =
    numero(
      formulario
        .aliquotaPis,
    )

  const cofins =
    numero(
      formulario
        .aliquotaCofins,
    )

  const ipi =
    numero(
      formulario
        .aliquotaIpi,
    )

  const aliquotaSimples =
    numero(
      formulario
        .aliquotaSimples,
    )

  const cbs =
    numero(
      formulario
        .aliquotaCbs,
    )

  const ibs =
    numero(
      formulario
        .aliquotaIbs,
    )

  const taxaPreco =
    simples
      ? aliquotaSimples
      : (
          icms +
          pis +
          cofins
        )

  let precoSemIpi
  let precoVenda
  let valorMargem
  let baseComercial
  let margemPercentual

  if (
    calculoAutomatico
  ) {
    margemPercentual =
      margemInformada

    valorMargem =
      custo *
      (
        margemPercentual /
        100
      )

    baseComercial =
      custo +
      valorMargem

    const divisor =
      1 -
      (
        taxaPreco /
        100
      )

    precoSemIpi =
      divisor > 0
        ? baseComercial /
          divisor
        : 0

    precoVenda =
      precoSemIpi *
      (
        1 +
        (
          ipi /
          100
        )
      )
  } else {
    precoVenda =
      numero(
        formulario
          .precoVendaManual,
      )

    const fatorIpi =
      1 +
      (
        ipi /
        100
      )

    precoSemIpi =
      fatorIpi > 0
        ? precoVenda /
          fatorIpi
        : 0

    baseComercial =
      precoSemIpi *
      (
        1 -
        (
          taxaPreco /
          100
        )
      )

    valorMargem =
      baseComercial -
      custo

    margemPercentual =
      custo > 0
        ? (
            valorMargem /
            custo
          ) *
          100
        : 0
  }

  const valorIcms =
    simples
      ? 0
      : precoSemIpi *
        (
          icms /
          100
        )

  const valorPis =
    simples
      ? 0
      : precoSemIpi *
        (
          pis /
          100
        )

  const valorCofins =
    simples
      ? 0
      : precoSemIpi *
        (
          cofins /
          100
        )

  const valorSimples =
    simples
      ? precoSemIpi *
        (
          aliquotaSimples /
          100
        )
      : 0

  const valorIpi =
    precoSemIpi *
    (
      ipi /
      100
    )

  const valorCbs =
    simples
      ? 0
      : precoSemIpi *
        (
          cbs /
          100
        )

  const valorIbs =
    simples
      ? 0
      : precoSemIpi *
        (
          ibs /
          100
        )

  return {
    custo,
    calculoAutomatico,
    margemPercentual,
    valorMargem,
    baseComercial,
    valorIcms,
    valorPis,
    valorCofins,
    valorIpi,
    valorSimples,
    valorCbs,
    valorIbs,
    precoVenda,
  }
}





function MenuProduto({
  produto,
  categoriasPermitidas,
  onEditarProduto,
  onExcluirProduto,
}) {
  const [
    menuAberto,
    setMenuAberto,
  ] = useState(false)

  const [
    visualizarAberto,
    setVisualizarAberto,
  ] = useState(false)

  const [
    editarAberto,
    setEditarAberto,
  ] = useState(false)

  const [
    excluirAberto,
    setExcluirAberto,
  ] = useState(false)

  const [
    salvandoEdicao,
    setSalvandoEdicao,
  ] = useState(false)

  const [
    excluindoProduto,
    setExcluindoProduto,
  ] = useState(false)

  const [
    mensagemEdicao,
    setMensagemEdicao,
  ] = useState('')

  const [
    mensagemExclusao,
    setMensagemExclusao,
  ] = useState('')

  const [
    formularioEdicao,
    setFormularioEdicao,
  ] = useState({
    nome: '',
    categoria: '',
    marca: '',
    especificacao: '',
    gtinEan: '',
    estoqueAtual: '',
    estoqueMinimo: '',
    custoUnitario: '',
    calculoAutomatico: true,
    precoVendaManual: '',
    margemLucroPercentual: '',
    ncm: '',
    regimeTributario:
      'lucro_presumido',
    ufReferencia:
      'SP',
    aliquotaIcms:
      '18',
    aliquotaPis:
      '0.65',
    aliquotaCofins:
      '3',
    aliquotaIpi:
      '0',
    aliquotaSimples:
      '0',
    aliquotaCbs:
      '0.9',
    aliquotaIbs:
      '0.1',
  })


  const produtosDisponiveisEdicao =
    obterProdutosPorCategoria(
      formularioEdicao.categoria,
    )

  const marcasDisponiveisEdicao =
    obterMarcasPorProduto(
      formularioEdicao.categoria,
      formularioEdicao.nome,
    )

  const variantesDisponiveisEdicao =
    obterVariantesPorProdutoMarca(
      formularioEdicao.categoria,
      formularioEdicao.nome,
      formularioEdicao.marca,
    )


  const menuRef =
    useRef(null)


  useEffect(
    () => {
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
    },
    [],
  )


  if (
    !produto
  ) {
    return null
  }


  const simplesProduto =
    produto.regimeTributario ===
    'simples_nacional'

  const previaEdicao =
    calcularPrevia(
      formularioEdicao,
    )


  function abrirVisualizacao() {
    setMenuAberto(
      false,
    )

    setVisualizarAberto(
      true,
    )
  }


  function abrirEdicao() {
    setMenuAberto(
      false,
    )

    setMensagemEdicao(
      '',
    )

    setFormularioEdicao({
      nome:
        produto.nome,

      categoria:
        produto.categoria,

      marca:
        produto.marca ??
        '',

      especificacao:
        produto.especificacao ??
        '',

      gtinEan:
        produto.gtinEan ??
        '',

      estoqueAtual:
        String(
          produto.estoqueAtual,
        ),

      estoqueMinimo:
        String(
          produto.estoqueMinimo,
        ),

      custoUnitario:
        String(
          produto.custoUnitario ??
          0,
        ),

      calculoAutomatico:
        produto.calculoAutomatico !==
        false,

      precoVendaManual:
        produto.precoVendaManual ===
          '' ||
        produto.precoVendaManual ===
          null ||
        produto.precoVendaManual ===
          undefined
          ? String(
              produto.precoVenda ??
              '',
            )
          : String(
              produto.precoVendaManual,
            ),

      margemLucroPercentual:
        String(
          produto.margemLucroPercentual ??
          0,
        ),

      ncm:
        produto.ncm ??
        '',

      regimeTributario:
        produto.regimeTributario ??
        'lucro_presumido',

      ufReferencia:
        produto.ufReferencia ??
        'SP',

      aliquotaIcms:
        String(
          produto.aliquotaIcms ??
          0,
        ),

      aliquotaPis:
        String(
          produto.aliquotaPis ??
          0,
        ),

      aliquotaCofins:
        String(
          produto.aliquotaCofins ??
          0,
        ),

      aliquotaIpi:
        String(
          produto.aliquotaIpi ??
          0,
        ),

      aliquotaSimples:
        String(
          produto.aliquotaSimples ??
          0,
        ),

      aliquotaCbs:
        String(
          produto.aliquotaCbs ??
          0,
        ),

      aliquotaIbs:
        String(
          produto.aliquotaIbs ??
          0,
        ),
    })

    setEditarAberto(
      true,
    )
  }


  function alterarFormularioEdicao(
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
      setFormularioEdicao(
        (
          anterior,
        ) => ({
          ...anterior,

          regimeTributario:
            value,

          ...(
            PRECIFICACAO_PADRAO[
              value
            ] ??
            PRECIFICACAO_PADRAO
              .manual
          ),
        }),
      )

    } else if (
      name ===
      'categoria'
    ) {
      setFormularioEdicao(
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

    } else if (
      name ===
      'nome'
    ) {
      setFormularioEdicao(
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

    } else if (
      name ===
      'marca'
    ) {
      setFormularioEdicao(
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

    } else {
      setFormularioEdicao(
        (
          anterior,
        ) => ({
          ...anterior,

          [name]:
            valorCampo,
        }),
      )
    }

    setMensagemEdicao(
      '',
    )
  }


  function validarEdicao() {
    if (
      formularioEdicao
        .nome
        .trim() === '' ||
      formularioEdicao
        .categoria === '' ||
      formularioEdicao
        .estoqueMinimo === '' ||
      formularioEdicao
        .custoUnitario === ''
    ) {
      return (
        'Preencha todos os campos obrigatórios.'
      )
    }

    const estoqueMinimo =
      Number(
        formularioEdicao
          .estoqueMinimo,
      )

    if (
      !Number.isInteger(
        estoqueMinimo,
      ) ||
      estoqueMinimo < 0
    ) {
      return (
        'O estoque mínimo deve ser um número inteiro igual ou maior que zero.'
      )
    }

    const custo =
      numero(
        formularioEdicao
          .custoUnitario,
      )

    if (
      custo <= 0
    ) {
      return (
        'Informe um custo unitário maior que zero.'
      )
    }

    if (
      formularioEdicao.calculoAutomatico !==
      false
    ) {
      if (
        numero(
          formularioEdicao
            .margemLucroPercentual,
        ) < 0
      ) {
        return (
          'Informe uma margem válida.'
        )
      }
    } else {
      const precoManual =
        numero(
          formularioEdicao
            .precoVendaManual,
        )

      if (
        precoManual <= 0
      ) {
        return (
          'Informe um preço de venda manual maior que zero.'
        )
      }

      const ipi =
        numero(
          formularioEdicao
            .aliquotaIpi,
        )

      const taxa =
        formularioEdicao
          .regimeTributario ===
          'simples_nacional'
          ? numero(
              formularioEdicao
                .aliquotaSimples,
            )
          : (
              numero(
                formularioEdicao
                  .aliquotaIcms,
              ) +
              numero(
                formularioEdicao
                  .aliquotaPis,
              ) +
              numero(
                formularioEdicao
                  .aliquotaCofins,
              )
            )

      const precoSemIpi =
        precoManual /
        (
          1 +
          ipi /
          100
        )

      const base =
        precoSemIpi *
        (
          1 -
          taxa /
          100
        )

      if (
        base <
        custo
      ) {
        return (
          'O preço manual informado não cobre o custo e os tributos do cenário.'
        )
      }
    }

    const ncm =
      String(
        formularioEdicao
          .ncm ??
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

    if (
      formularioEdicao
        .regimeTributario ===
        'simples_nacional' &&
      numero(
        formularioEdicao
          .aliquotaSimples,
      ) <= 0
    ) {
      return (
        'Informe a alíquota efetiva do Simples Nacional.'
      )
    }

    return ''
  }


  async function salvarEdicao(
    event,
  ) {
    event.preventDefault()

    if (
      salvandoEdicao
    ) {
      return
    }

    const erroValidacao =
      validarEdicao()

    if (
      erroValidacao
    ) {
      setMensagemEdicao(
        erroValidacao,
      )

      return
    }

    try {
      setSalvandoEdicao(
        true,
      )

      const resultado =
        await onEditarProduto(
          produto.sku,
          {
            ...formularioEdicao,

            nome:
              formularioEdicao
                .nome
                .trim(),

            estoqueAtual:
              produto.estoqueAtual,

            estoqueMinimo:
              Number(
                formularioEdicao
                  .estoqueMinimo,
              ),
          },
        )

      if (
        !resultado?.sucesso
      ) {
        setMensagemEdicao(
          resultado?.mensagem ||
          'Não foi possível atualizar o produto.',
        )

        return
      }

      setEditarAberto(
        false,
      )
    } catch (
      erro
    ) {
      setMensagemEdicao(
        erro.message ||
        'Não foi possível atualizar o produto.',
      )
    } finally {
      setSalvandoEdicao(
        false,
      )
    }
  }


  async function confirmarExclusao() {
    if (
      excluindoProduto
    ) {
      return
    }

    try {
      setExcluindoProduto(
        true,
      )

      setMensagemExclusao(
        '',
      )

      const resultado =
        await onExcluirProduto(
          produto.sku,
        )

      if (
        !resultado?.sucesso
      ) {
        setMensagemExclusao(
          resultado?.mensagem ||
          'Não foi possível excluir o produto.',
        )

        return
      }

      setExcluirAberto(
        false,
      )
    } catch (
      erro
    ) {
      setMensagemExclusao(
        erro.message ||
        'Não foi possível excluir o produto.',
      )
    } finally {
      setExcluindoProduto(
        false,
      )
    }
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
          onClick={
            () =>
              setMenuAberto(
                (
                  atual,
                ) =>
                  !atual,
              )
          }
          aria-label={
            `Ações do produto ${produto.nome}`
          }
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
                  abrirVisualizacao
                }
              >
                <span>
                  ◉
                </span>
                Visualizar
              </button>


              <button
                type="button"
                className="menu-produto-item"
                onClick={
                  abrirEdicao
                }
              >
                <span>
                  ✎
                </span>
                Editar
              </button>


              <div className="menu-produto-divider"></div>


              <button
                type="button"
                className="menu-produto-item danger"
                onClick={
                  () => {
                    setMenuAberto(
                      false,
                    )

                    setMensagemExclusao(
                      '',
                    )

                    setExcluirAberto(
                      true,
                    )
                  }
                }
              >
                <span>
                  🗑
                </span>
                Excluir
              </button>

            </div>

          )
        }

      </div>


      {
        visualizarAberto && (

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
                  setVisualizarAberto(
                    false,
                  )
                }
              }
            }
          >

            <div className="produto-detalhes-modal precificacao-detalhes-modal">

              <div className="produto-modal-header">

                <div>

                  <span className="produto-modal-subtitle">
                    DETALHES DO PRODUTO
                  </span>

                  <h3>
                    {
                      produto.nome
                    }
                  </h3>

                  <p>
                    Estoque, preço de venda e justificativa da simulação fiscal.
                  </p>

                </div>


                <button
                  type="button"
                  className="produto-modal-close"
                  onClick={
                    () =>
                      setVisualizarAberto(
                        false,
                      )
                  }
                >
                  ×
                </button>

              </div>


              <div className="produto-detalhes-conteudo">

                <div className="produto-detalhes-topo">

                  <div className="produto-detalhes-icone">
                    {
                      produto.icone
                    }
                  </div>

                  <div>

                    <span className="produto-detalhes-sku">
                      {
                        produto.sku
                      }
                    </span>

                    <h4>
                      {
                        produto.nome
                      }
                    </h4>

                    <span className="produto-detalhes-categoria">
                      {
                        rotuloCategoria(produto.categoria)
                      }
                      {
                        produto.marca
                          ? ` • ${produto.marca}`
                          : ''
                      }
                      {
                        produto.especificacao
                          ? ` • ${produto.especificacao}`
                          : ''
                      }
                    </span>

                    <span className="produto-detalhes-categoria">
                      {
                        produto.gtinEan
                          ? `GTIN/EAN ${produto.gtinEan}`
                          : 'GTIN/EAN não informado'
                      }
                      {' • '}
                      {
                        produto.ncm
                          ? `NCM ${produto.ncm}`
                          : 'NCM não informado'
                      }
                    </span>

                  </div>

                </div>


                <div className="produto-detalhes-grid produto-detalhes-grid-precificacao">

                  <div className="produto-detalhe-card">
                    <span>
                      Estoque Atual
                    </span>
                    <strong>
                      {
                        produto.estoqueAtual.toLocaleString(
                          'pt-BR',
                        )
                      } un
                    </strong>
                  </div>


                  <div className="produto-detalhe-card">
                    <span>
                      Estoque Mínimo
                    </span>
                    <strong>
                      {
                        produto.estoqueMinimo.toLocaleString(
                          'pt-BR',
                        )
                      } un
                    </strong>
                  </div>


                  <div className="produto-detalhe-card">
                    <span>
                      Custo Unitário
                    </span>
                    <strong>
                      {
                        moeda(
                          produto.custoUnitario,
                        )
                      }
                    </strong>
                  </div>


                  <div className="produto-detalhe-card destaque-preco">
                    <span>
                      {
                        produto.calculoAutomatico
                          ? 'Preço de Venda Automático'
                          : 'Preço de Venda Manual'
                      }
                    </span>
                    <strong>
                      {
                        moeda(
                          produto.precoVenda,
                        )
                      }
                    </strong>
                  </div>


                  <div className="produto-detalhe-card">
                    <span>
                      Margem sobre custo
                    </span>
                    <strong>
                      {
                        percentual(
                          produto.margemLucroPercentual,
                        )
                      }
                    </strong>
                  </div>


                  <div className="produto-detalhe-card">
                    <span>
                      Regime / referência
                    </span>
                    <strong className="produto-detalhe-texto">
                      {
                        nomeRegime(
                          produto.regimeTributario,
                        )
                      }
                      {' • '}
                      {
                        produto.ufReferencia
                      }
                    </strong>
                  </div>

                </div>


                <div className="produto-fiscal-breakdown">

                  <div className="produto-fiscal-breakdown-header">

                    <div>
                      <strong>
                        Composição do preço
                      </strong>

                      <span>
                        {
                          produto.referenciaFiscal
                        }
                      </span>
                    </div>

                    <span className="produto-fiscal-tag">
                      Simulação
                    </span>

                  </div>


                  <div className="produto-fiscal-breakdown-linhas">

                    <div>
                      <span>
                        Custo do produto
                      </span>
                      <strong>
                        {
                          moeda(
                            produto.custoUnitario,
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Margem comercial
                      </span>
                      <strong>
                        {
                          moeda(
                            produto.valorMargem,
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Base comercial
                      </span>
                      <strong>
                        {
                          moeda(
                            produto.baseComercial,
                          )
                        }
                      </strong>
                    </div>


                    {
                      simplesProduto
                        ? (
                            <div>
                              <span>
                                Simples / DAS estimado ({percentual(
                                  produto.aliquotaSimples,
                                )})
                              </span>
                              <strong>
                                {
                                  moeda(
                                    produto.valorSimples,
                                  )
                                }
                              </strong>
                            </div>
                          )
                        : (
                            <>
                              <div>
                                <span>
                                  ICMS estimado ({percentual(
                                    produto.aliquotaIcms,
                                  )})
                                </span>
                                <strong>
                                  {
                                    moeda(
                                      produto.valorIcms,
                                    )
                                  }
                                </strong>
                              </div>

                              <div>
                                <span>
                                  PIS estimado ({percentual(
                                    produto.aliquotaPis,
                                  )})
                                </span>
                                <strong>
                                  {
                                    moeda(
                                      produto.valorPis,
                                    )
                                  }
                                </strong>
                              </div>

                              <div>
                                <span>
                                  COFINS estimada ({percentual(
                                    produto.aliquotaCofins,
                                  )})
                                </span>
                                <strong>
                                  {
                                    moeda(
                                      produto.valorCofins,
                                    )
                                  }
                                </strong>
                              </div>
                            </>
                          )
                    }


                    <div>
                      <span>
                        IPI estimado ({percentual(
                          produto.aliquotaIpi,
                        )})
                      </span>
                      <strong>
                        {
                          moeda(
                            produto.valorIpi,
                          )
                        }
                      </strong>
                    </div>


                    <div className="informativo">
                      <span>
                        CBS 2026 informativa ({percentual(
                          produto.aliquotaCbs,
                        )})
                      </span>
                      <strong>
                        {
                          moeda(
                            produto.valorCbs,
                          )
                        }
                      </strong>
                    </div>


                    <div className="informativo">
                      <span>
                        IBS 2026 informativo ({percentual(
                          produto.aliquotaIbs,
                        )})
                      </span>
                      <strong>
                        {
                          moeda(
                            produto.valorIbs,
                          )
                        }
                      </strong>
                    </div>


                    <div className="total">
                      <span>
                        {
                          produto.calculoAutomatico
                            ? 'Preço de venda calculado'
                            : 'Preço de venda manual'
                        }
                      </span>
                      <strong>
                        {
                          moeda(
                            produto.precoVenda,
                          )
                        }
                      </strong>
                    </div>

                  </div>


                  <p>
                    CBS e IBS aparecem como referência informativa do cenário 2026 e não são somados novamente ao preço. As alíquotas devem ser revisadas quando o NCM, a operação ou o regime tributário exigirem tratamento específico.
                  </p>

                </div>

              </div>


              <div className="produto-detalhes-actions">

                <button
                  type="button"
                  className="produto-modal-button cancel"
                  onClick={
                    () =>
                      setVisualizarAberto(
                        false,
                      )
                  }
                >
                  Fechar
                </button>

              </div>

            </div>

          </div>

        )
      }


      {
        editarAberto && (

          <div
            className="produto-modal-overlay"
            onMouseDown={
              (
                event,
              ) => {
                if (
                  event.target ===
                    event.currentTarget &&
                  !salvandoEdicao
                ) {
                  setEditarAberto(
                    false,
                  )
                }
              }
            }
          >

            <div className="produto-modal produto-modal-precificacao">

              <div className="produto-modal-header">

                <div>

                  <span className="produto-modal-subtitle">
                    EDIÇÃO DE PRODUTO
                  </span>

                  <h3>
                    Editar Produto
                  </h3>

                  <p>
                    Atualize os dados cadastrais e as premissas de formação do preço.
                  </p>

                </div>


                <button
                  type="button"
                  className="produto-modal-close"
                  onClick={
                    () =>
                      setEditarAberto(
                        false,
                      )
                  }
                  disabled={
                    salvandoEdicao
                  }
                >
                  ×
                </button>

              </div>


              <form
                className="produto-form produto-form-precificacao"
                onSubmit={
                  salvarEdicao
                }
              >

                <div className="produto-form-row">

                  <div className="produto-form-group">

                    <label>
                      SKU
                    </label>

                    <input
                      type="text"
                      value={
                        produto.sku
                      }
                      disabled
                    />

                  </div>


                  <div className="produto-form-group">

                    <label>
                      Nome do Produto *
                    </label>

                    <input
                      name="nome"
                      type="text"
                      list="catalogo-produtos-papelaria-edicao"
                      value={
                        formularioEdicao.nome
                      }
                      onChange={
                        alterarFormularioEdicao
                      }
                    />

                    <datalist id="catalogo-produtos-papelaria-edicao">
                      {
                        produtosDisponiveisEdicao.map(
                          (
                            item,
                          ) => (
                            <option
                              key={
                                item
                              }
                              value={
                                item
                              }
                            />
                          ),
                        )
                      }
                    </datalist>

                  </div>

                </div>


                <div className="produto-form-row produto-form-row-3">

                  <div className="produto-form-group">
                    <label>Marca</label>
                    <input
                      name="marca"
                      type="text"
                      list="catalogo-marcas-papelaria-edicao"
                      placeholder="Selecione ou digite a marca"
                      value={formularioEdicao.marca}
                      onChange={alterarFormularioEdicao}
                    />

                    <datalist id="catalogo-marcas-papelaria-edicao">
                      {
                        marcasDisponiveisEdicao.map(
                          (
                            item,
                          ) => (
                            <option
                              key={
                                item
                              }
                              value={
                                item
                              }
                            />
                          ),
                        )
                      }
                    </datalist>
                  </div>

                  <div className="produto-form-group">
                    <label>Especificação / Variante</label>
                    <input
                      name="especificacao"
                      type="text"
                      list="catalogo-variantes-papelaria-edicao"
                      placeholder="Selecione uma variante"
                      value={formularioEdicao.especificacao}
                      onChange={alterarFormularioEdicao}
                    />

                    <datalist id="catalogo-variantes-papelaria-edicao">
                      {
                        variantesDisponiveisEdicao.map(
                          (
                            item,
                          ) => (
                            <option
                              key={
                                item
                              }
                              value={
                                item
                              }
                            />
                          ),
                        )
                      }
                    </datalist>
                  </div>

                  <div className="produto-form-group">
                    <label>Código de Barras / GTIN / EAN</label>
                    <input
                      name="gtinEan"
                      type="text"
                      placeholder="Digite ou leia o código de barras"
                      value={formularioEdicao.gtinEan}
                      onChange={alterarFormularioEdicao}
                    />
                  </div>

                </div>


                <div className="produto-form-row produto-form-row-3">

                  <div className="produto-form-group">

                    <label>
                      Categoria *
                    </label>

                    <select
                      name="categoria"
                      value={
                        formularioEdicao.categoria
                      }
                      onChange={
                        alterarFormularioEdicao
                      }
                    >

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

                  </div>


                  <div className="produto-form-group">

                    <label>
                      Estoque Atual
                    </label>

                    <div className="produto-campo-automatico">

                      <strong>
                        {
                          produto.estoqueAtual.toLocaleString(
                            'pt-BR',
                          )
                        } un
                      </strong>

                      <span>
                        Alterado somente por movimentações de entrada e saída.
                      </span>

                    </div>

                  </div>


                  <div className="produto-form-group">

                    <label>
                      Estoque Mínimo *
                    </label>

                    <input
                      name="estoqueMinimo"
                      type="number"
                      min="0"
                      step="1"
                      value={
                        formularioEdicao.estoqueMinimo
                      }
                      onChange={
                        alterarFormularioEdicao
                      }
                    />

                  </div>

                </div>


                <label className="produto-chave-preco produto-chave-preco-edicao">

                  <span className="produto-chave-preco-texto">

                    <strong>
                      Calcular preço automaticamente
                    </strong>

                    <small>
                      Ativado: custo + margem + tributos. Desativado: preço de venda informado manualmente.
                    </small>

                  </span>


                  <input
                    type="checkbox"
                    name="calculoAutomatico"
                    checked={
                      formularioEdicao.calculoAutomatico !==
                      false
                    }
                    onChange={
                      alterarFormularioEdicao
                    }
                  />


                  <span className="produto-chave-preco-controle" />

                </label>


                <div className="produto-form-row produto-form-row-3">

                  <div className="produto-form-group">

                    <label>
                      Custo Unitário *
                    </label>

                    <input
                      name="custoUnitario"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={
                        formularioEdicao.custoUnitario
                      }
                      onChange={
                        alterarFormularioEdicao
                      }
                    />

                  </div>


                  {
                    formularioEdicao.calculoAutomatico !==
                    false
                      ? (
                          <div className="produto-form-group">

                            <label>
                              Margem sobre custo (%) *
                            </label>

                            <input
                              name="margemLucroPercentual"
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                formularioEdicao.margemLucroPercentual
                              }
                              onChange={
                                alterarFormularioEdicao
                              }
                            />

                          </div>
                        )
                      : (
                          <div className="produto-form-group">

                            <label>
                              Preço de Venda Manual *
                            </label>

                            <input
                              name="precoVendaManual"
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={
                                formularioEdicao.precoVendaManual
                              }
                              onChange={
                                alterarFormularioEdicao
                              }
                            />

                          </div>
                        )
                  }


                  <div className="produto-form-group">

                    <label>
                      NCM
                    </label>

                    <input
                      name="ncm"
                      type="text"
                      maxLength="10"
                      value={
                        formularioEdicao.ncm
                      }
                      onChange={
                        alterarFormularioEdicao
                      }
                    />

                  </div>

                </div>


                <div className="produto-form-row">

                  <div className="produto-form-group">

                    <label>
                      Regime Tributário *
                    </label>

                    <select
                      name="regimeTributario"
                      value={
                        formularioEdicao.regimeTributario
                      }
                      onChange={
                        alterarFormularioEdicao
                      }
                    >
                      <option value="lucro_presumido">
                        Lucro Presumido
                      </option>
                      <option value="lucro_real">
                        Lucro Real
                      </option>
                      <option value="simples_nacional">
                        Simples Nacional
                      </option>
                      <option value="manual">
                        Configuração Manual
                      </option>
                    </select>

                  </div>


                  <div className="produto-form-group">

                    <label>
                      UF de referência *
                    </label>

                    <input
                      name="ufReferencia"
                      type="text"
                      maxLength="2"
                      value={
                        formularioEdicao.ufReferencia
                      }
                      onChange={
                        alterarFormularioEdicao
                      }
                    />

                  </div>

                </div>


                {
                  formularioEdicao
                    .regimeTributario ===
                    'simples_nacional'
                    ? (
                        <div className="produto-form-row">

                          <div className="produto-form-group">
                            <label>
                              Simples - alíquota efetiva (%) *
                            </label>
                            <input
                              name="aliquotaSimples"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={
                                formularioEdicao.aliquotaSimples
                              }
                              onChange={
                                alterarFormularioEdicao
                              }
                            />
                          </div>

                          <div className="produto-form-group">
                            <label>
                              IPI adicional (%)
                            </label>
                            <input
                              name="aliquotaIpi"
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={
                                formularioEdicao.aliquotaIpi
                              }
                              onChange={
                                alterarFormularioEdicao
                              }
                            />
                          </div>

                        </div>
                      )
                    : (
                        <div className="produto-form-row produto-form-row-4">

                          {
                            [
                              [
                                'aliquotaIcms',
                                'ICMS (%)',
                              ],
                              [
                                'aliquotaPis',
                                'PIS (%)',
                              ],
                              [
                                'aliquotaCofins',
                                'COFINS (%)',
                              ],
                              [
                                'aliquotaIpi',
                                'IPI (%)',
                              ],
                            ].map(
                              (
                                [
                                  campo,
                                  rotulo,
                                ],
                              ) => (
                                <div
                                  className="produto-form-group"
                                  key={
                                    campo
                                  }
                                >
                                  <label>
                                    {
                                      rotulo
                                    }
                                  </label>
                                  <input
                                    name={
                                      campo
                                    }
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={
                                      formularioEdicao[
                                        campo
                                      ]
                                    }
                                    onChange={
                                      alterarFormularioEdicao
                                    }
                                  />
                                </div>
                              ),
                            )
                          }

                        </div>
                      )
                }


                <div className="produto-form-row">

                  <div className="produto-form-group">
                    <label>
                      CBS 2026 - informativo (%)
                    </label>
                    <input
                      name="aliquotaCbs"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        formularioEdicao.aliquotaCbs
                      }
                      onChange={
                        alterarFormularioEdicao
                      }
                      disabled={
                        formularioEdicao
                          .regimeTributario ===
                          'simples_nacional'
                      }
                    />
                  </div>

                  <div className="produto-form-group">
                    <label>
                      IBS 2026 - informativo (%)
                    </label>
                    <input
                      name="aliquotaIbs"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        formularioEdicao.aliquotaIbs
                      }
                      onChange={
                        alterarFormularioEdicao
                      }
                      disabled={
                        formularioEdicao
                          .regimeTributario ===
                          'simples_nacional'
                      }
                    />
                  </div>

                </div>


                <div className="produto-preco-resumo-grid produto-preco-resumo-edicao">

                  <div className="produto-preco-resumo-card">
                    <span>
                      Base comercial
                    </span>
                    <strong>
                      {
                        moeda(
                          previaEdicao.base,
                        )
                      }
                    </strong>
                  </div>

                  <div className="produto-preco-resumo-card">
                    <span>
                      Tributos estimados
                    </span>
                    <strong>
                      {
                        moeda(
                          previaEdicao.valorIcms +
                          previaEdicao.valorPis +
                          previaEdicao.valorCofins +
                          previaEdicao.valorSimples +
                          previaEdicao.valorIpi,
                        )
                      }
                    </strong>
                  </div>

                  <div className="produto-preco-resumo-card destaque">
                    <span>
                      Novo preço de venda
                    </span>
                    <strong>
                      {
                        moeda(
                          previaEdicao.precoVenda,
                        )
                      }
                    </strong>
                  </div>

                </div>


                {
                  mensagemEdicao && (
                    <div className="produto-form-message">
                      ⚠ {
                        mensagemEdicao
                      }
                    </div>
                  )
                }


                <div className="produto-modal-actions">

                  <button
                    type="button"
                    className="produto-modal-button cancel"
                    onClick={
                      () =>
                        setEditarAberto(
                          false,
                        )
                    }
                    disabled={
                      salvandoEdicao
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="produto-modal-button save"
                    disabled={
                      salvandoEdicao
                    }
                  >
                    {
                      salvandoEdicao
                        ? 'Salvando...'
                        : '✓ Salvar Alterações'
                    }
                  </button>

                </div>

              </form>

            </div>

          </div>

        )
      }


      {
        excluirAberto && (

          <div
            className="produto-modal-overlay"
            onMouseDown={
              (
                event,
              ) => {
                if (
                  event.target ===
                    event.currentTarget &&
                  !excluindoProduto
                ) {
                  setExcluirAberto(
                    false,
                  )
                }
              }
            }
          >

            <div className="produto-excluir-modal">

              <div className="produto-excluir-icon">
                !
              </div>

              <div className="produto-excluir-conteudo">

                <span className="produto-excluir-subtitle">
                  EXCLUSÃO DE PRODUTO
                </span>

                <h3>
                  Excluir produto?
                </h3>

                <p>
                  Esta ação removerá o produto do estoque atual. O histórico de movimentações será preservado.
                </p>

                <div className="produto-excluir-info">

                  <div className="produto-excluir-produto">

                    <div className="produto-excluir-produto-icon">
                      {
                        produto.icone
                      }
                    </div>

                    <div>
                      <span>
                        {
                          produto.sku
                        }
                      </span>
                      <strong>
                        {
                          produto.nome
                        }
                      </strong>
                      <small>
                        {
                          rotuloCategoria(produto.categoria)
                        }
                      </small>
                    </div>

                  </div>

                  <div className="produto-excluir-estoque">
                    <span>
                      Estoque atual
                    </span>
                    <strong>
                      {
                        produto.estoqueAtual.toLocaleString(
                          'pt-BR',
                        )
                      } un
                    </strong>
                  </div>

                </div>


                {
                  produto.estoqueAtual > 0 && (
                    <div className="produto-excluir-alerta">
                      <strong>
                        Atenção
                      </strong>
                      <span>
                        Este produto ainda possui {
                          produto.estoqueAtual.toLocaleString(
                            'pt-BR',
                          )
                        } unidade(s) em estoque.
                      </span>
                    </div>
                  )
                }


                {
                  mensagemExclusao && (
                    <div className="produto-form-message">
                      ⚠ {
                        mensagemExclusao
                      }
                    </div>
                  )
                }

              </div>


              <div className="produto-excluir-actions">

                <button
                  type="button"
                  className="produto-modal-button cancel"
                  onClick={
                    () =>
                      setExcluirAberto(
                        false,
                      )
                  }
                  disabled={
                    excluindoProduto
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="produto-modal-button danger"
                  onClick={
                    confirmarExclusao
                  }
                  disabled={
                    excluindoProduto
                  }
                >
                  {
                    excluindoProduto
                      ? 'Excluindo...'
                      : '🗑 Excluir Produto'
                  }
                </button>

              </div>

            </div>

          </div>

        )
      }

    </>
  )
}


export default MenuProduto
