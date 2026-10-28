// Converte a resposta da brapi.dev (/quote com fundamentos) nos indicadores da tela.
// A leitura é defensiva: aceita número direto ou objeto { raw }, e deixa em branco o que não vier.

const num = (x) => {
  if (x == null) return null;
  if (typeof x === 'object') return num(x.raw ?? x.value ?? null);
  const n = typeof x === 'number' ? x : parseFloat(x);
  return Number.isFinite(n) ? n : null;
};

const first = (...xs) => {
  for (const x of xs) {
    const n = num(x);
    if (n != null) return n;
  }
  return null;
};

const pct = (x) => {
  const n = num(x);
  return n == null ? null : n * 100; // a brapi devolve razões como fração (0,08 = 8%)
};

const txt = (n, casas = 2) => (n == null || !Number.isFinite(n) ? '' : n.toFixed(casas).replace('.', ','));

/** Retorna { valores: {chave: "texto"}, nome, preco } ou null se a resposta não tiver resultados. */
export function mapBrapi(json) {
  const r = json?.results?.[0];
  if (!r) return null;
  const ks = r.defaultKeyStatistics ?? {};
  const fd = r.financialData ?? {};

  const preco = first(r.regularMarketPrice, fd.currentPrice);
  const lpa = first(r.earningsPerShare, ks.trailingEps);
  const pl = first(r.priceEarnings, ks.trailingPE, preco != null && lpa > 0 ? preco / lpa : null);
  const pvp = first(ks.priceToBook);
  const vpa = first(ks.bookValue, preco != null && pvp > 0 ? preco / pvp : null);

  // Dividend yield: aceita fração (0,0411) ou percentual (4,11).
  let dy = first(ks.dividendYield, r.dividendYield, fd.dividendYield);
  if (dy != null && dy > 0 && dy < 1) dy *= 100;

  const dividaLiquida = num(fd.totalDebt) != null && num(fd.totalCash) != null ? num(fd.totalDebt) - num(fd.totalCash) : null;
  const ebitda = num(fd.ebitda);
  const dlebitda = dividaLiquida != null && ebitda > 0 ? dividaLiquida / ebitda : null;

  const valores = {
    dy: txt(dy),
    pl: txt(pl),
    peg: txt(first(ks.pegRatio)),
    pvp: txt(pvp),
    evebitda: txt(first(ks.enterpriseToEbitda)),
    vpa: txt(vpa),
    lpa: txt(lpa),
    psr: txt(first(ks.priceToSalesTrailing12Months)),
    dlebitda: txt(dlebitda),
    liqcorr: txt(first(fd.currentRatio)),
    mbruta: txt(pct(fd.grossMargins)),
    mebitda: txt(pct(fd.ebitdaMargins)),
    mebit: txt(pct(fd.operatingMargins)),
    mliq: txt(pct(fd.profitMargins)),
    roe: txt(pct(fd.returnOnEquity)),
    roa: txt(pct(fd.returnOnAssets)),
    // Sem equivalente confiável na resposta: ficam em branco para você completar.
    // (CAGR de 5 anos, ROIC, EV/EBIT, P/EBIT, P/Ativo, giro, PL/Ativos, etc.)
  };

  return { valores, nome: r.longName ?? r.shortName ?? r.symbol ?? '', preco };
}
