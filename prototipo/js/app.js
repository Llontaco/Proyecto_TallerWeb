/*
 * SIGSU – Prototipo Fase I
 * SPA en JavaScript puro: enrutamiento por hash, manipulación del DOM,
 * formularios con validación y consumo de la API mediante fetch (ver api.js).
 */

const ESTADO_TEXTO = {
  REGISTRADA: 'Registrada',
  EN_EVALUACION: 'En evaluación',
  ASIGNADA: 'Asignada',
  EN_ATENCION: 'En atención',
  RESUELTA: 'Resuelta',
  CERRADA: 'Cerrada'
};
const ROL_TEXTO = { ESTUDIANTE: 'Solicitante', TECNICO: 'Técnico', SUPERVISOR: 'Supervisor', ADMIN: 'Administrador' };

// Qué menú ve cada rol (renderizado condicional)
const MENU = {
  ESTUDIANTE: [['#/solicitudes', 'Mis solicitudes'], ['#/solicitudes/nueva', 'Nueva solicitud']],
  TECNICO: [['#/solicitudes', 'Mis asignaciones']],
  SUPERVISOR: [['#/dashboard', 'Dashboard'], ['#/solicitudes', 'Solicitudes']],
  ADMIN: [['#/dashboard', 'Dashboard'], ['#/solicitudes', 'Solicitudes'], ['#/admin', 'Administración']]
};

const $app = document.getElementById('app');
const $nav = document.getElementById('nav');
const $usuario = document.getElementById('usuario-actual');
let catalogos = null;

// ---------- Utilidades de DOM ----------
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fecha = (iso) => new Date(iso).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const badge = (estado) => `<span class="badge badge--${estado.toLowerCase()}">${ESTADO_TEXTO[estado]}</span>`;
const prioridadChip = (p) => `<span class="prio prio--${esc((p || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))}">${esc(p)}</span>`;

