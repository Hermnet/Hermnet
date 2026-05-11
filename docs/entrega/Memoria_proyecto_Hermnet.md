# Memoria del Proyecto: Hermnet

**Proyecto:** Hermnet  
**Alumno/s:** [COMPLETAR]  
**Centro:** [COMPLETAR]  
**Ciclo formativo:** [COMPLETAR]  
**Tutor/a:** [COMPLETAR]  
**Curso académico:** [COMPLETAR]  
**Fecha:** [COMPLETAR]  
**Repositorio GitHub:** https://github.com/Hermnet/Hermnet  
**Repositorio web:** https://github.com/Hermnet/Hermnet-Web  

## 1. Introducción

Hermnet es una aplicación móvil de mensajería privada desarrollada como Trabajo de Fin de Grado. El proyecto integra una aplicación móvil para Android e iOS, un backend propio, una base de datos persistente, documentación técnica, manual de usuario y mecanismos de seguridad orientados a proteger la identidad y las conversaciones del usuario.

El objetivo principal del proyecto es crear una alternativa educativa y funcional a las aplicaciones de mensajería tradicionales, dando prioridad a la privacidad, al cifrado de los mensajes y al control local de la identidad. A diferencia de otras aplicaciones que dependen de números de teléfono, cuentas de correo o perfiles centralizados, Hermnet genera una identidad local basada en claves criptográficas. Esta identidad se representa mediante un hash público que puede compartirse por QR o copiarse manualmente.

La aplicación permite añadir contactos, enviar mensajes cifrados, crear grupos, gestionar miembros, proteger el acceso mediante PIN, bloquear capturas de pantalla, exportar e importar conversaciones y usar mecanismos visuales de privacidad como el efecto Matrix. El backend actúa como intermediario de transporte: recibe y entrega paquetes cifrados, pero no puede leer el contenido de los mensajes.

## 2. Contexto

La mensajería instantánea es una de las formas de comunicación digital más utilizadas. Sin embargo, muchas soluciones dependen de servicios centralizados, números de teléfono, cuentas personales o infraestructuras externas. Esto implica que parte de la identidad del usuario queda asociada a datos personales y que los metadatos de comunicación pueden quedar expuestos.

En un contexto donde la privacidad digital y la ciberseguridad son cada vez más relevantes, resulta útil estudiar y desarrollar sistemas donde el usuario mantenga más control sobre su identidad y sus datos. Hermnet se plantea como un proyecto académico que aplica conocimientos de desarrollo móvil, backend, bases de datos, API REST, seguridad, documentación y despliegue.

El proyecto también se relaciona con contenidos vistos durante el ciclo: desarrollo de aplicaciones, consumo de servicios web, diseño de interfaces, persistencia de datos, despliegue con Docker, documentación técnica, control de versiones con Git y seguridad en aplicaciones.

## 3. Problema o necesidad a resolver

Las aplicaciones de mensajería habituales suelen requerir datos personales como número de teléfono, correo electrónico o cuenta centralizada. Además, aunque muchas aplicaciones utilizan cifrado, el usuario no siempre tiene visibilidad clara sobre qué información se almacena, qué metadatos se generan o qué control real tiene sobre su identidad.

Hermnet busca resolver las siguientes necesidades:

- Permitir comunicación entre usuarios sin depender de números de teléfono.
- Generar una identidad local en el dispositivo.
- Añadir contactos mediante QR o hash público.
- Enviar mensajes cifrados antes de que salgan del dispositivo.
- Evitar que el backend pueda leer los mensajes.
- Guardar conversaciones localmente.
- Permitir exportar e importar conversaciones de forma protegida.
- Incorporar medidas de privacidad visual, como bloqueo por PIN, bloqueo de capturas y efecto Matrix.
- Ofrecer grupos con administrador, miembros y permisos básicos.

## 4. Objetivos

### 4.1 Objetivo general

Desarrollar una aplicación móvil de mensajería segura llamada Hermnet, con backend propio, cifrado extremo a extremo, gestión de contactos, grupos, protección local y documentación completa para instalación, despliegue y uso.

### 4.2 Objetivos específicos

