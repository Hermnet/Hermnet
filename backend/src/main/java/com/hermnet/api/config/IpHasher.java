package com.hermnet.api.config;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;

/**
 * Hashea IPs con HMAC-SHA256 + sal rotativa para uso interno (rate-limit y
 * agregación). El objetivo es que la asociación IP ↔ hash NO sea reversible
 * por nadie, ni siquiera por el operador del backend que tenga acceso al
 * código fuente.
 *
 * Diseño:
 *  - La sal es **64 bytes aleatorios generados con SecureRandom al arranque**
 *    del proceso. Vive solo en memoria; nunca se persiste, nunca se loguea.
 *  - La sal se rota cada hora. La rotación destruye la sal anterior, así que
 *    los hashes "del bucket de las 14:00" no se pueden recalcular en el bucket
 *    de las 15:00 ni siquiera con la nueva sal.
 *  - Se usa HMAC-SHA256 (no concatenación + SHA-256) para evitar ataques de
 *    extensión de longitud y por higiene criptográfica.
 *
 * Implicaciones:
 *  - Una IP atacante no puede ser deshasheada por fuerza bruta porque la sal
 *    son 64 bytes aleatorios, no una constante conocida.
 *  - El rate-limit sigue funcionando dentro de la ventana de la sal actual.
 *  - Si el backend reinicia, los rate-limits se reinician (aceptable para nuestro caso).
 */
public final class IpHasher {

    private static final long ROTATION_MILLIS = 60L * 60L * 1000L; // 1 hora
    private static final SecureRandom RNG = new SecureRandom();

    private static volatile byte[] currentSalt = newSalt();
    private static volatile long currentSaltExpiresAt = Instant.now().toEpochMilli() + ROTATION_MILLIS;

    private IpHasher() {
        // utility class
    }

    public static String hash(String ip) {
        if (ip == null) return "unknown";

        byte[] salt = saltForNow();
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(salt, "HmacSHA256"));
            byte[] digest = mac.doFinal(ip.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            // Nunca propagamos detalles del fallo: ese mensaje podría llegar a logs.
            throw new RuntimeException("hash failure");
        }
    }

    /**
     * Devuelve la sal vigente, rotándola si ha caducado. La rotación se hace
     * de forma perezosa la primera vez que alguien pide un hash tras vencer
     * el periodo, así no necesitamos un scheduler dedicado.
     */
    private static synchronized byte[] saltForNow() {
        long now = Instant.now().toEpochMilli();
        if (now >= currentSaltExpiresAt) {
            currentSalt = newSalt();
            currentSaltExpiresAt = now + ROTATION_MILLIS;
        }
        return currentSalt;
    }

    private static byte[] newSalt() {
        byte[] salt = new byte[64];
        RNG.nextBytes(salt);
        return salt;
    }
}