function toast(mensaje, tipo = 'ok') {
  const t = document.createElement('div');
  t.className = `toast toast--${tipo}`;
  t.setAttribute('role', 'status');
  t.textContent = mensaje;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function cargando() {
  $app.innerHTML = '<div class="cargando" aria-live="polite">Cargando…</div>';
}

function mostrarErrores(form, errores) {
  form.querySelectorAll('.campo__error').forEach((e) => { e.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
  Object.entries(errores).forEach(([campo, msg]) => {
    const input = form.elements[campo];
    const slot = form.querySelector(`[data-error-de="${campo}"]`);
    if (input) input.setAttribute('aria-invalid', 'true');
    if (slot) slot.textContent = msg;
  });
  const primero = form.querySelector('[aria-invalid="true"]');
  if (primero) primero.focus();
}

async function asegurarCatalogos() {
  if (!catalogos) catalogos = await Api.catalogos();
  return catalogos;
}

// ---------- Layout ----------
function pintarCabecera() {
  const u = Sesion.usuario();
  if (!u) {
    $nav.innerHTML = '';
    $usuario.innerHTML = '';
    document.body.classList.add('sin-sesion');
    return;
  }
  document.body.classList.remove('sin-sesion');
  const actual = location.hash.split('?')[0];
  $nav.innerHTML = MENU[u.rol]
    .map(([href, texto]) => `<a href="${href}" class="nav__link${actual === href ? ' nav__link--activo' : ''}">${texto}</a>`)
    .join('');
  $usuario.innerHTML = `
    <span class="usuario__nombre">${esc(u.nombre)}</span>
    <span class="usuario__rol">${ROL_TEXTO[u.rol]}</span>
    <button class="btn btn--ghost btn--sm" id="btn-salir" type="button">Salir</button>`;
  document.getElementById('btn-salir').addEventListener('click', () => {
    Sesion.cerrar();
    catalogos = null;
    location.hash = '#/login';
  });
}

// ---------- Vistas: autenticación ----------
function vistaLogin() {
  $app.innerHTML = `
    <section class="auth">
      <div class="auth__marca">
        <h1>SIGSU</h1>
        <p>Sistema Integral de Gestión de Servicios Universitarios</p>
        <ul class="auth__beneficios">
          <li>Registra solicitudes de mantenimiento, soporte y trámites</li>
          <li>Sigue el estado de tu pedido en tiempo real</li>
          <li>Sin correos perdidos ni llamadas repetidas</li>
        </ul>
      </div>
      <form class="card auth__form" id="form-login" novalidate>
        <h2>Iniciar sesión</h2>
        <div class="campo">
          <label for="correo">Correo institucional</label>
          <input id="correo" name="correo" type="email" autocomplete="username" placeholder="nombre@uni.edu.pe" required>
          <span class="campo__error" data-error-de="correo"></span>
        </div>
        <div class="campo">
          <label for="password">Contraseña</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required>
          <span class="campo__error" data-error-de="password"></span>
        </div>
        <p class="alerta" id="login-error" hidden></p>
        <button class="btn btn--primario btn--bloque" type="submit">Ingresar</button>
        <p class="auth__alt">¿No tienes cuenta? <a href="#/registro">Regístrate</a></p>
        <details class="demo">
          <summary>Usuarios de demostración</summary>
          <p>Contraseña para todos: <code>Demo1234</code></p>
          <div class="demo__botones">
            <button type="button" data-demo="estudiante@uni.edu.pe">Estudiante</button>
            <button type="button" data-demo="tecnico@uni.edu.pe">Técnico</button>
            <button type="button" data-demo="supervisor@uni.edu.pe">Supervisor</button>
            <button type="button" data-demo="admin@uni.edu.pe">Administrador</button>
          </div>
        </details>
      </form>
    </section>`;

  const form = document.getElementById('form-login');
  form.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => {
    form.correo.value = b.dataset.demo;
    form.password.value = 'Demo1234';
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errores = {};
    if (!form.correo.value.trim()) errores.correo = 'Ingresa tu correo';
    if (!form.password.value) errores.password = 'Ingresa tu contraseña';
    mostrarErrores(form, errores);
    if (Object.keys(errores).length) return;

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Ingresando…';
    const alerta = document.getElementById('login-error');
    try {
      const { token, usuario } = await Api.login(form.correo.value, form.password.value);
      Sesion.guardar(token, usuario);
      toast(`Bienvenido(a), ${usuario.nombre}`);
      location.hash = MENU[usuario.rol][0][0];
    } catch (err) {
      alerta.hidden = false;
      alerta.textContent = err.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Ingresar';
    }
  });
}

function vistaRegistro() {
  $app.innerHTML = `
    <section class="contenedor contenedor--angosto">
      <form class="card" id="form-registro" novalidate>
        <h2>Crear cuenta</h2>
        <div class="campo">
          <label for="nombre">Nombre completo</label>
          <input id="nombre" name="nombre" autocomplete="name" required>
          <span class="campo__error" data-error-de="nombre"></span>
        </div>
        <div class="campo">
          <label for="correo">Correo institucional</label>
          <input id="correo" name="correo" type="email" autocomplete="email" placeholder="nombre@uni.edu.pe" required>
          <span class="campo__error" data-error-de="correo"></span>
        </div>
        <div class="campo">
          <label for="tipo">Soy</label>
          <select id="tipo" name="tipo">
            <option>Estudiante</option><option>Docente</option><option>Personal administrativo</option>
          </select>
        </div>
        <div class="campo">
          <label for="password">Contraseña</label>
          <input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required>
          <span class="campo__ayuda">Mínimo 8 caracteres</span>
          <span class="campo__error" data-error-de="password"></span>
        </div>
        <div class="campo">
          <label for="password2">Repite la contraseña</label>
          <input id="password2" name="password2" type="password" autocomplete="new-password" required>
          <span class="campo__error" data-error-de="password2"></span>
        </div>
        <p class="alerta" id="registro-error" hidden></p>
        <button class="btn btn--primario btn--bloque" type="submit">Crear cuenta</button>
        <p class="auth__alt">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>
      </form>
    </section>`;

  const form = document.getElementById('form-registro');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(form));
    const errores = {};
    if (datos.nombre.trim().length < 3) errores.nombre = 'Ingresa tu nombre completo';
    if (!/^[^\s@]+@uni\.edu\.pe$/i.test(datos.correo)) errores.correo = 'Usa tu correo institucional (@uni.edu.pe)';
    if (datos.password.length < 8) errores.password = 'La contraseña debe tener al menos 8 caracteres';
    if (datos.password !== datos.password2) errores.password2 = 'Las contraseñas no coinciden';
    mostrarErrores(form, errores);
    if (Object.keys(errores).length) return;

    const alerta = document.getElementById('registro-error');
    try {
      await Api.registro({ nombre: datos.nombre, correo: datos.correo, tipo: datos.tipo, password: datos.password });
      toast('Cuenta creada. Ya puedes iniciar sesión.');
      location.hash = '#/login';
    } catch (err) {
      if (err.status === 400) mostrarErrores(form, err.errores);
      alerta.hidden = false;
      alerta.textContent = err.message;
    }
  });
}