- Crear una identidad local para cada usuario.
- Implementar autenticación segura contra el backend.
- Desarrollar un backend REST con Spring Boot.
- Utilizar PostgreSQL como base de datos del backend.
- Usar SQLite para persistencia local en la aplicación móvil.
- Permitir añadir contactos por QR.
- Permitir añadir contactos por hash online.
- Permitir copiar el hash público del usuario.
- Implementar envío y recepción de mensajes cifrados.
- Implementar conversaciones individuales.
- Implementar grupos con administrador.
- Permitir añadir y eliminar miembros de un grupo.
- Permitir activar la opción “solo administradores escriben”.
- Mostrar el nombre público del remitente en grupos.
- Obligar al usuario a configurar un nombre público.
- Permitir añadir descripción a los grupos.
- Implementar protección por PIN al entrar a la app.
- Implementar bloqueo de capturas de pantalla.
- Implementar notificaciones del dispositivo cuando sea posible.
- Implementar exportación e importación de conversaciones.
- Documentar la API con OpenAPI/Swagger.
- Crear documentación técnica y manual de usuario.
- Preparar el proyecto para entrega con repositorio, ZIP y vídeo demostrativo.

## 5. Alcance

El alcance del proyecto incluye:

- Aplicación móvil Android e iOS desarrollada con React Native y Expo.
- Backend desarrollado con Spring Boot.
- Base de datos PostgreSQL ejecutada mediante Docker.
- Entorno Odoo empresarial ejecutado mediante Docker.
- Persistencia local con SQLite.
- Gestión de identidad, contactos, mensajes y grupos.
- Protección local mediante PIN.
- Bloqueo de capturas de pantalla.
- Exportación e importación de respaldo cifrado.
- Documentación OpenAPI.
- Módulo Odoo para gestión de empresas, planes, nodos privados, dispositivos y políticas.
- Manual de usuario y documentación técnica.

Quedan fuera del alcance o se consideran limitaciones:

- Auditoría criptográfica profesional.
- Publicación en App Store o Play Store.
- Alta disponibilidad del backend.
- Sistema de push notifications completo en iOS sin configuración de Apple Developer.
- Sincronización multidispositivo avanzada.
- Panel administrativo web de producción.

## 6. Análisis de requisitos

### 6.1 Requisitos funcionales

- RF01. El usuario puede crear una identidad local.
- RF02. El usuario puede acceder a la aplicación mediante PIN.
- RF03. El usuario debe configurar un nombre público.
- RF04. El usuario puede ver su QR de identidad.
- RF05. El usuario puede copiar su hash público.
- RF06. El usuario puede añadir contactos por QR.
- RF07. El usuario puede añadir contactos por hash online.
- RF08. El usuario puede enviar mensajes.
- RF09. El usuario puede recibir mensajes.
- RF10. El usuario puede ver la lista de chats.
- RF11. El usuario puede buscar contactos.
- RF12. El usuario puede crear grupos.
- RF13. El grupo tiene un administrador.
- RF14. El administrador puede añadir miembros.
- RF15. El administrador puede eliminar miembros.
- RF16. El administrador puede activar que solo escriban administradores.
- RF17. El usuario puede editar la descripción de un grupo si es administrador.
- RF18. En los grupos se muestra el nombre del remitente.
- RF19. El usuario puede eliminar contactos.
- RF20. El usuario puede eliminar grupos.
- RF21. El usuario puede vaciar conversaciones.
- RF22. El usuario puede activar o desactivar el efecto Matrix.
- RF23. La aplicación bloquea capturas de pantalla.
- RF24. El usuario puede exportar un respaldo de conversaciones.
- RF25. El usuario puede importar un respaldo.
- RF26. La aplicación puede mostrar notificaciones cuando el entorno lo permite.
- RF27. El sistema permite gestionar empresas cliente desde Odoo.
- RF28. El sistema permite registrar planes, nodos privados, dispositivos y políticas empresariales en Odoo.

### 6.2 Requisitos no funcionales

- RNF01. Los mensajes deben cifrarse antes de enviarse.
- RNF02. El backend no debe almacenar mensajes en texto claro.
- RNF03. La aplicación debe funcionar en Android e iOS.
- RNF04. La interfaz debe adaptarse a pantallas móviles.
- RNF05. El código debe organizarse en módulos y servicios.
- RNF06. La API debe estar documentada mediante OpenAPI.
- RNF07. El proyecto debe poder instalarse con documentación.
- RNF08. El backend debe poder ejecutarse localmente con Docker.
- RNF09. El proyecto debe estar versionado con Git.
- RNF10. La aplicación debe gestionar errores de conexión.
- RNF11. El sistema debe validar datos de entrada.
- RNF12. El usuario debe recibir mensajes claros ante errores.
- RNF13. El entorno empresarial debe poder ejecutarse con Docker.
- RNF14. La gestión empresarial debe estar separada de la base de datos de mensajería.

## 7. Planificación

El proyecto se ha desarrollado por fases:

