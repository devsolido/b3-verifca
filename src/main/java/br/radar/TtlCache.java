package br.radar;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/** Cache em memória com expiração por tempo. Seguro para uso concorrente. */
final class TtlCache<K, V> {

    private record Entry<V>(V value, long expiresAtNanos) { }

    private static final int MAX_ENTRIES = 500;

    private final Map<K, Entry<V>> map = new ConcurrentHashMap<>();
    private final long ttlNanos;

    TtlCache(Duration ttl) {
        this.ttlNanos = ttl.toNanos();
    }

    Optional<V> get(K key) {
        Entry<V> e = map.get(key);
        if (e == null) {
            return Optional.empty();
        }
        if (System.nanoTime() - e.expiresAtNanos() >= 0) {
            map.remove(key, e);
            return Optional.empty();
        }
        return Optional.of(e.value());
    }

    void put(K key, V value) {
        if (map.size() >= MAX_ENTRIES) {
            map.clear();
        }
        map.put(key, new Entry<>(value, System.nanoTime() + ttlNanos));
    }
}