// ---------- Vistas: solicitudes ----------
function filaSolicitud(s) {
  return `
    <tr>
      <td data-label="Código"><a href="#/solicitudes/${s.id}" class="codigo">${esc(s.codigo)}</a>${s.vencida ? ' <span class="vencida" title="Superó el tiempo máximo de su prioridad">Vencida</span>' : ''}</td>
      <td data-label="Categoría">${esc(s.categoria)}</td>
      <td data-label="Ubicación">${esc(s.ubicacion)}</td>
      <td data-label="Prioridad">${prioridadChip(s.prioridad)}</td>
      <td data-label="Estado">${badge(s.estado)}</td>
      <td data-label="Responsable">${esc(s.tecnico || '—')}</td>
      <td data-label="Fecha">${fecha(s.fechaRegistro)}</td>
    </tr>`;
}

async function vistaListado() {
  const u = Sesion.usuario();
  cargando();
  const { categorias } = await asegurarCatalogos();
  const titulo = { ESTUDIANTE: 'Mis solicitudes', TECNICO: 'Solicitudes asignadas a mí' }[u.rol] || 'Todas las solicitudes';

  $app.innerHTML = `
    <section class="contenedor">
      <div class="encabezado">
        <h1>${titulo}</h1>
        ${u.rol === 'ESTUDIANTE' ? '<a class="btn btn--primario" href="#/solicitudes/nueva">+ Nueva solicitud</a>' : ''}
      </div>
      <form class="filtros card" id="filtros">
        <input name="q" type="search" placeholder="Buscar por código o descripción" aria-label="Buscar">
        <select name="estado" aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          ${Object.entries(ESTADO_TEXTO).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
        </select>
        <select name="categoriaId" aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          ${categorias.map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}
        </select>
      </form>
      <div id="resultado"></div>
    </section>`;

  const form = document.getElementById('filtros');
  const $res = document.getElementById('resultado');

  async function buscar() {
    $res.innerHTML = '<div class="cargando">Buscando…</div>';
    const lista = await Api.listarSolicitudes(Object.fromEntries(new FormData(form)));
    if (!lista.length) {
      $res.innerHTML = `<div class="vacio card"><p>No hay solicitudes para mostrar.</p>${u.rol === 'ESTUDIANTE' ? '<a class="btn btn--primario" href="#/solicitudes/nueva">Registrar la primera</a>' : ''}</div>`;
      return;
    }
    $res.innerHTML = `
      <p class="contador">${lista.length} solicitud(es)</p>
      <table class="tabla card">
        <thead><tr><th>Código</th><th>Categoría</th><th>Ubicación</th><th>Prioridad</th><th>Estado</th><th>Responsable</th><th>Fecha</th></tr></thead>
        <tbody>${lista.map(filaSolicitud).join('')}</tbody>
      </table>`;
  }

  let espera;
  form.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(buscar, 300); });
  form.addEventListener('submit', (e) => e.preventDefault());
  buscar();
}

