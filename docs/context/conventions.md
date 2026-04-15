# Convenciones del proyecto

## Idioma
- **Documentación y commits** en español.
- **Código** (nombres, comentarios) en inglés.
- Textos visibles en la UI en español.

## Commits
Estilo observado en `git log`:
- `Se añade <cosa> #<issue>`
- `<Acción imperativa descriptiva> #<issue>` (p. ej. `Conectar front`, `Optimizacion frontend`)
- SIEMPRE terminan con `#<numero-issue>`.
- Autor: `alvarogrlp <alvarogarciaprof@gmail.com>`.
- **No añadir** `Co-Authored-By: Claude`.

## Workflow Git
- Rama principal: `main` (protegida; normalmente se mergea vía PR).
- PRs con plantilla `Se añade ... #<issue> (#<pr>)`.
- Rebase preferido sobre merge commits para mantener historial lineal.

## Issues
- Existen issues numerados (#54, #56, #58, #59, #60, #61, #62...). Cada commit debe vincular al issue relevante.
- No tengo acceso directo a GitHub Issues vía `gh` (requiere auth). Pedir al usuario el contexto si hace falta.

## Tests
- Frontend: Jest + `jest-expo`, suite en `frontend/__tests__/`.
- Backend: JUnit (estándar Spring Boot) — revisar `backend/src/test/` si existe.
- Actualmente no bloquean pipeline visible.

## Estilo
- **Sin comentarios evidentes** — solo cuando el "por qué" no es obvio.
- **No añadir** features, refactors o abstracciones no pedidas.
- **No** escribir archivos `.md` de resumen de cambios salvo que se pidan.
