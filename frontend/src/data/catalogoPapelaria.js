// ============================================================
// NEXOLOG
// CATÁLOGO CURADO DE PAPELARIA
// ============================================================
//
// Objetivo:
// - sugerir Produto -> Marca -> Especificação/Variante;
// - manter o cadastro flexível para itens novos;
// - evitar uma lista fechada que envelheça rapidamente.
//
// Fontes de referência usadas na curadoria:
// Chamex, Suzano/Report, Tilibra, Jandaia, Tris,
// Pimaco, Dello, 3M/Post-it/Scotch e linhas comercializadas
// no mercado brasileiro.
//
// ============================================================

export const CATEGORIAS_PAPELARIA = [
  'Papéis e Impressão',
  'Cadernos, Agendas e Blocos',
  'Canetas e Escrita',
  'Lápis, Lapiseiras e Grafites',
  'Marca-textos e Marcadores',
  'Desenho, Pintura e Colorir',
  'Borrachas, Apontadores e Corretivos',
  'Colas, Fitas e Adesivos',
  'Corte, Régua e Geometria',
  'Pastas, Arquivos e Organização',
  'Etiquetas e Identificação',
  'Grampeamento, Perfuração e Clips',
  'Notas Autoadesivas e Marcadores de Página',
  'Calculadoras e Acessórios de Escritório',
  'Escolar, Estojos e Kits',
]


export const CATEGORIAS_LEGADAS = [
  'Embalagens',
  'Paletização',
  'Identificação',
  'EPI',
  'Equipamentos',
]


export const TODAS_CATEGORIAS = [
  ...CATEGORIAS_PAPELARIA,
  ...CATEGORIAS_LEGADAS,
]


