/*
 * API simulada de SIGSU (Fase I).
 * Intercepta las llamadas fetch() a /api/* y responde como lo hará el backend
 * Spring Boot en la Fase II. Los datos se guardan en localStorage.
 * Al pasar a la Fase II basta con eliminar este archivo y apuntar API_BASE al backend real.
 */
(() => {
  const DB_KEY = 'sigsu_db_v1';
  const LATENCIA_MS = 250;
  const HORA = 3600 * 1000;

  const ESTADOS = ['REGISTRADA', 'EN_EVALUACION', 'ASIGNADA', 'EN_ATENCION', 'RESUELTA', 'CERRADA'];

  // Transiciones permitidas: estado actual -> { estado destino: roles que pueden hacerlo }
  const TRANSICIONES = {
    REGISTRADA: { EN_EVALUACION: ['SUPERVISOR', 'ADMIN'] },
    EN_EVALUACION: {}, // pasa a ASIGNADA solo mediante la asignación de responsable
    ASIGNADA: { EN_ATENCION: ['TECNICO'] },
    EN_ATENCION: { RESUELTA: ['TECNICO'] },
    RESUELTA: { CERRADA: ['SUPERVISOR', 'ADMIN', 'ESTUDIANTE'], EN_ATENCION: ['SUPERVISOR'] },
    CERRADA: {}
  };

  const hace = (horas) => new Date(Date.now() - horas * HORA).toISOString();

  function datosIniciales() {
    const usuarios = [
      { id: 1, nombre: 'Ana Quispe', correo: 'estudiante@uni.edu.pe', password: 'Demo1234', rol: 'ESTUDIANTE', tipo: 'Estudiante', activo: true },
      { id: 2, nombre: 'Luis Paredes', correo: 'tecnico@uni.edu.pe', password: 'Demo1234', rol: 'TECNICO', tipo: 'Personal administrativo', areaId: 1, activo: true },
      { id: 3, nombre: 'María Torres', correo: 'tecnico2@uni.edu.pe', password: 'Demo1234', rol: 'TECNICO', tipo: 'Personal administrativo', areaId: 2, activo: true },
      { id: 4, nombre: 'Jorge Salas', correo: 'supervisor@uni.edu.pe', password: 'Demo1234', rol: 'SUPERVISOR', tipo: 'Personal administrativo', activo: true },
      { id: 5, nombre: 'Rosa Medina', correo: 'admin@uni.edu.pe', password: 'Demo1234', rol: 'ADMIN', tipo: 'Personal administrativo', activo: true },
      { id: 6, nombre: 'Carlos Ramos', correo: 'docente@uni.edu.pe', password: 'Demo1234', rol: 'ESTUDIANTE', tipo: 'Docente', activo: true }
    ];
    const areas = [
      { id: 1, nombre: 'Mantenimiento e Infraestructura' },
      { id: 2, nombre: 'Soporte Informático' },
      { id: 3, nombre: 'Servicios Académicos' }
    ];
    const categorias = [
      { id: 1, nombre: 'Mantenimiento', areaId: 1 },
      { id: 2, nombre: 'Infraestructura', areaId: 1 },
      { id: 3, nombre: 'Soporte informático', areaId: 2 },
      { id: 4, nombre: 'Solicitud administrativa', areaId: 3 },
      { id: 5, nombre: 'Reserva de ambiente', areaId: 3 }
    ];
    const prioridades = [
      { id: 1, nombre: 'Baja', horasMaximas: 120 },
      { id: 2, nombre: 'Media', horasMaximas: 72 },
      { id: 3, nombre: 'Alta', horasMaximas: 24 },
      { id: 4, nombre: 'Crítica', horasMaximas: 4 }
    ];
    const s = (id, solicitanteId, categoriaId, prioridadId, estado, horas, ubicacion, descripcion, tecnicoId, horasResolucion) => ({
      id,
      codigo: `SOL-2026-${String(id).padStart(5, '0')}`,
      solicitanteId, categoriaId, prioridadId, estado, ubicacion, descripcion,
      tecnicoId: tecnicoId || null,
      fechaRegistro: hace(horas),
      fechaResolucion: horasResolucion != null ? hace(horasResolucion) : null,
      evidencias: [],
      comentarios: [],
      historial: [{ fecha: hace(horas), usuarioId: solicitanteId, accion: 'Solicitud registrada', estado: 'REGISTRADA' }]
    });
    const solicitudes = [
      s(1, 1, 1, 3, 'EN_ATENCION', 30, 'Facultad de Ingeniería – Aula 204', 'El proyector del aula 204 no enciende desde el lunes.', 2),
      s(2, 1, 3, 2, 'RESUELTA', 96, 'Biblioteca central – Sala de cómputo', 'Tres computadoras de la sala no tienen acceso a internet.', 3, 50),
      s(3, 6, 2, 4, 'ASIGNADA', 2, 'Pabellón B – Baños 2.º piso', 'Fuga de agua en los baños del segundo piso, el piso está mojado.', 2),
      s(4, 1, 4, 1, 'REGISTRADA', 5, 'Oficina de Registro Académico', 'Solicito constancia de matrícula del ciclo 2026-II.'),
      s(5, 6, 5, 2, 'EN_EVALUACION', 20, 'Auditorio principal', 'Reserva del auditorio para la sustentación del 20 de noviembre.'),
      s(6, 1, 3, 3, 'CERRADA', 200, 'Laboratorio de Redes', 'El switch del laboratorio se reinicia constantemente.', 3, 185),
      s(7, 6, 1, 2, 'CERRADA', 150, 'Facultad de Ciencias – Aula 101', 'Dos sillas rotas en la última fila del aula.', 2, 110),
      s(8, 1, 2, 3, 'REGISTRADA', 40, 'Cafetería – Entrada principal', 'Luminaria apagada en la entrada, de noche está muy oscuro.')
    ];
    return { usuarios, areas, categorias, prioridades, solicitudes, secuencia: 8 };
  }

  const cargar = () => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* localStorage no disponible: se usan datos en memoria */ }
    return datosIniciales();
  };
  let db = cargar();
  const guardar = () => { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* sin persistencia */ } };
  guardar();

  // ---------- Token simulado (mismo formato que un JWT: header.payload.firma) ----------
  const b64 = (obj) => btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
  const crearToken = (u) => [b64({ alg: 'HS256', typ: 'JWT' }), b64({ sub: u.id, rol: u.rol, exp: Date.now() + 8 * HORA }), 'firma-simulada'].join('.');
  const leerToken = (header) => {
    if (!header || !header.startsWith('Bearer ')) return null;
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(header.slice(7).split('.')[1]))));
      if (payload.exp < Date.now()) return null;
      return db.usuarios.find((u) => u.id === payload.sub) || null;
    } catch (e) { return null; }
  };

  // ---------- Utilidades ----------
  const ok = (body, status = 200) => ({ status, body });
  const error = (status, mensaje, errores) => ({ status, body: { status, mensaje, errores } });
  const sinPassword = ({ password, ...u }) => u;
  const nombreUsuario = (id) => (db.usuarios.find((u) => u.id === id) || {}).nombre || '—';

  function vista(sol) {
    const cat = db.categorias.find((c) => c.id === sol.categoriaId) || {};
    const pri = db.prioridades.find((p) => p.id === sol.prioridadId) || {};
    const limite = new Date(sol.fechaRegistro).getTime() + (pri.horasMaximas || 0) * HORA;
    const abierta = !['RESUELTA', 'CERRADA'].includes(sol.estado);
    return {
      ...sol,
      categoria: cat.nombre,
      prioridad: pri.nombre,
      area: (db.areas.find((a) => a.id === cat.areaId) || {}).nombre,
      solicitante: nombreUsuario(sol.solicitanteId),
      tecnico: sol.tecnicoId ? nombreUsuario(sol.tecnicoId) : null,
      vencida: abierta && Date.now() > limite,
      historial: sol.historial.map((h) => ({ ...h, usuario: nombreUsuario(h.usuarioId) })),
      comentarios: sol.comentarios.map((c) => ({ ...c, usuario: nombreUsuario(c.usuarioId) }))
    };
  }

  const puedeVer = (u, sol) =>
    u.rol === 'SUPERVISOR' || u.rol === 'ADMIN' ||
    (u.rol === 'ESTUDIANTE' && sol.solicitanteId === u.id) ||
    (u.rol === 'TECNICO' && sol.tecnicoId === u.id);

  function validarSolicitud(b) {
    const errores = {};
    if (!db.categorias.some((c) => c.id === Number(b.categoriaId))) errores.categoriaId = 'Selecciona una categoría';
    if (!db.prioridades.some((p) => p.id === Number(b.prioridadId))) errores.prioridadId = 'Selecciona una prioridad';
    if (!b.ubicacion || b.ubicacion.trim().length < 3) errores.ubicacion = 'Indica la ubicación';
    if (!b.descripcion || b.descripcion.trim().length < 20) errores.descripcion = 'Describe el problema con al menos 20 caracteres';
    return errores;
  }

  // ---------- Rutas ----------
  function enrutar(metodo, ruta, query, body, usuario) {
    // Rutas públicas
    if (metodo === 'POST' && ruta === '/api/auth/login') {
      const u = db.usuarios.find((x) => x.correo === (body.correo || '').toLowerCase().trim());
      if (!u || u.password !== body.password || !u.activo) return error(401, 'Correo o contraseña incorrectos');
      return ok({ token: crearToken(u), usuario: sinPassword(u) });
    }
    if (metodo === 'POST' && ruta === '/api/auth/registro') {
      const errores = {};
      if (!body.nombre || body.nombre.trim().length < 3) errores.nombre = 'Ingresa tu nombre completo';
      if (!/^[^\s@]+@uni\.edu\.pe$/i.test(body.correo || '')) errores.correo = 'Usa tu correo institucional (@uni.edu.pe)';
      if (!body.password || body.password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres';
      if (Object.keys(errores).length) return error(400, 'Datos inválidos', errores);
      if (db.usuarios.some((u) => u.correo === body.correo.toLowerCase())) return error(409, 'El correo ya está registrado');
      const nuevo = { id: Math.max(...db.usuarios.map((u) => u.id)) + 1, nombre: body.nombre.trim(), correo: body.correo.toLowerCase(), password: body.password, rol: 'ESTUDIANTE', tipo: body.tipo || 'Estudiante', activo: true };
      db.usuarios.push(nuevo); guardar();
      return ok(sinPassword(nuevo), 201);
    }

    // A partir de aquí todo requiere token
    if (!usuario) return error(401, 'Sesión no válida o expirada');

    if (metodo === 'GET' && ruta === '/api/catalogos') {
      return ok({ categorias: db.categorias, prioridades: db.prioridades, areas: db.areas, estados: ESTADOS });
    }

    if (metodo === 'GET' && ruta === '/api/solicitudes') {
      let lista = db.solicitudes.filter((s) => puedeVer(usuario, s));
      if (query.estado) lista = lista.filter((s) => s.estado === query.estado);
      if (query.categoriaId) lista = lista.filter((s) => s.categoriaId === Number(query.categoriaId));
      if (query.q) {
        const q = query.q.toLowerCase();
        lista = lista.filter((s) => s.codigo.toLowerCase().includes(q) || s.descripcion.toLowerCase().includes(q));
      }
      lista = lista.map(vista).sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro));
      return ok(lista);
    }

    if (metodo === 'POST' && ruta === '/api/solicitudes') {
      if (usuario.rol !== 'ESTUDIANTE') return error(403, 'Solo los solicitantes registran solicitudes');
      const errores = validarSolicitud(body);
      if (Object.keys(errores).length) return error(400, 'Datos inválidos', errores);
      db.secuencia += 1;
      const ahora = new Date().toISOString();
      const nueva = {
        id: db.secuencia,
        codigo: `SOL-${new Date().getFullYear()}-${String(db.secuencia).padStart(5, '0')}`,
        solicitanteId: usuario.id,
        categoriaId: Number(body.categoriaId),
        prioridadId: Number(body.prioridadId),
        ubicacion: body.ubicacion.trim(),
        descripcion: body.descripcion.trim(),
        estado: 'REGISTRADA',
        tecnicoId: null,
        fechaRegistro: ahora,
        fechaResolucion: null,
        evidencias: Array.isArray(body.evidencias) ? body.evidencias.slice(0, 3) : [],
        comentarios: [],
        historial: [{ fecha: ahora, usuarioId: usuario.id, accion: 'Solicitud registrada', estado: 'REGISTRADA' }]
      };
      db.solicitudes.push(nueva); guardar();
      return ok(vista(nueva), 201);
    }

    let m = ruta.match(/^\/api\/solicitudes\/(\d+)(\/[a-z]+)?$/);
    if (m) {
      const sol = db.solicitudes.find((s) => s.id === Number(m[1]));
      if (!sol) return error(404, 'Solicitud no encontrada');
      if (!puedeVer(usuario, sol)) return error(403, 'No tienes acceso a esta solicitud');
      const sub = m[2];
      const ahora = new Date().toISOString();

      if (metodo === 'GET' && !sub) return ok(vista(sol));

      if (metodo === 'PATCH' && sub === '/estado') {
        const permitidos = (TRANSICIONES[sol.estado] || {})[body.estado];
        if (!permitidos) return error(422, 'Transición de estado no permitida');
        if (!permitidos.includes(usuario.rol)) return error(403, 'Tu rol no puede realizar este cambio');
        sol.estado = body.estado;
        if (body.estado === 'RESUELTA') sol.fechaResolucion = ahora;
        if (body.estado === 'EN_ATENCION') sol.fechaResolucion = null;
        sol.historial.push({ fecha: ahora, usuarioId: usuario.id, accion: `Estado cambiado a ${body.estado}`, estado: body.estado });
        if (body.comentario && body.comentario.trim()) sol.comentarios.push({ fecha: ahora, usuarioId: usuario.id, texto: body.comentario.trim() });
        guardar();
        return ok(vista(sol));
      }

      if (metodo === 'PATCH' && sub === '/asignacion') {
        if (!['SUPERVISOR', 'ADMIN'].includes(usuario.rol)) return error(403, 'Solo el supervisor asigna responsables');
        if (!['EN_EVALUACION', 'ASIGNADA'].includes(sol.estado)) return error(422, 'Primero pasa la solicitud a "En evaluación"');
        const tec = db.usuarios.find((u) => u.id === Number(body.tecnicoId) && u.rol === 'TECNICO');
        if (!tec) return error(400, 'Datos inválidos', { tecnicoId: 'Selecciona un técnico' });
        if (body.prioridadId) sol.prioridadId = Number(body.prioridadId);
        sol.tecnicoId = tec.id;
        sol.estado = 'ASIGNADA';
        sol.historial.push({ fecha: ahora, usuarioId: usuario.id, accion: `Asignada a ${tec.nombre}`, estado: 'ASIGNADA' });
        guardar();
        return ok(vista(sol));
      }

      if (metodo === 'POST' && sub === '/comentarios') {
        if (!body.texto || !body.texto.trim()) return error(400, 'Datos inválidos', { texto: 'Escribe un comentario' });
        sol.comentarios.push({ fecha: ahora, usuarioId: usuario.id, texto: body.texto.trim().slice(0, 500) });
        guardar();
        return ok(vista(sol), 201);
      }
    }

    if (metodo === 'GET' && ruta === '/api/usuarios') {
      if (!['SUPERVISOR', 'ADMIN'].includes(usuario.rol)) return error(403, 'Acceso denegado');
      let lista = db.usuarios.map(sinPassword);
      if (query.rol) lista = lista.filter((u) => u.rol === query.rol);
      return ok(lista);
    }

    m = ruta.match(/^\/api\/usuarios\/(\d+)\/rol$/);
    if (m && metodo === 'PATCH') {
      if (usuario.rol !== 'ADMIN') return error(403, 'Acceso denegado');
      const u = db.usuarios.find((x) => x.id === Number(m[1]));
      if (!u) return error(404, 'Usuario no encontrado');
      if (!['ESTUDIANTE', 'TECNICO', 'SUPERVISOR', 'ADMIN'].includes(body.rol)) return error(400, 'Rol inválido');
      u.rol = body.rol; guardar();
      return ok(sinPassword(u));
    }

    if (ruta === '/api/categorias' && metodo === 'POST') {
      if (usuario.rol !== 'ADMIN') return error(403, 'Acceso denegado');
      if (!body.nombre || body.nombre.trim().length < 3) return error(400, 'Datos inválidos', { nombre: 'Ingresa un nombre de al menos 3 caracteres' });
      if (db.categorias.some((c) => c.nombre.toLowerCase() === body.nombre.trim().toLowerCase())) return error(409, 'La categoría ya existe');
      const nueva = { id: Math.max(0, ...db.categorias.map((c) => c.id)) + 1, nombre: body.nombre.trim(), areaId: Number(body.areaId) || 1 };
      db.categorias.push(nueva); guardar();
      return ok(nueva, 201);
    }
    m = ruta.match(/^\/api\/categorias\/(\d+)$/);
    if (m && metodo === 'DELETE') {
      if (usuario.rol !== 'ADMIN') return error(403, 'Acceso denegado');
      const id = Number(m[1]);
      if (db.solicitudes.some((s) => s.categoriaId === id)) return error(409, 'No se puede eliminar: hay solicitudes con esta categoría');
      db.categorias = db.categorias.filter((c) => c.id !== id); guardar();
      return ok(null, 204);
    }

    if (metodo === 'GET' && ruta === '/api/dashboard') {
      if (!['SUPERVISOR', 'ADMIN'].includes(usuario.rol)) return error(403, 'Acceso denegado');
      const todas = db.solicitudes.map(vista);
      const atendidas = todas.filter((s) => ['RESUELTA', 'CERRADA'].includes(s.estado));
      const conTiempo = atendidas.filter((s) => s.fechaResolucion);
      const promedioHoras = conTiempo.length
        ? conTiempo.reduce((acc, s) => acc + (new Date(s.fechaResolucion) - new Date(s.fechaRegistro)) / HORA, 0) / conTiempo.length
        : 0;
      const contar = (clave) => todas.reduce((acc, s) => { const k = s[clave] || 'Sin asignar'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
      return ok({
        registradas: todas.length,
        pendientes: todas.length - atendidas.length,
        atendidas: atendidas.length,
        porcentajeResueltas: todas.length ? Math.round((atendidas.length / todas.length) * 100) : 0,
        tiempoPromedioHoras: Math.round(promedioHoras * 10) / 10,
        vencidas: todas.filter((s) => s.vencida).length,
        porCategoria: contar('categoria'),
        porPrioridad: contar('prioridad'),
        porResponsable: contar('tecnico'),
        porEstado: contar('estado')
      });
    }

    if (metodo === 'POST' && ruta === '/api/dev/reset') {
      db = datosIniciales(); guardar();
      return ok({ mensaje: 'Datos de demostración restaurados' });
    }

    return error(404, `Ruta no encontrada: ${metodo} ${ruta}`);
  }

  // ---------- Interceptor de fetch ----------
  const fetchReal = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
    if (!url.pathname.includes('/api/')) return fetchReal(input, init);

    const ruta = url.pathname.slice(url.pathname.indexOf('/api/'));
    const metodo = (init.method || 'GET').toUpperCase();
    const headers = new Headers(init.headers || {});
    let body = {};
    try { body = init.body ? JSON.parse(init.body) : {}; } catch (e) { body = {}; }
    const query = Object.fromEntries(url.searchParams.entries());

    await new Promise((r) => setTimeout(r, LATENCIA_MS));
    const usuario = leerToken(headers.get('Authorization'));
    const res = enrutar(metodo, ruta, query, body, usuario);
    console.info(`[API simulada] ${metodo} ${ruta} -> ${res.status}`);
    return new Response(res.status === 204 ? null : JSON.stringify(res.body), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' }
    });
  };
})();
