package br.radar;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Rotas da API:
 *  GET /api/status          estado do servidor e se há token configurado
 *  GET /api/acao/{TICKER}   cotação e fundamentos da brapi.dev (JSON repassado)
 */
final class ApiHandler implements HttpHandler {

    private static final String PREFIX_ACAO = "/api/acao/";

    private final BrapiClient brapi;

    ApiHandler(BrapiClient brapi) {
        this.brapi = brapi;
    }

    @Override
    public void handle(HttpExchange ex) throws IOException {
        try {
            if (!"GET".equals(ex.getRequestMethod())) {
                json(ex, 405, erro("Método não permitido."));
                return;
            }
            String path = ex.getRequestURI().getPath();

            if ("/api/status".equals(path)) {
                json(ex, 200, "{\"ok\":true,\"token\":" + brapi.hasToken() + "}");
            } else if (path.startsWith(PREFIX_ACAO)) {
                acao(ex, path.substring(PREFIX_ACAO.length()).toUpperCase(Locale.ROOT));
            } else {
                json(ex, 404, erro("Rota não encontrada."));
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            json(ex, 503, erro("Requisição interrompida."));
        } catch (Exception e) {
            json(ex, 502, erro("Não foi possível consultar a brapi.dev: " + e.getClass().getSimpleName()));
        } finally {
            ex.close();
        }
    }

    private void acao(HttpExchange ex, String ticker) throws IOException, InterruptedException {
        if (!BrapiClient.validTicker(ticker)) {
            json(ex, 400, erro("Código inválido. Use o formato da B3, por exemplo BBAS3 ou BPAC11."));
            return;
        }
        BrapiClient.Result r = brapi.quote(ticker);
        switch (r.status()) {
            case 200 -> json(ex, 200, r.body());
            case 404 -> json(ex, 404, erro("A brapi.dev não encontrou o código " + ticker + "."));
            case 401, 402, 403 -> json(ex, 502, erro("A brapi.dev recusou a consulta (HTTP " + r.status()
                    + "). Confira o BRAPI_TOKEN e se o seu plano cobre o ticker e os módulos de fundamentos."));
            case 429 -> json(ex, 429, erro("Limite de consultas da brapi.dev atingido. Tente novamente em instantes."));
            default -> json(ex, 502, erro("A brapi.dev respondeu HTTP " + r.status() + "."));
        }
    }

    private static String erro(String mensagem) {
        return "{\"erro\":\"" + escape(mensagem) + "\"}";
    }

    private static String escape(String s) {
        StringBuilder sb = new StringBuilder(s.length() + 8);
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }

    private static void json(HttpExchange ex, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.getResponseHeaders().set("Cache-Control", "no-store");
        ex.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }
}
