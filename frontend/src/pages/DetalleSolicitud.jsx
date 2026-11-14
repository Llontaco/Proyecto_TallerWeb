import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { BadgeEstado, Cargando, FlujoEstados, Prioridad, Vacio, Vencida } from '../components/ui.jsx';
import { formatearFecha } from '../constants.js';

function PanelAsignacion({ solicitud, prioridades, onListo }) {
  const [tecnicos, setTecnicos] = useState([]);
  const [tecnicoId, setTecnicoId] = useState(solicitud.tecnicoId ?? '');
  const [prioridadId, setPrioridadId] = useState(solicitud.prioridadId);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    api.usuarios('TECNICO').then(setTecnicos).catch(() => {});
  }, []);

  async function enviar(e) {
    e.preventDefault();
    if (!tecnicoId) { setError('Selecciona un técnico'); return; }
    try {
      onListo(await api.asignar(solicitud.id, Number(tecnicoId), Number(prioridadId)));
      toast('Responsable asignado');
    } catch (err) {
      setError(err.errores.tecnicoId || err.message);
    }
  }

  return (
    <form onSubmit={enviar} noValidate>
      <div className="campo">
        <label htmlFor="tecnicoId">Técnico responsable</label>
        <select id="tecnicoId" value={tecnicoId} onChange={(e) => setTecnicoId(e.target.value)}>
          <option value="">Selecciona…</option>
          {tecnicos.map((t) => <option key={t.id} value={t.id}>{t.nombre}{t.area ? ` · ${t.area}` : ''}</option>)}
        </select>
        <span className="campo__error">{error}</span>
      </div>
      <div className="campo">
        <label htmlFor="prioridadAsig">Prioridad final</label>
        <select id="prioridadAsig" value={prioridadId} onChange={(e) => setPrioridadId(e.target.value)}>
          {prioridades.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>
      <button className="btn btn--primario btn--bloque" type="submit">{solicitud.tecnicoId ? 'Reasignar' : 'Asignar'}</button>
    </form>
  );
}

