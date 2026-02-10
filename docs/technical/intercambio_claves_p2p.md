## Intercambio de Identidad y Vinculación P2P

<div style="text-align: justify; text-indent: 20px;">


## 1. Modelo de Confianza Descentralizado

Hermnet opera sin un directorio central de usuarios para preservar el anonimato de la red (Network Anonymity). La vinculación entre usuarios se realiza estrictamente **Peer-to-Peer (P2P)** y de forma explícita.

El sistema proporciona mecanismos para intercambiar Claves Públicas fuera de banda (Out-of-Band), asegurando que la red de contactos de cada usuario se construya únicamente mediante interacciones verificadas.
Los vectores de intercambio soportados son:
*   **Intercambio Óptico:** Mediante códigos QR para interacciones presenciales.
*   **Deep Linking:** Mediante URIs personalizados para intercambio seguro a través de canales secundarios.

## 2. Política de Seguridad en el Intercambio

**¿Es seguro compartir esto por WhatsApp? SÍ.**

Lo que se comparte es la Clave Pública. Como su nombre indica, es pública.

*   **Riesgo de Intercepción:** Nulo. Si un hacker intercepta la invitación, solo obtiene la capacidad de enviarte mensajes cifrados, pero jamás podrá leer tus mensajes anteriores ni futuros, ya que no tiene la Clave Privada (que nunca sale de tu móvil).
*   **Validación:** El sistema confía en el canal de transporte. Si tu amigo te lo envía por WhatsApp, asumimos que es él.

## 3. Lógica del Payload (El "Pasaporte")

Tanto el QR como el Enlace comparten la misma estructura de datos interna.

**Estructura Base (JSON):**
```json
{
  "h": "HNET-7a2b-91zM",   // [Hash ID] Tu dirección en la red.
  "pk": "MCowBQYDK...",    // [Public Key] Tu candado abierto.
  "n": "Álvaro"            // [Alias] Tu nombre visible (opcional).
}
```

## 4. Desarrollo Detallado del Algoritmo

### Fase A: Exportar Identidad (Generar)
El usuario tiene dos botones: "Mostrar QR" y "Copiar Enlace".

#### Opción 1: Generar QR (Visual)
*   La app toma el JSON, lo convierte a String y genera una imagen QR en pantalla.

#### Opción 2: Generar Deep Link (Texto)
*   La app toma el JSON y lo codifica en Base64 (para evitar problemas con caracteres especiales).
*   Construye una URL con un esquema personalizado:
    *   `hermnet://invite?data=eyJoIjoiSE5FVC...` (La ristra de letras es el JSON en Base64).
*   **Acción:** Copia esta URL al portapapeles del sistema operativo.
*   **Resultado:** El usuario pega esto en WhatsApp: "¡Agrégame a Hermnet! hermnet://invite?data=...".

### Fase B: Importar Identidad (Recibir)

#### Vía 1: Escáner de Cámara
*   El usuario abre la cámara de Hermnet $\rightarrow$ Escanea el QR $\rightarrow$ Se añade el contacto.

#### Vía 2: Detección de Enlace (Deep Linking)
*   El usuario recibe el enlace por WhatsApp y lo toca.
*   El sistema operativo (Android/iOS) reconoce el prefijo `hermnet://` y abre la app automáticamente.
*   **Lógica de Recepción:**
    1.  La app se despierta y recibe el parámetro `data` de la URL.
    2.  Decodifica Base64 $\rightarrow$ Obtiene JSON.
    3.  Muestra un modal: "¿Quieres añadir a Álvaro (HNET-7a...)? ".
    4.  Si el usuario acepta, se guarda en la base de datos local.

## 5. Control de Escenarios y Posibilidades (Edge Cases)

Como desarrolladores, debemos controlar qué pasa si el enlace se rompe o se manipula.

### Escenario 1: Enlace Cortado o Dañado
*   **Situación:** Al copiar y pegar en apps de mensajería antiguas, a veces se cortan los enlaces muy largos.
*   **Fallo:** La decodificación Base64 fallará (Error de formato).
*   **Control:** Capturar la excepción (`try-catch`). Mostrar alerta: "El código de invitación está incompleto. Pídelo de nuevo."

### Escenario 2: Intento de "Phishing" de Identidad
*   **Situación:** Un atacante te envía su propia clave pública haciéndose pasar por tu amigo "Juan".
*   **Realidad:** Hermnet no puede saber quién es el dueño real de una clave (es anónimo).
*   **Control (TOFU - Trust On First Use):** La seguridad depende del canal. Si el enlace te llega desde el WhatsApp real de Juan, el sistema asume que es auténtico.
*   **Mejora Visual:** Al añadir el contacto, mostramos una "Huella de Seguridad" (los primeros 4 y últimos 4 caracteres del Hash) para que el usuario pueda confirmar visualmente con su amigo si lo desea.

### Escenario 3: Añadirse a uno mismo
*   **Situación:** Te envías el enlace a ti mismo para probar.
*   **Control:** El código compara el `h` (Hash) recibido con el `h` del usuario actual. Si son iguales $\rightarrow$ Error: "No puedes añadirte a ti mismo".

## 6. Resumen del Flujo de Datos

Para el equipo de desarrollo, la función de "Añadir Amigo" es única, independientemente de si viene por cámara o por enlace:

*   **Entrada:** String codificado.
*   **Proceso:**
    1.  Limpiar prefijos (`hermnet://`).
    2.  Parsear a Objeto JSON.
    3.  Validar campos obligatorios (`h`, `pk`).
    4.  Persistencia: `INSERT OR UPDATE INTO contacts_vault`.
    5.  Salida UI: Confirmación "Contacto Guardado".

</div>
