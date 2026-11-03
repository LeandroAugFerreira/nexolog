function ModalMovimentacao({
  aberto,
  formularioMovimentacao,
  produtos,
  mensagemMovimentacao,
  onFechar,
  onAlterar,
  onRegistrar,
}) {
  if (!aberto) {
    return null
  }


  const produtoSelecionado =
    produtos.find(
      (produto) =>
        produto.sku ===
        formularioMovimentacao.produtoSku,
    )


  const quantidade =
    Number(
      formularioMovimentacao.quantidade,
    )


  const saldoPosteriorEstimado =
    produtoSelecionado &&
    Number.isInteger(
      quantidade,
    ) &&
    quantidade > 0
      ? (
          formularioMovimentacao.tipo ===
          'entrada'
            ? produtoSelecionado.estoqueAtual +
              quantidade
            : formularioMovimentacao.tipo ===
                'saida'
              ? produtoSelecionado.estoqueAtual -
                quantidade
              : produtoSelecionado.estoqueAtual
        )
      : null


  return (
    <div
      className="produto-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onFechar()
        }
      }}
    >

      <div className="produto-modal">

        {/* ====================================================
            CABEÇALHO
        ==================================================== */}

        <div className="produto-modal-header">

          <div>

            <span className="produto-modal-subtitle">
              MOVIMENTAÇÃO DE ESTOQUE
            </span>

            <h3>
              Registrar Movimentação
            </h3>

            <p>
              Registre uma entrada ou saída de produto.
            </p>

          </div>


          <button
            className="produto-modal-close"
            onClick={onFechar}
            type="button"
          >
            ×
          </button>

        </div>


        {/* ====================================================
            FORMULÁRIO
        ==================================================== */}

        <form
          className="produto-form"
          onSubmit={onRegistrar}
        >

          {/* ==================================================
              TIPO / QUANTIDADE
          ================================================== */}

          <div className="produto-form-row">

            <div className="produto-form-group">

              <label htmlFor="tipo">
                Tipo *
              </label>

              <select
                id="tipo"
                name="tipo"
                value={
                  formularioMovimentacao.tipo
                }
                onChange={onAlterar}
              >

                <option value="">
                  Selecione
                </option>

                <option value="entrada">
                  Entrada
                </option>

                <option value="saida">
                  Saída
                </option>

              </select>

            </div>


            <div className="produto-form-group">

              <label htmlFor="quantidade">
                Quantidade *
              </label>

              <input
                id="quantidade"
                name="quantidade"
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={
                  formularioMovimentacao.quantidade
                }
                onChange={onAlterar}
              />

            </div>

          </div>


          {/* ==================================================
              PRODUTO
          ================================================== */}

          <div className="produto-form-group full">

            <label htmlFor="produtoSku">
              Produto *
            </label>

            <select
              id="produtoSku"
              name="produtoSku"
              value={
                formularioMovimentacao.produtoSku
              }
              onChange={onAlterar}
            >

              <option value="">
                Selecione um produto
              </option>


              {
                produtos.map(
                  (produto) => (

                    <option
                      key={produto.sku}
                      value={produto.sku}
                    >
                      {produto.sku} - {produto.nome} ({produto.estoqueAtual} un)
                    </option>

                  ),
                )
              }

            </select>

          </div>


          {/* ==================================================
              ORIGEM
          ================================================== */}

          <div className="produto-form-group full">

            <label htmlFor="origem">
              {
                formularioMovimentacao.tipo ===
                'saida'
                  ? 'Origem do Estoque *'
                  : 'Origem / Fornecedor *'
              }
            </label>

            <input
              id="origem"
              name="origem"
              type="text"
              placeholder={
                formularioMovimentacao.tipo ===
                'saida'
                  ? 'Estoque Principal'
                  : 'Ex.: Fornecedor / Compra / Recebimento'
              }
              value={
                formularioMovimentacao.origem
              }
              onChange={onAlterar}
              readOnly={
                formularioMovimentacao.tipo ===
                'saida'
              }
            />

          </div>


          {/* ==================================================
              DESTINO
          ================================================== */}

          <div className="produto-form-group full">

            <label htmlFor="destino">
              {
                formularioMovimentacao.tipo ===
                'entrada'
                  ? 'Destino do Estoque *'
                  : 'Destino / Cliente / Operação *'
              }
            </label>

            <input
              id="destino"
              name="destino"
              type="text"
              placeholder={
                formularioMovimentacao.tipo ===
                'entrada'
                  ? 'Estoque Principal'
                  : 'Ex.: Cliente / Pedido / Uso interno'
              }
              value={
                formularioMovimentacao.destino
              }
              onChange={onAlterar}
              readOnly={
                formularioMovimentacao.tipo ===
                'entrada'
              }
            />

          </div>


          {/* ==================================================
              ESTOQUE ATUAL
          ================================================== */}

          {
            produtoSelecionado && (

              <div className="produto-status-preview">

                <span>
                  Saldo Anterior:
                </span>


                <strong className="preview-ok">
                  {produtoSelecionado.estoqueAtual} un
                </strong>


                {
                  saldoPosteriorEstimado !==
                  null &&
                  (
                    <>
                      <span>
                        Saldo Posterior:
                      </span>

                      <strong
                        className={
                          saldoPosteriorEstimado >= 0
                            ? 'preview-ok'
                            : 'preview-danger'
                        }
                      >
                        {saldoPosteriorEstimado} un
                      </strong>
                    </>
                  )
                }

              </div>

            )
          }


          {/* ==================================================
              MENSAGEM
          ================================================== */}

          {
            mensagemMovimentacao && (

              <div className="produto-form-message">

                ⚠ {mensagemMovimentacao}

              </div>

            )
          }


          {/* ==================================================
              AÇÕES
          ================================================== */}

          <div className="produto-modal-actions">

            <button
              type="button"
              className="produto-modal-button cancel"
              onClick={onFechar}
            >
              Cancelar
            </button>


            <button
              type="submit"
              className="produto-modal-button save"
            >
              ⇄ Registrar Movimentação
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}


export default ModalMovimentacao