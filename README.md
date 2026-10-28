# Radar Fundamentalista B3

Digite o código de uma ação da B3 e o sistema mostra os indicadores fundamentalistas, calcula uma nota de −1 a +1 e classifica a ação como **COMPRA**, **NEUTRA** ou **VENDA**. Também estima o valor justo de Graham e o preço-teto de Bazin.

## Arquitetura

| Camada | Tecnologia | Função |
|---|---|---|
| Backend | Java 17+ (somente JDK, sem dependências) | Serve o frontend, consulta a brapi.dev, guarda cache de 5 minutos e esconde o token |
| Frontend | HTML, CSS e JavaScript (módulos ES) | Tela, regras de análise e cálculo da nota |
| Dados | [brapi.dev](https://brapi.dev) | Cotação e fundamentos da B3 |

```
radar-fundamentalista-b3/
├── src/main/java/br/radar/   Main, ApiHandler, BrapiClient, StaticHandler, TtlCache
├── web/
│   ├── index.html
│   ├── css/style.css
│   └── js/                   app.js (tela), scoring.js (regras), mapper.js (brapi), data.js
├── run.sh / run.bat          compilam e executam
└── README.md
```

## Como executar

1. Instale o **JDK 17 ou superior**.
2. (Recomendado) Crie um token gratuito em <https://brapi.dev> e defina a variável de ambiente:
   - Linux/macOS: `export BRAPI_TOKEN=seu_token`
   - Windows (cmd): `set BRAPI_TOKEN=seu_token`
3. Execute `./run.sh` (Linux/macOS) ou `run.bat` (Windows).
4. Abra <http://localhost:8080>.

Variáveis opcionais: `PORT` (padrão 8080), `HOST` (padrão 127.0.0.1; use 0.0.0.0 para acessar de outros aparelhos) e `WEB_DIR`.

## Rotas da API

- `GET /api/status` informa se há token configurado.
- `GET /api/acao/{TICKER}` devolve a resposta da brapi.dev. Exemplo: `/api/acao/BBAS3`.

## Como a decisão é tomada

Cada indicador avaliado recebe +1 (favorável), 0 (neutro) ou −1 (desfavorável), multiplicado por um peso. A nota é a média ponderada:

- nota ≥ +0,30: **COMPRA**
- nota ≤ −0,30: **VENDA**
- entre os dois: **NEUTRA**
- menos de 4 pontos de peso avaliados: **dados insuficientes**

Principais limites (editáveis em `web/js/scoring.js`):

| Indicador | Peso | Favorável | Desfavorável |
|---|---|---|---|
| P/L | 2 | ≤ 10 (banco ≤ 8) | > 15 (banco > 12) ou negativo |
| P/VP | 2 | ≤ 1 | > 2 |
| ROE | 2 | ≥ 15% | < 10% |
| ROIC | 2 | ≥ 12% | < 8% |
| Dív. líquida/EBITDA | 2 | ≤ 1 | > 3 |
| Dividend Yield | 1 | ≥ 6% | < 3% |
| ROA | 1 | ≥ 8% (banco ≥ 1,2%) | < 3% (banco < 0,8%) |
| CAGR lucros 5 anos | 1,5 | ≥ 10% | < 0% |

Para **bancos e financeiras** (BBAS3, ITUB4, BBDC4 e outros), indicadores que não fazem sentido para o setor (EV/EBITDA, dívida líquida, margens, liquidez corrente, ROIC) ficam fora da nota. Indicadores sem valor ficam em branco e não entram no cálculo.

O valor justo de Graham usa `√(22,5 × LPA × VPA)` e o teto de Bazin usa `dividendo por ação ÷ 6%`.

## Limitações

- A brapi.dev decide quais tickers e módulos de fundamentos cada plano cobre. Se a consulta for recusada, a tela avisa e você ainda pode **colar os indicadores do Status Invest** ou digitar os valores.
- A API não entrega alguns indicadores (CAGR de 5 anos, ROIC, EV/EBIT, entre outros). Eles ficam em branco para você completar.
- O mapeamento dos campos da brapi está em `web/js/mapper.js`. Se o formato da resposta mudar, ajuste esse arquivo.
- Os dados de exemplo do BBAS3 vêm do Status Invest e servem de reserva quando a API está indisponível.
- Isto é uma triagem educacional, não recomendação de investimento.