export default function DetalleSolicitud() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [s, setS] = useState(null);
  const [prioridades, setPrioridades] = useState([]);
  const [error, setError] = useState('');
  const [comentario, setComentario] = useState('');
  const [errorComentario, setErrorComentario] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(() => {
    api.obtenerSolicitud(id).then(setS).catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    cargar();
    api.catalogos().then((c) => setPrioridades(c.prioridades)).catch(() => {});
  }, [cargar]);

  async function ejecutar(fn, mensaje) {
    setOcupado(true);
    try {
      const r = await fn();
      if (r) setS(r);
      toast(mensaje);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setOcupado(false);
    }
  }

  function cambiarEstado(estado, etiqueta) {
    let nota = '';
    if (estado === 'RESUELTA') nota = window.prompt('Describe brevemente cómo se resolvió (opcional):') ?? '';
    ejecutar(() => api.cambiarEstado(s.id, estado, nota), `Estado actualizado a "${etiqueta}"`);
  }

  async function comentar(e) {
    e.preventDefault();
    if (!comentario.trim()) { setErrorComentario('Escribe un comentario'); return; }
    setErrorComentario('');
    await ejecutar(() => api.comentar(s.id, comentario), 'Comentario agregado');
    setComentario('');
  }

  async function eliminar() {
    if (!window.confirm(`¿Eliminar la solicitud ${s.codigo}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.eliminarSolicitud(s.id);
      toast('Solicitud eliminada');
      navigate('/solicitudes');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  function adjuntar(e) {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (archivo) ejecutar(() => api.adjuntar(s.id, archivo), 'Evidencia adjuntada');
  }

  if (error) return <section className="contenedor"><Vacio><p>{error}</p><Link to="/solicitudes" className="btn btn--ghost">Volver</Link></Vacio></section>;
  if (!s) return <Cargando />;

  const a = s.acciones;
  const hayAcciones = a.transiciones.length > 0 || a.puedeAsignar || a.puedeEditar || a.puedeEliminar;

  return (
    <section className="contenedor">
      <Link to="/solicitudes" className="volver">← Volver</Link>
      <div className="encabezado">
        <h1>{s.codigo} <BadgeEstado estado={s.estado} /> {s.vencida && <Vencida />}</h1>
      </div>
      <FlujoEstados actual={s.estado} />

      <div className="detalle">
        <div className="detalle__principal">
          <article className="card">
            <h2>Datos de la solicitud</h2>
            <dl className="datos">
              <dt>Solicitante</dt><dd>{s.solicitante}</dd>
              <dt>Categoría</dt><dd>{s.categoria}</dd>
              <dt>Área responsable</dt><dd>{s.area}</dd>
              <dt>Ubicación</dt><dd>{s.ubicacion}</dd>
              <dt>Prioridad</dt><dd><Prioridad nombre={s.prioridad} /> <span className="tenue">(máx. {s.horasMaximas} h)</span></dd>
              <dt>Responsable</dt><dd>{s.tecnico || 'Sin asignar'}</dd>
              <dt>Registrada</dt><dd>{formatearFecha(s.fechaRegistro)}</dd>
              {s.fechaResolucion && <><dt>Resuelta</dt><dd>{formatearFecha(s.fechaResolucion)}</dd></>}
            </dl>
            <h3>Descripción</h3>
            <p className="descripcion">{s.descripcion}</p>
            <h3>Evidencias</h3>
            {s.evidencias.length ? (
              <ul className="evidencias">
                {s.evidencias.map((e) => (
                  <li key={e.id}><a href={api.urlEvidencia(s.id, e.id)} target="_blank" rel="noreferrer">📎 {e.nombre}</a> <span className="tenue">· {(e.tamanoBytes / 1024).toFixed(0)} KB</span></li>
                ))}
              </ul>
            ) : <p className="tenue">Sin evidencias adjuntas.</p>}
            {a.puedeAdjuntar && (
              <label className="btn btn--ghost btn--sm adjuntar">
                Adjuntar evidencia
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={adjuntar} className="sr-only" disabled={ocupado} />
              </label>
            )}
          </article>

          <article className="card">
            <h2>Comentarios</h2>
            <ul className="comentarios">
              {s.comentarios.length ? s.comentarios.map((c) => (
                <li key={c.id}><strong>{c.autor}</strong> <span className="tenue">· {formatearFecha(c.fecha)}</span><p>{c.texto}</p></li>
              )) : <li className="tenue">Aún no hay comentarios.</li>}
            </ul>
            {a.puedeComentar && (
              <form className="comentar" onSubmit={comentar} noValidate>
                <label htmlFor="texto" className="sr-only">Nuevo comentario</label>
                <textarea id="texto" rows={2} maxLength={500} placeholder="Escribe un comentario…"
                          value={comentario} onChange={(e) => setComentario(e.target.value)} />
                <span className="campo__error">{errorComentario}</span>
                <button className="btn btn--primario btn--sm" type="submit" disabled={ocupado}>Comentar</button>
              </form>
            )}
          </article>
        </div>

        <aside className="detalle__lateral">
          {hayAcciones && (
            <article className="card">
              <h2>Acciones</h2>
              {a.puedeAsignar && <PanelAsignacion solicitud={s} prioridades={prioridades} onListo={setS} />}
              {a.transiciones.map((t) => (
                <button key={t.estado} type="button" disabled={ocupado}
                        className={`btn btn--bloque ${t.estado === 'EN_ATENCION' && s.estado === 'RESUELTA' ? 'btn--ghost' : 'btn--primario'}`}
                        onClick={() => cambiarEstado(t.estado, t.etiqueta)}>
                  {textoTransicion(t, s.estado, usuario.rol)}
                </button>
              ))}
              {a.puedeEditar && <Link className="btn btn--ghost btn--bloque" to={`/solicitudes/${s.id}/editar`}>Editar</Link>}
              {a.puedeEliminar && <button type="button" className="btn btn--peligro btn--bloque" onClick={eliminar}>Eliminar</button>}
            </article>
          )}
          <article className="card">
            <h2>Historial</h2>
            <ol className="historial">
              {[...s.historial].reverse().map((h) => (
                <li key={h.id}>
                  <span className="historial__accion">{h.accion}</span>
                  <span className="tenue">{h.usuario} · {formatearFecha(h.fecha)}</span>
                </li>
              ))}
            </ol>
          </article>
        </aside>
      </div>
    </section>
  );
}

function textoTransicion(t, actual, rol) {
  if (t.estado === 'EN_EVALUACION') return 'Pasar a evaluación';
  if (t.estado === 'EN_ATENCION') return actual === 'RESUELTA' ? 'Reabrir' : 'Iniciar atención';
  if (t.estado === 'RESUELTA') return 'Marcar como resuelta';
  if (t.estado === 'CERRADA') return rol === 'ESTUDIANTE' ? 'Confirmar y cerrar' : 'Cerrar solicitud';
  return t.etiqueta;
}
