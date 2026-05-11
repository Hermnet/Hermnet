# Manual de Usuario: Hermnet

**Proyecto:** Hermnet  
**Versión:** 1.0  
**Fecha:** [COMPLETAR]  
**Autor/es:** [COMPLETAR]  

## 1. Qué es Hermnet

Hermnet es una aplicación móvil de mensajería privada. Permite comunicarse con otros usuarios mediante una identidad propia, sin depender de un número de teléfono. Los contactos pueden añadirse por QR o por hash, y los mensajes se cifran antes de enviarse.

La aplicación incluye chats individuales, grupos, protección por PIN, bloqueo de capturas, efecto Matrix, notificaciones y exportación/importación de conversaciones.

## 2. Requisitos para usar la aplicación

Para usar Hermnet se necesita:

- Tener la aplicación instalada.
- Tener conexión de red para enviar y recibir mensajes.
- Crear una identidad local.
- Configurar un PIN.
- Configurar un nombre público.
- Añadir contactos por QR o hash.

## 3. Primer inicio

Al abrir Hermnet por primera vez:

1. La aplicación crea o carga una identidad local.
2. El usuario configura un PIN.
3. La aplicación solicita un nombre público obligatorio.
4. Tras guardar el nombre, se accede a la pantalla principal de chats.

El nombre público es importante porque se muestra en grupos para que otros usuarios puedan reconocer al remitente.

## 4. Pantalla principal

La pantalla principal muestra:

- Buscador de contactos.
- Lista de chats.
- Indicador de conexión.
- Botón de ajustes.
- Botón flotante para acciones rápidas.

Cada chat puede mostrar:

- Nombre del contacto o grupo.
- Último mensaje.
- Hora del último mensaje.
- Indicador de no leídos.
- Iconos de grupo, fijado o silenciado.

## 5. Añadir contacto por QR

Para añadir un contacto por QR:

1. Pulsar el botón flotante.
2. Seleccionar “Escanear QR”.
3. Apuntar la cámara al QR del otro usuario.
4. Escribir un alias opcional para reconocerlo.
5. Guardar.
6. El contacto aparecerá en la lista de chats.

## 6. Mostrar mi QR

Para que otro usuario te añada:

1. Pulsar el botón flotante.
2. Seleccionar “Enseñar QR”.
3. Mostrar el QR al otro usuario.
4. El otro usuario lo escanea desde su aplicación.

## 7. Añadir contacto por hash

Para añadir un contacto por hash:

1. Pulsar el botón flotante.
2. Seleccionar “Añadir hash”.
3. Escribir o pegar el hash del usuario.
4. Escribir un alias opcional.
5. Guardar.

El contacto se añadirá si existe y el backend puede recuperar su identidad pública.

## 8. Enviar mensajes

Para enviar un mensaje:

1. Abrir un chat.
2. Escribir el mensaje en la caja inferior.
3. Usar emojis si se desea.
4. Pulsar el botón de enviar.

El mensaje se cifra antes de enviarse. El servidor no puede leer su contenido.

## 9. Recibir mensajes

Los mensajes nuevos aparecen en la conversación correspondiente. Si el usuario está en la lista de chats, puede ver el último mensaje, la hora y el indicador de mensajes no leídos.

Si no hay conexión al servidor, la aplicación mostrará un aviso.

## 10. Efecto Matrix

El efecto Matrix oculta visualmente los mensajes con caracteres aleatorios. Sirve como medida de privacidad visual.

Cuando está activado:

- Los mensajes pueden aparecer ocultos hasta que se revelan.
- Los previews de la lista de chats también pueden ocultarse.

Cuando está desactivado:

- Los mensajes se muestran normalmente.
- Los previews de la lista de chats se muestran en texto normal.

Para cambiarlo:

1. Entrar en Ajustes.
2. Entrar en Seguridad o Privacidad.
3. Activar o desactivar “Efecto Matrix”.

## 11. Grupos

### 11.1 Crear un grupo

1. Pulsar el botón flotante.
2. Seleccionar “Nuevo grupo”.
3. Escribir el nombre del grupo.
4. Seleccionar miembros.
5. Confirmar creación.

El creador del grupo será el administrador.

### 11.2 Gestionar grupo

Dentro de un grupo:

