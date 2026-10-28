package br.radar;

import com.sun.net.httpserver.HttpServer;

import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.Executors;

/**
 * Ponto de entrada do Radar Fundamentalista B3.
 *
 * Sobe um servidor HTTP leve (somente JDK, sem dependências) que:
 *  - serve o frontend estático da pasta "web";
 *  - expõe /api/acao/{TICKER} e /api/status, com proxy para a brapi.dev e cache em memória.
 *
 * Variáveis de ambiente (todas opcionais):
 *  PORT         porta HTTP (padrão 8080)
 *  HOST         endereço de escuta (padrão 127.0.0.1; use 0.0.0.0 para expor na rede)
 *  WEB_DIR      pasta do frontend (padrão "web")
 *  BRAPI_TOKEN  token da brapi.dev (recomendado; sem ele só funcionam os tickers de teste do serviço)
 */
public final class Main {

    private Main() { }

    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(env("PORT", "8080"));
        String host = env("HOST", "127.0.0.1");
        Path web = Paths.get(env("WEB_DIR", "web")).toAbsolutePath().normalize();
        String token = System.getenv("BRAPI_TOKEN");

        if (!Files.isDirectory(web)) {
            System.err.println("Pasta do frontend não encontrada: " + web);
            System.err.println("Execute a partir da raiz do projeto ou defina WEB_DIR.");
            System.exit(1);
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(host, port), 0);
        server.createContext("/api/", new ApiHandler(new BrapiClient(token)));
        server.createContext("/", new StaticHandler(web));
        server.setExecutor(Executors.newFixedThreadPool(8));
        server.start();

        System.out.println("Radar Fundamentalista B3 em http://" + host + ":" + port);
        System.out.println("Frontend: " + web);
        System.out.println(token == null || token.isBlank()
                ? "Aviso: BRAPI_TOKEN não definido. A brapi pode recusar tickers fora da lista de teste."
                : "Token da brapi.dev carregado.");
    }

    private static String env(String name, String fallback) {
        String v = System.getenv(name);
        return (v == null || v.isBlank()) ? fallback : v.trim();
    }
}
