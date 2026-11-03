// ============================================================
// NEXOLOG
// MODAL - NOVO PEDIDO
// ============================================================


function montarClassificacaoProduto(
  produto,
) {
  if (
    !produto
  ) {
    return ''
  }

  return [
    produto.marca,
    produto.especificacao,
  ]
    .map(
      (
        valor,
      ) =>
        String(
          valor ??
          '',
        ).trim(),
    )
    .filter(
      Boolean,
    )
    .join(
      ' • ',
    )
}


function formatarMoeda(
  valor,
) {
  return new Intl.NumberFormat(
    'pt-BR',
    {
      style:
        'currency',

      currency:
        'BRL',
    },
  ).format(
    Number(
      valor ||
      0,
    ),
  )
}


// ============================================================
// MODAL
// ============================================================

function ModalNovoPedido({
  aberto,
  formulario,
  clientes,
  carregandoClientes,
  erroClientes,
  produtos,
  carregandoProdutos,
  erroProdutos,
  mensagem,
  salvando,
  onAlterarCampo,
  onAlterarItem,
  onAdicionarItem,
  onRemoverItem,
  onFechar,
  onSalvar,
}) {
  if (
    !aberto
  ) {
    return null
  }


  // ==========================================================
  // TOTAL
  // ==========================================================

  const valorTotal =
    formulario.itens.reduce(
      (
        total,
        item,
      ) => {
        const quantidade =
          Number(
            item.quantidade ||
            0,
          )


        const valorUnitario =
          Number(
            item.valor_unitario ||
            0,
          )


        return (
          total +
          (
            quantidade *
            valorUnitario
          )
        )
      },
      0,
    )


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="pedido-modal-overlay"
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
        className="pedido-modal pedido-modal-grande"
      >

        {/* ================================================== */}
        {/* CABEÇALHO */}
        {/* ================================================== */}

        <div
          className="pedido-modal-header"
        >

          <div>

            <h3>
              Realizar Pedido
            </h3>


            <p>
              Informe o cliente,
              transporte e produtos
              que farão parte do pedido.
            </p>

          </div>


          <button
            type="button"
            className="pedido-modal-close"
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


        {/* ================================================== */}
        {/* FORMULÁRIO */}
        {/* ================================================== */}

        <form
          className="pedido-form"
          onSubmit={
            onSalvar
          }
        >

          {/* ================================================= */}
          {/* DADOS DO CLIENTE */}
          {/* ================================================= */}

          <div
            className="pedido-form-section"
          >

            <div
              className="pedido-form-section-header"
            >

              <div
                className="pedido-form-section-icon"
              >
                ◇
              </div>


              <div>

                <strong>
                  Dados do Pedido
                </strong>


                <span>
                  Cliente e destino da entrega.
                </span>

              </div>

            </div>


            <div
              className="pedido-form-group"
            >

              <label
                htmlFor="cliente_codigo"
              >
                Cliente *
              </label>


              <select
                id="cliente_codigo"
                name="cliente_codigo"
                value={
                  formulario.cliente_codigo
                }
                onChange={
                  onAlterarCampo
                }
                disabled={
                  salvando ||
                  carregandoClientes
                }
                autoFocus
              >

                <option
                  value=""
                >
                  {
                    carregandoClientes
                      ? 'Carregando clientes...'
                      : clientes.length ===
                          0
                        ? 'Nenhum cliente ativo cadastrado'
                        : 'Selecione um cliente...'
                  }
                </option>


                {
                  clientes.map(
                    (
                      cliente,
                    ) => (
                      <option
                        key={
                          cliente.codigo
                        }
                        value={
                          cliente.codigo
                        }
                      >
                        {
                          cliente.codigo
                        }
                        {' - '}
                        {
                          cliente.nome
                        }
                        {
                          cliente.cidade &&
                          cliente.uf
                            ? ` • ${cliente.cidade} - ${cliente.uf}`
                            : ''
                        }
                      </option>
                    ),
                  )
                }

              </select>


              {
                erroClientes &&
                (
                  <small
                    className="pedido-estoque-disponivel"
                  >
                    ⚠ {erroClientes}
                  </small>
                )
              }


              {
                !erroClientes &&
                formulario.cliente_nome &&
                (
                  <small
                    className="pedido-estoque-disponivel"
                  >
                    Cliente selecionado: {
                      formulario.cliente_nome
                    }
                  </small>
                )
              }

            </div>


            <div
              className="pedido-form-group"
            >

              <label
                htmlFor="destino"
              >
                Destino *
              </label>


              <input
                id="destino"
                name="destino"
                type="text"
                placeholder="Selecione um cliente para preencher automaticamente"
                value={
                  formulario.destino
                }
                onChange={
                  onAlterarCampo
                }
                disabled={
                  salvando
                }
              />

            </div>

          </div>


          {/* ================================================= */}
          {/* TRANSPORTE */}
          {/* ================================================= */}

          <div
            className="pedido-form-section"
          >

            <div
              className="pedido-form-section-header"
            >

              <div
                className="pedido-form-section-icon transporte"
              >
                ⇄
              </div>


              <div>

                <strong>
                  Transporte
                </strong>


                <span>
                  Informações opcionais de expedição.
                </span>

              </div>

            </div>


            <div
              className="pedido-form-row"
            >

              <div
                className="pedido-form-group"
              >

                <label
                  htmlFor="transportadora"
                >
                  Transportadora
                </label>


                <input
                  id="transportadora"
                  name="transportadora"
                  type="text"
                  placeholder="Ex.: Loggi Transportes"
                  value={
                    formulario.transportadora
                  }
                  onChange={
                    onAlterarCampo
                  }
                  disabled={
                    salvando
                  }
                />

              </div>


              <div
                className="pedido-form-group"
              >

                <label
                  htmlFor="codigo_rastreio"
                >
                  Código de Rastreio
                </label>


                <input
                  id="codigo_rastreio"
                  name="codigo_rastreio"
                  type="text"
                  placeholder="Ex.: LOG-2026-000123"
                  value={
                    formulario.codigo_rastreio
                  }
                  onChange={
                    onAlterarCampo
                  }
                  disabled={
                    salvando
                  }
                />

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* ITENS */}
          {/* ================================================= */}

          <div
            className="pedido-form-section"
          >

            <div
              className="pedido-itens-header"
            >

              <div
                className="pedido-form-section-header"
              >

                <div
                  className="pedido-form-section-icon produto"
                >
                  □
                </div>


                <div>

                  <strong>
                    Itens do Pedido
                  </strong>


                  <span>
                    Selecione os produtos,
                    quantidades e valores.
                  </span>

                </div>

              </div>


              <button
                type="button"
                className="pedido-adicionar-item"
                onClick={
                  onAdicionarItem
                }
                disabled={
                  salvando ||
                  carregandoProdutos
                }
              >
                ＋ Adicionar Item
              </button>

            </div>


            {/* =============================================== */}
            {/* ERRO PRODUTOS */}
            {/* =============================================== */}

            {
              erroProdutos &&
              (
                <div
                  className="pedido-produtos-alerta"
                >
                  ⚠ {erroProdutos}
                </div>
              )
            }


            {/* =============================================== */}
            {/* CARREGANDO */}
            {/* =============================================== */}

            {
              carregandoProdutos &&
              (
                <div
                  className="pedido-produtos-carregando"
                >
                  Carregando produtos do estoque...
                </div>
              )
            }


            {/* =============================================== */}
            {/* LINHAS */}
            {/* =============================================== */}

            {
              formulario.itens.map(
                (
                  item,
                  index,
                ) => {
                  const produtoSelecionado =
                    produtos.find(
                      (
                        produto,
                      ) =>
                        produto.sku ===
                        item.produto_sku,
                    )


                  const subtotal =
                    Number(
                      item.quantidade ||
                      0,
                    ) *
                    Number(
                      item.valor_unitario ||
                      0,
                    )


                  return (
                    <div
                      key={
                        item.id
                      }
                      className="pedido-item-card"
                    >

                      <div
                        className="pedido-item-topo"
                      >

                        <span>
                          Item {
                            index +
                            1
                          }
                        </span>


                        <button
                          type="button"
                          className="pedido-remover-item"
                          onClick={
                            () =>
                              onRemoverItem(
                                index,
                              )
                          }
                          disabled={
                            salvando ||
                            formulario.itens.length ===
                            1
                          }
                          title="Remover item"
                        >
                          ×
                        </button>

                      </div>


                      <div
                        className="pedido-item-grid"
                      >

                        {/* =================================== */}
                        {/* PRODUTO */}
                        {/* =================================== */}

                        <div
                          className="pedido-form-group produto"
                        >

                          <label>
                            Produto *
                          </label>


                          <select
                            value={
                              item.produto_sku
                            }
                            onChange={
                              (
                                event,
                              ) =>
                                onAlterarItem(
                                  index,
                                  'produto_sku',
                                  event.target.value,
                                )
                            }
                            disabled={
                              salvando ||
                              carregandoProdutos
                            }
                          >

                            <option
                              value=""
                            >
                              Selecione...
                            </option>


                            {
                              produtos.map(
                                (
                                  produto,
                                ) => {
                                  const usadoEmOutroItem =
                                    formulario.itens.some(
                                      (
                                        outroItem,
                                        outroIndex,
                                      ) =>
                                        outroIndex !==
                                          index &&
                                        outroItem.produto_sku ===
                                          produto.sku,
                                    )


                                  const classificacao =
                                    montarClassificacaoProduto(
                                      produto,
                                    )


                                  return (
                                    <option
                                      key={
                                        produto.sku
                                      }
                                      value={
                                        produto.sku
                                      }
                                      disabled={
                                        usadoEmOutroItem
                                      }
                                    >
                                      {
                                        [
                                          `${produto.sku} - ${produto.nome}`,
                                          classificacao,
                                        ]
                                          .filter(
                                            Boolean,
                                          )
                                          .join(
                                            ' • ',
                                          )
                                      }
                                    </option>
                                  )
                                },
                              )
                            }

                          </select>


                          {
                            produtoSelecionado &&
                            (
                              <div
                                className="pedido-produto-identidade"
                              >

                                <strong>
                                  {
                                    produtoSelecionado.nome
                                  }
                                </strong>


                                {
                                  montarClassificacaoProduto(
                                    produtoSelecionado,
                                  ) && (
                                    <span>
                                      {
                                        montarClassificacaoProduto(
                                          produtoSelecionado,
                                        )
                                      }
                                    </span>
                                  )
                                }


                                <small
                                  className="pedido-estoque-disponivel"
                                >
                                  Estoque disponível para reserva: {
                                    Number(
                                      produtoSelecionado
                                        .estoque_disponivel ?? produtoSelecionado.estoque_atual ??
                                      0,
                                    ).toLocaleString(
                                      'pt-BR',
                                    )
                                  } un
                                  {' • '}
                                  Preço cadastrado: {
                                    Number(
                                      produtoSelecionado
                                        .preco_venda ??
                                      0,
                                    ) > 0
                                      ? formatarMoeda(
                                          Number(
                                            produtoSelecionado
                                              .preco_venda,
                                          ),
                                        )
                                      : 'não definido'
                                  }
                                </small>

                              </div>
                            )
                          }

                        </div>


                        {/* =================================== */}
                        {/* QUANTIDADE */}
                        {/* =================================== */}

                        <div
                          className="pedido-form-group quantidade"
                        >

                          <label>
                            Quantidade *
                          </label>


                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={
                              item.quantidade
                            }
                            onChange={
                              (
                                event,
                              ) =>
                                onAlterarItem(
                                  index,
                                  'quantidade',
                                  event.target.value,
                                )
                            }
                            disabled={
                              salvando
                            }
                          />

                        </div>


                        {/* =================================== */}
                        {/* VALOR */}
                        {/* =================================== */}

                        <div
                          className="pedido-form-group valor"
                        >

                          <label>
                            Valor Unitário *
                          </label>


                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                            value={
                              item.valor_unitario
                            }
                            onChange={
                              (
                                event,
                              ) =>
                                onAlterarItem(
                                  index,
                                  'valor_unitario',
                                  event.target.value,
                                )
                            }
                            disabled={
                              salvando
                            }
                          />

                        </div>


                        {/* =================================== */}
                        {/* SUBTOTAL */}
                        {/* =================================== */}

                        <div
                          className="pedido-item-subtotal"
                        >

                          <span>
                            Subtotal
                          </span>


                          <strong>
                            {
                              formatarMoeda(
                                subtotal,
                              )
                            }
                          </strong>

                        </div>

                      </div>

                    </div>
                  )
                },
              )
            }

          </div>


          {/* ================================================= */}
          {/* RESUMO */}
          {/* ================================================= */}

          <div
            className="pedido-form-resumo pedido-form-resumo-final"
          >

            <div>

              <span>
                Cliente
              </span>


              <strong>
                {
                  formulario
                    .cliente_nome
                    .trim() ||
                  'Não informado'
                }
              </strong>

            </div>


            <div>

              <span>
                Destino
              </span>


              <strong>
                {
                  formulario
                    .destino
                    .trim() ||
                  'Não informado'
                }
              </strong>

            </div>


            <div>

              <span>
                Unidades
              </span>


              <strong>
                {
                  formulario.itens
                    .reduce(
                      (
                        total,
                        item,
                      ) =>
                        total +
                        Number(
                          item.quantidade ||
                          0,
                        ),
                      0,
                    )
                }
              </strong>

            </div>


            <div
              className="pedido-resumo-total"
            >

              <span>
                Valor Total
              </span>


              <strong>
                {
                  formatarMoeda(
                    valorTotal,
                  )
                }
              </strong>

            </div>

          </div>


          {/* ================================================= */}
          {/* STATUS */}
          {/* ================================================= */}

          <div
            className="pedido-status-inicial"
          >

            <span>
              Status inicial
            </span>


            <div>

              <span
                className="pedido-status-dot pendente"
              />


              <strong>
                Pendente
              </strong>

            </div>

          </div>


          {/* ================================================= */}
          {/* MENSAGEM */}
          {/* ================================================= */}

          {
            mensagem &&
            (
              <div
                className="pedido-form-message"
              >
                {mensagem}
              </div>
            )
          }


          {/* ================================================= */}
          {/* AÇÕES */}
          {/* ================================================= */}

          <div
            className="pedido-modal-actions"
          >

            <button
              type="button"
              className="pedido-modal-button cancel"
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
              className="pedido-modal-button save"
              disabled={
                salvando ||
                carregandoProdutos
              }
            >
              {
                salvando
                  ? 'Cadastrando...'
                  : 'Cadastrar Pedido'
              }
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}


export default ModalNovoPedido