async function vistaNueva() {
  cargando();
  const { categorias, prioridades } = await asegurarCatalogos();
  $app.innerHTML = `
    <section class="contenedor contenedor--medio">
      <a href="#/solicitudes" class="volver">← Volver</a>
      <form class="card" id="form-solicitud" novalidate>
        <h1>Nueva solicitud</h1>
        <p class="subtitulo">Los campos marcados con * son obligatorios.</p>
        <div class="grid-2">
          <div class="campo">
            <label for="categoriaId">Categoría *</label>
            <select id="categoriaId" name="categoriaId" required>
              <option value="">Selecciona…</option>
              ${categorias.map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}
            </select>
            <span class="campo__error" data-error-de="categoriaId"></span>
          </div>
          <div class="campo">
            <label for="prioridadId">Prioridad sugerida *</label>
            <select id="prioridadId" name="prioridadId" required>
              <option value="">Selecciona…</option>
              ${prioridades.map((p) => `<option value="${p.id}">${esc(p.nombre)} (máx. ${p.horasMaximas} h)</option>`).join('')}
            </select>
            <span class="campo__error" data-error-de="prioridadId"></span>
          </div>
        </div>
        <div class="campo">
          <label for="ubicacion">Ubicación *</label>
          <input id="ubicacion" name="ubicacion" placeholder="Ej.: Facultad de Ingeniería – Aula 204" required>
          <span class="campo__error" data-error-de="ubicacion"></span>
        </div>
        <div class="campo">
          <label for="descripcion">Descripción *</label>
          <textarea id="descripcion" name="descripcion" rows="5" maxlength="1000" placeholder="¿Qué ocurre? ¿Desde cuándo?" required></textarea>
          <span class="campo__ayuda"><span id="contador-desc">0</span>/1000 caracteres · mínimo 20</span>
          <span class="campo__error" data-error-de="descripcion"></span>
        </div>
        <div class="campo">
          <label for="evidencias">Evidencias (opcional)</label>
          <input id="evidencias" name="evidencias" type="file" accept=".jpg,.jpeg,.png,.pdf" multiple>
          <span class="campo__ayuda">JPG, PNG o PDF · hasta 3 archivos de 5 MB</span>
          <span class="campo__error" data-error-de="evidencias"></span>
          <ul id="lista-evidencias" class="evidencias"></ul>
        </div>
        <div class="acciones">
          <a class="btn btn--ghost" href="#/solicitudes">Cancelar</a>
          <button class="btn btn--primario" type="submit">Registrar solicitud</button>
        </div>
      </form>
    </section>`;

  const form = document.getElementById('form-solicitud');
  const $contador = document.getElementById('contador-desc');
  form.descripcion.addEventListener('input', () => { $contador.textContent = form.descripcion.value.length; });

  form.evidencias.addEventListener('change', () => {
    document.getElementById('lista-evidencias').innerHTML = [...form.evidencias.files]
      .map((f) => `<li>${esc(f.name)} · ${(f.size / 1024 / 1024).toFixed(2)} MB</li>`).join('');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const archivos = [...form.evidencias.files];
    const datos = {
      categoriaId: form.categoriaId.value,
      prioridadId: form.prioridadId.value,
      ubicacion: form.ubicacion.value,
      descripcion: form.descripcion.value,
      evidencias: archivos.map((f) => f.name)
    };
    const errores = {};
    if (!datos.categoriaId) errores.categoriaId = 'Selecciona una categoría';
    if (!datos.prioridadId) errores.prioridadId = 'Selecciona una prioridad';
    if (datos.ubicacion.trim().length < 3) errores.ubicacion = 'Indica la ubicación';
    if (datos.descripcion.trim().length < 20) errores.descripcion = 'Describe el problema con al menos 20 caracteres';
    if (archivos.length > 3) errores.evidencias = 'Máximo 3 archivos';
    else if (archivos.some((f) => f.size > 5 * 1024 * 1024)) errores.evidencias = 'Cada archivo debe pesar como máximo 5 MB';
    else if (archivos.some((f) => !/\.(jpe?g|png|pdf)$/i.test(f.name))) errores.evidencias = 'Solo se permiten JPG, PNG o PDF';
    mostrarErrores(form, errores);
    if (Object.keys(errores).length) return;

    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Registrando…';
    try {
      const sol = await Api.crearSolicitud(datos);
      $app.innerHTML = `
        <section class="contenedor contenedor--angosto">
          <div class="card exito">
            <div class="exito__icono" aria-hidden="true">✓</div>
            <h1>Solicitud registrada</h1>
            <p>Tu código de seguimiento es</p>
            <p class="exito__codigo">${esc(sol.codigo)}</p>
            <p>Estado: ${badge(sol.estado)}</p>
            <div class="acciones acciones--centro">
              <a class="btn btn--ghost" href="#/solicitudes/${sol.id}">Ver detalle</a>
              <a class="btn btn--primario" href="#/solicitudes">Ir a mis solicitudes</a>
            </div>
          </div>
        </section>`;
    } catch (err) {
      if (err.status === 400) mostrarErrores(form, err.errores);
      toast(err.message, 'error');
      btn.disabled = false; btn.textContent = 'Registrar solicitud';
    }
  });
}

