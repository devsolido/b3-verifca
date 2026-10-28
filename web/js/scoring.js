// Regras de análise fundamentalista e cálculo da nota.
// Cada indicador avaliado recebe +1 (favorável), 0 (neutro) ou -1 (desfavorável) e um peso.
// Nota final = soma(peso * resultado) / soma(pesos avaliados), na escala de -1 a +1.

export const LIMITE_COMPRA = 0.3;
export const LIMITE_VENDA = -0.3;
export const MIN_PESO = 4; // abaixo disso não há dados suficientes para opinar

const hi = (bom, ok) => (v) => (v >= bom ? 1 : v >= ok ? 0 : -1);
const lo = (bom, ok) => (v) => (v <= 0 ? -1 : v <= bom ? 1 : v <= ok ? 0 : -1);
const divida = (bom, ok) => (v) => (v <= bom ? 1 : v <= ok ? 0 : -1);

export const INFO = 'Informativo, não entra na nota';

/**
 * k: chave | l: rótulo | w: peso | r: regra(valor, ehBanco) | h: dica de limites
 * nb: não se aplica a bancos | info: apenas informativo
 */
export const GROUPS = [
  { name: 'Valuation', items: [
    { k: 'dy', l: 'Dividend Yield (%)', w: 1, r: hi(6, 3), h: '≥ 6% favorável, < 3% desfavorável' },
    { k: 'pl', l: 'P/L', w: 2,
      r: (v, b) => (b ? lo(8, 12)(v) : lo(10, 15)(v)),
      h: (b) => (b ? 'Banco: ≤ 8 favorável, > 12 desfavorável' : '≤ 10 favorável, > 15 desfavorável') },
    { k: 'peg', l: 'PEG Ratio', w: 1, r: (v) => (v <= 0 ? null : v <= 1 ? 1 : v <= 2 ? 0 : -1),
      h: '0 a 1 favorável, > 2 desfavorável; negativo não é avaliado' },
    { k: 'pvp', l: 'P/VP', w: 2, r: lo(1, 2), h: '≤ 1 favorável, > 2 desfavorável' },
    { k: 'evebitda', l: 'EV/EBITDA', w: 1.5, nb: true, r: lo(6, 10), h: '≤ 6 favorável, > 10 desfavorável' },
    { k: 'evebit', l: 'EV/EBIT', w: 1.5, nb: true, r: lo(8, 15), h: '≤ 8 favorável, > 15 desfavorável' },
    { k: 'pebitda', l: 'P/EBITDA', info: true },
    { k: 'pebit', l: 'P/EBIT', info: true },
    { k: 'vpa', l: 'VPA (R$)', info: true },
    { k: 'lpa', l: 'LPA (R$)', info: true },
    { k: 'pativo', l: 'P/Ativo', info: true },
    { k: 'psr', l: 'P/SR', w: 1, nb: true, r: lo(1, 3), h: '≤ 1 favorável, > 3 desfavorável' },
    { k: 'pcg', l: 'P/Cap. Giro', info: true },
    { k: 'pacl', l: 'P/Ativo Circ. Liq.', info: true },
  ] },
  { name: 'Endividamento', items: [
    { k: 'dlpl', l: 'Dív. líquida/PL', w: 1, nb: true, r: divida(0.5, 1), h: '≤ 0,5 favorável, > 1 desfavorável' },
    { k: 'dlebitda', l: 'Dív. líquida/EBITDA', w: 2, nb: true, r: divida(1, 3), h: '≤ 1 favorável, > 3 desfavorável' },
    { k: 'dlebit', l: 'Dív. líquida/EBIT', w: 1, nb: true, r: divida(1.5, 4), h: '≤ 1,5 favorável, > 4 desfavorável' },
    { k: 'plativos', l: 'PL/Ativos', info: true },
    { k: 'passativos', l: 'Passivos/Ativos', info: true },
    { k: 'liqcorr', l: 'Liquidez corrente', w: 1, nb: true, r: hi(1.5, 1), h: '≥ 1,5 favorável, < 1 desfavorável' },
  ] },
  { name: 'Eficiência', items: [
    { k: 'mbruta', l: 'Margem bruta (%)', info: true },
    { k: 'mebitda', l: 'Margem EBITDA (%)', w: 1, nb: true, r: hi(20, 10), h: '≥ 20% favorável, < 10% desfavorável' },
    { k: 'mebit', l: 'Margem EBIT (%)', w: 1, nb: true, r: hi(15, 5), h: '≥ 15% favorável, < 5% desfavorável' },
    { k: 'mliq', l: 'Margem líquida (%)', w: 1.5, nb: true, r: hi(12, 5), h: '≥ 12% favorável, < 5% desfavorável' },
  ] },
  { name: 'Rentabilidade', items: [
    { k: 'roe', l: 'ROE (%)', w: 2, r: hi(15, 10), h: '≥ 15% favorável, < 10% desfavorável' },
    { k: 'roa', l: 'ROA (%)', w: 1,
      r: (v, b) => (b ? hi(1.2, 0.8)(v) : hi(8, 3)(v)),
      h: (b) => (b ? 'Banco: ≥ 1,2% favorável, < 0,8% desfavorável' : '≥ 8% favorável, < 3% desfavorável') },
    { k: 'roic', l: 'ROIC (%)', w: 2, nb: true, r: hi(12, 8), h: '≥ 12% favorável, < 8% desfavorável' },
    { k: 'giro', l: 'Giro dos ativos', info: true },
  ] },
  { name: 'Crescimento', items: [
    { k: 'cagrrec', l: 'CAGR receitas 5 anos (%)', w: 1, r: hi(10, 0), h: '≥ 10% favorável, < 0% desfavorável' },
    { k: 'cagrlucro', l: 'CAGR lucros 5 anos (%)', w: 1.5, r: hi(10, 0), h: '≥ 10% favorável, < 0% desfavorável' },
  ] },
];

