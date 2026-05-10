# Guía de Arranque

Esta guía está pensada para clonar Hermnet en una máquina nueva y dejarlo listo para desarrollar sin pelearse con la configuración.

## 1. Requisitos

- Git.
- Node.js + npm.
- Java 17 o superior.
- Maven.
- Docker Desktop.
- Android Studio con emulador si vas a probar Android.
- Xcode si vas a probar iOS.

Hermnet no funciona en Expo Go porque usa módulos nativos. Hay que compilar un development build con `expo run:android` o `expo run:ios`.

## 2. Inicialización Recomendada

Desde la raíz del repositorio:

```bash
bash scripts/bootstrap.sh
bash scripts/doctor.sh
```

`bootstrap.sh` prepara el entorno:

- crea `backend/.env` desde `backend/.env.example` si no existe;
- crea `frontend/.env` desde `frontend/.env.example` si no existe;
- detecta la IP local y actualiza `EXPO_PUBLIC_DEV_MACHINE_IP`;
- instala dependencias del frontend si falta `node_modules`;
- comprueba herramientas base;
- avisa si falta el JSON de Firebase.

`doctor.sh` revisa el estado del entorno y marca en verde/amarillo/rojo lo que falta.

## 3. Firebase

Firebase es opcional para desarrollo. Si no configuras el JSON, el backend arranca igual y solo desactiva las push notifications.

Para activar push notifications, coloca el JSON descargado en:

```text
backend/src/main/resources/hermnet-6d85d-firebase-adminsdk-fbsvc-fdf1bb4af7.json
```

O apunta a otra ruta desde `backend/.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=/ruta/absoluta/firebase-admin.json
```

El JSON no se sube a Git.

## 4. Arrancar Backend

Desde la raíz:

```bash
bash dev.sh backend
```

Este comando levanta PostgreSQL con Docker y arranca Spring Boot en:

```text
http://localhost:8080
```

Si prefieres hacerlo manual:

```bash
cd backend
docker compose up -d
mvn spring-boot:run
```

## 5. Arrancar Frontend

En otra terminal:

```bash
bash dev.sh metro
```

Primera compilación nativa:

```bash
bash dev.sh android
# o
bash dev.sh ios
```

Después de compilar una vez, normalmente basta con dejar Metro abierto y recargar la app.

## 6. Atajos

Backend + Metro:

```bash
bash dev.sh
```

Solo backend:

```bash
bash dev.sh backend
```

Solo Metro:

```bash
bash dev.sh metro
```

Actualizar IP local si cambias de WiFi:

```bash
bash scripts/bootstrap.sh
```

O solo la IP:

```bash
bash set-local-ip.sh
```

## 7. Verificación

Backend:

```bash
cd backend
mvn verify
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm test -- --runInBand
```

## 8. Problemas Comunes

### El móvil no conecta con el backend

- Android Emulator usa normalmente `http://10.0.2.2:8080`.
- iOS Simulator suele aceptar `http://localhost:8080`.
- Dispositivo físico necesita la IP LAN de tu máquina, por ejemplo `http://192.168.1.50:8080`.

El script `bootstrap.sh` intenta dejar esta IP preparada en `frontend/.env`.

### Error NitroModules o módulo nativo no encontrado

Estás usando Expo Go o una build vieja. Ejecuta:

```bash
bash dev.sh android
# o
bash dev.sh ios
```

Cada vez que instales o cambies dependencias nativas, recompila la app.

### Firebase no arranca

En desarrollo no bloquea el backend. Si quieres push notifications, revisa que `FIREBASE_SERVICE_ACCOUNT_PATH` apunta a un JSON real.

### Puerto 5432 ocupado

PostgreSQL local o Docker ya están usando el puerto. Libera el puerto o cambia el mapeo en `backend/docker-compose.yml`.

### Cambia la red WiFi y deja de funcionar

Ejecuta:

```bash
bash scripts/bootstrap.sh
```

Esto actualiza `EXPO_PUBLIC_DEV_MACHINE_IP`.