// Acciones disponibles según rol y estado (renderizado condicional)
function accionesDisponibles(u, s) {
  const a = [];
  if (['SUPERVISOR', 'ADMIN'].includes(u.rol) && s.estado === 'REGISTRADA') a.push(['EN_EVALUACION', 'Pasar a evaluación']);
  if (u.rol === 'TECNICO' && s.estado === 'ASIGNADA') a.push(['EN_ATENCION', 'Iniciar atención']);
  if (u.rol === 'TECNICO' && s.estado === 'EN_ATENCION') a.push(['RESUELTA', 'Marcar como resuelta']);
  if (s.estado === 'RESUELTA' && ['SUPERVISOR', 'ADMIN', 'ESTUDIANTE'].includes(u.rol)) a.push(['CERRADA', u.rol === 'ESTUDIANTE' ? 'Confirmar y cerrar' : 'Cerrar solicitud']);
  if (s.estado === 'RESUELTA' && u.rol === 'SUPERVISOR') a.push(['EN_ATENCION', 'Reabrir']);
  return a;
}

function lineaDeEstados(actual) {
  const orden = Object.keys(ESTADO_TEXTO);
  const idx = orden.indexOf(actual);
  return `<ol class="flujo">${orden.map((e, i) =>
    `<li class="flujo__paso${i < idx ? ' flujo__paso--hecho' : ''}${i === idx ? ' flujo__paso--actual' : ''}">${ESTADO_TEXTO[e]}</li>`).join('')}</ol>`;
}

