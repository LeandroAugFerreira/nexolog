import { rotuloCategoria } from '../../data/categorias'
import {
  obterMarcasPorProduto,
  obterProdutosPorCategoria,
  obterVariantesPorProdutoMarca,
} from '../../data/catalogoPapelaria'


function converterNumero(
  valor,
) {
  const numero =
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
    numero,
  )
    ? numero
    : 0
}


function formatarMoeda(
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


function calcularPrevia(
  formulario,
) {
  const custo =
    converterNumero(
      formulario
        .custoUnitario,
    )

  const calculoAutomatico =
    formulario
      .calculoAutomatico !==
    false

  const margemInformada =
    converterNumero(
      formulario
        .margemLucroPercentual,
    )

  const simples =
    formulario
      .regimeTributario ===
      'simples_nacional'

  const icms =
    converterNumero(
      formulario
        .aliquotaIcms,
    )

  const pis =
    converterNumero(
      formulario
        .aliquotaPis,
    )

  const cofins =
    converterNumero(
      formulario
        .aliquotaCofins,
    )

  const ipi =
    converterNumero(
      formulario
        .aliquotaIpi,
    )

  const aliquotaSimples =
    converterNumero(
      formulario
        .aliquotaSimples,
    )

  const cbs =
    converterNumero(
      formulario
        .aliquotaCbs,
    )

  const ibs =
    converterNumero(
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
      converterNumero(
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


function ModalNovoProduto({
  aberto,
  formularioProduto,
  categoriasPermitidas,
  produtoDuplicado,
  produtosSemelhantes,
  mensagemFormulario,
  onFechar,
  onAlterar,
  onCadastrar,
}) {

  const produtosDisponiveis =
    obterProdutosPorCategoria(
      formularioProduto.categoria,
    )

  const marcasDisponiveis =
    obterMarcasPorProduto(
      formularioProduto.categoria,
      formularioProduto.nome,
    )

  const variantesDisponiveis =
    obterVariantesPorProdutoMarca(
      formularioProduto.categoria,
      formularioProduto.nome,
      formularioProduto.marca,
    )


  if (
    !aberto
  ) {
    return null
  }

  const previa =
    calcularPrevia(
      formularioProduto,
    )

  const simples =
    formularioProduto
      .regimeTributario ===
      'simples_nacional'

  return (
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
            onFechar()
          }
        }
      }
    >

      <div
        className="produto-modal produto-modal-precificacao"
      >

        <div className="produto-modal-header">

          <div>

            <span className="produto-modal-subtitle">
              CADASTRO DE PRODUTO
            </span>

            <h3>
              Novo Produto
            </h3>

            <p>
              Cadastre o item, estoque e a formação justificável do preço de venda.
            </p>

          </div>


          <button
            className="produto-modal-close"
            onClick={
              onFechar
            }
            type="button"
            aria-label="Fechar"
          >
            ×
          </button>

        </div>


        <form
          className="produto-form produto-form-precificacao"
          onSubmit={
            onCadastrar
          }
        >

          <div className="produto-form-section">

            <div className="produto-form-section-title">

              <div>
                ◇
              </div>

              <span>
                <strong>
                  Identificação e Estoque
                </strong>

                <small>
                  Dados operacionais do produto.
                </small>
              </span>

            </div>


            <div className="produto-form-row">

              <div className="produto-form-group">

                <label htmlFor="categoria">
                  Categoria *
                </label>

                <select
                  id="categoria"
                  name="categoria"
                  value={
                    formularioProduto.categoria
                  }
                  onChange={
                    onAlterar
                  }
                  autoFocus
                >

                  <option value="">
                    Selecione uma categoria
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

              </div>


              <div className="produto-form-group">

                <label htmlFor="nome">
                  Nome do Produto *
                </label>

                <input
                  id="nome"
                  name="nome"
                  type="text"
                  list="catalogo-produtos-papelaria"
                  placeholder={
                    formularioProduto.categoria
                      ? 'Selecione ou digite o produto'
                      : 'Selecione primeiro a categoria'
                  }
                  value={
                    formularioProduto.nome
                  }
                  onChange={
                    onAlterar
                  }
                  disabled={
                    !formularioProduto.categoria
                  }
                />


                <datalist id="catalogo-produtos-papelaria">

                  {
                    produtosDisponiveis.map(
                      (
                        produto,
                      ) => (
                        <option
                          key={
                            produto
                          }
                          value={
                            produto
                          }
                        />
                      ),
                    )
                  }

                </datalist>


                <small className="produto-catalogo-ajuda">
                  Lista pesquisável por categoria. Também aceita um produto não listado.
                </small>

              </div>

            </div>

            <div className="produto-form-row produto-form-row-3">

              <div className="produto-form-group">

                <label htmlFor="marca">
                  Marca
                </label>

                <input
                  id="marca"
                  name="marca"
                  type="text"
                  list="catalogo-marcas-papelaria"
                  placeholder={
                    formularioProduto.nome
                      ? 'Selecione ou digite a marca'
                      : 'Selecione primeiro o produto'
                  }
                  value={
                    formularioProduto.marca
                  }
                  onChange={
                    onAlterar
                  }
                  disabled={
                    !formularioProduto.nome
                  }
                />


                <datalist id="catalogo-marcas-papelaria">

                  {
                    marcasDisponiveis.map(
                      (
                        marca,
                      ) => (
                        <option
                          key={
                            marca
                          }
                          value={
                            marca
                          }
                        />
                      ),
                    )
                  }

                </datalist>

              </div>


              <div className="produto-form-group">

                <label htmlFor="especificacao">
                  Especificação / Variante
                </label>

                <input
                  id="especificacao"
                  name="especificacao"
                  type="text"
                  list="catalogo-variantes-papelaria"
                  placeholder={
                    formularioProduto.marca
                      ? 'Selecione uma variante'
                      : 'Selecione a marca para carregar as variantes'
                  }
                  value={
                    formularioProduto.especificacao
                  }
                  onChange={
                    onAlterar
                  }
                  disabled={
                    !formularioProduto.nome ||
                    !formularioProduto.marca
                  }
                />


                <datalist id="catalogo-variantes-papelaria">

                  {
                    variantesDisponiveis.map(
                      (
                        variante,
                      ) => (
                        <option
                          key={
                            variante
                          }
                          value={
                            variante
                          }
                        />
                      ),
                    )
                  }

                </datalist>


                <small className="produto-catalogo-ajuda">
                  {
                    variantesDisponiveis.length > 0
                      ? `${variantesDisponiveis.length} variante(s) disponível(is) para esta seleção.`
                      : 'Se a variante não estiver catalogada, ela pode ser digitada manualmente.'
                  }
                </small>

              </div>


              <div className="produto-form-group">

                <label htmlFor="gtinEan">
                  Código de Barras / GTIN / EAN
                </label>

                <input
                  id="gtinEan"
                  name="gtinEan"
                  type="text"
                  placeholder="Digite ou leia o código de barras"
                  value={
                    formularioProduto.gtinEan
                  }
                  onChange={
                    onAlterar
                  }
                />

                <small className="produto-catalogo-ajuda">
                  Campo livre: aceita números, letras e símbolos, sem validação de tamanho ou dígito verificador.
                </small>

              </div>

            </div>


            {
              produtoDuplicado
                ? (
                    <div className="produto-alerta-identidade bloqueio">
                      <strong>
                        Produto já cadastrado — {produtoDuplicado.sku}
                      </strong>
                      <span>
                        {produtoDuplicado.nome}
                        {produtoDuplicado.marca ? ` • ${produtoDuplicado.marca}` : ''}
                        {produtoDuplicado.especificacao ? ` • ${produtoDuplicado.especificacao}` : ''}
                      </span>
                      <small>
                        Para adicionar novas unidades deste item, utilize Registrar Movimento → Entrada.
                      </small>
                    </div>
                  )
                : (
                    produtosSemelhantes.length > 0 && (
                      <div className="produto-alerta-identidade aviso">
                        <strong>
                          Existem produtos com o mesmo nome.
                        </strong>
                        <span>
                          Confira Marca, Especificação e GTIN/EAN antes de continuar.
                        </span>
                        <small>
                          {
                            produtosSemelhantes
                              .map(
                                (produto) =>
                                  `${produto.sku} • ${produto.marca || 'Sem marca'}${
                                    produto.especificacao ? ` • ${produto.especificacao}` : ''
                                  }`,
                              )
                              .join(' | ')
                          }
                        </small>
                      </div>
                    )
                  )
            }


            <div className="produto-form-row">

              <div className="produto-form-group">

                <label htmlFor="estoqueAtual">
                  Estoque Inicial *
                </label>

                <input
                  id="estoqueAtual"
                  name="estoqueAtual"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ex.: 250"
                  value={
                    formularioProduto.estoqueAtual
                  }
                  onChange={
                    onAlterar
                  }
                />

                <small className="produto-catalogo-ajuda">
                  Quantidade disponível no primeiro cadastro. Depois disso, o saldo será controlado pelas movimentações.
                </small>

              </div>


              <div className="produto-form-group">

                <label htmlFor="estoqueMinimo">
                  Estoque Mínimo *
                </label>

                <input
                  id="estoqueMinimo"
                  name="estoqueMinimo"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ex.: 50"
                  value={
                    formularioProduto.estoqueMinimo
                  }
                  onChange={
                    onAlterar
                  }
                />

                <small className="produto-catalogo-ajuda">
                  Limite de segurança utilizado para indicar Estoque Baixo.
                </small>

              </div>

            </div>

          </div>


          <div className="produto-form-section">

            <div className="produto-form-section-title">

              <div>
                R$
              </div>

              <span>
                <strong>
                  Formação do Preço
                </strong>

                <small>
                  Custo, margem e cenário fiscal utilizado.
                </small>
              </span>

            </div>


            <label className="produto-chave-preco">

              <span className="produto-chave-preco-texto">

                <strong>
                  Calcular preço automaticamente
                </strong>

                <small>
                  Quando ativado, o NexoLog usa custo, margem e tributos para formar o preço de venda.
                </small>

              </span>


              <input
                type="checkbox"
                name="calculoAutomatico"
                checked={
                  formularioProduto.calculoAutomatico !==
                  false
                }
                onChange={
                  onAlterar
                }
              />


              <span className="produto-chave-preco-controle" />

            </label>


            <div className="produto-form-row produto-form-row-3">

              <div className="produto-form-group">

                <label htmlFor="custoUnitario">
                  Custo Unitário *
                </label>

                <input
                  id="custoUnitario"
                  name="custoUnitario"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  value={
                    formularioProduto.custoUnitario
                  }
                  onChange={
                    onAlterar
                  }
                />

              </div>


              {
                formularioProduto.calculoAutomatico !==
                false
                  ? (
                      <div className="produto-form-group">

                        <label htmlFor="margemLucroPercentual">
                          Margem sobre custo (%) *
                        </label>

                        <input
                          id="margemLucroPercentual"
                          name="margemLucroPercentual"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="30,00"
                          value={
                            formularioProduto.margemLucroPercentual
                          }
                          onChange={
                            onAlterar
                          }
                        />

                      </div>
                    )
                  : (
                      <div className="produto-form-group">

                        <label htmlFor="precoVendaManual">
                          Preço de Venda Manual *
                        </label>

                        <input
                          id="precoVendaManual"
                          name="precoVendaManual"
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0,00"
                          value={
                            formularioProduto.precoVendaManual
                          }
                          onChange={
                            onAlterar
                          }
                        />

                      </div>
                    )
              }


              <div className="produto-form-group">

                <label htmlFor="ncm">
                  NCM
                </label>

                <input
                  id="ncm"
                  name="ncm"
                  type="text"
                  inputMode="numeric"
                  maxLength="10"
                  placeholder="Ex.: 39232190"
                  value={
                    formularioProduto.ncm
                  }
                  onChange={
                    onAlterar
                  }
                />

              </div>

            </div>


            <div className="produto-form-row">

              <div className="produto-form-group">

                <label htmlFor="regimeTributario">
                  Regime Tributário *
                </label>

                <select
                  id="regimeTributario"
                  name="regimeTributario"
                  value={
                    formularioProduto.regimeTributario
                  }
                  onChange={
                    onAlterar
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

                <label htmlFor="ufReferencia">
                  UF da operação de referência *
                </label>

                <input
                  id="ufReferencia"
                  name="ufReferencia"
                  type="text"
                  maxLength="2"
                  placeholder="SP"
                  value={
                    formularioProduto.ufReferencia
                  }
                  onChange={
                    onAlterar
                  }
                />

              </div>

            </div>

          </div>


          <div className="produto-form-section">

            <div className="produto-form-section-title">

              <div>
                %
              </div>

              <span>
                <strong>
                  Tributos da Simulação
                </strong>

                <small>
                  Alíquotas editáveis para refletir NCM, regime e operação.
                </small>
              </span>

            </div>


            {
              simples
                ? (
                    <div className="produto-form-row">

                      <div className="produto-form-group">

                        <label htmlFor="aliquotaSimples">
                          Simples Nacional - alíquota efetiva (%) *
                        </label>

                        <input
                          id="aliquotaSimples"
                          name="aliquotaSimples"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="Informe a alíquota efetiva"
                          value={
                            formularioProduto.aliquotaSimples
                          }
                          onChange={
                            onAlterar
                          }
                        />

                      </div>


                      <div className="produto-form-group">

                        <label htmlFor="aliquotaIpi">
                          IPI adicional (%)
                        </label>

                        <input
                          id="aliquotaIpi"
                          name="aliquotaIpi"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            formularioProduto.aliquotaIpi
                          }
                          onChange={
                            onAlterar
                          }
                        />

                      </div>

                    </div>
                  )
                : (
                    <div className="produto-form-row produto-form-row-4">

                      <div className="produto-form-group">

                        <label htmlFor="aliquotaIcms">
                          ICMS (%)
                        </label>

                        <input
                          id="aliquotaIcms"
                          name="aliquotaIcms"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            formularioProduto.aliquotaIcms
                          }
                          onChange={
                            onAlterar
                          }
                        />

                      </div>


                      <div className="produto-form-group">

                        <label htmlFor="aliquotaPis">
                          PIS (%)
                        </label>

                        <input
                          id="aliquotaPis"
                          name="aliquotaPis"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            formularioProduto.aliquotaPis
                          }
                          onChange={
                            onAlterar
                          }
                        />

                      </div>


                      <div className="produto-form-group">

                        <label htmlFor="aliquotaCofins">
                          COFINS (%)
                        </label>

                        <input
                          id="aliquotaCofins"
                          name="aliquotaCofins"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            formularioProduto.aliquotaCofins
                          }
                          onChange={
                            onAlterar
                          }
                        />

                      </div>


                      <div className="produto-form-group">

                        <label htmlFor="aliquotaIpi">
                          IPI (%)
                        </label>

                        <input
                          id="aliquotaIpi"
                          name="aliquotaIpi"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={
                            formularioProduto.aliquotaIpi
                          }
                          onChange={
                            onAlterar
                          }
                        />

                      </div>

                    </div>
                  )
            }


            <div className="produto-form-row">

              <div className="produto-form-group">

                <label htmlFor="aliquotaCbs">
                  CBS 2026 - informativo (%)
                </label>

                <input
                  id="aliquotaCbs"
                  name="aliquotaCbs"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={
                    formularioProduto.aliquotaCbs
                  }
                  onChange={
                    onAlterar
                  }
                  disabled={
                    simples
                  }
                />

              </div>


              <div className="produto-form-group">

                <label htmlFor="aliquotaIbs">
                  IBS 2026 - informativo (%)
                </label>

                <input
                  id="aliquotaIbs"
                  name="aliquotaIbs"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={
                    formularioProduto.aliquotaIbs
                  }
                  onChange={
                    onAlterar
                  }
                  disabled={
                    simples
                  }
                />

              </div>

            </div>


            <div className="produto-fiscal-alerta">

              <strong>
                Simulação fiscal
              </strong>

              <span>
                As alíquotas são referências editáveis. ICMS e IPI podem variar por NCM e operação; créditos e regimes especiais não são inferidos automaticamente. CBS e IBS são apenas informativos neste cenário 2026.
              </span>

            </div>

          </div>


          <div className="produto-form-section produto-resumo-section">

            <div className="produto-form-section-title">

              <div>
                ✓
              </div>

              <span>
                <strong>
                  Justificativa do Preço
                </strong>

                <small>
                  {
                  previa.calculoAutomatico
                    ? 'Composição calculada automaticamente a partir do custo.'
                    : 'Composição estimada a partir do preço de venda informado.'
                }
                </small>
              </span>

            </div>


            <div className="produto-preco-resumo-grid">

              <div className="produto-preco-resumo-card">

                <span>
                  Custo Unitário
                </span>

                <strong>
                  {
                    formatarMoeda(
                      previa.custo,
                    )
                  }
                </strong>

              </div>


              <div className="produto-preco-resumo-card">

                <span>
                  {
                    previa.calculoAutomatico
                      ? 'Margem Comercial'
                      : 'Margem Efetiva'
                  }
                </span>

                <strong>
                  {
                    formatarMoeda(
                      previa.valorMargem,
                    )
                  }
                </strong>

              </div>


              <div className="produto-preco-resumo-card">

                <span>
                  Base Comercial
                </span>

                <strong>
                  {
                    formatarMoeda(
                      previa.baseComercial,
                    )
                  }
                </strong>

              </div>


              {
                simples
                  ? (
                      <div className="produto-preco-resumo-card">

                        <span>
                          Simples / DAS estimado
                        </span>

                        <strong>
                          {
                            formatarMoeda(
                              previa.valorSimples,
                            )
                          }
                        </strong>

                      </div>
                    )
                  : (
                      <>
                        <div className="produto-preco-resumo-card">

                          <span>
                            ICMS estimado
                          </span>

                          <strong>
                            {
                              formatarMoeda(
                                previa.valorIcms,
                              )
                            }
                          </strong>

                        </div>


                        <div className="produto-preco-resumo-card">

                          <span>
                            PIS estimado
                          </span>

                          <strong>
                            {
                              formatarMoeda(
                                previa.valorPis,
                              )
                            }
                          </strong>

                        </div>


                        <div className="produto-preco-resumo-card">

                          <span>
                            COFINS estimada
                          </span>

                          <strong>
                            {
                              formatarMoeda(
                                previa.valorCofins,
                              )
                            }
                          </strong>

                        </div>
                      </>
                    )
              }


              <div className="produto-preco-resumo-card">

                <span>
                  IPI estimado
                </span>

                <strong>
                  {
                    formatarMoeda(
                      previa.valorIpi,
                    )
                  }
                </strong>

              </div>


              <div className="produto-preco-resumo-card informativo">

                <span>
                  CBS 2026 informativa
                </span>

                <strong>
                  {
                    formatarMoeda(
                      previa.valorCbs,
                    )
                  }
                </strong>

              </div>


              <div className="produto-preco-resumo-card informativo">

                <span>
                  IBS 2026 informativo
                </span>

                <strong>
                  {
                    formatarMoeda(
                      previa.valorIbs,
                    )
                  }
                </strong>

              </div>


              <div className="produto-preco-resumo-card destaque">

                <span>
                  {
                    previa.calculoAutomatico
                      ? 'Preço de Venda Calculado'
                      : 'Preço de Venda Manual'
                  }
                </span>

                <strong>
                  {
                    formatarMoeda(
                      previa.precoVenda,
                    )
                  }
                </strong>

              </div>

            </div>

          </div>


          {
            formularioProduto.estoqueAtual !== '' &&
            formularioProduto.estoqueMinimo !== '' && (

              <div className="produto-status-preview">

                <span>
                  Status calculado:
                </span>

                {
                  Number(
                    formularioProduto.estoqueAtual,
                  ) <
                  Number(
                    formularioProduto.estoqueMinimo,
                  )
                    ? (
                        <strong className="preview-warning">
                          ● Estoque Baixo
                        </strong>
                      )
                    : (
                        <strong className="preview-ok">
                          ● Em Estoque
                        </strong>
                      )
                }

              </div>

            )
          }


          {
            mensagemFormulario && (

              <div className="produto-form-message">
                ⚠ {
                  mensagemFormulario
                }
              </div>

            )
          }


          <div className="produto-modal-actions">

            <button
              type="button"
              className="produto-modal-button cancel"
              onClick={
                onFechar
              }
            >
              Cancelar
            </button>


            <button
              type="submit"
              className="produto-modal-button save"
              disabled={
                Boolean(
                  produtoDuplicado,
                )
              }
            >
              {
                produtoDuplicado
                  ? 'Produto já cadastrado'
                  : '＋ Cadastrar Produto'
              }
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}


export default ModalNovoProduto
