function ModalImportacao({
  aberto,
  arquivoSelecionado,
  erroImportacao,
  dadosValidosImportacao,
  colunasAusentes,
  linhasInvalidas,
  colunasEncontradas,
  dadosImportacao,
  onFechar,
  onImportar,
}) {
  if (
    !aberto
  ) {
    return null
  }

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

      <div className="importacao-modal">

        <div className="produto-modal-header">

          <div>

            <span className="produto-modal-subtitle">
              IMPORTAÇÃO DE DADOS
            </span>

            <h3>
              Importar Excel/CSV
            </h3>

            <p>
              Confira estoque e dados de formação do preço antes da importação.
            </p>

          </div>


          <button
            className="produto-modal-close"
            type="button"
            onClick={
              onFechar
            }
          >
            ×
          </button>

        </div>


        <div className="importacao-conteudo">

          <div className="importacao-arquivo">

            <div className="importacao-arquivo-icon">
              ▦
            </div>

            <div>

              <strong>
                {
                  arquivoSelecionado?.name
                }
              </strong>

              <span>
                {
                  arquivoSelecionado
                    ? `${(
                        arquivoSelecionado.size /
                        1024
                      ).toFixed(
                        1,
                      )} KB`
                    : ''
                }
              </span>

            </div>

          </div>


          {
            erroImportacao
              ? (
                  <div className="importacao-validacao erro">
                    <strong>
                      ⚠ Arquivo não validado
                    </strong>
                    <p>
                      {
                        erroImportacao
                      }
                    </p>
                  </div>
                )
              : (
                  <div className="importacao-validacao sucesso">
                    <strong>
                      ✓ Arquivo pronto para importação
                    </strong>
                    <p>
                      {
                        dadosValidosImportacao.length
                      } produto(s) validado(s).
                    </p>
                  </div>
                )
          }


          {
            colunasAusentes.length > 0 && (

              <div className="importacao-colunas">

                <span>
                  Colunas obrigatórias ausentes:
                </span>

                <div className="importacao-tags">

                  {
                    colunasAusentes.map(
                      (
                        coluna,
                      ) => (
                        <span
                          className="importacao-tag erro"
                          key={
                            coluna
                          }
                        >
                          {
                            coluna
                          }
                        </span>
                      ),
                    )
                  }

                </div>

              </div>

            )
          }


          {
            linhasInvalidas.length > 0 && (

              <div className="importacao-colunas">

                <span>
                  Registros que precisam ser corrigidos:
                </span>

                <div className="importacao-tags">

                  {
                    linhasInvalidas.map(
                      (
                        erro,
                        index,
                      ) => (
                        <span
                          className="importacao-tag erro"
                          key={
                            `${erro.linha}-${index}`
                          }
                        >
                          Linha {
                            erro.linha
                          }: {
                            erro.motivos.join(
                              ', ',
                            )
                          }
                        </span>
                      ),
                    )
                  }

                </div>

              </div>

            )
          }


          {
            colunasEncontradas.length > 0 && (

              <div className="importacao-colunas">

                <span>
                  Colunas encontradas:
                </span>

                <div className="importacao-tags">

                  {
                    colunasEncontradas.map(
                      (
                        coluna,
                      ) => (
                        <span
                          className="importacao-tag"
                          key={
                            coluna
                          }
                        >
                          {
                            coluna
                          }
                        </span>
                      ),
                    )
                  }

                </div>

              </div>

            )
          }


          {
            dadosImportacao.length > 0 && (

              <div className="importacao-preview">

                <div className="importacao-preview-header">
                  <strong>
                    Prévia dos dados
                  </strong>
                  <span>
                    Primeiros 5 registros
                  </span>
                </div>


                <div className="importacao-preview-table-wrapper">

                  <table className="importacao-preview-table importacao-preview-precificacao">

                    <thead>
                      <tr>
                        <th>
                          Produto
                        </th>
                        <th>
                          Categoria
                        </th>
                        <th>
                          Estoque
                        </th>
                        <th>
                          Custo
                        </th>
                        <th>
                          Margem
                        </th>
                        <th>
                          NCM
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {
                        dadosImportacao
                          .slice(
                            0,
                            5,
                          )
                          .map(
                            (
                              linha,
                              index,
                            ) => (
                              <tr key={index}>
                                <td>
                                  {
                                    linha[
                                      'Nome do Produto'
                                    ] ??
                                    '-'
                                  }
                                </td>
                                <td>
                                  {
                                    linha[
                                      'Categoria'
                                    ] ??
                                    '-'
                                  }
                                </td>
                                <td>
                                  {
                                    linha[
                                      'Estoque Atual'
                                    ] ??
                                    '-'
                                  }
                                </td>
                                <td>
                                  {
                                    linha[
                                      'Custo Unitário'
                                    ] ??
                                    '-'
                                  }
                                </td>
                                <td>
                                  {
                                    linha[
                                      'Margem (%)'
                                    ] ??
                                    '-'
                                  }
                                </td>
                                <td>
                                  {
                                    linha[
                                      'Marca',
                                  'Especificação',
                                  'GTIN/EAN',
                                  'NCM'
                                    ] ??
                                    '-'
                                  }
                                </td>
                              </tr>
                            ),
                          )
                      }

                    </tbody>

                  </table>

                </div>

              </div>

            )
          }


          <div className="produto-fiscal-alerta">

            <strong>
              Modelo de importação atualizado
            </strong>

            <span>
              Obrigatórios: Nome do Produto, Categoria, Estoque Atual, Estoque Mínimo, Custo Unitário e Margem (%). Marca, Especificação, GTIN/EAN, NCM, Regime Tributário, UF Referência e alíquotas são opcionais. GTIN/EAN, quando informado, deve ser único.
            </span>

          </div>

        </div>


        <div className="importacao-actions">

          <button
            type="button"
            className="produto-modal-button cancel"
            onClick={
              onFechar
            }
          >
            Cancelar
          </button>


          {
            !erroImportacao &&
            dadosValidosImportacao.length > 0 && (

              <button
                type="button"
                className="produto-modal-button save"
                onClick={
                  onImportar
                }
              >
                ⇧ Importar {
                  dadosValidosImportacao.length
                } Produto(s)
              </button>

            )
          }

        </div>

      </div>

    </div>
  )
}


export default ModalImportacao