async function vistaDetalle(id) {
  const u = Sesion.usuario();
  cargando();
  let s;
  try {
    s = await Api.obtenerSolicitud(id);
  } catch (err) {
    $app.innerHTML = `<section class="contenedor"><div class="card vacio"><p>${esc(err.message)}</p><a href="#/solicitudes" class="btn btn--ghost">Volver</a></div></section>`;
    return;
  }
  const { prioridades } = await asegurarCatalogos();
  const tecnicos = ['SUPERVISOR', 'ADMIN'].includes(u.rol) ? await Api.usuarios('TECNICO') : [];
  const acciones = accionesDisponibles(u, s);
  const puedeAsignar = ['SUPERVISOR', 'ADMIN'].includes(u.rol) && ['EN_EVALUACION', 'ASIGNADA'].includes(s.estado);

  $app.innerHTML = `
    <section class="contenedor">
      <a href="#/solicitudes" class="volver">← Volver</a>
      <div class="encabezado">
        <h1>${esc(s.codigo)} ${badge(s.estado)} ${s.vencida ? '<span class="vencida">Vencida</span>' : ''}</h1>
      </div>
      ${lineaDeEstados(s.estado)}
      <div class="detalle">
        <div class="detalle__principal">
          <article class="card">
            <h2>Datos de la solicitud</h2>
            <dl class="datos">
              <dt>Solicitante</dt><dd>${esc(s.solicitante)}</dd>
              <dt>Categoría</dt><dd>${esc(s.categoria)}</dd>
              <dt>Área responsable</dt><dd>${esc(s.area)}</dd>
              <dt>Ubicación</dt><dd>${esc(s.ubicacion)}</dd>
              <dt>Prioridad</dt><dd>${prioridadChip(s.prioridad)}</dd>
              <dt>Responsable</dt><dd>${esc(s.tecnico || 'Sin asignar')}</dd>
              <dt>Fecha de registro</dt><dd>${fecha(s.fechaRegistro)}</dd>
              ${s.fechaResolucion ? `<dt>Fecha de resolución</dt><dd>${fecha(s.fechaResolucion)}</dd>` : ''}
            </dl>
            <h3>Descripción</h3>
            <p class="descripcion">${esc(s.descripcion)}</p>
            <h3>Evidencias</h3>
            ${s.evidencias.length ? `<ul class="evidencias">${s.evidencias.map((e) => `<li>📎 ${esc(e)}</li>`).join('')}</ul>` : '<p class="tenue">Sin evidencias adjuntas.</p>'}
          </article>

          <article class="card">
            <h2>Comentarios</h2>
            <ul class="comentarios">
              ${s.comentarios.length ? s.comentarios.map((c) => `
                <li><strong>${esc(c.usuario)}</strong> <span class="tenue">· ${fecha(c.fecha)}</span><p>${esc(c.texto)}</p></li>`).join('') : '<li class="tenue">Aún no hay comentarios.</li>'}
            </ul>
            ${s.estado !== 'CERRADA' ? `
            <form id="form-comentario" class="comentar" novalidate>
              <label for="texto" class="sr-only">Nuevo comentario</label>
              <textarea id="texto" name="texto" rows="2" maxlength="500" placeholder="Escribe un comentario…"></textarea>
              <span class="campo__error" data-error-de="texto"></span>
              <button class="btn btn--primario btn--sm" type="submit">Comentar</button>
            </form>` : ''}
          </article>
        </div>

        <aside class="detalle__lateral">
          ${acciones.length || puedeAsignar ? `
          <article class="card">
            <h2>Acciones</h2>
            ${puedeAsignar ? `
            <form id="form-asignar" novalidate>
              <div class="campo">
                <label for="tecnicoId">Técnico responsable</label>
                <select id="tecnicoId" name="tecnicoId">
                  <option value="">Selecciona…</option>
                  ${tecnicos.map((t) => `<option value="${t.id}" ${t.id === s.tecnicoId ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}
                </select>
                <span class="campo__error" data-error-de="tecnicoId"></span>
              </div>
              <div class="campo">
                <label for="prioridadAsig">Prioridad final</label>
                <select id="prioridadAsig" name="prioridadId">
                  ${prioridades.map((p) => `<option value="${p.id}" ${p.id === s.prioridadId ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}
                </select>
              </div>
              <button class="btn btn--primario btn--bloque" type="submit">${s.tecnicoId ? 'Reasignar' : 'Asignar'}</button>
            </form>` : ''}
            ${acciones.map(([estado, texto]) => `<button class="btn btn--bloque ${estado === 'EN_ATENCION' && s.estado === 'RESUELTA' ? 'btn--ghost' : 'btn--primario'}" data-estado="${estado}" type="button">${texto}</button>`).join('')}
          </article>` : ''}

          <article class="card">
            <h2>Historial</h2>
            <ol class="historial">
              ${s.historial.slice().reverse().map((h) => `
                <li><span class="historial__accion">${esc(h.accion)}</span><span class="tenue">${esc(h.usuario)} · ${fecha(h.fecha)}</span></li>`).join('')}
            </ol>
          </article>
        </aside>
      </div>
    </section>`;

  // Eventos
  const formC = document.getElementById('form-comentario');
  if (formC) formC.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!formC.texto.value.trim()) { mostrarErrores(formC, { texto: 'Escribe un comentario' }); return; }
    await Api.comentar(s.id, formC.texto.value);
    toast('Comentario agregado');
    vistaDetalle(s.id);
  });

  const formA = document.getElementById('form-asignar');
  if (formA) formA.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!formA.tecnicoId.value) { mostrarErrores(formA, { tecnicoId: 'Selecciona un técnico' }); return; }
    try {
      await Api.asignar(s.id, formA.tecnicoId.value, formA.prioridadId.value);
      toast('Responsable asignado');
      vistaDetalle(s.id);
    } catch (err) { toast(err.message, 'error'); }
  });

  $app.querySelectorAll('[data-estado]').forEach((b) => b.addEventListener('click', async () => {
    const comentario = b.dataset.estado === 'RESUELTA' ? prompt('Describe brevemente cómo se resolvió (opcional):') || '' : '';
    try {
      await Api.cambiarEstado(s.id, b.dataset.estado, comentario);
      toast(`Estado actualizado a "${ESTADO_TEXTO[b.dataset.estado]}"`);
      vistaDetalle(s.id);
    } catch (err) { toast(err.message, 'error'); }
  }));
}

