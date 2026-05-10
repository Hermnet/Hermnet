# Entorno de Desarrollo

Guía principal: `docs/guia_arranque.md`.

## Arranque Nuevo

```bash
bash scripts/bootstrap.sh
bash scripts/doctor.sh
```

## Backend

```bash
bash dev.sh backend
```

- Spring Boot en `http://localhost:8080`.
- PostgreSQL por Docker.
- Firebase es opcional en desarrollo.
- Producción debe definir `JWT_SECRET`.

## Frontend

```bash
bash dev.sh metro
bash dev.sh android
# o
bash dev.sh ios
```

## Verificación

```bash
cd backend && mvn verify
cd frontend && npx tsc --noEmit
cd frontend && npm test -- --runInBand
```

## Red Local

Si cambia la WiFi, ejecutar:

```bash
bash scripts/bootstrap.sh
```

Esto actualiza `EXPO_PUBLIC_DEV_MACHINE_IP`.
