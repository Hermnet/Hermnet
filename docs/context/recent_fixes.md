# Bugs y Limpiezas Recientes

## 2026-05-10 — Limpieza final para TFG/portfolio

- Backend con JaCoCo y gate de cobertura >= 98%.
- Cobertura backend verificada: 99.28%.
- Frontend TypeScript y Jest en verde.
- Documentación pública actualizada a implementación real.
- Firebase convertido en opcional para desarrollo.
- Scripts `bootstrap.sh` y `doctor.sh` añadidos.

## 2026-05-10 — Orden estable de mensajes

Síntoma: mensajes enviados durante el mismo minuto podían cambiar de posición entre enviado/recibido.

Fix: el historial local se ordena por `msg_id` y no por timestamp truncado.

## 2026-05-10 — Input del chat y teclado iOS

Síntoma: la caja de texto subía más lenta que el teclado y quedaba desfasada.

Fix: ajuste de animación con `Animated.Value` y duración más rápida para apertura.

## 2026-05-10 — Camuflaje de mensajes

Regla final:

- mensajes recibidos/enviados con el chat abierto no se camuflan;
- mensajes antiguos al reabrir chat sí se camuflan;
- mensajes nuevos no leídos no se camuflan.

## 2026-05-10 — Chat list

- Unread bubble vuelve a mostrarse correctamente.
- Preview del último mensaje respeta la misma lógica de leído/camuflado.

## 2026-05-10 — Auth local

- PIN local ya no hace loop al fallar reauth remota.
- Si el backend perdió el usuario, se re-registra la identidad local cacheada.

## 2026-05-10 — Nitro Modules

- Versiones JS/native alineadas para evitar warning de Nitro.
- `CryptoService` evita que un import nativo rompa tests o entornos sin Nitro.

## 2026-05-08 — Personalización de chat

- Los colores custom de burbujas ganan sobre high contrast.
- Texto legible con burbujas custom oscuras.
- Preview de patrones con `overflow: hidden`.

## 2026-04-15 — Network request failed / falso offline

- `ApiClient` autodetecta URL desde Metro/hostUri.
- Fallback Android Emulator: `10.0.2.2`.
- `useNetworkStatus` no marca offline por falsos negativos de reachability.