1. Análisis de la idea y definición de objetivos.
2. Diseño de arquitectura general.
3. Desarrollo del backend con Spring Boot.
4. Configuración de PostgreSQL con Docker.
5. Desarrollo de la aplicación móvil.
6. Implementación de identidad y autenticación.
7. Implementación de contactos por QR.
8. Implementación de contactos por hash.
9. Implementación del flujo de mensajes cifrados.
10. Implementación de persistencia local.
11. Implementación de grupos.
12. Implementación de seguridad local.
13. Implementación de exportación e importación.
14. Corrección de errores visuales y lógicos.
15. Pruebas.
16. Integración de Odoo para gestión empresarial.
17. Documentación.
18. Preparación de entrega.

Herramientas utilizadas:

- Git y GitHub.
- React Native.
- Expo.
- TypeScript.
- Spring Boot.
- Java 21.
- Maven.
- PostgreSQL.
- Docker.
- SQLite.
- Android Studio.
- Xcode y dispositivo iOS físico cuando ha sido posible.
- Swagger/OpenAPI.
- Odoo 17.

## 8. Desarrollo del proyecto

### 8.1 Frontend móvil

El frontend se ha desarrollado con React Native y Expo. La aplicación utiliza pantallas para login, lista de chats, conversación individual, conversación de grupo, ajustes, perfil, QR y transferencia de datos.

Los principales servicios del frontend son:

- `ApiClient`: centraliza las peticiones al backend.
- `AuthFlowService`: gestiona autenticación y arranque de sesión.
- `DatabaseService`: gestiona SQLite local.
- `ContactsService`: gestiona contactos.
- `MessageFlowService`: gestiona envío y recepción de mensajes.
- `PrefsService`: guarda preferencias.
- `RecoveryService`: exporta e importa respaldos.
- `ScreenPrivacyService`: bloquea capturas de pantalla.
- `DeviceNotificationService`: gestiona notificaciones.

### 8.2 Backend

El backend se ha desarrollado con Spring Boot. Expone una API REST para registrar usuarios, autenticar, enviar mensajes, recibir mensajes y consultar información pública de usuarios. Utiliza PostgreSQL para persistencia y JWT para la autenticación.

Además, se ha añadido documentación OpenAPI para facilitar la revisión de endpoints y modelos.

### 8.3 Base de datos

El sistema utiliza dos niveles de persistencia:

- PostgreSQL en backend, para usuarios, buzón de mensajes cifrados, retos de autenticación, tokens revocados y rate limiting.
- SQLite en la app, para identidad local, contactos, mensajes, grupos, miembros, cola offline y preferencias relacionadas con la mensajería.

### 8.4 Gestión empresarial con Odoo

Se ha añadido un entorno Odoo independiente para representar el uso de Hermnet en empresas que quieran implantar la aplicación en sistemas privados. Esta parte permite gestionar:

- Empresas cliente.
- Planes comerciales.
- Nodos privados de Hermnet.
- Dispositivos autorizados.
- Políticas de seguridad.
- Solicitudes de despliegue, soporte o formación.

Odoo se ejecuta con Docker y utiliza una base de datos PostgreSQL separada de la base de datos principal del backend. De esta forma, la mensajería privada permanece aislada de la información administrativa y comercial.

El módulo personalizado `hermnet_enterprise_connector` incluye datos demo para mostrar en la defensa un escenario empresarial completo.

## 9. Arquitectura general

La arquitectura general es cliente-servidor:

```text
App móvil
 ├─ Identidad local
 ├─ SQLite
 ├─ Cifrado/descifrado
 ├─ Contactos y grupos
 └─ Cliente API
        ↓
Backend Spring Boot
 ├─ API REST
 ├─ Seguridad JWT
 ├─ OpenAPI
 └─ PostgreSQL

Odoo empresarial
 ├─ Empresas cliente
 ├─ Planes y licencias
 ├─ Nodos privados
 ├─ Dispositivos autorizados
 ├─ Políticas de seguridad
 └─ PostgreSQL Odoo
```

La app cifra los mensajes antes de enviarlos. El backend solo almacena paquetes cifrados y los entrega al destinatario. El descifrado se realiza en el dispositivo receptor.

## 10. Seguridad y privacidad

Hermnet incorpora varias medidas de seguridad:

- Identidad local.
- Mensajes cifrados.
- Backend sin acceso al contenido en claro.
- Autenticación mediante JWT.
- Rate limiting en backend.
- Persistencia local controlada.
- PIN obligatorio al entrar.
- Bloqueo de capturas de pantalla.
- Efecto Matrix para ocultar mensajes visualmente.
- Exportación cifrada de conversaciones.
- Validación de entradas.
- Gestión de errores.

Limitaciones:

- No sustituye una auditoría criptográfica profesional.
- En iOS, las notificaciones push requieren configuración de Apple Developer.
- Si un dispositivo está comprometido, puede capturar información antes de que la aplicación la proteja.

