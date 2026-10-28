package br.radar;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

/** Serve os arquivos estáticos do frontend, com proteção contra acesso fora da pasta web. */
final class StaticHandler implements HttpHandler {

    private static final Map<String, String> TYPES = Map.of(
            "html", "text/html; charset=utf-8",
            "css", "text/css; charset=utf-8",
            "js", "text/javascript; charset=utf-8",
            "json", "application/json; charset=utf-8",
            "svg", "image/svg+xml",
            "png", "image/png",
            "ico", "image/x-icon",
            "txt", "text/plain; charset=utf-8");

    private static final String CSP = "default-src 'self'; script-src 'self'; style-src 'self'; "
            + "img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

    private final Path root;

    StaticHandler(Path root) {
        this.root = root;
    }

    @Override
    public void handle(HttpExchange ex) throws IOException {
        try {
            String method = ex.getRequestMethod();
            if (!"GET".equals(method) && !"HEAD".equals(method)) {
                ex.sendResponseHeaders(405, -1);
                return;
            }

            String raw = URLDecoder.decode(ex.getRequestURI().getRawPath(), StandardCharsets.UTF_8);
            String rel = "/".equals(raw) ? "index.html" : raw.replaceFirst("^/+", "");
            Path file = root.resolve(rel).normalize();

            if (!file.startsWith(root) || !Files.isRegularFile(file)) {
                byte[] msg = "Não encontrado".getBytes(StandardCharsets.UTF_8);
                ex.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
                ex.sendResponseHeaders(404, "HEAD".equals(method) ? -1 : msg.length);
                if (!"HEAD".equals(method)) {
                    try (OutputStream os = ex.getResponseBody()) {
                        os.write(msg);
                    }
                }
                return;
            }

            String name = file.getFileName().toString();
            String ext = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1).toLowerCase() : "";
            byte[] bytes = Files.readAllBytes(file);

            var h = ex.getResponseHeaders();
            h.set("Content-Type", TYPES.getOrDefault(ext, "application/octet-stream"));
            h.set("Cache-Control", "no-cache");
            h.set("X-Content-Type-Options", "nosniff");
            h.set("Referrer-Policy", "no-referrer");
            h.set("Content-Security-Policy", CSP);

            if ("HEAD".equals(method)) {
                ex.sendResponseHeaders(200, -1);
                return;
            }
            ex.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = ex.getResponseBody()) {
                os.write(bytes);
            }
        } finally {
            ex.close();
        }
    }
}
