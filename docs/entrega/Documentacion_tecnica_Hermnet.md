# Documentación Técnica: Hermnet

**Proyecto:** Hermnet  
**Versión:** 1.0  
**Fecha:** [COMPLETAR]  
**Autor/es:** [COMPLETAR]  
**Repositorio:** https://github.com/Hermnet/Hermnet  

## 1. Resumen técnico

Hermnet es un sistema de mensajería privada compuesto por una aplicación móvil, un backend propio y un entorno Odoo para gestión empresarial. La aplicación móvil está desarrollada con React Native, Expo y TypeScript. El backend está desarrollado con Spring Boot y Java 21. La persistencia del servidor se realiza con PostgreSQL y la persistencia local del dispositivo con SQLite. Odoo se ejecuta como servicio independiente con su propia base de datos PostgreSQL.

El sistema se basa en una arquitectura cliente-servidor donde el backend actúa como intermediario de transporte. Los mensajes se cifran en el dispositivo emisor antes de enviarse y se descifran en el dispositivo receptor. El backend no necesita conocer el contenido de los mensajes.

## 2. Estructura del repositorio

```text
Hermnet/
├─ backend/
│  ├─ src/main/java/
│  ├─ src/main/resources/
│  ├─ src/test/
│  ├─ pom.xml
│  └─ docker-compose.yml
├─ frontend/
│  ├─ app/
│  ├─ screens/
│  ├─ components/
│  ├─ services/
│  ├─ hooks/
│  ├─ store/
│  ├─ styles/
│  ├─ assets/
│  ├─ app.json
│  └─ package.json
├─ docs/
├─ odoo/
│  ├─ docker-compose.yml
│  ├─ config/
│  └─ addons/
│     └─ hermnet_enterprise_connector/
├─ dev.sh
└─ README.md
```

## 3. Requisitos previos

### 3.1 Backend

- Java 21.
- Maven.
- Docker.
- Docker Compose.
- Puerto 8080 disponible.

### 3.2 Frontend

- Node.js.
- npm.
- Expo.
- Android Studio para emulador Android.
- Xcode para iOS.
- Dispositivo iOS físico opcional.
- Development build para probar módulos nativos.

### 3.3 Red

El móvil y el ordenador deben estar en la misma red local si se prueba contra backend local. La aplicación utiliza la IP local del ordenador para conectarse al backend.

### 3.4 Odoo

- Docker.
- Docker Compose.
- Puerto 8069 disponible.
- Puerto 55432 disponible si se quiere acceder a PostgreSQL de Odoo desde el host.

## 4. Variables de entorno

### 4.1 Backend

Archivo `backend/.env`:

```env
JWT_SECRET=clave-super-secreta-de-al-menos-32-caracteres
DB_URL=jdbc:postgresql://localhost:5432/hermnet_blind_db
DB_USERNAME=alvaro_admin
DB_PASSWORD=alvaro_admin
```

Descripción:

- `JWT_SECRET`: clave usada para firmar y validar tokens JWT.
- `DB_URL`: URL JDBC de PostgreSQL.
- `DB_USERNAME`: usuario de base de datos.
- `DB_PASSWORD`: contraseña de base de datos.

### 4.2 Frontend

Archivo `frontend/.env`:

```env
EXPO_PUBLIC_DEV_MACHINE_IP=192.168.x.x
```

Esta variable indica al frontend la IP local donde se ejecuta el backend.

### 4.3 Odoo

Archivo `odoo/.env`:

```env
ODOO_DB_HOST=odoo-db
ODOO_DB_PORT=5432
ODOO_DB_USER=odoo
ODOO_DB_PASSWORD=odoo
ODOO_DB_NAME=hermnet_odoo
ODOO_MASTER_PASSWORD=hermnet-admin-master
ODOO_HTTP_PORT=8069
ODOO_LONGPOLLING_PORT=8072
```

Estas variables configuran el entorno Odoo de gestión empresarial. En producción deben cambiarse las contraseñas.

## 5. Instalación y ejecución del backend

Desde la raíz del proyecto:

```bash
bash dev.sh backend
```

Ejecución manual:

```bash
cd backend
docker compose up -d
mvn spring-boot:run
```

El backend queda disponible en:

```text
http://localhost:8080
http://IP_LOCAL:8080
```

## 6. Instalación y ejecución del frontend

Instalar dependencias:

```bash
cd frontend
npm install
```

Arrancar Metro:

```bash
npx expo start --dev-client
```

Ejecutar en Android:

```bash
npx expo run:android
```