## 11. Plan de marketing

### Público objetivo

- Usuarios interesados en privacidad.
- Estudiantes y docentes.
- Personas que quieren probar mensajería sin teléfono.
- Grupos pequeños que requieren comunicación privada.
- Entornos educativos de ciberseguridad y desarrollo.

### Propuesta de valor

Hermnet ofrece una mensajería centrada en privacidad, identidad local, cifrado de mensajes y control del usuario. No se basa en número de teléfono y permite añadir contactos por QR o hash.

### Competencia

- WhatsApp.
- Telegram.
- Signal.
- Session.

### Diferenciación

- Proyecto propio y documentado.
- Identidad basada en hash y QR.
- Backend propio.
- Exportación cifrada.
- Funciones de privacidad visual.
- Grupos con permisos básicos.

### Canales

- GitHub.
- Web del proyecto.
- Vídeo demostrativo.
- Presentación académica.
- Implantación en organizaciones que necesiten comunicaciones privadas.
- Gestión empresarial mediante Odoo para clientes con despliegues privados.

## 12. Plan de sostenibilidad

### Sostenibilidad técnica

El proyecto utiliza tecnologías ampliamente conocidas: React Native, Expo, Spring Boot, PostgreSQL y Docker. La arquitectura modular facilita mantenimiento y ampliación.

### Sostenibilidad económica

El proyecto puede ejecutarse con herramientas gratuitas y de código abierto. El backend puede desplegarse en un VPS económico.

### Sostenibilidad ambiental

Hermnet no requiere infraestructura pesada. El backend es ligero y la base de datos puede ejecutarse en contenedores o servidores de bajo consumo.

### Sostenibilidad social

El proyecto promueve privacidad, control de datos y reducción de dependencia de identificadores personales como el número de teléfono.

## 13. Pruebas realizadas

Se han realizado pruebas automáticas y manuales.

Pruebas automáticas:

```bash
cd frontend
npx tsc --noEmit
npm test -- --runInBand
```

```bash
cd backend
mvn test
```

Resultados obtenidos durante el desarrollo:

- Frontend: 9 suites de test superadas.
- Frontend: 33 tests superados.
- Backend: 137 tests superados.
- TypeScript sin errores.

Pruebas manuales:

- Creación de identidad.
- Entrada con PIN.
- Configuración de nombre público.
- Añadir contacto por QR.
- Añadir contacto por hash.
- Enviar y recibir mensajes.
- Crear grupo.
- Añadir miembros.
- Eliminar miembros.
- Activar “solo administradores escriben”.
- Editar descripción de grupo.
- Exportar backup.
- Importar backup.
- Probar Android Emulator.
- Probar iPhone físico.
- Probar backend con Docker.
- Probar OpenAPI.
- Probar bloqueo de capturas.
- Probar efecto Matrix activado y desactivado.

## 14. Conclusiones

Hermnet cumple el objetivo principal de desarrollar una aplicación de mensajería privada con backend propio, cifrado, identidad local, contactos, grupos y documentación. El proyecto ha permitido aplicar conocimientos de desarrollo móvil, backend, bases de datos, seguridad, documentación, pruebas y despliegue.

Durante el desarrollo se han resuelto problemas reales como configuración de entorno, conexión móvil-backend, gestión de PostgreSQL, integración de módulos nativos, pruebas en Android/iOS y corrección de errores visuales y lógicos.

El resultado es un prototipo funcional, con una base técnica sólida y ampliable.

## 15. Futuras mejoras

- Publicar la app en tiendas oficiales.
- Configurar notificaciones push completas para iOS.
- Realizar auditoría criptográfica.
- Mejorar roles de grupo.
- Añadir invitaciones a grupos.
- Implementar sincronización multidispositivo.
- Desplegar backend en VPS con HTTPS.
- Añadir panel web.
- Mejorar accesibilidad.
- Añadir traducciones.
- Conectar Odoo con el backend mediante API para sincronizar nodos y licencias automáticamente.

## 16. Bibliografía

- Documentación oficial de React Native.
- Documentación oficial de Expo.
- Documentación oficial de Spring Boot.
- Documentación oficial de PostgreSQL.
- Documentación oficial de Docker.
- Documentación oficial de OpenAPI/Swagger.
- Documentación de JWT.
- Repositorio del proyecto: https://github.com/Hermnet/Hermnet

## 17. Anexos

Se adjuntan o referencian:

- Repositorio GitHub.
- ZIP con código fuente.
- Vídeo demostrativo.
- Capturas de pantalla.
- Documentación técnica.
- Manual de usuario.
- Diagramas incluidos en `docs/images`.