// ---------- Vista: dashboard ----------
function barras(titulo, datos) {
  const entradas = Object.entries(datos).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entradas.map(([, v]) => v));
  return `
    <article class="card">
      <h2>${titulo}</h2>
      <ul class="barras">
        ${entradas.map(([k, v]) => `
          <li><span class="barras__etiqueta">${esc(ESTADO_TEXTO[k] || k)}</span>
          <span class="barras__pista"><span class="barras__valor" style="width:${(v / max) * 100}%"></span></span>
          <span class="barras__num">${v}</span></li>`).join('')}
      </ul>
    </article>`;
}

async function vistaDashboard() {
  cargando();
  const d = await Api.dashboard();
  const kpi = (titulo, valor, nota, clase = '') => `
    <div class="kpi card ${clase}"><span class="kpi__titulo">${titulo}</span><span class="kpi__valor">${valor}</span>${nota ? `<span class="kpi__nota">${nota}</span>` : ''}</div>`;
  $app.innerHTML = `
    <section class="contenedor">
      <div class="encabezado"><h1>Dashboard de atención</h1><span class="tenue">Actualizado: ${fecha(new Date().toISOString())}</span></div>
      <div class="kpis">
        ${kpi('Registradas', d.registradas, 'total histórico')}
        ${kpi('Pendientes', d.pendientes, 'sin resolver')}
        ${kpi('Atendidas', d.atendidas, 'resueltas + cerradas')}
        ${kpi('% resueltas', `${d.porcentajeResueltas}%`, '')}
        ${kpi('Tiempo promedio', `${d.tiempoPromedioHoras} h`, 'registro → resolución')}
        ${kpi('Vencidas', d.vencidas, 'superan su tiempo máximo', d.vencidas ? 'kpi--alerta' : '')}
      </div>
      <div class="grid-graficos">
        ${barras('Por estado', d.porEstado)}
        ${barras('Por categoría', d.porCategoria)}
        ${barras('Por prioridad', d.porPrioridad)}
        ${barras('Por responsable', d.porResponsable)}
      </div>
    </section>`;
}

