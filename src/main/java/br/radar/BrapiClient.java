package br.radar;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.regex.Pattern;

/** Cliente da API brapi.dev (cotações e fundamentos da B3). */
final class BrapiClient {

    /** Resposta já tratada: código HTTP de origem e corpo JSON. */
    record Result(int status, String body) { }

    private static final Pattern TICKER = Pattern.compile("^[A-Z]{4}[0-9]{1,2}$");
    private static final String BASE = "https://brapi.dev/api/quote/";
    private static final String QUERY = "?fundamental=true&modules=defaultKeyStatistics,financialData";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private final TtlCache<String, Result> cache = new TtlCache<>(Duration.ofMinutes(5));
    private final String token;

    BrapiClient(String token) {
        this.token = (token == null || token.isBlank()) ? null : token.trim();
    }

    static boolean validTicker(String ticker) {
        return ticker != null && TICKER.matcher(ticker).matches();
    }

    boolean hasToken() {
        return token != null;
    }

    /** Busca cotação e fundamentos. Somente respostas 200 entram no cache. */
    Result quote(String ticker) throws IOException, InterruptedException {
        var hit = cache.get(ticker);
        if (hit.isPresent()) {
            return hit.get();
        }

        HttpRequest.Builder req = HttpRequest.newBuilder(URI.create(BASE + ticker + QUERY))
                .timeout(Duration.ofSeconds(15))
                .header("Accept", "application/json")
                .header("User-Agent", "radar-fundamentalista-b3/1.0")
                .GET();
        if (token != null) {
            req.header("Authorization", "Bearer " + token);
        }

        HttpResponse<String> resp = http.send(req.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        Result result = new Result(resp.statusCode(), resp.body());
        if (resp.statusCode() == 200) {
            cache.put(ticker, result);
        }
        return result;
    }
}
