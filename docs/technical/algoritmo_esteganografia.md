## Algoritmo de Esteganografía LSB

<div style="text-align: justify; text-indent: 20px;">


## 1. Fundamentos Técnicos de la Inyección de Datos

La esteganografía en Hermnet utiliza la técnica de **Least Significant Bit (LSB) Modification** sobre el dominio espacial de imágenes digitales. El algoritmo aprovecha la redundancia perceptiva en los canales de color para incrustar información binaria.

El proceso consiste en alterar el bit menos significativo de los bytes que componen los canales RGB de cada píxel. Dado que esta modificación afecta el valor del color en una magnitud mínima ($\pm 1$ en una escala de 0-255), la alteración resulta estadísticamente y visualmente imperceptible para el ojo humano.

**Integridad de Formato:** El sistema utiliza exclusivamente el formato **PNG (Portable Network Graphics)**. A diferencia de formatos como JPEG, que aplican compresión con pérdida (DCT) y eliminarían la información oculta, PNG ofrece compresión sin pérdida (DEFLATE), garantizando la recuperación exacta del payload binario.

## 2. Estructura del Flujo de Bits (The Stream)

No podemos simplemente inyectar bits al azar. Necesitamos un protocolo para que el receptor sepa qué leer. Antes de inyectar, organizamos los datos en una estructura lineal:

1.  **Cabecera de Tamaño (4 Bytes):** Los primeros 32 píxeles/canales indicarán el tamaño total del mensaje en bytes. Esto permite al receptor saber cuándo detenerse.
2.  **Payload (Variable):** El bloque de datos cifrados (procedente del Doc 05).
3.  **Delimitador de Fin (Sentinel):** Una secuencia única de bits (ej. `1111111111111110`) para confirmar el cierre del mensaje.
4.  **Relleno de Ruido (Padding):** Si la imagen es grande y el mensaje corto, el resto de los píxeles se rellenan con bits aleatorios para que el análisis estadístico del archivo sea uniforme.

## 3. Algoritmo de Inyección (El Emisor)

Este proceso es intensivo en CPU, por lo que debe ejecutarse en un hilo secundario (Background Thread) en React Native para no congelar la interfaz.

**Entrada:** Imagen de Cobertura (PNG) + Mensaje Binario.

**Proceso Lógico:**
1.  **Carga:** Cargamos la imagen en memoria como un Bitmap o matriz de bytes RGBA.
2.  **Aplanado:** Convertimos nuestro mensaje a una cadena de bits (ej. `0101001...`).
3.  **Iteración (El Bucle Principal):**
    *   Recorremos la matriz de píxeles (x, y).
    *   Por cada píxel, iteramos sus canales (R, G, B). Ignoramos el canal Alpha (Transparencia) para evitar artefactos visuales.
4.  **Operación Bitwise:**
    *   Para inyectar un bit `b` en un color `C`:
    *   $$C_{nuevo} = (C_{original} \ \& \ 0xFE) \ | \ b$$
    *   (Esto pone el último bit a 0 y luego le suma nuestro bit).
5.  **Guardado:** El resultado se guarda como un nuevo archivo PNG sin compresión extra.

## 4. Algoritmo de Extracción (El Receptor)

Cuando el usuario recibe una imagen, el proceso es inverso.

1.  **Lectura de Cabecera:**
    *   Leemos los LSB de los primeros 32 canales RGB.
    *   Reconstruimos el entero (Int32) que nos dice: "El mensaje pesa 450 bytes".
2.  **Extracción del Cuerpo:**
    *   Continuamos leyendo bits hasta completar los 450 bytes indicados.
    *   **Operación:** `Bit = Color & 1`.
3.  **Validación:**
    *   Verificamos si los bits siguientes coinciden con el Delimitador de Fin.
    *   Si coinciden, pasamos el bloque de bytes al Motor de Descifrado (Doc 05).

## 5. Normalización de Tráfico (Anti-Análisis)

Para evitar que un espía sepa si enviamos un "Hola" (poco peso) o un libro (mucho peso) mirando el tamaño del archivo:

*   **Tamaño Fijo:** Todas las imágenes generadas tendrán una resolución estándar (ej. 1024x1024).
*   **Relleno (Noise Filling):** Si el mensaje real ocupa el 10% de la imagen, el algoritmo debe continuar recorriendo el 90% restante de los píxeles inyectando bits aleatorios.
*   **Resultado:** Todos los archivos enviados pesarán exactamente lo mismo (ej. 1.5 MB), haciendo imposible distinguir el contenido por su tamaño.

## 6. Control de Errores y Límites

### Escenario: Capacidad Insuficiente
*   **Cálculo:** Una imagen de 1024x1024 píxeles tiene 1.048.576 píxeles.
*   **Canales Usables:** 3 por píxel (RGB) = ~3 millones de bits.
*   **Capacidad Máxima:** ~375 KB de datos puros.
*   **Control:** Antes de inyectar, el algoritmo compara: `Tamaño_Mensaje > Capacidad_Imagen`.
*   **Si excede:** La app debe comprimir el archivo antes de cifrar o dividir el mensaje en varios PNGs (Multi-part message).

### Escenario: Conversión Accidental
*   **Riesgo:** Si Android/iOS intenta optimizar el almacenamiento y convierte el PNG a JPG o HEIC.
*   **Solución:** Forzar la extensión `.png` en el guardado y verificar los "Magic Bytes" del archivo antes de intentar leerlo.

</div>
