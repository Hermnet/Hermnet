from odoo import api, fields, models


class HermnetPlan(models.Model):
    _name = "hermnet.plan"
    _description = "Plan empresarial Hermnet"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "monthly_price asc, name asc"

    name = fields.Char(required=True, tracking=True)
    code = fields.Char(required=True, tracking=True)
    monthly_price = fields.Float(string="Precio mensual", tracking=True)
    max_users = fields.Integer(string="Usuarios incluidos", default=25)
    max_private_nodes = fields.Integer(string="Nodos privados incluidos", default=1)
    includes_support = fields.Boolean(string="Soporte incluido", default=True)
    includes_onboarding = fields.Boolean(string="Onboarding incluido", default=True)
    active = fields.Boolean(default=True)
    notes = fields.Text(string="Notas")


class HermnetCustomer(models.Model):
    _name = "hermnet.customer"
    _description = "Empresa cliente Hermnet"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "name asc"

    name = fields.Char(required=True, tracking=True)
    partner_id = fields.Many2one("res.partner", string="Contacto Odoo", tracking=True)
    tax_id = fields.Char(string="CIF/NIF")
    sector = fields.Selection(
        [
            ("health", "Sanidad"),
            ("legal", "Legal"),
            ("education", "Educación"),
            ("security", "Seguridad"),
            ("industrial", "Industrial"),
            ("public", "Administración pública"),
            ("other", "Otro"),
        ],
        default="other",
        tracking=True,
    )
    plan_id = fields.Many2one("hermnet.plan", string="Plan", tracking=True)
    state = fields.Selection(
        [
            ("lead", "Lead"),
            ("pilot", "Piloto"),
            ("active", "Activo"),
            ("suspended", "Suspendido"),
            ("closed", "Cerrado"),
        ],
        default="lead",
        tracking=True,
    )
    admin_contact = fields.Char(string="Responsable técnico")
    admin_email = fields.Char(string="Email técnico")
    admin_phone = fields.Char(string="Teléfono técnico")
    allowed_domains = fields.Char(string="Dominios permitidos")
    seats_purchased = fields.Integer(string="Licencias contratadas", default=25, tracking=True)
    seats_used = fields.Integer(string="Licencias en uso", compute="_compute_usage")
    node_count = fields.Integer(string="Nodos", compute="_compute_usage")
    device_count = fields.Integer(string="Dispositivos", compute="_compute_usage")
    policy_count = fields.Integer(string="Políticas", compute="_compute_usage")
    deployment_count = fields.Integer(string="Solicitudes", compute="_compute_usage")
    onboarding_date = fields.Date(string="Fecha de alta")
    renewal_date = fields.Date(string="Renovación")
    internal_notes = fields.Text(string="Notas internas")
    node_ids = fields.One2many("hermnet.private.node", "customer_id", string="Nodos privados")
    device_ids = fields.One2many("hermnet.device", "customer_id", string="Dispositivos")
    policy_ids = fields.One2many("hermnet.security.policy", "customer_id", string="Políticas")
    deployment_ids = fields.One2many("hermnet.deployment.request", "customer_id", string="Solicitudes")

    @api.depends("device_ids", "node_ids", "policy_ids", "deployment_ids")
    def _compute_usage(self):
        for record in self:
            record.seats_used = len(record.device_ids.mapped("assigned_user_hash"))
            record.node_count = len(record.node_ids)
            record.device_count = len(record.device_ids)
            record.policy_count = len(record.policy_ids)
            record.deployment_count = len(record.deployment_ids)

    def action_view_nodes(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": "Nodos privados",
            "res_model": "hermnet.private.node",
            "view_mode": "tree,form",
            "domain": [("customer_id", "=", self.id)],
            "context": {"default_customer_id": self.id},
        }

    def action_view_devices(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": "Dispositivos",
            "res_model": "hermnet.device",
            "view_mode": "tree,form",
            "domain": [("customer_id", "=", self.id)],
            "context": {"default_customer_id": self.id},
        }

    def action_view_policies(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": "Políticas",
            "res_model": "hermnet.security.policy",
            "view_mode": "tree,form",
            "domain": [("customer_id", "=", self.id)],
            "context": {"default_customer_id": self.id},
        }


