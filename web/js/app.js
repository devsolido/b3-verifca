import { GROUPS, evaluate, dica } from './scoring.js';
import { mapBrapi } from './mapper.js';
import { SAMPLES, BANCOS, ROTULOS } from './data.js';

const $ = (id) => document.getElementById(id);
const brl = (n, d = 2) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const CLASSE = { COMPRA: 'buy', VENDA: 'sell', NEUTRA: 'hold', SEM_DADOS: 'none' };
const PILL = (s) => (s > 0 ? 's1' : s < 0 ? 'sm' : s === 0 ? 's0' : '');

let fonte = '';

function buildRows() {
  $('groups').innerHTML = GROUPS.map((g) =>
    `<section class="group"><h2>${g.name}</h2>${g.items.map((it) =>
      `<div class="row"><div class="nm">${it.l}<span id="h-${it.k}"></span></div>` +
      `<input type="text" inputmode="decimal" id="f-${it.k}" autocomplete="off" aria-label="${it.l}">` +
      `<span class="pill" id="p-${it.k}">–</span></div>`).join('')}</section>`).join('');
  for (const g of GROUPS) for (const it of g.items) $('f-' + it.k).addEventListener('input', update);
}

function readValues() {
  const v = {};
  for (const g of GROUPS) for (const it of g.items) v[it.k] = $('f-' + it.k).value;
  return v;
}

function setValues(v = {}) {
  for (const g of GROUPS) for (const it of g.items) $('f-' + it.k).value = v[it.k] ?? '';
}

function setStatus(msg, kind = '') {
  const el = $('status');
  el.textContent = msg;
  el.className = 'status ' + kind;
}

function update() {
  const banco = $('setor').value === 'banco';
  const res = evaluate(readValues(), banco);

  for (const g of GROUPS) {
    for (const it of g.items) {
      $('h-' + it.k).textContent = dica(it, banco);
      const p = $('p-' + it.k);
      p.textContent = res.rows[it.k].texto;
      p.className = 'pill ' + PILL(res.rows[it.k].s);
    }
  }

  const word = $('vword');
  const cls = CLASSE[res.veredito];
  word.className = 'vword ' + cls;
  word.textContent = res.veredito === 'SEM_DADOS' ? 'Dados insuficientes' : res.veredito;
  $('pin').style.left = res.veredito === 'SEM_DADOS' ? '50%' : ((res.score + 1) / 2 * 100) + '%';

  const t = $('ticker').value.toUpperCase() || '–';
  $('vt').textContent = res.veredito === 'SEM_DADOS'
    ? 'Resultado para ' + t
    : `Resultado para ${t} · nota ${res.score > 0 ? '+' : ''}${brl(res.score)}`;

  $('counts').innerHTML = res.veredito === 'SEM_DADOS'
    ? '<span class="note">Preencha mais indicadores para gerar a nota.</span>'
    : `<span class="pillv s1">${res.fav} favoráveis</span><span class="pillv s0">${res.neu} neutros</span><span class="pillv sm">${res.des} desfavoráveis</span>`;

  const { preco, graham, bazin } = res.refs;
  let refs = '';
  if (preco) refs += `<div><span>Preço implícito nos múltiplos</span><b>R$ ${brl(preco)}</b></div>`;
  if (graham) {
    const m = preco ? ` (${graham / preco - 1 >= 0 ? '+' : ''}${brl((graham / preco - 1) * 100, 0)}%)` : '';
    refs += `<div><span>Valor justo de Graham</span><b>R$ ${brl(graham)}${m}</b></div>`;
  }
  if (bazin) refs += `<div><span>Preço-teto de Bazin (6%)</span><b>R$ ${brl(bazin)}</b></div>`;
  $('refs').innerHTML = refs || '<span class="note">Informe P/L e LPA, ou P/VP e VPA, para estimar preço, valor justo de Graham e teto de Bazin.</span>';
  $('fonte').textContent = fonte;
}

async function analisar() {
  const t = $('ticker').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  $('ticker').value = t;
  if (!t) { setStatus('Digite um código da B3, por exemplo BBAS3.', 'warn'); return; }

  $('setor').value = BANCOS.has(t) ? 'banco' : 'geral';
  const btn = $('go');
  btn.disabled = true;
  setStatus('Consultando ' + t + '…');

  try {
    const resp = await fetch('/api/acao/' + encodeURIComponent(t));
    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(json.erro || 'Falha na consulta (HTTP ' + resp.status + ').');
    const m = mapBrapi(json);
    if (!m) throw new Error('A brapi.dev não retornou dados para ' + t + '.');
    setValues(m.valores);
    fonte = 'Fonte: brapi.dev · ' + new Date().toLocaleString('pt-BR');
    const vazios = Object.values(m.valores).filter((x) => x === '').length;
    setStatus(`${m.nome || t} carregada com dados da brapi.dev.` +
      (vazios ? ' Indicadores que a API não fornece ficaram em branco; complete à mão ou cole do Status Invest.' : ''), 'ok');
  } catch (e) {
    const amostra = SAMPLES[t];
    if (amostra) {
      $('setor').value = amostra.setor;
      setValues(amostra.valores);
      fonte = 'Fonte: dados de exemplo informados por você (Status Invest)';
      setStatus('Sem acesso à API (' + e.message + ') Mostrando os dados de exemplo salvos para ' + t + '.', 'warn');
    } else {
      setValues({});
      fonte = '';
      setStatus(e.message + ' Você pode colar os indicadores do Status Invest abaixo ou digitá-los.', 'warn');
    }
  } finally {
    btn.disabled = false;
    update();
  }
}

function colar() {
  const texto = $('paste').value
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(show_chart|help_outline|format_quote)/g, '');
  const linhas = texto.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const out = {};
  let n = 0;
  linhas.forEach((ln, i) => {
    const k = ROTULOS[ln];
    if (k && !(k in out)) {
      const prox = linhas[i + 1] || '';
      out[k] = /^-?[\d.,]+%?$/.test(prox) ? prox.replace('%', '') : '';
      if (out[k]) n++;
    }
  });
  if (!n) { setStatus('Não encontrei indicadores no texto colado. Copie a página inteira de indicadores do Status Invest.', 'warn'); return; }
  setValues(out);
  fonte = 'Fonte: texto colado do Status Invest';
  setStatus(n + ' indicadores preenchidos a partir do texto colado.', 'ok');
  update();
}

async function checarServidor() {
  try {
    const s = await (await fetch('/api/status')).json();
    $('srv').textContent = s.token ? 'API conectada (token configurado)' : 'API sem token: defina BRAPI_TOKEN';
    $('srv').className = 'srv ' + (s.token ? 'ok' : 'warn');
  } catch {
    $('srv').textContent = 'Servidor Java não encontrado: abra pelo run.sh ou run.bat';
    $('srv').className = 'srv warn';
  }
}

buildRows();
$('form').addEventListener('submit', (e) => { e.preventDefault(); analisar(); });
$('setor').addEventListener('change', update);
$('fill').addEventListener('click', colar);
checarServidor();
analisar();