Ejecutar en iOS físico:

```bash
npx expo run:ios --device
```

Nota: Expo Go no soporta completamente todos los módulos usados, como bloqueo de capturas, notificaciones remotas recientes o módulos nativos. Para pruebas completas debe usarse development build.

## 7. Script de desarrollo

El archivo `dev.sh` automatiza tareas habituales.

Comandos:

```bash
bash dev.sh backend
bash dev.sh metro
bash dev.sh android
bash dev.sh ios
bash dev.sh
```

Funciones:

- Detectar IP local.
- Actualizar `frontend/.env`.
- Levantar PostgreSQL con Docker.
- Arrancar Spring Boot.
- Arrancar Metro.
- Evitar arrancar otro backend si el puerto 8080 ya está ocupado.

## 8. Backend

### 8.1 Tecnologías

- Java 21.
- Spring Boot.
- Spring Security.
- Spring Data JPA.
- PostgreSQL.
- Maven.
- OpenAPI/Swagger.
- JWT.

### 8.2 Estructura principal

- `controller`: endpoints REST.
- `service`: lógica de negocio.
- `repository`: acceso a datos.
- `model`: entidades.
- `dto`: objetos de transferencia.
- `security`: JWT, filtros y seguridad.
- `config`: configuración general, OpenAPI y filtros.

### 8.3 Endpoints principales

El backend incluye endpoints para:

- Registro de usuario.
- Autenticación.
- Envío de mensajes.
- Recepción de mensajes.
- Consulta de identidad pública por hash.
- Actualización de token de notificaciones.

### 8.4 OpenAPI

La documentación de la API está disponible en:

```text
http://localhost:8080/swagger-ui.html
http://localhost:8080/v3/api-docs
```

OpenAPI permite revisar los endpoints, modelos, parámetros y respuestas de la API.

## 9. Frontend

### 9.1 Tecnologías

- React Native.
- Expo.
- TypeScript.
- Expo Router.
- SQLite.
- SecureStore.
- Lucide React Native.

### 9.2 Carpetas principales

- `app/`: layout y rutas.
- `screens/main/`: chats, conversación, QR y pantalla principal.
- `screens/settings/`: ajustes, perfil, privacidad y transferencia.
- `components/`: componentes reutilizables.
- `services/`: lógica de negocio y acceso a datos.
- `hooks/`: hooks personalizados.
- `store/`: estado global.
- `assets/`: iconos, logo y splash.

### 9.3 Servicios principales

- `ApiClient`: configuración de conexión al backend.
- `AuthFlowService`: autenticación y arranque.
- `DatabaseService`: SQLite local.
- `ContactsService`: gestión de contactos.
- `MessageFlowService`: envío, recepción y sincronización.
- `RecoveryService`: exportación e importación.
- `PrefsService`: preferencias.
- `ScreenPrivacyService`: bloqueo de capturas.
- `DeviceNotificationService`: notificaciones.

## 10. Base de datos del backend

Tablas principales:

- `users`: usuarios registrados, hash público, clave pública y token push.
- `mailbox`: paquetes cifrados pendientes de entrega.
- `auth_challenges`: retos temporales de autenticación.
- `token_blacklist`: tokens revocados.
- `rate_limit_buckets`: control de límites de peticiones.

## 11. Base de datos local

Tablas SQLite principales:

- `key_store`: almacén de claves locales.
- `contacts_vault`: contactos.
- `messages_history`: mensajes.
- `groups_vault`: grupos.
- `group_members`: miembros de grupo.
- `sync_queue`: cola de operaciones pendientes.
- `outgoing_seq`: secuencia de mensajes enviados.
- `replay_seen`: control anti-replay.
- `pending_ephemeral`: propuestas de mensajes temporales.

## 12. Flujo de envío de mensaje

1. El usuario escribe un mensaje.
2. La app prepara un sobre de mensaje.
3. El mensaje se cifra para el destinatario.
4. La app envía el paquete cifrado al backend.
5. El backend almacena el paquete en el buzón del destinatario.
6. El receptor sincroniza su buzón.
7. La app receptora descarga el paquete.
8. La app receptora descifra localmente.
9. El mensaje se guarda en SQLite.
10. El mensaje se muestra en la interfaz.

## 13. Flujo de grupos

1. El usuario crea un grupo.
2. El creador queda como administrador.
3. Se seleccionan miembros.
4. El grupo se guarda localmente.
5. Al enviar un mensaje, se cifra una copia para cada miembro.
6. Cada receptor actualiza o crea el grupo localmente.
7. En la interfaz se muestra el nombre público del remitente.
8. El administrador puede añadir miembros, eliminar miembros y activar la restricción de escritura.

