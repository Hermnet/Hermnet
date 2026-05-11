# Hermnet Odoo

Este entorno añade Odoo como capa de gestión para empresas que quieran usar Hermnet en sistemas privados.

Odoo no sustituye al backend de mensajería. Su función es gestionar clientes, planes, nodos privados, dispositivos autorizados, políticas de seguridad, solicitudes de despliegue y auditoría operativa.

## Arranque

```bash
cd odoo
cp .env.example .env
docker compose up -d
```

Abrir:

```text
http://localhost:8069
```

Crear una base de datos desde la pantalla inicial de Odoo. Usar como master password:

```text
hermnet-admin-master
```

El `docker-compose.yml` arranca Odoo contra la base configurada en `ODOO_DB_NAME` e inicializa el módulo `base` automáticamente. Esto evita el error de base existente sin tablas internas de Odoo (`ir_module_module does not exist`) cuando PostgreSQL crea la base antes que Odoo.

Después, instalar el módulo:

```text
Apps > Actualizar lista de aplicaciones > buscar "Hermnet Enterprise Connector" > Instalar
```

## Módulo incluido

El addon `hermnet_enterprise_connector` incluye:

- Empresas cliente de Hermnet.
- Planes comerciales.
- Nodos privados por empresa.
- Dispositivos registrados.
- Políticas de seguridad.
- Solicitudes de despliegue.
- Datos demo para enseñar el caso de uso en la defensa.

## Puertos

| Servicio | Puerto local |
|---|---:|
| Odoo | 8069 |
| Odoo longpolling | 8072 |
| PostgreSQL Odoo | 55432 |

## Nota de seguridad

Las credenciales incluidas son solo para desarrollo y demostración. En producción deben cambiarse y desplegarse detrás de HTTPS.
