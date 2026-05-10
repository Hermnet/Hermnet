# Convenciones

## Idioma

- Documentación en español.
- UI en español.
- Código, nombres de variables y APIs internas en inglés.

## Código

- Mantener cambios acotados.
- Preferir patrones existentes del repo.
- Añadir comentarios solo cuando expliquen una decisión no obvia.
- No subir secretos, `.env` reales ni JSON de Firebase.

## Git

- Rama principal: `main`.
- Evitar incluir artefactos generados (`build/`, `.gradle/`, `.expo/`, etc.).
- Antes de enseñar/subir el repo, revisar `git status --short`.

## Tests

- Backend: `mvn verify`.
- Frontend tipos: `npx tsc --noEmit`.
- Frontend tests: `npm test -- --runInBand`.

## Documentación

- `README.md` debe ser la portada pública.
- `docs/guia_arranque.md` debe ser la guía práctica de setup.
- `docs/technical/` debe describir la implementación real, no ideas antiguas.
