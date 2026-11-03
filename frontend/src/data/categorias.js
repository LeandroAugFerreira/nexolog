// Os rótulos de apresentação não alteram os valores usados no banco e nos filtros.
const ROTULOS_CATEGORIA = {
  'Papéis e Impressão': 'Papéis',
  'Canetas e Escrita': 'Escrita',
  'Cadernos, Agendas e Blocos': 'Cadernos',
  'Colas, Fitas e Adesivos': 'Adesivos',
  'Pastas, Arquivos e Organização': 'Organização',
  'Lápis, Lapiseiras e Grafites': 'Grafites',
  'Marca-textos e Marcadores': 'Marcadores',
  'Desenho, Pintura e Colorir': 'Arte',
  'Borrachas, Apontadores e Corretivos': 'Correção',
  'Corte, Régua e Geometria': 'Geometria',
  'Etiquetas e Identificação': 'Etiquetas',
  'Grampeamento, Perfuração e Clips': 'Fixação',
  'Notas Autoadesivas e Marcadores de Página': 'Notas',
  'Calculadoras e Acessórios de Escritório': 'Calculadoras',
  'Escolar, Estojos e Kits': 'Escolar',
  'Higiene e Limpeza': 'Limpeza',
  'Matéria-prima': 'Insumos',
}

export function rotuloCategoria(categoria) {
  const nome = String(categoria ?? '').trim()
  return ROTULOS_CATEGORIA[nome] || nome.split(/[\s,]+/)[0] || 'Outros'
}