1. Pulsar el menú de opciones.
2. Seleccionar “Gestionar grupo”.

Desde esta pantalla se puede:

- Ver miembros.
- Añadir gente.
- Eliminar miembros.
- Editar descripción.
- Activar o desactivar “solo administradores escriben”.

### 11.3 Solo administradores escriben

Si esta opción está activada, solo el administrador puede enviar mensajes al grupo. Los demás usuarios pueden leer, pero no escribir.

### 11.4 Nombre del remitente

En los grupos, cada mensaje muestra el nombre público del usuario que lo envió. Por eso Hermnet obliga a configurar un nombre público al entrar por primera vez.

## 12. Perfil público

Para cambiar el nombre público:

1. Entrar en Ajustes.
2. Entrar en Perfil.
3. Editar el campo “Nombre público”.
4. Guardar.

El nombre público no puede estar vacío.

## 13. Seguridad local

Hermnet incluye:

- PIN obligatorio.
- Bloqueo al entrar en la app.
- Bloqueo de capturas de pantalla.
- Efecto Matrix opcional.
- Exportación protegida por contraseña.

Estas medidas ayudan a proteger la información del usuario en el dispositivo.

## 14. Exportar conversaciones

Para exportar un respaldo:

1. Entrar en Ajustes.
2. Entrar en Transferencia o Backup.
3. Seleccionar “Exportar”.
4. Introducir una contraseña.
5. Guardar o compartir el archivo `.hnet`.

Importante: la contraseña es necesaria para restaurar el archivo. Si se pierde, no se podrá importar el respaldo.

## 15. Importar conversaciones

Para importar un respaldo:

1. Entrar en Ajustes.
2. Entrar en Transferencia o Backup.
3. Seleccionar “Importar”.
4. Elegir el archivo `.hnet`.
5. Introducir la contraseña.
6. Esperar a que finalice la restauración.

La importación puede restaurar identidad, contactos, grupos y mensajes.

## 16. Notificaciones

Hermnet puede mostrar notificaciones de mensajes. En Android, se recomienda usar una development build. En iOS, las notificaciones push requieren configuración adicional en Apple Developer.

Si las notificaciones no están configuradas, la mensajería seguirá funcionando.

## 17. Eliminar contacto

Para eliminar un contacto:

1. Abrir el chat.
2. Abrir el menú de opciones.
3. Seleccionar “Eliminar contacto”.
4. Confirmar.

Esta acción borra el contacto y su historial local.

## 18. Eliminar grupo

Para eliminar un grupo:

1. Abrir el grupo.
2. Abrir el menú de opciones.
3. Seleccionar “Eliminar grupo”.
4. Confirmar.

También puede eliminarse desde la lista si la interfaz muestra esa opción.

## 19. Vaciar conversación

Para borrar solo los mensajes:

1. Abrir el chat.
2. Abrir el menú.
3. Seleccionar “Vaciar conversación”.
4. Confirmar.

El contacto se mantiene, pero se borra el historial local.

## 20. Problemas frecuentes

### La app muestra “sin conexión”

Comprobar:

- Que el dispositivo tiene red.
- Que el backend está encendido.
- Que el móvil y el ordenador están en la misma red.
- Que la IP configurada es correcta.

### No llegan mensajes

Comprobar:

- Conexión al servidor.
- Que el contacto está añadido correctamente.
- Que el backend no está apagado.

### No puedo hacer capturas

Es una medida de seguridad. Hermnet bloquea capturas para proteger conversaciones.

### No funcionan notificaciones en iPhone

Puede faltar la configuración de Apple Push Notifications. La app sigue funcionando aunque no haya push configurado.

### No aparece el logo nuevo

Hay que recompilar la app nativa:

```bash
cd frontend
npx expo run:android
```

o:

```bash
cd frontend
npx expo run:ios --device
```

### No puedo crear un grupo

Comprobar:

- Que existe un nombre público configurado.
- Que se ha escrito un nombre de grupo.
- Que se ha seleccionado al menos un miembro.

## 21. Buenas prácticas

- Usar un PIN seguro.
- No compartir archivos de respaldo sin protección.
- Recordar la contraseña del respaldo.
- Añadir solo contactos de confianza.
- No compartir claves privadas.
- Mantener la aplicación actualizada.
- Revisar la identidad del contacto antes de enviar información sensible.