class HermnetPrivateNode(models.Model):
    _name = "hermnet.private.node"
    _description = "Nodo privado Hermnet"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "customer_id, environment, name"

    name = fields.Char(required=True, tracking=True)
    customer_id = fields.Many2one("hermnet.customer", required=True, ondelete="cascade", tracking=True)
    environment = fields.Selection(
        [("dev", "Desarrollo"), ("staging", "Preproducción"), ("prod", "Producción")],
        default="prod",
        required=True,
        tracking=True,
    )
    state = fields.Selection(
        [
            ("planned", "Planificado"),
            ("deploying", "Desplegando"),
            ("online", "Online"),
            ("maintenance", "Mantenimiento"),
            ("offline", "Offline"),
        ],
        default="planned",
        tracking=True,
    )
    base_url = fields.Char(string="URL base")
    onion_url = fields.Char(string="Hidden service Onion")
    region = fields.Char(string="Región")
    server_provider = fields.Char(string="Proveedor/VPS")
    db_name = fields.Char(string="Base de datos backend")
    max_daily_messages = fields.Integer(string="Límite diario mensajes", default=50000)
    last_healthcheck = fields.Datetime(string="Último healthcheck")
    notes = fields.Text(string="Notas")


class HermnetDevice(models.Model):
    _name = "hermnet.device"
    _description = "Dispositivo autorizado Hermnet"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "customer_id, display_name"

    display_name = fields.Char(string="Nombre visible", required=True, tracking=True)
    customer_id = fields.Many2one("hermnet.customer", required=True, ondelete="cascade", tracking=True)
    node_id = fields.Many2one("hermnet.private.node", string="Nodo asignado", tracking=True)
    assigned_user_hash = fields.Char(string="Hash/ID Hermnet", required=True, tracking=True)
    platform = fields.Selection(
        [("android", "Android"), ("ios", "iOS"), ("desktop", "Escritorio"), ("unknown", "Desconocido")],
        default="unknown",
        tracking=True,
    )
    app_version = fields.Char(string="Versión app")
    state = fields.Selection(
        [("pending", "Pendiente"), ("active", "Activo"), ("blocked", "Bloqueado"), ("lost", "Perdido")],
        default="pending",
        tracking=True,
    )
    last_seen = fields.Datetime(string="Última conexión")
    push_enabled = fields.Boolean(string="Push configurado")
    screenshot_block_required = fields.Boolean(string="Bloqueo capturas obligatorio", default=True)
    notes = fields.Text(string="Notas")


class HermnetSecurityPolicy(models.Model):
    _name = "hermnet.security.policy"
    _description = "Política de seguridad Hermnet"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "customer_id, name"

    name = fields.Char(required=True, tracking=True)
    customer_id = fields.Many2one("hermnet.customer", required=True, ondelete="cascade", tracking=True)
    require_pin_on_open = fields.Boolean(string="PIN al abrir", default=True, tracking=True)
    block_screenshots = fields.Boolean(string="Bloquear capturas", default=True, tracking=True)
    allow_backups = fields.Boolean(string="Permitir backups", default=True, tracking=True)
    require_backup_password = fields.Boolean(string="Contraseña en backup", default=True)
    allow_matrix_effect = fields.Boolean(string="Permitir efecto Matrix", default=True)
    allow_group_creation = fields.Boolean(string="Permitir grupos", default=True)
    admins_only_groups_default = fields.Boolean(string="Grupos solo admin por defecto")
    min_pin_length = fields.Integer(string="Longitud mínima PIN", default=6)
    message_retention_days = fields.Integer(string="Retención local recomendada (días)", default=0)
    notes = fields.Text(string="Notas")


class HermnetDeploymentRequest(models.Model):
    _name = "hermnet.deployment.request"
    _description = "Solicitud de despliegue Hermnet"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "priority desc, create_date desc"

    name = fields.Char(required=True, tracking=True)
    customer_id = fields.Many2one("hermnet.customer", required=True, ondelete="cascade", tracking=True)
    node_id = fields.Many2one("hermnet.private.node", string="Nodo")
    request_type = fields.Selection(
        [
            ("new_node", "Nuevo nodo"),
            ("migration", "Migración"),
            ("upgrade", "Actualización"),
            ("incident", "Incidencia"),
            ("training", "Formación"),
        ],
        default="new_node",
        tracking=True,
    )
    priority = fields.Selection(
        [("0", "Baja"), ("1", "Normal"), ("2", "Alta"), ("3", "Crítica")],
        default="1",
        tracking=True,
    )
    state = fields.Selection(
        [
            ("draft", "Borrador"),
            ("approved", "Aprobada"),
            ("in_progress", "En curso"),
            ("done", "Hecha"),
            ("cancelled", "Cancelada"),
        ],
        default="draft",
        tracking=True,
    )
    requested_date = fields.Date(string="Fecha solicitada")
    planned_date = fields.Date(string="Fecha planificada")
    done_date = fields.Date(string="Fecha cierre")
    requirements = fields.Text(string="Requisitos")
    result_notes = fields.Text(string="Resultado")