/** Converte "1.234,56", "4,11%" ou "-" em número. Vazio e traço viram null. */
export function parseNum(s) {
  const t = String(s ?? '').replace('%', '').replace(/\s/g, '');
  if (t === '' || t === '-') return null;
  const n = parseFloat(t.replace(/\./g, '').replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

export function dica(item, banco) {
  if (item.info) return INFO;
  if (item.nb && banco) return 'Não se aplica a bancos e financeiras';
  return typeof item.h === 'function' ? item.h(banco) : item.h;
}

/**
 * values: { chave: "texto digitado" }, banco: boolean.
 * Retorna o status de cada indicador, a nota, o veredito e os preços de referência.
 */
export function evaluate(values, banco) {
  const rows = {};
  let soma = 0;
  let pesos = 0;
  let fav = 0;
  let neu = 0;
  let des = 0;

  for (const g of GROUPS) {
    for (const it of g.items) {
      const v = parseNum(values[it.k]);
      let s = null;
      let texto;
      if (it.info) texto = 'Informativo';
      else if (it.nb && banco) texto = 'N/A p/ banco';
      else if (v == null) texto = 'Sem dado';
      else {
        s = it.r(v, banco);
        if (s == null) texto = 'Não avaliado';
      }
      if (s != null) {
        soma += it.w * s;
        pesos += it.w;
        if (s > 0) { fav++; texto = 'Favorável'; } else if (s < 0) { des++; texto = 'Desfavorável'; } else { neu++; texto = 'Neutro'; }
      }
      rows[it.k] = { s, texto };
    }
  }

  const score = pesos ? soma / pesos : 0;
  let veredito = 'SEM_DADOS';
  if (pesos >= MIN_PESO) {
    veredito = score >= LIMITE_COMPRA ? 'COMPRA' : score <= LIMITE_VENDA ? 'VENDA' : 'NEUTRA';
  }

  // Preço de referência: implícito nos múltiplos; Graham = raiz(22,5 x LPA x VPA); Bazin = dividendo / 6%.
  const pl = parseNum(values.pl);
  const lpa = parseNum(values.lpa);
  const pvp = parseNum(values.pvp);
  const vpa = parseNum(values.vpa);
  const dy = parseNum(values.dy);
  const preco = pl > 0 && lpa > 0 ? pl * lpa : pvp > 0 && vpa > 0 ? pvp * vpa : null;
  const graham = lpa > 0 && vpa > 0 ? Math.sqrt(22.5 * lpa * vpa) : null;
  const bazin = preco && dy > 0 ? (preco * dy / 100) / 0.06 : null;

  return { rows, score, pesos, fav, neu, des, veredito, refs: { preco, graham, bazin } };
}
