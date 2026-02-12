<p align="center">
  <img src="./docs/images/logo.png" alt="Hermnet Logo" width="500" style="filter: drop-shadow(0 0 0.5px white);"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
</p> 

<h3 align="center"><em>Privacidad por Diseño y Esteganografía Avanzada</em></h3>

<p align="center">  
  <a href="./docs/anteproyecto.md"><strong>[Leer el Anteproyecto Completo]</strong></a>
</p>

<h3 align="center">Índice</h3>


| Módulo | Descripción Técnica |
| :--- | :--- |
| **[Especificación Detallada](./docs/technical/descripcion_detallada.md)** | **Documento Maestro:** Especificación técnica completa del sistema. |
| **[Generación de Identidad](./docs/technical/generacion_identidad.md)** | Generación de claves Ed25519 y protección del almacén local. |
| **[Protocolo de Autenticación](./docs/technical/protocolo_autenticacion.md)** | Protocolo Challenge-Response Zero-Knowledge. |
| **[Intercambio de Claves P2P](./docs/technical/intercambio_claves_p2p.md)** | Vinculación segura mediante códigos QR y Deep Links. |
| **[Esquema de Base de Datos](./docs/technical/esquema_base_datos.md)** | Estructura relacional del servidor y persistencia efímera. |
| **[Cifrado Híbrido (E2EE)](./docs/technical/cifrado_hibrido_e2ee.md)** | Motor criptográfico híbrido (AES-256 + ECC). |
| **[Algoritmo de Esteganografía](./docs/technical/algoritmo_esteganografia.md)** | Algoritmo LSB para inyección invisible de datos en PNGs. |
| **[Arquitectura Backend API](./docs/technical/arquitectura_backend_api.md)** | Especificación de la API REST y políticas de privacidad. |

<div style="text-align: justify; text-indent: 20px;">

**Hermnet** es una aplicación de mensajería instantánea desarrollada con un enfoque prioritario en la seguridad y la privacidad del usuario. A diferencia de las plataformas convencionales, Hermnet implementa una arquitectura de "Conocimiento Cero" y utiliza técnicas de esteganografía para ocultar la existencia misma de los mensajes.

### Origen del Nombre

El nombre **Hermnet** surge de la combinación de dos conceptos clave que definen la identidad del proyecto:

* **Herm**: Deriva de **Hermes**, el dios de la mitología griega, conocido como el mensajero de los dioses. También hace referencia al término **Hermético**, simbolizando un sistema cerrado, seguro e impenetrable.
* **Net**: Abreviatura de **Network** (Red), en referencia a la infraestructura sobre la cual se construye el sistema.

En conjunto, **Hermnet** representa una red de mensajería protegida, diseñada para asegurar que la comunicación fluya de manera eficiente y segura, resguardando la integridad de los datos en todo momento.

### Filosofía y Tecnología

La premisa fundamental de Hermnet es que la privacidad no debe depender de la confianza en un tercero, sino de la solidez matemática y tecnológica.

1. **Esteganografía**: Los mensajes cifrados se incrustan dentro de archivos de imagen, haciéndolos imperceptibles para análisis de tráfico convencionales.
2. **Identidad Soberana**: El sistema no requiere datos personales (teléfono o correo). La identidad se basa exclusivamente en pares de claves criptográficas generadas en el dispositivo del usuario.
3. **Arquitectura "Zero Knowledge"**: El servidor actúa únicamente como un canal de transmisión ciego. No almacena historiales de chat, listas de contactos ni claves privadas.

### Objetivo del Proyecto

El objetivo principal es proporcionar una herramienta robusta y accesible para usuarios que requieren un nivel elevado de confidencialidad, como periodistas, activistas o profesionales de la seguridad. Hermnet busca democratizar el acceso a tecnologías de privacidad avanzada, garantizando la confidencialidad, integridad y autenticidad de las comunicaciones en un entorno digital cada vez más vigilado.

</div>

---

<p align="center">
  <strong>Desarrollado por:</strong><br>
  <a href="https://github.com/franciscorodalf">@franciscorodalf</a>  •  <a href="https://github.com/alvarogrlp">@alvarogrlp</a>
</p>
