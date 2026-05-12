# Plan de Empresa: Hermnet

**Proyecto:** Hermnet  
**Actividad:** Mensajería privada para empresas y profesionales  
**Producto principal:** Aplicación móvil de mensajería cifrada con backend privado y gestión empresarial mediante Odoo  
**Web del proyecto:** https://hermnet.github.io/Hermnet-Web/  
**Repositorio:** https://github.com/Hermnet/Hermnet  

## Índice

- [1. Resumen ejecutivo](#1-resumen-ejecutivo)
- [2. Idea de negocio](#2-idea-de-negocio)
- [3. Propuesta de valor](#3-propuesta-de-valor)
- [4. Público objetivo](#4-público-objetivo)
- [5. Problema que resuelve](#5-problema-que-resuelve)
- [6. Solución ofrecida](#6-solución-ofrecida)
- [7. Productos y servicios](#7-productos-y-servicios)
- [8. Modelo de negocio](#8-modelo-de-negocio)
- [9. Análisis de mercado](#9-análisis-de-mercado)
- [10. Competencia](#10-competencia)
- [11. Plan de marketing](#11-plan-de-marketing)
- [12. Plan operativo](#12-plan-operativo)
- [13. Recursos necesarios](#13-recursos-necesarios)
- [14. Plan económico-financiero](#14-plan-económico-financiero)
- [15. Plan de sostenibilidad](#15-plan-de-sostenibilidad)
- [16. Riesgos y medidas de mitigación](#16-riesgos-y-medidas-de-mitigación)
- [17. Indicadores de seguimiento](#17-indicadores-de-seguimiento)
- [18. Conclusión](#18-conclusión)

## 1. Resumen ejecutivo

Hermnet es una solución de mensajería privada orientada a empresas y profesionales que necesitan comunicarse de forma controlada, segura y sin depender de plataformas externas de consumo masivo. La propuesta consiste en ofrecer una aplicación móvil para Android e iOS, un backend propio desplegable en infraestructura privada y una capa de gestión empresarial mediante Odoo.

El producto está pensado para organizaciones que manejan información sensible: empresas de comunicación, despachos de abogados, asesorías, consultoras, equipos directivos, departamentos internos, empresas tecnológicas y cualquier entidad que quiera un sistema de mensajería privado bajo su propio control.

La principal diferencia frente a una app de mensajería convencional es que Hermnet no basa la identidad en teléfono o correo electrónico. Cada usuario genera una identidad criptográfica local y los mensajes se cifran antes de salir del dispositivo. El servidor actúa como intermediario de transporte, pero no puede leer el contenido.

## 2. Idea de negocio

La idea empresarial es comercializar Hermnet como una solución privada de comunicación para organizaciones. En lugar de ofrecer únicamente una app pública para usuarios finales, Hermnet se plantea como un producto B2B que puede instalarse, configurarse y mantenerse para clientes que necesitan soberanía sobre sus comunicaciones.

La empresa cliente podría contratar Hermnet para:

- Disponer de una mensajería interna separada de WhatsApp, Telegram u otras plataformas comerciales.
- Alojar el backend en un servidor propio, VPS privado o infraestructura contratada.
- Gestionar usuarios, dispositivos, políticas y solicitudes desde Odoo.
- Tener una solución adaptada a su marca y a sus necesidades operativas.
- Reducir la exposición de conversaciones sensibles en plataformas no controladas por la organización.

## 3. Propuesta de valor

Hermnet ofrece privacidad, control y despliegue privado para comunicaciones empresariales.

La propuesta de valor se resume en cinco puntos:

- **Privacidad por diseño:** los mensajes se cifran extremo a extremo antes de salir del móvil.
- **Servidor ciego:** el backend transporta mensajes cifrados, pero no puede leerlos.
- **Identidad sin teléfono:** el usuario se identifica mediante claves y hash público.
- **Control empresarial:** Odoo permite gestionar clientes, planes, nodos, dispositivos y políticas.
- **Despliegue flexible:** el sistema puede ejecutarse en infraestructura propia o en VPS dedicado.

## 4. Público objetivo

Hermnet se dirige principalmente a empresas y profesionales con necesidades de confidencialidad.

### 4.1 Empresas de comunicación

Medios, agencias, productoras y departamentos de comunicación que trabajan con información sensible, fuentes, campañas, notas internas o material previo a publicación.

Necesidades principales:

- Comunicación interna privada.
- Control de acceso por equipo.
- Separación entre conversaciones personales y profesionales.
- Protección frente a filtraciones.

### 4.2 Despachos de abogados

Abogados, asesorías jurídicas, procuradores y consultorías legales que gestionan información confidencial de clientes, expedientes y comunicaciones internas.

Necesidades principales:

- Comunicación protegida entre miembros del despacho.
- Canal privado para asuntos sensibles.
- Menor dependencia de herramientas personales.
- Posibilidad de alojar el backend en entorno controlado.

### 4.3 Empresas con datos sensibles

Empresas tecnológicas, financieras, sanitarias, consultoras, departamentos de recursos humanos y equipos directivos.

Necesidades principales:

- Mensajería interna privada.
- Gestión de dispositivos autorizados.
- Políticas de seguridad internas.
- Control de infraestructura y datos.

### 4.4 Organizaciones pequeñas y medianas

Pymes que no tienen recursos para desarrollar una solución propia, pero necesitan una herramienta privada y documentada.

Necesidades principales:

- Instalación sencilla.
- Coste asumible.
- Soporte técnico.
- Formación inicial.

## 5. Problema que resuelve

Muchas organizaciones usan aplicaciones generalistas para comunicaciones profesionales. Esto genera varios problemas:

- Uso de números personales para asuntos laborales.
- Falta de control sobre la infraestructura.
- Dependencia de terceros.
- Mezcla de comunicaciones personales y profesionales.
- Riesgo de exposición de conversaciones sensibles.
- Dificultad para aplicar políticas internas de seguridad.
- Ausencia de una gestión empresarial propia sobre usuarios, dispositivos y nodos.

Hermnet resuelve este problema ofreciendo un canal de comunicación privado, desplegable y gestionable por la propia empresa.

## 6. Solución ofrecida

La solución se compone de cuatro partes:

| Componente | Función |
|---|---|
| App móvil | Permite a los usuarios comunicarse, añadir contactos, crear grupos y proteger el acceso con PIN |
| Backend Spring Boot | Transporta mensajes cifrados, autentica usuarios y gestiona buzones temporales |
| Base de datos PostgreSQL | Guarda usuarios, buzones cifrados, tokens y datos técnicos del backend |
| Odoo empresarial | Gestiona clientes, planes, nodos privados, dispositivos, políticas y despliegues |

La empresa puede contratar la solución como instalación privada. Hermnet se encargaría de preparar el entorno, configurar servidores, formar a usuarios y mantener el sistema.

## 7. Productos y servicios

### 7.1 Licencia de uso

Acceso a la aplicación Hermnet y al backend privado para una empresa cliente.

### 7.2 Instalación y despliegue

Servicio técnico para instalar:

- Backend.
- Base de datos.
- Odoo.
- Configuración del servidor.
- Variables de entorno.
- Certificados HTTPS.
- Dominio o subdominio privado.

### 7.3 Personalización

Adaptación a cada empresa:

- Logo.
- Colores.
- Nombre del entorno.
- Políticas de seguridad.
- Configuración de usuarios y dispositivos.

### 7.4 Mantenimiento

Servicio recurrente para:

- Actualizaciones.
- Copias de seguridad.
- Revisión de logs.
- Soporte técnico.
- Corrección de errores.
- Mejoras funcionales.

### 7.5 Formación

Sesiones para administradores y usuarios finales:

- Uso de la app.
- Gestión de identidad.
- Añadir contactos.
- Crear grupos.
- Exportar e importar conversaciones.
- Buenas prácticas de seguridad.

## 8. Modelo de negocio

Hermnet puede monetizarse mediante un modelo mixto:

| Línea de ingresos | Descripción |
|---|---|
| Alta inicial | Pago único por instalación, configuración y puesta en marcha |
| Suscripción mensual | Mantenimiento, soporte y actualizaciones |
| Personalización | Adaptaciones visuales o funcionales específicas |
| Formación | Sesiones para administradores y usuarios |
| Despliegue avanzado | Instalación en VPS, servidor dedicado o infraestructura del cliente |

### 8.1 Propuesta de planes

| Plan | Cliente objetivo | Incluye |
|---|---|---|
| Starter | Pequeñas empresas | Backend privado, app estándar, soporte básico |
| Professional | Despachos y pymes | Personalización, Odoo, soporte prioritario |
| Enterprise | Empresas con mayores requisitos | Nodo dedicado, políticas avanzadas, formación y mantenimiento ampliado |

### 8.2 Precios orientativos

| Concepto | Precio estimado |
|---|---:|
| Instalación inicial Starter | 600 EUR |
| Instalación inicial Professional | 1.200 EUR |
| Instalación inicial Enterprise | Desde 2.500 EUR |
| Mantenimiento mensual Starter | 99 EUR/mes |
| Mantenimiento mensual Professional | 249 EUR/mes |
| Mantenimiento mensual Enterprise | Desde 499 EUR/mes |
| Formación por sesión | 150 EUR |
| Personalización de marca | Desde 300 EUR |

Estos precios son orientativos y dependerían del tamaño del cliente, número de usuarios, infraestructura y nivel de soporte.

## 9. Análisis de mercado

El mercado de herramientas de comunicación empresarial está consolidado, pero existe una necesidad creciente de privacidad, soberanía tecnológica y separación entre canales personales y profesionales.

Factores que favorecen la oportunidad:

- Mayor preocupación por la privacidad digital.
- Aumento del teletrabajo y equipos distribuidos.
- Necesidad de canales internos seguros.
- Interés de pymes por soluciones privadas sin desarrollar software propio.
- Importancia de cumplir buenas prácticas de protección de datos.

Hermnet no compite directamente como red social o app masiva. Su enfoque es más específico: comunicación privada empresarial, control de infraestructura y despliegue adaptado.

## 10. Competencia

| Solución | Ventajas | Limitaciones frente a Hermnet |
|---|---|---|
| WhatsApp Business | Muy conocida y fácil de usar | Depende de teléfono, plataforma externa y uso generalista |
| Telegram | Funcionalidades completas | No está orientada a despliegue privado empresarial estándar |
| Signal | Privacidad fuerte | Enfoque de usuario final, no gestión empresarial privada con Odoo |
| Slack | Muy usado en empresas | No es mensajería E2EE privada por defecto y depende de SaaS externo |
| Microsoft Teams | Integración empresarial | Complejidad, dependencia de Microsoft y enfoque más amplio que mensajería privada |
| Matrix/Element | Federación y código abierto | Mayor complejidad técnica para clientes pequeños |

La ventaja competitiva de Hermnet es ofrecer una solución más simple, centrada en mensajería privada, con despliegue propio y una gestión empresarial clara mediante Odoo.

## 11. Plan de marketing

### 11.1 Posicionamiento

Hermnet se posiciona como:

> Una solución de mensajería privada para empresas que necesitan controlar sus comunicaciones sin depender de plataformas personales o externas.

### 11.2 Mensaje principal

Mensajes clave:

- “Comunicación privada para equipos que manejan información sensible.”
- “Tu empresa controla el servidor; Hermnet protege los mensajes.”
- “Mensajería interna sin teléfonos personales.”
- “Backend privado, app móvil y gestión empresarial con Odoo.”

### 11.3 Canales de captación

| Canal | Uso |
|---|---|
| Web oficial | Presentar producto, ventajas, capturas y contacto |
| GitHub | Demostrar transparencia técnica y calidad del proyecto |
| LinkedIn | Captación de empresas, abogados y perfiles profesionales |
| Email comercial | Contacto directo con despachos y pymes |
| Demostraciones | Vídeos y reuniones para enseñar el producto |
| Networking local | Contacto con empresas cercanas, asesorías y centros de negocio |

### 11.4 Estrategia comercial

La estrategia inicial se basaría en ventas consultivas:

1. Identificar empresas con necesidad de comunicación privada.
2. Mostrar una demo funcional de la app.
3. Explicar el despliegue privado.
4. Ofrecer una prueba piloto limitada.
5. Instalar el entorno en servidor de pruebas.
6. Convertir el piloto en contrato de mantenimiento.

### 11.5 Acciones iniciales

- Publicar la web del proyecto con llamada clara a empresas.
- Preparar un vídeo demo de 3 a 5 minutos.
- Crear una presentación comercial corta.
- Contactar con despachos de abogados locales.
- Contactar con agencias de comunicación.
- Ofrecer una prueba piloto a una empresa pequeña.
- Documentar un caso de uso empresarial.

## 12. Plan operativo

### 12.1 Flujo de implantación

1. Reunión inicial con el cliente.
2. Análisis de necesidades.
3. Elección del plan.
4. Preparación de servidor o VPS.
5. Instalación de backend, PostgreSQL y Odoo.
6. Configuración de dominio, HTTPS y variables.
7. Configuración de la app.
8. Alta de usuarios piloto.
9. Formación inicial.
10. Periodo de pruebas.
11. Puesta en producción.
12. Mantenimiento mensual.

### 12.2 Soporte

El soporte se organizaría por niveles:

| Nivel | Descripción |
|---|---|
| Básico | Resolución de dudas de uso y errores comunes |
| Técnico | Revisión de backend, logs, despliegue y base de datos |
| Evolutivo | Nuevas funcionalidades o personalizaciones |

## 13. Recursos necesarios

### 13.1 Recursos humanos

- Desarrollador móvil.
- Desarrollador backend.
- Técnico de despliegue.
- Responsable de soporte.
- Responsable comercial.

En una fase inicial, varias funciones pueden ser asumidas por el mismo equipo fundador.

### 13.2 Recursos técnicos

- Repositorio GitHub.
- Servidor VPS o infraestructura del cliente.
- Docker.
- PostgreSQL.
- Odoo.
- Dominio y certificado HTTPS.
- Herramientas de monitorización.
- Dispositivos Android e iOS para pruebas.

### 13.3 Recursos documentales

- Memoria del proyecto.
- Documentación técnica.
- Manual de usuario.
- Guía de instalación.
- Guía de despliegue.
- Contrato de servicio.
- Política de soporte.

## 14. Plan económico-financiero

### 14.1 Costes iniciales estimados

| Concepto | Coste estimado |
|---|---:|
| Dominio y web | 20-50 EUR/año |
| VPS demo | 10-30 EUR/mes |
| Dispositivos de prueba | Variable |
| Herramientas de diseño y documentación | 0-50 EUR/mes |
| Certificados HTTPS | 0 EUR si se usa Let's Encrypt |
| Marketing inicial | 100-300 EUR |

### 14.2 Costes recurrentes

| Concepto | Coste estimado |
|---|---:|
| Servidor demo | 10-30 EUR/mes |
| Copias de seguridad | 5-20 EUR/mes |
| Monitorización | 0-30 EUR/mes |
| Soporte y mantenimiento | Coste de tiempo del equipo |

### 14.3 Previsión simple de ingresos

| Escenario | Clientes | Ingreso mensual medio | Ingreso mensual total |
|---|---:|---:|---:|
| Conservador | 3 | 99 EUR | 297 EUR |
| Intermedio | 8 | 249 EUR | 1.992 EUR |
| Optimista | 15 | 349 EUR | 5.235 EUR |

Además del ingreso mensual, cada cliente podría generar un pago inicial de instalación.

### 14.4 Punto de equilibrio

En una fase inicial con costes bajos, el punto de equilibrio podría alcanzarse con pocos clientes de mantenimiento. Por ejemplo, si los costes mensuales fueran aproximadamente 300 EUR, bastaría con:

- 4 clientes Starter a 99 EUR/mes.
- 2 clientes Professional a 249 EUR/mes.
- 1 cliente Enterprise con mantenimiento superior a 499 EUR/mes.

## 15. Plan de sostenibilidad

### 15.1 Sostenibilidad económica

El modelo de suscripción permite ingresos recurrentes y facilita mantener el producto a largo plazo. La instalación inicial cubre el trabajo de puesta en marcha, mientras que el mantenimiento mensual financia soporte, actualizaciones y mejoras.

### 15.2 Sostenibilidad técnica

Para mantener el proyecto viable se propone:

- Usar Docker para facilitar despliegues reproducibles.
- Mantener tests automatizados.
- Documentar instalación y operación.
- Evitar dependencias innecesarias.
- Separar backend, app móvil y Odoo.
- Mantener backups y procedimientos de recuperación.

### 15.3 Sostenibilidad ambiental

Hermnet puede desplegarse en servidores ajustados al tamaño real del cliente, evitando infraestructura sobredimensionada. El uso de VPS eficientes y la posibilidad de compartir recursos en clientes pequeños reduce consumo y coste.

### 15.4 Sostenibilidad social

El proyecto favorece la privacidad digital y ayuda a empresas pequeñas a disponer de herramientas de comunicación más controladas. También reduce la necesidad de usar teléfonos personales para comunicaciones profesionales sensibles.

## 16. Riesgos y medidas de mitigación

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Dificultad para competir con apps conocidas | Alto | Enfocar el producto en privacidad, despliegue privado y nichos concretos |
| Complejidad de instalación | Medio | Automatizar con Docker y documentar pasos |
| Falta de confianza inicial | Alto | Mostrar demo, documentación, código y pruebas |
| Incidencias de seguridad | Alto | Revisar código, usar buenas prácticas y plantear auditorías futuras |
| Dependencia de plataformas móviles | Medio | Mantener compatibilidad Android/iOS y probar en dispositivos reales |
| Coste de soporte | Medio | Crear manuales claros y procesos repetibles |

## 17. Indicadores de seguimiento

Para medir el avance del negocio se usarían los siguientes indicadores:

- Número de empresas contactadas.
- Número de demos realizadas.
- Número de pruebas piloto activas.
- Conversión de pilotos a clientes.
- Ingresos mensuales recurrentes.
- Tiempo medio de instalación.
- Número de incidencias por cliente.
- Tiempo medio de resolución.
- Satisfacción del cliente.
- Retención mensual.

## 18. Conclusión

Hermnet tiene potencial como producto empresarial porque combina una necesidad clara, privacidad en comunicaciones, despliegue privado y gestión mediante Odoo. Su valor no está en competir como app masiva de mensajería, sino en ofrecer a empresas y profesionales un canal controlado para comunicaciones sensibles.

El proyecto puede evolucionar desde un Trabajo de Fin de Grado hacia una solución B2B vendible a despachos de abogados, empresas de comunicación, consultoras, pymes y organizaciones que necesiten independencia, control y seguridad en su mensajería interna.
