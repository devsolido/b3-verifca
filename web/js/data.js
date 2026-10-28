// Dados de exemplo (Status Invest, informados pelo usuário) usados quando a API não está disponível.
export const SAMPLES = {
  BBAS3: {
    setor: 'banco',
    valores: {
      dy: '4,11', pl: '6,26', peg: '-0,35', pvp: '0,52', evebit: '14,41', pebit: '14,38', vpa: '32,47',
      pativo: '0,04', lpa: '2,68', psr: '0,29', pcg: '1,62', pacl: '-0,04', plativos: '0,07',
      passativos: '0,93', liqcorr: '11,58', mbruta: '30,86', mebit: '2,03', mliq: '4,66',
      roe: '8,27', roa: '0,59', giro: '0,13', cagrrec: '26,49', cagrlucro: '2,97',
    },
  },
};

// Tickers de bancos e financeiras: usam regras próprias (sem EV/EBITDA, dívida líquida, margens).
export const BANCOS = new Set([
  'BBAS3', 'BBDC3', 'BBDC4', 'ITUB3', 'ITUB4', 'SANB3', 'SANB4', 'SANB11', 'BPAC11', 'BRSR6',
  'BMGB4', 'ABCB4', 'BPAN4', 'BEES3', 'BEES4', 'PINE4',
]);

// Texto do Status Invest (página de indicadores) -> chave do indicador.
export const ROTULOS = {
  'D.Y': 'dy', 'P/L': 'pl', 'PEG Ratio': 'peg', 'P/VP': 'pvp', 'EV/EBITDA': 'evebitda', 'EV/EBIT': 'evebit',
  'P/EBITDA': 'pebitda', 'P/EBIT': 'pebit', 'VPA': 'vpa', 'P/Ativo': 'pativo', 'LPA': 'lpa', 'P/SR': 'psr',
  'P/Cap. Giro': 'pcg', 'P/Ativo Circ. Liq.': 'pacl', 'Dív. líquida/PL': 'dlpl',
  'Dív. líquida/EBITDA': 'dlebitda', 'Dív. líquida/EBIT': 'dlebit', 'PL/Ativos': 'plativos',
  'Passivos/Ativos': 'passativos', 'Liq. corrente': 'liqcorr', 'M. Bruta': 'mbruta', 'M. EBITDA': 'mebitda',
  'M. EBIT': 'mebit', 'M. Líquida': 'mliq', 'ROE': 'roe', 'ROA': 'roa', 'ROIC': 'roic', 'Giro ativos': 'giro',
  'CAGR Receitas 5 anos': 'cagrrec', 'CAGR Lucros 5 anos': 'cagrlucro',
};