// ---------- Vista: administración ----------
async function vistaAdmin() {
  cargando();
  catalogos = null;
  const [{ categorias, areas }, usuarios] = await Promise.all([asegurarCatalogos(), Api.usuarios()]);
  $app.innerHTML = `
    <section class="contenedor">
      <div class="encabezado"><h1>Administración</h1>
        <button class="btn btn--ghost btn--sm" id="btn-reset" type="button">Restaurar datos demo</button></div>
      <div class="grid-graficos">
        <article class="card">
          <h2>Categorías</h2>
          <ul class="lista-admin">
            ${categorias.map((c) => `<li><span>${esc(c.nombre)} <span class="tenue">· ${esc((areas.find((a) => a.id === c.areaId) || {}).nombre)}</span></span>
              <button class="btn btn--ghost btn--sm" data-borrar="${c.id}" type="button" aria-label="Eliminar ${esc(c.nombre)}">Eliminar</button></li>`).join('')}
          </ul>
          <form id="form-cat" class="fila-form" novalidate>
            <input name="nombre" placeholder="Nueva categoría" aria-label="Nombre de la categoría">
            <select name="areaId" aria-label="Área responsable">${areas.map((a) => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}</select>
            <button class="btn btn--primario btn--sm" type="submit">Agregar</button>
            <span class="campo__error" data-error-de="nombre"></span>
          </form>
        </article>
        <article class="card">
          <h2>Usuarios y roles</h2>
          <ul class="lista-admin">
            ${usuarios.map((x) => `<li><span>${esc(x.nombre)}<br><span class="tenue">${esc(x.correo)}</span></span>
              <select data-rol-de="${x.id}" aria-label="Rol de ${esc(x.nombre)}">
                ${Object.entries(ROL_TEXTO).map(([k, v]) => `<option value="${k}" ${k === x.rol ? 'selected' : ''}>${v}</option>`).join('')}
              </select></li>`).join('')}
          </ul>
        </article>
      </div>
    </section>`;

  const formCat = document.getElementById('form-cat');
  formCat.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await Api.crearCategoria(formCat.nombre.value, formCat.areaId.value);
      toast('Categoría creada');
      vistaAdmin();
    } catch (err) {
      mostrarErrores(formCat, err.errores && Object.keys(err.errores).length ? err.errores : { nombre: err.message });
    }
  });
  $app.querySelectorAll('[data-borrar]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try { await Api.eliminarCategoria(b.dataset.borrar); toast('Categoría eliminada'); vistaAdmin(); } catch (err) { toast(err.message, 'error'); }
  }));
  $app.querySelectorAll('[data-rol-de]').forEach((s) => s.addEventListener('change', async () => {
    await Api.cambiarRol(s.dataset.rolDe, s.value);
    toast('Rol actualizado');
  }));
  document.getElementById('btn-reset').addEventListener('click', async () => {
    await Api.reiniciarDemo();
    toast('Datos de demostración restaurados');
    vistaAdmin();
  });
}

// ---------- Enrutador ----------
const RUTAS = [
  { patron: /^#\/login$/, vista: vistaLogin, publica: true },
  { patron: /^#\/registro$/, vista: vistaRegistro, publica: true },
  { patron: /^#\/solicitudes$/, vista: vistaListado },
  { patron: /^#\/solicitudes\/nueva$/, vista: vistaNueva, roles: ['ESTUDIANTE'] },
  { patron: /^#\/solicitudes\/(\d+)$/, vista: vistaDetalle },
  { patron: /^#\/dashboard$/, vista: vistaDashboard, roles: ['SUPERVISOR', 'ADMIN'] },
  { patron: /^#\/admin$/, vista: vistaAdmin, roles: ['ADMIN'] }
];

async function enrutar() {
  const hash = location.hash || '#/login';
  const u = Sesion.usuario();
  const ruta = RUTAS.find((r) => r.patron.test(hash));

  if (!ruta) { location.hash = u ? MENU[u.rol][0][0] : '#/login'; return; }
  if (!ruta.publica && !u) { location.hash = '#/login'; return; }
  if (ruta.publica && u) { location.hash = MENU[u.rol][0][0]; return; }
  if (ruta.roles && !ruta.roles.includes(u.rol)) { toast('No tienes permiso para ver esa página', 'error'); location.hash = MENU[u.rol][0][0]; return; }

  pintarCabecera();
  try {
    await ruta.vista(...(hash.match(ruta.patron).slice(1)));
  } catch (err) {
    console.error(err);
    $app.innerHTML = `<section class="contenedor"><div class="card vacio"><p>Ocurrió un error: ${esc(err.message)}</p></div></section>`;
  }
  $app.focus();
}

window.addEventListener('hashchange', enrutar);
enrutar();
