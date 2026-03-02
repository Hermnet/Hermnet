## Protocolo de Autenticación Challenge-Response

<div style="text-align: justify; text-indent: 20px;">


## 1. Mecanismo de Verificación de Identidad

Hermnet implementa un protocolo de autenticación de "Conocimiento Nulo" (Zero-Knowledge Proof) basado en el esquema Desafío-Respuesta (Challenge-Response). Este mecanismo permite al cliente demostrar la posesión de la clave privada asociada a su identidad sin necesidad de transmitir dicha clave ni credenciales estáticas por la red.

El objetivo es establecer sesiones seguras y efímeras mediante la firma digital de *nonces* (números aleatorios de un solo uso) generados por el servidor.

## 2. Política de "Momentos de Autenticación"

Para equilibrar la Seguridad Máxima con una buena Experiencia de Usuario (UX), el sistema disparará el desafío (Challenge) en tres escenarios distintos:

### A. Inicio en Frío (Cold Start)
*   **Situación:** El usuario abre la app después de haberla cerrado completamente o reiniciado el móvil.
*   **Acción:** Se bloquea la interfaz (Splash Screen).
*   **Procedimiento:**
    1.  La app solicita desbloqueo del Búnker Local (Biometría o PIN).
    2.  Si el desbloqueo es correcto, se descifra la identidad en memoria.
    3.  Se inicia el protocolo Challenge-Response con el servidor.
    4.  Si es exitoso, se descarga la bandeja de entrada y se permite el acceso.

### B. Retorno desde Segundo Plano (Warm Start)
*   **Situación:** El usuario minimizó Hermnet para ver otra app (ej. WhatsApp) y vuelve.
*   **Regla de Tiempo (Time-Lock):**
    *   **Menos de 60 segundos:** No se pide re-autenticación. La sesión se mantiene viva para agilidad.
    *   **Más de 60 segundos:** La app considera la sesión "Sucia". Se muestra una pantalla de bloqueo y se obliga a introducir Biometría o PIN para firmar un nuevo desafío y renovar el token.

### C. Renovación de Sesión (Token Rotation)
*   **Mecanismo:** Rotación de tokens JWT.
*   **Funcionamiento:** Para minimizar la ventana de exposición en caso de compromiso del token, el sistema implementa una política de tokens de vida corta (Short-Lived Tokens). El cliente gestiona automáticamente la renovación silenciosa del token firmando un nuevo desafío en segundo plano antes de la expiración, garantizando la continuidad del servicio sin interrumpir al usuario.

## 3. Flujo Lógico Detallado (Narrativa del Protocolo)

El proceso de autenticación funciona como un diálogo de seguridad en tres actos.

### Fase 1: El Saludo y el Reto (Handshake)
Todo empieza cuando el usuario abre la app.
1.  **La App dice:** "Hola Servidor, soy el usuario con ID `HNET-7a2b...`. Quiero entrar."
2.  **El Servidor responde:** "Vale, te reconozco, pero demuéstrame que eres tú. Toma este número aleatorio único (Nonce): `A1B2C3...`. Tienes 10 segundos para firmarlo."
    *   *Nota: El servidor guarda ese número en memoria temporal. Si pasados 10 segundos no recibe respuesta, lo borra.*

### Fase 2: La Prueba de Identidad (Jerarquía de Acceso)
Aquí ocurre la magia criptográfica dentro del móvil. La Clave Privada está cifrada en la base de datos local (`key_store`) y necesitamos "abrirla".

#### Opción A: Biometría (Huella/FaceID)
*   El sistema operativo (Android/iOS) actúa como garante. Si reconoce la huella, entrega la Clave Privada a la app directamente desde el SecureStore.

#### Opción B: PIN de Seguridad (Mecanismo KDF)
1.  El usuario escribe su PIN (ej: `123456`).
2.  **Derivación:** La app usa una función matemática (KDF) para convertir ese PIN en una Clave Efímera.
3.  **Descifrado:** La app intenta usar esa Clave Efímera para descifrar la Clave Privada almacenada.
    *   **Si el PIN es mal:** El descifrado falla (basura digital). Acceso denegado.
    *   **Si el PIN es bien:** Se obtiene la Clave Privada en texto plano solo en la memoria RAM.

#### Acción Final (Firma):
1.  Con la Clave Privada ya disponible en RAM, la app firma el número del servidor (`A1B2C3...`).
2.  **Borrado Seguro:** Inmediatamente después de firmar, la Clave Privada y la Clave del PIN se borran de la memoria RAM.

### Fase 3: Verificación y Entrega de Llaves
1.  **La App envía:** "Aquí tienes la firma `XYZ987...` del número que me diste."
2.  **El Servidor verifica:** Comprueba matemáticamente si la firma coincide con la Clave Pública del usuario.
    *   **Si NO coincide:** "Error. PIN incorrecto o identidad falsa." -> Error 401.
    *   **Si COINCIDE:** "Correcto. Borro el reto usado."
3.  **El Servidor dice:** "Acceso concedido. Toma tu Token JWT, válido por 5 minutos."

## 4. Especificaciones de Seguridad Crítica

### El PIN y las Claves Efímeras
*   **Principio de "Zero-Storage":** El PIN del usuario NUNCA se guarda en el dispositivo ni se envía al servidor.
*   **Clave Efímera:** La clave criptográfica derivada del PIN vive solo unos milisegundos en la memoria RAM. Si un atacante roba el móvil, no puede extraerla porque no existe en el almacenamiento físico.

### El "Nonce" (Número de un solo uso)
Para evitar ataques de repetición (Replay Attack), el Nonce debe:
*   Ser aleatorio y único por intento.
*   Ser invalidado inmediatamente después de su uso.

### Gestión de Tokens (JWT)
*   **Validez:** 5 minutos exactos.
*   **Blacklist:** Si el usuario cierra sesión o se detecta robo, el token se invalida en el servidor instantáneamente.

## 5. Manejo de Errores y "Autodestrucción"

Definimos cómo reacciona el sistema ante fallos de seguridad local:

### A. Fallo de Biometría o PIN Incorrecto
*   La app muestra "Credenciales Incorrectas".
*   No se envía nada al servidor (ahorro de tráfico y seguridad).

### B. Protocolo de Autodestrucción Local
Para proteger la identidad si roban el móvil e intentan adivinar el PIN:
*   **Contador de Fallos:** La app registra internamente los intentos fallidos consecutivos de PIN.
*   **Límite (10 intentos):** Si se alcanza el intento nº 10 fallido:
    *   **Acción:** La app ejecuta un `DROP TABLE key_store` o sobrescribe la clave privada con ceros.
    *   **Resultado:** La identidad se pierde permanentemente en ese dispositivo. El usuario podrá restaurar su cuenta únicamente importando su archivo de respaldo (.hnet) si lo exportó previamente.

### C. Fallo de Red / Reloj Desincronizado
*   Si el reloj del móvil no coincide con el tiempo UTC del servidor, la firma será rechazada. La app avisará: "Ajuste su hora a automática".

</div>
