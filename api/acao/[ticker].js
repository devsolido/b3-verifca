// Função do Vercel: GET /api/acao/{TICKER}
// Faz o mesmo que o servidor Java: valida o código, consulta a brapi.dev com o token
// (variável de ambiente BRAPI_TOKEN) e devolve o JSON. Respostas 200 ficam em cache por 5 minutos.
const TICKER = /^[A-Z]{4}[0-9]{1,2}$/;
const BASE = 'https://brapi.dev/api/quote/';
const QUERY = '?fundamental=true&modules=defaultKeyStatistics,financialData';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  const ticker = String(req.query.ticker || '').toUpperCase();
  if (!TICKER.test(ticker)) {
    return res.status(400).json({ erro: 'Código inválido. Use o formato da B3, por exemplo BBAS3 ou BPAC11.' });
  }

  const token = (process.env.BRAPI_TOKEN || '').trim();
  const headers = { Accept: 'application/json', 'User-Agent': 'radar-fundamentalista-b3/1.0' };
  if (token) headers.Authorization = 'Bearer ' + token;

  let upstream;
  try {
    upstream = await fetch(BASE + ticker + QUERY, { headers, signal: AbortSignal.timeout(15000) });
  } catch (e) {
    return res.status(502).json({ erro: 'Não foi possível consultar a brapi.dev: ' + (e.name || 'erro de rede') });
  }

  switch (upstream.status) {
    case 200:
      break;
    case 404:
      return res.status(404).json({ erro: 'A brapi.dev não encontrou o código ' + ticker + '.' });
    case 401:
    case 402:
    case 403:
      return res.status(502).json({
        erro: 'A brapi.dev recusou a consulta (HTTP ' + upstream.status + '). Confira o BRAPI_TOKEN e se o seu plano cobre o ticker e os módulos de fundamentos.',
      });
    case 429:
      return res.status(429).json({ erro: 'Limite de consultas da brapi.dev atingido. Tente novamente em instantes.' });
    default:
      return res.status(502).json({ erro: 'A brapi.dev respondeu HTTP ' + upstream.status + '.' });
  }

  const body = await upstream.json().catch(() => null);
  if (!body) {
    return res.status(502).json({ erro: 'Resposta inválida da brapi.dev.' });
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  return res.status(200).json(body);
};
