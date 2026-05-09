# Bugs arreglados recientemente

Log corto para no re-investigar. Añadir entradas nuevas arriba.

---

## 2026-05-08 — Personalización de chat no se aplicaba a burbujas reales
**Síntoma**: El usuario seleccionaba colores en `ChatCustomizationScreen`, la preview cambiaba pero los chats reales seguían con colores de high contrast (azul claro `#dbeafe` / verde claro `#dcfce7`).
**Causa**: En `MessageBubble.tsx`, `hcBubbleStyle` se aplicaba incondicionalmente cuando high contrast estaba activo, sobreescribiendo `customBubbleStyle`. Además, `customBubbleStyle` era `null` cuando `highContrast === true`.
**Fix**: (1) `customBubbleStyle` siempre se genera (nunca null). (2) Orden de estilos: `[base, hcBubbleStyle, customBubbleStyle]` — custom siempre gana. (3) HC solo aplica colores de burbuja/texto cuando el usuario NO ha elegido colores custom (`hasCustomOut` / `hasCustomIn` checks).

## 2026-05-08 — Texto de burbujas cambiaba a oscuro con colores custom
**Síntoma**: Al elegir color custom de burbuja oscuro, el texto se ponía oscuro (ilegible) porque high contrast forzaba `#1e3a8a` / `#14532d`.
**Fix**: `hcTextColor` ahora usa colores de tema default (blanco) cuando el usuario tiene colores custom activos.

## 2026-05-08 — Patrón SVG desbordaba preview en ChatCustomizationScreen
**Síntoma**: Hexagonos/grid se veían desalineados fuera del contenedor de preview.
**Fix**: Wrap de `ChatBackground` en View con `overflow: 'hidden'` y `borderRadius: 16`.

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