export const CATALOGO_PAPELARIA = {

  // ==========================================================
  // PAPÉIS E IMPRESSÃO
  // ==========================================================

  'Papéis e Impressão': {

    'Papel Sulfite': {
      genericas: [
        'A4 • 75g/m² • 500 folhas • Branco',
        'A4 • 90g/m² • 500 folhas • Branco',
        'A3 • 75g/m² • 500 folhas • Branco',
        'A3 • 90g/m² • 500 folhas • Branco',
        'Carta • 75g/m² • 500 folhas • Branco',
        'Ofício 2 • 75g/m² • 500 folhas • Branco',
      ],

      marcas: {
        Chamex: [
          'A4 • 75g/m² • 500 folhas • Branco',
          'A4 • 75g/m² • 300 folhas • Branco',
          'A4 • 90g/m² • 500 folhas • Branco',
          'A4 • 75g/m² • Colorido Amarelo',
          'A4 • 75g/m² • Colorido Azul',
          'A4 • 75g/m² • Colorido Verde',
          'A4 • 75g/m² • Colorido Rosa',
          'A4 • 75g/m² • Colorido Marfim',
          'Carta • 75g/m² • 500 folhas • Branco',
          'Notes • 75g/m² • 300 folhas • Branco',
          'Ofício 2 • 75g/m² • 500 folhas • Branco',
          'A3 • 75g/m² • 500 folhas • Branco',
          'A3 • 90g/m² • 500 folhas • Branco',
          'Reciclado A4 • 75g/m² • 500 folhas',
        ],

        Report: [
          'Premium A4 • 75g/m² • 500 folhas • Branco',
          'Premium A4 • 90g/m² • 500 folhas • Branco',
          'A3 • 75g/m² • 500 folhas • Branco',
          'Reciclato A4 • 75g/m² • 500 folhas • Natural',
          'Colorido A4 • 75g/m² • 500 folhas • Amarelo',
          'Colorido A4 • 75g/m² • 500 folhas • Verde',
          'Colorido A4 • 75g/m² • 500 folhas • Rosa',
          'Colorido A4 • 75g/m² • 500 folhas • Azul',
        ],

        HP: [
          'Office A4 • 75g/m² • 500 folhas • Branco',
        ],
      },
    },


    'Papel Colorido': {
      genericas: [
        'A4 • 75g/m² • 500 folhas • Amarelo',
        'A4 • 75g/m² • 500 folhas • Azul',
        'A4 • 75g/m² • 500 folhas • Verde',
        'A4 • 75g/m² • 500 folhas • Rosa',
        'A4 • 75g/m² • 500 folhas • Marfim',
      ],

      marcas: {
        Chamex: [
          'A4 • 75g/m² • Amarelo',
          'A4 • 75g/m² • Azul',
          'A4 • 75g/m² • Verde',
          'A4 • 75g/m² • Rosa',
          'A4 • 75g/m² • Marfim',
        ],

        Report: [
          'A4 • 75g/m² • 500 folhas • Amarelo',
          'A4 • 75g/m² • 500 folhas • Verde',
          'A4 • 75g/m² • 500 folhas • Rosa',
          'A4 • 75g/m² • 500 folhas • Azul',
        ],
      },
    },


    'Papel Reciclado': {
      genericas: [
        'A4 • 75g/m² • 500 folhas',
      ],

      marcas: {
        Chamex: [
          'Reciclado A4 • 75g/m² • 500 folhas',
        ],

        Report: [
          'Reciclato A4 • 75g/m² • 500 folhas • Natural',
        ],
      },
    },


    'Papel Fotográfico': {
      genericas: [
        'A4 • 115g/m² • Glossy',
        'A4 • 180g/m² • Glossy',
        'A4 • 200g/m² • Glossy',
        'A4 • 230g/m² • Glossy',
        'A4 • 180g/m² • Matte',
        'A4 • 230g/m² • Matte',
        '10 x 15 cm • Glossy',
      ],

      marcas: {
        Masterprint: [
          'A4 • Glossy • 115g/m²',
          'A4 • Glossy • 180g/m²',
          'A4 • Glossy • 230g/m²',
        ],

        OffPaper: [
          'A4 • Glossy • 180g/m²',
          'A4 • Matte • 180g/m²',
        ],
      },
    },


    'Papel Cartolina / Cartão': {
      genericas: [
        'Cartolina • 150g/m² • 50 x 66 cm',
        'Papel cartão • 180g/m² • 48 x 66 cm',
        'Papel cartão • 240g/m² • A4',
        'Papel kraft • 180g/m² • A4',
        'Papel kraft • 200g/m² • 66 x 96 cm',
      ],

      marcas: {
        Filiperson: [
          'Papel cartão A4 • 180g/m²',
          'Papel cartão A4 • 240g/m²',
          'Papel kraft A4 • 180g/m²',
        ],

        VMP: [
          'Cartolina • 50 x 66 cm',
          'Papel cartão • 48 x 66 cm',
        ],
      },
    },


    'Papel Vegetal': {
      genericas: [
        'A4 • 90g/m²',
        'A4 • 110g/m²',
        'A3 • 90g/m²',
        'A3 • 110g/m²',
      ],

      marcas: {
        Canson: [
          'A4 • 90g/m²',
          'A3 • 90g/m²',
        ],
      },
    },


    'Bloco Flip Chart': {
      genericas: [
        '640 x 880 mm • 50 folhas • 56g/m²',
        '660 x 960 mm • 50 folhas',
      ],

      marcas: {
        Spiral: [
          '640 x 880 mm • 50 folhas • 56g/m² • Branco',
        ],
      },
    },
  },


  // ==========================================================
  // CADERNOS, AGENDAS E BLOCOS
  // ==========================================================

  'Cadernos, Agendas e Blocos': {

    'Caderno Espiral Universitário': {
      genericas: [
        '1 matéria • 80 folhas • capa dura',
        '1 matéria • 96 folhas • capa dura',
        '10 matérias • 160 folhas • capa dura',
        '10 matérias • 200 folhas • capa dura',
        '12 matérias • 192 folhas • capa dura',
        '15 matérias • 240 folhas • capa dura',
        '20 matérias • 320 folhas • capa dura',
      ],

      marcas: {
        Tilibra: [
          '1 matéria • 80 folhas • capa dura • 200 x 275 mm',
          '1 matéria • 96 folhas • capa dura • 200 x 275 mm',
          '10 matérias • 160 folhas • capa dura • 200 x 275 mm',
          '10 matérias • 200 folhas • capa dura • 200 x 275 mm',
        ],

        Jandaia: [
          '1 matéria • 80 folhas • capa dura',
          '10 matérias • 160 folhas • capa dura',
          '12 matérias • 192 folhas • capa dura',
          '15 matérias • 240 folhas • capa dura',
          '20 matérias • 320 folhas • capa dura',
        ],

        Foroni: [
          '1 matéria • 80 folhas • capa dura',
          '10 matérias • 160 folhas • capa dura',
          '10 matérias • 200 folhas • capa dura',
        ],
      },
    },


    'Caderno Brochura': {
      genericas: [
        '1/4 • 48 folhas • capa dura',
        '1/4 • 80 folhas • capa dura',
        'Universitário • 80 folhas • capa dura',
        'Universitário • 96 folhas • capa dura',
      ],

      marcas: {
        Tilibra: [
          '1/4 • 48 folhas • capa dura',
          '1/4 • 80 folhas • capa dura',
          'Universitário • 80 folhas • capa dura',
        ],

        Jandaia: [
          '1/4 • 80 folhas • capa dura',
          'Universitário • 80 folhas • capa dura',
        ],

        Foroni: [
          '1/4 • 48 folhas • capa dura',
          'Universitário • 80 folhas • capa dura',
        ],
      },
    },


    'Caderno Cartografia / Desenho': {
      genericas: [
        'Espiral • 80 folhas • capa dura',
        'Espiral • 96 folhas • capa dura',
        'Sem pauta • A4 • 50 folhas',
      ],

      marcas: {
        Tilibra: [
          'Cartografia • 80 folhas • capa dura',
        ],

        Jandaia: [
          'Cartografia • 80 folhas • capa dura',
        ],
      },
    },


    'Caderno Argolado / Fichário': {
      genericas: [
        'A4 • 4 argolas',
        'Universitário • 4 argolas',
        'Fichário escolar • 4 argolas',
        'Refil pautado • 80 folhas',
        'Refil pautado • 96 folhas',
      ],

      marcas: {
        Tilibra: [
          'Argolado • 4 argolas • A4',
          'Refil pautado • 80 folhas',
        ],

        Jandaia: [
          'Argolado • 4 argolas',
        ],
      },
    },


    'Agenda / Planner': {
      genericas: [
        'Agenda diária • 1 dia por página',
        'Agenda semanal',
        'Agenda executiva',
        'Planner diário',
        'Planner semanal',
        'Planner mensal',
        'Planner permanente',
      ],

      marcas: {
        Tilibra: [
          'Agenda diária',
          'Agenda executiva',
          'Planner',
        ],

        Jandaia: [
          'Agenda diária',
          'Agenda Planner',
          'Agenda Executiva',
          'Agenda Permanente',
          'Caderneta',
        ],
      },
    },


    'Bloco de Notas / Rascunho': {
      genericas: [
        'A4 • 50 folhas',
        'A5 • 50 folhas',
        'A6 • 50 folhas',
        'Legal Pad • pautado',
        'Bloco rascunho • 50 folhas',
        'Bloco rascunho • 100 folhas',
      ],

      marcas: {
        Jandaia: [
          'Legal Pad',
          'Bloco de Rascunho',
          'Bloco de Ilustração',
        ],

        Tilibra: [
          'Bloco A4 • pautado',
          'Bloco A5 • pautado',
        ],
      },
    },
  },


  // ==========================================================
  // CANETAS E ESCRITA
  // ==========================================================

  'Canetas e Escrita': {

    'Caneta Esferográfica': {
      genericas: [
        '0,7 mm • Azul',
        '0,7 mm • Preta',
        '0,7 mm • Vermelha',
        '0,8 mm • Azul',
        '1,0 mm • Azul',
        '1,0 mm • Preta',
        '1,0 mm • Vermelha',
        '1,4 mm • Azul',
        '4 cores • 1,0 mm',
      ],

      marcas: {
        'Faber-Castell': [
          'Trilux • 0,8 mm • Azul',
          'Trilux • 0,8 mm • 3 cores',
          'Trilux • 1,0 mm • Azul',
          'Trilux • 1,0 mm • 3 cores',
          'Trilux Colors • 1,0 mm • 5 cores',
          'Ice 061 • 0,8 mm • Azul',
          'Ice 061 Office • 0,8 mm • 3 cores',
        ],

        Tris: [
          'Slide • 1,0 mm • Azul',
          'Slide • 1,0 mm • Preta',
          'Slide • 1,0 mm • Vermelha',
          'Slide Trio • 1,0 mm • Cores clássicas',
          'Blu • 0,7 mm',
          'ColorMix • 1,0 mm',
          'Disco • 1,0 mm',
          'Flow • 1,4 mm',
          'Icy • 0,7 mm',
          'Modern • 1,0 mm',
          'Trendz • 1,0 mm',
          'Tub • 1,0 mm',
        ],

        BIC: [
          'Cristal • 1,0 mm • Azul',
          'Cristal • 1,0 mm • Preta',
          'Cristal • 1,0 mm • Vermelha',
          'Cristal Fashion • 1,0 mm • Cores',
          '4 Cores • 1,0 mm',
          'Round Stic • 1,0 mm',
        ],

        Pilot: [
          'BPS Grip • 1,0 mm',
          'Super Grip • 0,7 mm',
          'Super Grip • 1,0 mm',
        ],

        Compactor: [
          'Office • 1,0 mm',
          '07 • 0,7 mm',
        ],
      },
    },


    'Caneta Gel': {
      genericas: [
        '0,38 mm',
        '0,5 mm',
        '0,6 mm',
        '0,7 mm',
        '1,0 mm',
        'Apagável • 0,7 mm',
        'Metálica',
        'Pastel',
      ],

      marcas: {
        Tris: [
          'Glass • 0,5 mm',
          'Full • 0,6 mm',
          'Disco Cristal • 0,7 mm',
          'Jelly Pop • 0,38 mm',
          'Signature • 0,5 mm',
          'Holic Prime • 0,5 mm',
          'Apagável • 0,7 mm',
          'Inkfinity • Metálica',
          'Inkfinity • Pastel',
        ],

        Pilot: [
          'G2 • 0,7 mm',
        ],
      },
    },


    'Caneta Roller': {
      genericas: [
        '0,5 mm',
        '0,7 mm',
      ],

      marcas: {
        Pilot: [
          'V5 • 0,5 mm',
          'V7 • 0,7 mm',
        ],

        Tris: [
          'Energy • 0,5 mm',
        ],
      },
    },


    'Fine Pen / Caneta Superfina': {
      genericas: [
        '0,4 mm • Preta',
        '0,4 mm • Azul',
        '0,4 mm • Cores',
        '0,4 mm • Pastel',
      ],

      marcas: {
        'Faber-Castell': [
          'Fine Pen • 0,4 mm • Classic Black',
          'Fine Pen • 0,4 mm • Classic Blue',
          'Fine Pen Colors • 0,4 mm • 4 cores',
          'Fine Pen Colors • 0,4 mm • Pastel • 4 cores',
        ],

        Stabilo: [
          'point 88 • 0,4 mm',
          'point 88 • Estojo cores sortidas',
        ],

        Tris: [
          'Vibes • Superfina • Preta',
          'Vibes • Superfina • Azul',
          'Vibes • Superfina • Vermelha',
          'Vibes • Superfina • Rosa',
          'Vibes • Superfina • Cores sortidas',
        ],
      },
    },
  },


  // ==========================================================
  // LÁPIS / LAPISEIRAS
  // ==========================================================

  'Lápis, Lapiseiras e Grafites': {

    'Lápis Grafite': {
      genericas: [
        'HB / Nº 2',
        'B',
        '2B',
        '3B',
        '4B',
        '5B',
        '6B',
        '8B',
        'H',
        '2H',
      ],

      marcas: {
        'Faber-Castell': [
          'EcoLápis Nº 2 / HB',
          'Grip 2001 Nº 2 / B',
          'Castell 9000 • B',
          'Castell 9000 • 2B',
          'Castell 9000 • 3B',
          'Castell 9000 • 4B',
          'Castell 9000 • 5B',
          'Castell 9000 • 6B',
          'Castell 9000 • 8B',
          'Castell 9000 • H',
          'Castell 9000 • 2H',
        ],

        Tris: [
          'HB',
          'Holic • HB',
        ],

        BIC: [
          'Evolution • HB / Nº 2',
        ],
      },
    },


    'Lapiseira': {
      genericas: [
        '0,5 mm',
        '0,7 mm',
        '0,9 mm',
        '1,2 mm',
        '2,0 mm',
      ],

      marcas: {
        'Faber-Castell': [
          'Grip Matic • 0,5 mm',
          'Grip Matic • 0,7 mm',
          'Poly Matic Super • 0,7 mm',
          'Super Pencil • 0,7 mm',
        ],

        Tris: [
          'Trendz • 0,5 mm',
          'SoftGrip • 0,7 mm',
          'Icy • 0,7 mm',
          'Vetra • 0,7 mm',
          'Comfy • 0,7 mm',
          'Comfy Neon • 0,9 mm',
          'Link • 1,2 mm',
          'College • 2,0 mm',
          'Dots • 2,0 mm',
          'Balance • 2,0 mm',
        ],

        BIC: [
          'Matic • 0,7 mm',
        ],
      },
    },


    'Grafite para Lapiseira': {
      genericas: [
        '0,5 mm • HB',
        '0,5 mm • 2B',
        '0,7 mm • HB',
        '0,7 mm • 2B',
        '0,9 mm • HB',
        '2,0 mm • HB',
      ],

      marcas: {
        'Faber-Castell': [
          'Polymer Técnico • 0,5 mm • HB',
          'Polymer Técnico • 0,5 mm • 2B',
          'Polymer Técnico • 0,7 mm • HB',
          'Polymer Técnico • 0,7 mm • 2B',
        ],

        Tris: [
          'Hi-Polymer • 0,5 mm',
          'Hi-Polymer • 0,7 mm',
          'Hi-Polymer • 2,0 mm',
        ],
      },
    },
  },


  // ==========================================================
  // MARCA-TEXTOS E MARCADORES
  // ==========================================================

  'Marca-textos e Marcadores': {

    'Marca-texto': {
      genericas: [
        'Amarelo Neon',
        'Verde Neon',
        'Rosa Neon',
        'Laranja Neon',
        'Azul Pastel',
        'Rosa Pastel',
        'Verde Pastel',
        'Lilás Pastel',
      ],

      marcas: {
        'Faber-Castell': [
          'Grifpen • Amarelo',
          'Grifpen • Verde',
          'Grifpen • Rosa',
          'Grifpen Pastel • 6 cores',
          'SuperSoft Gel • Amarelo',
        ],

        Stabilo: [
          'BOSS ORIGINAL • Amarelo',
          'BOSS ORIGINAL • Verde',
          'BOSS ORIGINAL • Rosa',
          'BOSS ORIGINAL • Laranja',
          'swing cool • cores sortidas',
        ],

        Tris: [
          'Flash Neon • Amarelo',
          'Flash Neon • conjunto 4 cores',
          'Flash Pastel • conjunto',
          'Holic Pop Flash • Neon',
        ],
      },
    },


    'Marcador Permanente': {
      genericas: [
        'Ponta fina • Preto',
        'Ponta fina • Azul',
        'Ponta média • Preto',
        'Ponta média • Azul',
        'Ponta chanfrada • Preto',
      ],

      marcas: {
        Pilot: [
          'Permanent Marker • Preto',
          'Permanent Marker • Azul',
        ],

        'Faber-Castell': [
          'CD Marker / Retroprojetor • Azul',
          'CD Marker / Retroprojetor • Preto',
        ],

        Compactor: [
          'Marcador Permanente • Preto',
          'Marcador Permanente • Azul',
        ],
      },
    },


    'Marcador para Quadro Branco': {
      genericas: [
        'Ponta redonda • Preto',
        'Ponta redonda • Azul',
        'Ponta redonda • Vermelho',
        'Ponta redonda • Verde',
        'Ponta chanfrada • Preto',
      ],

      marcas: {
        Pilot: [
          'V Board Master • Preto',
          'V Board Master • Azul',
          'V Board Master • Vermelho',
          'V Board Master • Verde',
        ],

        Compactor: [
          'Marcador Quadro Branco • Preto',
          'Marcador Quadro Branco • Azul',
        ],
      },
    },
  },


  // ==========================================================
  // DESENHO E COLORIR
  // ==========================================================

  'Desenho, Pintura e Colorir': {

    'Lápis de Cor': {
      genericas: [
        '12 cores',
        '18 cores',
        '24 cores',
        '36 cores',
        '48 cores',
        '60 cores',
        'Aquarelável • 12 cores',
        'Aquarelável • 24 cores',
      ],

      marcas: {
        'Faber-Castell': [
          'Sextavado • 12 cores',
          'Sextavado • 36 cores',
          'Sextavado • 48 cores',
          'Sextavado • 60 cores',
          'Caras & Cores • 12 cores + tons de pele',
          'Caras & Cores • 24 cores + tons de pele',
          'Aquarelável • 12 cores + pincel',
          'Aquarelável • 24 cores + pincel',
          'SuperSoft • 50 cores',
          'Metallic • 10 cores',
        ],

        BIC: [
          'Evolution • 12 cores',
          'Evolution • 24 cores',
        ],

        Tris: [
          '12 cores',
          '24 cores',
          'Rainbow • cores sortidas',
        ],
      },
    },


    'Canetinha Hidrográfica': {
      genericas: [
        '6 cores',
        '10 cores',
        '12 cores',
        '24 cores',
        'Ponta pincel',
        'Ponta dupla',
      ],

      marcas: {
        'Faber-Castell': [
          'Vai e Vem • 6 cores • Pastel',
          'Vai e Vem • 6 cores • Neon',
          'SuperSoft Brush • 10 cores • ponta pincel',
          'Super Duo • 10 cores • duas pontas',
          'Contorna & Pinta • 10 cores • duas pontas',
          'Triangular Jumbo • 6 cores',
          'Triangular Jumbo • 24 cores',
        ],

        Tris: [
          'Hidrocor • 12 cores',
          'Hidrocor • 24 cores',
          'Vibes Sketch • ponta dupla',
        ],
      },
    },


    'Tinta Guache': {
      genericas: [
        '15 ml • 6 cores',
        '15 ml • 12 cores',
        '250 ml • Branco',
        '250 ml • Preto',
        '250 ml • cores',
      ],

      marcas: {
        Acrilex: [
          '15 ml • 6 cores',
          '15 ml • 12 cores',
          '250 ml • cores',
        ],

        Tris: [
          'Tinta Guache • 6 cores',
          'Tinta Guache • 12 cores',
        ],
      },
    },


    'Giz de Cera': {
      genericas: [
        '6 cores',
        '12 cores',
        '24 cores',
        'Jumbo • 12 cores',
      ],

      marcas: {
        Acrilex: [
          '6 cores',
          '12 cores',
          '24 cores',
        ],

        Tris: [
          '12 cores',
          '24 cores',
        ],
      },
    },


    'Massa de Modelar': {
      genericas: [
        '6 cores',
        '12 cores',
        '100 g',
        '180 g',
      ],

      marcas: {
        Acrilex: [
          '6 cores',
          '12 cores',
        ],

        Tris: [
          '6 cores',
          '12 cores',
        ],
      },
    },
  },


  // ==========================================================
  // BORRACHAS / APONTADORES / CORRETIVOS
  // ==========================================================

  'Borrachas, Apontadores e Corretivos': {

    'Borracha': {
      genericas: [
        'Branca pequena',
        'Branca grande',
        'Técnica Dust Free',
        'Ponteira',
        'Colorida',
      ],

      marcas: {
        'Faber-Castell': [
          'Plástica branca • pequena',
          'Técnica Dust Free • pequena',
          'Técnica Dust Free • grande',
        ],

        Tris: [
          'Branca',
          'Holic',
          'Ponteira',
        ],

        Mercur: [
          'Branca escolar',
          'Técnica',
        ],
      },
    },


    'Apontador': {
      genericas: [
        'Simples • 1 furo',
        'Com depósito • 1 furo',
        'Com depósito • 2 furos',
        'Com borracha',
      ],

      marcas: {
        'Faber-Castell': [
          'Com depósito',
          'Com depósito + borracha',
          'Grip • com depósito',
        ],

        Tris: [
          'Com depósito',
          'Com depósito + borracha',
          '2 furos',
        ],

        Maped: [
          '1 furo',
          '2 furos',
          'Com depósito',
        ],
      },
    },


    'Corretivo': {
      genericas: [
        'Fita • 5 mm x 6 m',
        'Fita • 5 mm x 8 m',
        'Líquido • 18 ml',
        'Caneta corretiva • 7 ml',
      ],

      marcas: {
        Tris: [
          'Corretivo em fita',
          'Corretivo líquido',
          'Caneta corretiva',
        ],

        BIC: [
          'Corretivo líquido',
          'Corretivo em fita',
        ],

        CIS: [
          'Corretivo em fita',
          'Corretivo líquido',
        ],
      },
    },
  },


  // ==========================================================
  // COLAS / FITAS
  // ==========================================================

  'Colas, Fitas e Adesivos': {

    'Cola Branca': {
      genericas: [
        '40 g',
        '90 g',
        '500 g',
        '1 kg',
      ],

      marcas: {
        Acrilex: [
          '40 g',
          '90 g',
          '500 g',
        ],

        Tris: [
          '40 g',
          '90 g',
        ],
      },
    },


    'Cola Bastão': {
      genericas: [
        '10 g',
        '20 g',
        '40 g',
      ],

      marcas: {
        Pritt: [
          '10 g',
          '20 g',
          '40 g',
        ],

        Tris: [
          '10 g',
          '20 g',
        ],
      },
    },


    'Fita Adesiva Transparente': {
      genericas: [
        '12 mm x 10 m',
        '12 mm x 30 m',
        '18 mm x 50 m',
        '24 mm x 50 m',
        '45 mm x 45 m',
      ],

      marcas: {
        Scotch: [
          'Transparente • 12 mm x 10 m',
          'Transparente • 18 mm x 50 m',
          'Transparente • 24 mm x 50 m',
        ],
      },
    },


    'Fita de Empacotamento': {
      genericas: [
        '45 mm x 45 m • Transparente',
        '45 mm x 100 m • Transparente',
        '45 mm x 100 m • Marrom',
        '48 mm x 100 m • Transparente',
      ],

      marcas: {
        Scotch: [
          '5802 • 45 mm x 100 m • Transparente',
          '311 • Empacotamento',
          '373 • Empacotamento',
          '570 • Empacotamento de papel',
        ],
      },
    },


    'Fita Crepe': {
      genericas: [
        '18 mm x 50 m',
        '24 mm x 50 m',
        '48 mm x 50 m',
      ],

      marcas: {
        Scotch: [
          '2721N • 18 mm x 50 m',
          '2721N • 24 mm x 50 m',
          '2721N • 48 mm x 50 m',
        ],
      },
    },


    'Fita Dupla Face': {
      genericas: [
        '12 mm x 20 m',
        '19 mm x 20 m',
        '24 mm x 20 m',
        'Espuma • 12 mm',
        'Espuma • 19 mm',
      ],

      marcas: {
        Scotch: [
          'Dupla face • uso geral',
          'Fixação • remoção limpa',
        ],
      },
    },
  },


  // ==========================================================
  // CORTE / MEDIÇÃO
  // ==========================================================

  'Corte, Régua e Geometria': {

    'Tesoura Escolar / Escritório': {
      genericas: [
        '13 cm • escolar',
        '17 cm • uso geral',
        '20 cm • escritório',
        '21 cm • escritório',
      ],

      marcas: {
        Maped: [
          '13 cm • escolar',
          '17 cm • uso geral',
          '21 cm • escritório',
        ],

        Tris: [
          'Escolar',
          'Com capa',
          'Uso geral',
        ],
      },
    },


    'Estilete': {
      genericas: [
        '9 mm',
        '18 mm',
        'Largo • trava automática',
      ],

      marcas: {
        Maped: [
          '9 mm',
          '18 mm',
        ],

        Tris: [
          '9 mm',
          '18 mm',
        ],
      },
    },


    'Régua': {
      genericas: [
        '15 cm',
        '20 cm',
        '30 cm',
        '50 cm',
      ],

      marcas: {
        Maped: [
          '15 cm',
          '30 cm',
        ],

        Tris: [
          '15 cm',
          '30 cm',
        ],
      },
    },


    'Esquadro': {
      genericas: [
        '45° • 21 cm',
        '60° • 21 cm',
        '45° • 30 cm',
        '60° • 30 cm',
      ],

      marcas: {
        Maped: [
          '45°',
          '60°',
        ],
      },
    },


    'Compasso': {
      genericas: [
        'Escolar',
        'Técnico',
        'Com adaptador universal',
      ],

      marcas: {
        Maped: [
          'Escolar',
          'Técnico',
        ],

        Tris: [
          'Escolar',
          'Técnico',
        ],
      },
    },
  },


  // ==========================================================
  // PASTAS / ORGANIZAÇÃO
  // ==========================================================

  'Pastas, Arquivos e Organização': {

    'Pasta Suspensa': {
      genericas: [
        'Kraft • com visor e etiqueta',
        'Plastificada • com visor e etiqueta',
        'Colorida',
      ],

      marcas: {
        Dello: [
          'Kraft com haste plástica',
          'Kraft plastificada com haste plástica',
          'DelloPlast',
          'KraftSuper 12 divisórias',
          'MarmoDello',
          'MarmoDello plastificada',
          'Marmorizada pintada',
          'Marmorizada pintada plastificada',
          'DelloPlus',
        ],
      },
    },


    'Pasta Aba Elástico': {
      genericas: [
        'A4 • fina',
        'A4 • lombo 2 cm',
        'A4 • lombo 4 cm',
        'Ofício',
      ],

      marcas: {
        Dello: [
          'A4 Premium • lombo 4 cm',
        ],

        ACP: [
          'A4 • fina',
          'A4 • lombo 2 cm',
          'A4 • lombo 4 cm',
        ],
      },
    },


    'Pasta Sanfonada': {
      genericas: [
        'A4 • 5 divisórias',
        'A4 • 12 divisórias',
        'A4 • 31 divisórias',
        'Com zíper • 12 divisórias',
      ],

      marcas: {
        Dello: [
          'A4 Premium • 5 divisórias',
          'A4 Premium • 12 divisórias',
          'Premium com zíper • 12 divisórias',
          'Premium de mesa • 12 divisórias',
        ],
      },
    },


    'Arquivo Morto': {
      genericas: [
        'Ofício • papelão',
        'Ofício • polipropileno',
        'A4 • polipropileno',
      ],

      marcas: {
        Dello: [
          'Caixa para Arquivo Morto Ofício',
        ],

        Polycart: [
          'Ofício • papelão',
        ],
      },
    },


    'Maleta / Caixa Organizadora': {
      genericas: [
        'Com 6 pastas suspensas',
        'Com 10 pastas suspensas',
        'Sem pastas suspensas',
        'Empilhável',
      ],

      marcas: {
        Dello: [
          'Maleta Slim Line • 6 pastas suspensas',
          'Maleta DelloPlast • 10 pastas suspensas',
          'Maleta DelloPlast • sem suspensas',
          'Maleta Organizadora Empilhável',
          'Caixa DelloColor • 6 pastas suspensas',
        ],
      },
    },


    'Prancheta': {
      genericas: [
        'A4 • acrílica',
        'A4 • MDF',
        'A4 • plástico',
        'Ofício',
      ],

      marcas: {
        Dello: [
          'Prancheta Estojo Dupla',
        ],

        Acrimet: [
          'A4 • acrílica',
          'A4 • plástico',
        ],
      },
    },
  },


  // ==========================================================
  // ETIQUETAS
  // ==========================================================

  'Etiquetas e Identificação': {

    'Etiqueta Inkjet / Laser': {
      genericas: [
        'A4 • folha inteira',
        'A4 • múltiplas etiquetas',
        'A5 • múltiplas etiquetas',
        'Carta • múltiplas etiquetas',
        'Glossy',
        'Removível',
      ],

      marcas: {
        Pimaco: [
          'A4 • A4365 • 100 folhas',
          'A4 • A4249 • 25 folhas',
          'A4 • A4251 • 25 folhas',
          'A4 • A4367 • 100 folhas',
          'A4 • A4349 • 100 folhas',
          'A5 • A5Q1250 • 12 folhas',
          'A5 • A5Q3348 • 12 folhas',
          'A5 • A5Q1219 • 12 folhas',
          'Carta • 6081 • 10 folhas • 20 etiquetas/folha',
          'Carta • 6280 • 25 folhas • 30 etiquetas/folha',
          'Carta • 6281 • 25 folhas • 20 etiquetas/folha',
          'Carta • 6284 • 25 folhas • 6 etiquetas/folha',
          'Carta • 6184 • 100 folhas • 6 etiquetas/folha',
          'Carta • 8099L • 10 folhas • 15 etiquetas/folha',
          'Carta • REM6080 • removível',
          'Carta • REM6085 • removível',
        ],
      },
    },


    'Etiqueta Escolar / Manual': {
      genericas: [
        'Branca • pequena',
        'Branca • média',
        'Branca • grande',
        'Colorida',
        'Reforço para fichário',
      ],

      marcas: {
        Pimaco: [
          'Escolar • branca',
          'Identificação • branca',
        ],

        Tilibra: [
          'Escolar',
        ],
      },
    },
  },


  // ==========================================================
  // GRAMPEAMENTO
  // ==========================================================

  'Grampeamento, Perfuração e Clips': {

    'Grampeador': {
      genericas: [
        'Mini • grampo 26/6',
        'Mesa • 20 folhas',
        'Mesa • 30 folhas',
        'Alicate',
        'Grande capacidade',
      ],

      marcas: {
        Dello: [
          'Grampeador de mesa',
        ],

        Tris: [
          'Mini • 26/6',
        ],

        Rapid: [
          'Mesa • 26/6',
        ],
      },
    },


    'Grampo para Grampeador': {
      genericas: [
        '26/6 • caixa 1.000',
        '26/6 • caixa 5.000',
        '24/6 • caixa 1.000',
        '23/8 • caixa 1.000',
        '23/10 • caixa 1.000',
      ],

      marcas: {
        ACC: [
          '26/6 • 1.000 unidades',
          '26/6 • 5.000 unidades',
        ],

        Rapid: [
          '26/6 • 1.000 unidades',
        ],
      },
    },


    'Perfurador de Papel': {
      genericas: [
        '2 furos • 10 folhas',
        '2 furos • 20 folhas',
        '2 furos • 30 folhas',
        'Grande capacidade',
      ],

      marcas: {
        Dello: [
          '2 furos',
        ],

        Maped: [
          '2 furos',
        ],
      },
    },


    'Clips': {
      genericas: [
        'Nº 1/0',
        'Nº 2/0',
        'Nº 3/0',
        'Nº 4/0',
        'Nº 6/0',
        'Nº 8/0',
        'Colorido',
      ],

      marcas: {
        ACC: [
          'Nº 2/0',
          'Nº 3/0',
          'Nº 4/0',
          'Nº 6/0',
          'Nº 8/0',
        ],

        Tris: [
          'Colorido',
        ],
      },
    },
  },


  // ==========================================================
  // NOTAS AUTOADESIVAS
  // ==========================================================

  'Notas Autoadesivas e Marcadores de Página': {

    'Bloco Autoadesivo': {
      genericas: [
        '38 x 50 mm',
        '76 x 76 mm',
        '76 x 102 mm',
        'Super adesivo',
        'Cores sortidas',
      ],

      marcas: {
        'Post-it': [
          'Super Adesivo • 76 x 76 mm • 90 folhas',
          'Super Adesivo • 76 x 102 mm • 90 folhas',
          'Cascata • 76 x 76 mm • 3 blocos • 45 folhas/bloco',
          '76 x 76 mm • Amarelo',
          '76 x 76 mm • Pink',
          '76 x 76 mm • Azul Elétrico',
          '76 x 102 mm • Azul Aqua',
          '76 x 102 mm • Menta',
          '76 x 102 mm • Verde Limeade',
        ],

        Tris: [
          'Notas autoadesivas • cores sortidas',
          'Holic • notas autoadesivas',
        ],
      },
    },


    'Marcador de Página Autoadesivo': {
      genericas: [
        'Flags • 12 x 45 mm',
        'Flags • cores sortidas',
        'Setas • cores sortidas',
      ],

      marcas: {
        'Post-it': [
          'Flags • cores sortidas',
          'Marcadores de página • cores sortidas',
        ],

        Tris: [
          'Marcador de Página Autoadesivo',
        ],
      },
    },
  },


  // ==========================================================
  // CALCULADORAS E ACESSÓRIOS
  // ==========================================================

  'Calculadoras e Acessórios de Escritório': {

    'Calculadora': {
      genericas: [
        '8 dígitos • bolso',
        '12 dígitos • mesa',
        'Científica',
        'Financeira',
      ],

      marcas: {
        Casio: [
          '8 dígitos • bolso',
          '12 dígitos • mesa',
          'Científica',
        ],

        Jandaia: [
          'Calculadora escolar',
        ],
      },
    },


    'Porta-lápis / Organizador de Mesa': {
      genericas: [
        'Porta-lápis simples',
        'Organizador de mesa',
        'Organizador com divisórias',
      ],

      marcas: {
        Dello: [
          'Organizador de mesa',
        ],

        Acrimet: [
          'Porta-lápis',
          'Organizador de mesa',
        ],
      },
    },


    'Carimbo': {
      genericas: [
        'Automático pequeno',
        'Automático médio',
        'Datador',
        'Numerador',
      ],

      marcas: {
        Trodat: [
          'Automático',
          'Datador',
        ],

        Colop: [
          'Automático',
          'Datador',
        ],
      },
    },
  },


  // ==========================================================
  // ESCOLAR / ESTOJOS
  // ==========================================================

  'Escolar, Estojos e Kits': {

    'Estojo': {
      genericas: [
        '1 compartimento',
        '2 compartimentos',
        '3 compartimentos',
        'Plástico',
        'Tecido',
      ],

      marcas: {
        Tris: [
          'Plástico',
          'Holic',
          'Escolar',
        ],

        Tilibra: [
          'Escolar',
        ],
      },
    },


    'Kit Escolar': {
      genericas: [
        'Lápis + borracha + apontador',
        'Canetas + lápis + borracha + apontador',
        'Lápis de cor + acessórios',
      ],

      marcas: {
        'Faber-Castell': [
          '2 EcoLápis Nº 2 + apontador + borracha',
          'Lápis de cor 12 cores + apontador + borracha + 2 grafites',
        ],

        BIC: [
          'Canetas Cristal + lápis de cor Evolution + apontador + borracha',
          'Caneta 4 cores + marca-texto + lapiseira',
        ],
      },
    },
  },
}


