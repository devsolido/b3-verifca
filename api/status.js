// Função do Vercel: informa se o BRAPI_TOKEN está configurado (mesma resposta do servidor Java).
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, token: Boolean((process.env.BRAPI_TOKEN || '').trim()) });
};
