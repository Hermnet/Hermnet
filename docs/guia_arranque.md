# Guía de arranque del proyecto (Backend + Frontend)

Esta guía está pensada para levantar Hermnet en local de forma rápida y sin sorpresas.

## 1) Requisitos previos

- **Git**
- **Docker Desktop** (para PostgreSQL)
- **Java 21**
- **Maven 3.9+**
- **Node.js 18+** (recomendado LTS)
- **npm 9+**
- **Expo Go** en móvil (opcional) o emulador iOS/Android

## 2) Estructura y puertos

- Backend Spring Boot: `http://localhost:8080`
- Base de datos PostgreSQL (Docker): `localhost:5432`
- Frontend Expo: puerto dinámico de Expo (según CLI)

## 3) Arrancar backend

### 3.1 Levantar PostgreSQL con Docker

Desde la carpeta `backend`:

```bash
cd backend
docker compose up -d
```

Con esta configuración:
- DB: `hermnet_blind_db`
- Usuario: `alvaro_admin`
- Password: `alvaro_admin`

### 3.2 Configurar variables obligatorias

El backend necesita:

1. **JWT secret** válido (recomendado mínimo 32 caracteres).
2. **Credenciales Firebase** (para inicializar `FirebaseApp`).

En macOS/Linux, en la misma terminal donde arrancas backend:

```bash
export JWT_SECRET='cambia-esto-por-una-clave-larga-y-segura-de-32-o-mas-caracteres'
export GOOGLE_APPLICATION_CREDENTIALS='/ruta/absoluta/a/service-account.json'
```

> Alternativa Firebase: en vez de `GOOGLE_APPLICATION_CREDENTIALS`, puedes usar la propiedad `firebase.service.account.path` al arrancar la app.

### 3.3 Ejecutar API Spring Boot

Desde `backend`:

```bash
mvn spring-boot:run
```

Si prefieres pasar propiedades por línea de comando:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--jwt.secret=$JWT_SECRET --firebase.service.account.path=$GOOGLE_APPLICATION_CREDENTIALS"
```

Cuando arranque bien, la API quedará disponible en `http://localhost:8080`.

## 4) Arrancar frontend (Expo)

Desde la carpeta `frontend`:

```bash
cd ../frontend
npm install
```

Configura URL del backend (el cliente usa `EXPO_PUBLIC_API_BASE_URL`):

```bash
export EXPO_PUBLIC_API_BASE_URL='http://localhost:8080'
```

Luego inicia Expo:

```bash
npm run start
```

También puedes abrir directamente:

```bash
npm run android
npm run ios
npm run web
```

## 5) Importante según dónde corra la app

- **iOS Simulator (macOS):** suele funcionar `http://localhost:8080`.
- **Android Emulator:** usa normalmente `http://10.0.2.2:8080`.
- **Dispositivo físico:** usa la IP de tu máquina en LAN, por ejemplo `http://192.168.1.50:8080`.

Ejemplo para Android Emulator:

```bash
export EXPO_PUBLIC_API_BASE_URL='http://10.0.2.2:8080'
```

## 6) Comprobaciones rápidas

- API viva:

```bash
curl -i http://localhost:8080/api/auth/challenge
```

Debe responder (aunque sea 400/405 según método/body), lo importante es que el servidor conteste.

- Frontend apuntando a la API correcta: revisa que `EXPO_PUBLIC_API_BASE_URL` coincide con tu entorno (simulador/dispositivo).

## 7) Ejecutar tests (opcional)

Backend:

```bash
cd backend
mvn test
```

Frontend:

```bash
cd frontend
npm test
```

## 8) Problemas comunes

- **Error JWT / firma inválida:** define `JWT_SECRET` largo y estable.
- **Fallo al iniciar Firebase:** revisa ruta/permisos de `service-account.json` o `GOOGLE_APPLICATION_CREDENTIALS`.
- **El móvil no conecta con localhost:** usa IP LAN de tu Mac, no `localhost`.
- **Puerto 5432 ocupado:** cambia el mapeo en `backend/docker-compose.yml` o libera el puerto.

---

Si quieres, puedo añadir una segunda guía tipo "comando único" con scripts (`Makefile` o scripts npm) para levantar todo con 1-2 comandos.