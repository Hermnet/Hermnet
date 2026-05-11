{
    "name": "Hermnet Enterprise Connector",
    "summary": "Gestión empresarial para despliegues privados de Hermnet",
    "description": """
Hermnet Enterprise Connector permite gestionar empresas, planes,
nodos privados, dispositivos, políticas de seguridad y solicitudes
de despliegue para organizaciones que quieran usar Hermnet en
infraestructura privada.
    """,
    "version": "1.0.0",
    "category": "Productivity",
    "author": "Hermnet",
    "license": "LGPL-3",
    "depends": ["base", "mail", "contacts"],
    "data": [
        "security/ir.model.access.csv",
        "views/hermnet_enterprise_views.xml",
        "views/report_hermnet_customer.xml",
        "data/demo_data.xml",
    ],
    "application": True,
    "installable": True,
}
