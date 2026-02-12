# Referencia de Clases del Backend

Este documento describe la estructura actual del backend de Hermnet API, detallando el propósito y responsabilidad de cada clase implementada hasta el momento.

## 1. Aplicación Principal
### `com.hermnet.api`
- **`HermnetApiApplication.java`**: Punto de entrada de la aplicación Spring Boot.

---

## 2. Configuración (`config`)
Componentes transversales y de configuración de seguridad/privacidad.

- **`IpHasher.java`**:
  - **Tipo**: Utilidad.
  - **Función**: Convierte direcciones IP en hashes (SHA-256) utilizando un "salt" dinámico que rota diariamente.
  - **Objetivo**: Garantizar que el servidor nunca almacene ni procese IPs reales, cumpliendo con el principio de privacidad y "Conocimiento Cero".

- **`IpAnonymizationFilter.java`**:
  - **Tipo**: Filtro Servlet (`Filter`).
  - **Función**: Intercepta todas las peticiones HTTP entrantes *antes* de que lleguen a los controladores. Reemplaza la IP real del cliente con el hash generado por `IpHasher`.
  - **Objetivo**: Anonimizar el tráfico desde la entrada.

---

## 3. Controladores (`controller`)
Capa de exposición de la API REST anónima.

- **`AuthController.java`**:
  - **Ruta Base**: `/api/auth`
  - **Endpoints**:
    - `POST /register`: Registra nuevos usuarios recibiendo su ID y clave pública.

- **`MessageController.java`**:
  - **Ruta Base**: `/api/messages`
  - **Endpoints**:
    - `POST /`: Recibe mensajes cifrados (imágenes esteganográficas) para un destinatario.
    - `GET /`: Recupera los mensajes pendientes para un usuario específico.

---

## 4. Modelos / Entidades (`model`)
Representación de las tablas de la base de datos (JPA Entities).

- **`User.java`**: Representa a un usuario en el sistema (identidad pública). Almacena el hash del ID, la clave pública y el token de notificaciones.
- **`Message.java`**: Representa un mensaje en tránsito (buzón ciego). Contiene el hash del destinatario y el blob de la imagen con el mensaje oculto.
- **`AuthChallenge.java`**: Almacena los retos criptográficos temporales (`nonces`) usados para el login sin contraseña.
- **`BlacklistedToken.java`**: Almacena identificadores de tokens JWT revocados o comprometidos.
- **`RateLimitBucket.java`**: Mantiene el estado de los límites de velocidad (rate limiting) para IPs anonimizadas, previniendo ataques DDoS.

---

## 5. DTOs (Data Transfer Objects) (`dto`)
Objetos para la transferencia de datos entre el cliente y el servidor sin exponer las entidades internas.

- **`RegisterRequest.java`**: Datos necesarios para registrarse (ID, Public Key, Push Token).
- **`UserResponse.java`**: Respuesta tras un registro exitoso o consulta de usuario.
- **`SendMessageRequest.java`**: Estructura para enviar un mensaje (ID Destinatario + Imagen).
- **`ChallengeRequest.java`**: Solicitud para iniciar un login (petición de reto).
- **`ChallengeResponse.java`**: Respuesta con el reto criptográfico (`nonce`) que el cliente debe firmar.

---

## 6. Servicios (`service`)
Lógica de negocio.

- **`UserService.java`**: Gestiona la lógica relacionada con usuarios, como la validación de duplicados durante el registro y la persistencia de nuevos usuarios.

---

## 7. Repositorios (`repository`)
Interfaces para acceso a datos (Spring Data JPA).

- **`UserRepository.java`**: Acceso a tabla `users`.
- **`MessageRepository.java`**: Acceso a tabla `messages` (buzón).
- **`AuthChallengeRepository.java`**: Acceso a tabla de retos.
- **`BlacklistedTokenRepository.java`**: Acceso a lista negra de tokens.
- **`RateLimitBucketRepository.java`**: Acceso a control de rate limits.