// ============================================================
// FUNÇÕES DO CATÁLOGO
// ============================================================

function ordenar(
  lista,
) {
  return [
    ...new Set(
      lista.filter(
        Boolean,
      ),
    ),
  ].sort(
    (
      a,
      b,
    ) =>
      a.localeCompare(
        b,
        'pt-BR',
      ),
  )
}


export function obterProdutosPorCategoria(
  categoria,
) {
  const grupo =
    CATALOGO_PAPELARIA[
      categoria
    ]

  if (
    !grupo
  ) {
    return []
  }

  return ordenar(
    Object.keys(
      grupo,
    ),
  )
}


export function obterMarcasPorProduto(
  categoria,
  produto,
) {
  const item =
    CATALOGO_PAPELARIA[
      categoria
    ]?.[
      produto
    ]

  if (
    !item
  ) {
    return []
  }

  return ordenar(
    Object.keys(
      item.marcas ??
      {},
    ),
  )
}


export function obterVariantesPorProdutoMarca(
  categoria,
  produto,
  marca,
) {
  const item =
    CATALOGO_PAPELARIA[
      categoria
    ]?.[
      produto
    ]

  if (
    !item
  ) {
    return []
  }

  const especificas =
    item.marcas?.[
      marca
    ] ??
    []

  if (
    especificas.length >
    0
  ) {
    return ordenar(
      especificas,
    )
  }

  return ordenar(
    item.genericas ??
    [],
  )
}


export function obterResumoCatalogo() {
  const categorias =
    Object.keys(
      CATALOGO_PAPELARIA,
    )

  let produtos = 0
  let marcas = 0
  let variantes = 0

  categorias.forEach(
    (
      categoria,
    ) => {
      const grupo =
        CATALOGO_PAPELARIA[
          categoria
        ]

      Object.values(
        grupo,
      ).forEach(
        (
          produto,
        ) => {
          produtos += 1

          const marcasProduto =
            Object.keys(
              produto.marcas ??
              {},
            )

          marcas +=
            marcasProduto.length

          variantes +=
            (
              produto.genericas ??
              []
            ).length

          marcasProduto.forEach(
            (
              marca,
            ) => {
              variantes +=
                (
                  produto.marcas[
                    marca
                  ] ??
                  []
                ).length
            },
          )
        },
      )
    },
  )

  return {
    categorias:
      categorias.length,

    produtos,

    marcas,

    variantes,
  }
}