## 14. Seguridad

Medidas implementadas:

- JWT para proteger endpoints.
- Rate limiting.
- Validación de DTOs.
- Cifrado de mensajes antes del envío.
- Persistencia local con SQLite.
- Uso de SecureStore para datos sensibles.
- PIN obligatorio.
- Bloqueo de capturas.
- Efecto Matrix opcional.
- Exportación cifrada.
- Control anti-replay.

Limitaciones:

- iOS requiere configuración de Apple para push notifications.
- Un dispositivo comprometido puede capturar información antes del cifrado.
- No se ha realizado auditoría criptográfica externa.

## 15. Notificaciones

La aplicación incluye integración con notificaciones del dispositivo.

En Android, las notificaciones requieren development build. En Expo Go, las notificaciones push remotas no están completamente soportadas en SDK 53.

En iOS, para recibir push reales es necesario configurar:

- Apple Developer.
- Push Notifications en el Bundle ID.
- Provisioning profile con `aps-environment`.
- Recompilación de la app.

Si iOS no está configurado, puede aparecer un aviso sobre `aps-environment`, pero la app continúa funcionando.

## 16. Exportación e importación

Hermnet permite exportar datos a un archivo `.hnet` protegido con contraseña. El respaldo incluye:

- Identidad.
- Contactos.
- Grupos.
- Miembros.
- Descripciones.
- Mensajes.
- Metadatos necesarios de conversación.

La importación restaura esos datos en el dispositivo.

## 17. Gestión empresarial con Odoo

El proyecto incluye un entorno Odoo separado para gestionar empresas que quieran usar Hermnet en sistemas privados.

### 17.1 Arranque

Desde la raíz del proyecto:

```bash
bash dev.sh odoo
```

Arranque manual:

```bash
cd odoo
cp .env.example .env
docker compose up -d
```

Odoo queda disponible en:

```text
http://localhost:8069
```

### 17.2 Servicios

| Servicio | Imagen | Puerto |
|---|---|---:|
| Odoo | `odoo:17.0` | 8069 |
| PostgreSQL Odoo | `postgres:15-alpine` | 55432 |

### 17.3 Addon personalizado

El módulo `hermnet_enterprise_connector` añade modelos de gestión:

- Empresas cliente.
- Planes.
- Nodos privados.
- Dispositivos autorizados.
- Políticas de seguridad.
- Solicitudes de despliegue.
- Informe PDF `Ficha empresarial Hermnet` para resumir clientes, licencias, nodos, políticas y despliegues.

### 17.4 Datos demo

El addon incluye datos de ejemplo:

- Clínica Atlas.
- Lexnova Legal.
- Planes Starter, Business y Sovereign.
- Nodos privados.
- Dispositivos.
- Políticas.
- Solicitudes de despliegue.

Estos datos permiten demostrar un caso de uso empresarial sin tener que introducir registros manualmente durante la defensa.

## 18. Pruebas

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm test -- --runInBand
```

Backend:

```bash
cd backend
mvn test
```

Resultados obtenidos:

- Frontend: 9 suites superadas.
- Frontend: 33 tests superados.
- Backend: 137 tests superados.

## 19. Errores comunes

### Puerto 8080 ocupado

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
kill PID
```

### PostgreSQL no responde

```bash
cd backend
docker compose up -d
docker ps
```

### `jwt.secret no está configurado`

Revisar `backend/.env` y definir `JWT_SECRET`.

### App sin conexión

Comprobar:

- Backend arrancado.
- IP correcta en `frontend/.env`.
- Móvil y ordenador en la misma red.
- Puerto 8080 accesible.

### Expo notifications en Expo Go

Usar development build.

### iOS `aps-environment`

Configurar Apple Push Notifications.

## 20. Despliegue local

1. Clonar repositorio.
2. Crear `backend/.env`.
3. Ejecutar `bash dev.sh backend`.
4. Ejecutar `bash dev.sh metro`.
5. Ejecutar `bash dev.sh odoo` si se quiere abrir el entorno empresarial.
6. Compilar app con `npx expo run:android` o `npx expo run:ios --device`.

## 21. Mantenimiento

Recomendaciones:

- Ejecutar tests antes de entregar.
- No subir secretos.
- Mantener `.env` fuera del repositorio.
- Revisar dependencias.
- Documentar cambios.
- Recompilar app nativa cuando cambien iconos, permisos o módulos nativos.
