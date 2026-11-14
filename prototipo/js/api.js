/*
 * Cliente HTTP de SIGSU. Toda la comunicación con el backend pasa por aquí.
 * En la Fase I responde la API simulada (mock-api.js); en la Fase II se cambia
 * API_BASE por la URL del backend Spring Boot (p. ej. https://api.sigsu.app/api).
 */
const API_BASE = './api';

const Sesion = {
  guardar(token, usuario) {
    sessionStorage.setItem('sigsu_token', token);
    sessionStorage.setItem('sigsu_usuario', JSON.stringify(usuario));
  },
  token: () => sessionStorage.getItem('sigsu_token'),
  usuario() {
    try { return JSON.parse(sessionStorage.getItem('sigsu_usuario')); } catch (e) { return null; }
  },
  cerrar() {
    sessionStorage.removeItem('sigsu_token');
    sessionStorage.removeItem('sigsu_usuario');
  }
};

class ApiError extends Error {
  constructor(status, mensaje, errores) {
    super(mensaje);
    this.status = status;
    this.errores = errores || {};
  }
}

async function peticion(metodo, ruta, datos) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Sesion.token();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${ruta}`, {
    method: metodo,
    headers,
    body: datos ? JSON.stringify(datos) : undefined
  });

  if (res.status === 204) return null;
  const cuerpo = await res.json();
  if (!res.ok) {
    if (res.status === 401 && token) {
      Sesion.cerrar();
      location.hash = '#/login';
    }
    throw new ApiError(res.status, cuerpo.mensaje || 'Error inesperado', cuerpo.errores);
  }
  return cuerpo;
}

const Api = {
  login: (correo, password) => peticion('POST', '/auth/login', { correo, password }),
  registro: (datos) => peticion('POST', '/auth/registro', datos),
  catalogos: () => peticion('GET', '/catalogos'),
  listarSolicitudes: (filtros = {}) => {
    const qs = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v)).toString();
    return peticion('GET', `/solicitudes${qs ? `?${qs}` : ''}`);
  },
  obtenerSolicitud: (id) => peticion('GET', `/solicitudes/${id}`),
  crearSolicitud: (datos) => peticion('POST', '/solicitudes', datos),
  cambiarEstado: (id, estado, comentario) => peticion('PATCH', `/solicitudes/${id}/estado`, { estado, comentario }),
  asignar: (id, tecnicoId, prioridadId) => peticion('PATCH', `/solicitudes/${id}/asignacion`, { tecnicoId, prioridadId }),
  comentar: (id, texto) => peticion('POST', `/solicitudes/${id}/comentarios`, { texto }),
  usuarios: (rol) => peticion('GET', `/usuarios${rol ? `?rol=${rol}` : ''}`),
  cambiarRol: (id, rol) => peticion('PATCH', `/usuarios/${id}/rol`, { rol }),
  crearCategoria: (nombre, areaId) => peticion('POST', '/categorias', { nombre, areaId }),
  eliminarCategoria: (id) => peticion('DELETE', `/categorias/${id}`),
  dashboard: () => peticion('GET', '/dashboard'),
  reiniciarDemo: () => peticion('POST', '/dev/reset')
};
