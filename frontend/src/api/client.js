/*
 * Cliente HTTP de SIGSU. Toda la comunicación con la API Spring Boot pasa por aquí.
 * El token JWT viaja en una cookie HttpOnly que pone el servidor: JavaScript nunca lo toca,
 * por eso basta con credentials: 'include'.
 */
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export class ApiError extends Error {
  constructor(status, mensaje, errores) {
    super(mensaje);
    this.status = status;
    this.errores = errores || {};
  }
}

// El AuthContext registra aquí qué hacer cuando la sesión expira (401).
let alExpirarSesion = () => {};
export function onSesionExpirada(fn) {
  alExpirarSesion = fn;
}

async function peticion(metodo, ruta, { json, form } = {}) {
  const opciones = { method: metodo, credentials: 'include', headers: {} };
  if (json !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(json);
  } else if (form) {
    opciones.body = form; // multipart: el navegador pone el boundary
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${ruta}`, opciones);
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  if (res.status === 204) return null;
  const cuerpo = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !ruta.startsWith('/auth/')) alExpirarSesion();
    throw new ApiError(res.status, cuerpo.mensaje || 'Error inesperado', cuerpo.errores);
  }
  return cuerpo;
}

const qs = (filtros) => {
  const p = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== '' && v != null));
  return p.toString() ? `?${p}` : '';
};

export const api = {
  // Autenticación
  login: (correo, password) => peticion('POST', '/auth/login', { json: { correo, password } }),
  registro: (datos) => peticion('POST', '/auth/registro', { json: datos }),
  logout: () => peticion('POST', '/auth/logout'),
  yo: () => peticion('GET', '/auth/me'),
  cambiarPassword: (actual, nueva) => peticion('PUT', '/auth/password', { json: { actual, nueva } }),

  // Catálogos
  catalogos: () => peticion('GET', '/catalogos'),
  categorias: () => peticion('GET', '/categorias'),
  crearCategoria: (datos) => peticion('POST', '/categorias', { json: datos }),
  actualizarCategoria: (id, datos) => peticion('PUT', `/categorias/${id}`, { json: datos }),
  eliminarCategoria: (id) => peticion('DELETE', `/categorias/${id}`),
  actualizarPrioridad: (id, horasMaximas) => peticion('PUT', `/prioridades/${id}`, { json: { horasMaximas } }),

  // Solicitudes
  listarSolicitudes: (filtros = {}) => peticion('GET', `/solicitudes${qs(filtros)}`),
  obtenerSolicitud: (id) => peticion('GET', `/solicitudes/${id}`),
  crearSolicitud: (datos) => peticion('POST', '/solicitudes', { json: datos }),
  actualizarSolicitud: (id, datos) => peticion('PUT', `/solicitudes/${id}`, { json: datos }),
  eliminarSolicitud: (id) => peticion('DELETE', `/solicitudes/${id}`),
  cambiarEstado: (id, estado, comentario) => peticion('PATCH', `/solicitudes/${id}/estado`, { json: { estado, comentario } }),
  asignar: (id, tecnicoId, prioridadId) => peticion('PATCH', `/solicitudes/${id}/asignacion`, { json: { tecnicoId, prioridadId } }),
  comentar: (id, texto) => peticion('POST', `/solicitudes/${id}/comentarios`, { json: { texto } }),
  adjuntar: (id, archivo) => {
    const form = new FormData();
    form.append('archivo', archivo);
    return peticion('POST', `/solicitudes/${id}/evidencias`, { form });
  },
  urlEvidencia: (id, evidenciaId) => `${API_BASE}/solicitudes/${id}/evidencias/${evidenciaId}`,

  // Notificaciones
  notificaciones: () => peticion('GET', '/notificaciones'),
  marcarNotificacion: (id) => peticion('PATCH', `/notificaciones/${id}/leida`),
  marcarTodasNotificaciones: () => peticion('PATCH', '/notificaciones/leidas'),

  // Usuarios y dashboard
  usuarios: (rol) => peticion('GET', `/usuarios${qs({ rol })}`),
  actualizarUsuario: (id, datos) => peticion('PATCH', `/usuarios/${id}`, { json: datos }),
  dashboard: (filtros = {}) => peticion('GET', `/dashboard${qs(filtros)}`)
};
