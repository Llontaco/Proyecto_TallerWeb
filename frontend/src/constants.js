export const ESTADOS = [
  ['REGISTRADA', 'Registrada'],
  ['EN_EVALUACION', 'En evaluación'],
  ['ASIGNADA', 'Asignada'],
  ['EN_ATENCION', 'En atención'],
  ['RESUELTA', 'Resuelta'],
  ['CERRADA', 'Cerrada']
];

export const ETIQUETA_ESTADO = Object.fromEntries(ESTADOS);

export const ROL_TEXTO = {
  ESTUDIANTE: 'Solicitante',
  TECNICO: 'Técnico',
  SUPERVISOR: 'Supervisor',
  ADMIN: 'Administrador'
};

// Menú lateral por rol (renderizado condicional): [ruta, texto, ícono]
export const MENU = {
  ESTUDIANTE: [['/solicitudes', 'Mis solicitudes', 'lista'], ['/solicitudes/nueva', 'Nueva solicitud', 'mas']],
  TECNICO: [['/solicitudes', 'Mis asignaciones', 'herramienta']],
  SUPERVISOR: [['/dashboard', 'Dashboard', 'grafico'], ['/solicitudes', 'Solicitudes', 'lista']],
  ADMIN: [['/dashboard', 'Dashboard', 'grafico'], ['/solicitudes', 'Solicitudes', 'lista'], ['/admin', 'Administración', 'ajustes']]
};

export const iniciales = (nombre = '') =>
  nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export const inicioDe = (rol) => MENU[rol]?.[0]?.[0] ?? '/login';

export const formatearFecha = (iso) =>
  iso ? new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const TIPOS_EVIDENCIA = /\.(jpe?g|png|pdf)$/i;
export const MAX_MB = 5;
