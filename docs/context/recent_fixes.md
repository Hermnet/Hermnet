# Bugs arreglados recientemente

Log corto para no re-investigar. Añadir entradas nuevas arriba.

---

## 2026-04-15 — Network request failed + JWT 403 + falso offline  (#62)
**Síntoma 1**: fetch fallaba con `TypeError: Network request failed` al hacer login desde emulador Android.
**Causa**: `ApiClient` apuntaba a `localhost:8080`; en emulador eso es el propio device.
**Fix**: `frontend/services/ApiClient.ts` ahora resuelve URL desde `Constants.expoConfig.hostUri`, con fallback `10.0.2.2` en Android.

**Síntoma 2**: tras conectar, backend devolvía 500 (visto como 403 en front) en `/api/auth/login`.
**Causa**: `jwt.secret` en `application.properties` tenía una `\` al final que lo dejaba efectivamente vacío; usaba el default de `@Value` (25 bytes / 200 bits) → `WeakKeyException` de jjwt (exige ≥256 bits).
**Fix**: secret de 72 chars literal en `application.properties`.

**Síntoma 3**: banner "Sin conexión a la red" en mailbox aunque la API respondía.
**Causa**: `useNetworkStatus` marcaba offline si `isInternetReachable === false`; NetInfo en emulador Android no consigue hacer reachability check a Google y devuelve false.
**Fix**: `frontend/hooks/useNetworkStatus.ts` ahora solo usa `isConnected`.

Commit: `59c41ad` en `main`.
