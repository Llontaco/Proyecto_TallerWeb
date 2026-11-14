import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { BadgeEstado, Campo, Cargando } from '../components/ui.jsx';
import { MAX_MB, TIPOS_EVIDENCIA } from '../constants.js';

const VACIO = { categoriaId: '', prioridadId: '', ubicacion: '', descripcion: '' };

/** Reglas de HU-05 y HU-06; exportada para probarla de forma aislada. */
export function validar(d, archivos) {
  const e = {};
  if (!d.categoriaId) e.categoriaId = 'Selecciona una categoría';
  if (!d.prioridadId) e.prioridadId = 'Selecciona una prioridad';
  if (d.ubicacion.trim().length < 3) e.ubicacion = 'Indica la ubicación';
  if (d.descripcion.trim().length < 20) e.descripcion = 'Describe el problema con al menos 20 caracteres';
  if (archivos.length > 3) e.archivo = 'Máximo 3 archivos';
  else if (archivos.some((f) => f.size > MAX_MB * 1024 * 1024)) e.archivo = `Cada archivo debe pesar como máximo ${MAX_MB} MB`;
  else if (archivos.some((f) => !TIPOS_EVIDENCIA.test(f.name))) e.archivo = 'Solo se permiten JPG, PNG o PDF';
  return e;
}

/** Sirve para registrar (POST) y para editar (PUT) una solicitud. */
export default function FormularioSolicitud() {
  const { id } = useParams();
  const editando = Boolean(id);
  const [catalogos, setCatalogos] = useState(null);
  const [datos, setDatos] = useState(VACIO);
  const [archivos, setArchivos] = useState([]);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [creada, setCreada] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.catalogos().then(setCatalogos).catch((err) => toast(err.message, 'error'));
    if (editando) {
      api.obtenerSolicitud(id).then((s) => {
        if (!s.acciones.puedeEditar) {
          toast('Esta solicitud ya no se puede editar', 'error');
          navigate(`/solicitudes/${id}`, { replace: true });
          return;
        }
        setDatos({ categoriaId: String(s.categoriaId), prioridadId: String(s.prioridadId), ubicacion: s.ubicacion, descripcion: s.descripcion });
      }).catch((err) => toast(err.message, 'error'));
    }
  }, [id, editando, navigate, toast]);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const errs = validar(datos, archivos);
    setErrores(errs);
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    setEnviando(true);
    const cuerpo = { ...datos, categoriaId: Number(datos.categoriaId), prioridadId: Number(datos.prioridadId) };
    try {
      if (editando) {
        await api.actualizarSolicitud(id, cuerpo);
        toast('Solicitud actualizada');
        navigate(`/solicitudes/${id}`);
        return;
      }
      let sol = await api.crearSolicitud(cuerpo);
      for (const archivo of archivos) {
        try {
          sol = await api.adjuntar(sol.id, archivo);
        } catch (err) {
          toast(`${archivo.name}: ${err.errores.archivo || err.message}`, 'error');
        }
      }
      setCreada(sol);
    } catch (err) {
      setErrores(err.errores);
      toast(err.message, 'error');
    } finally {
      setEnviando(false);
    }
  }

  if (creada) {
    return (
      <section className="contenedor contenedor--angosto">
        <div className="card exito">
          <div className="exito__icono" aria-hidden="true">✓</div>
          <h1>Solicitud registrada</h1>
          <p>Tu código de seguimiento es</p>
          <p className="exito__codigo">{creada.codigo}</p>
          <p>Estado: <BadgeEstado estado={creada.estado} /></p>
          {creada.evidencias.length > 0 && <p className="tenue">{creada.evidencias.length} evidencia(s) adjunta(s)</p>}
          <div className="acciones acciones--centro">
            <Link className="btn btn--ghost" to={`/solicitudes/${creada.id}`}>Ver detalle</Link>
            <Link className="btn btn--primario" to="/solicitudes">Ir a mis solicitudes</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!catalogos) return <Cargando />;

  return (
    <section className="contenedor contenedor--medio">
      <Link to={editando ? `/solicitudes/${id}` : '/solicitudes'} className="volver">← Volver</Link>
      <form className="card" onSubmit={enviar} noValidate>
        <h1>{editando ? 'Editar solicitud' : 'Nueva solicitud'}</h1>
        <p className="subtitulo">Los campos marcados con * son obligatorios.</p>
        <div className="grid-2">
          <Campo id="categoriaId" etiqueta="Categoría *" error={errores.categoriaId}>
            <select id="categoriaId" name="categoriaId" value={datos.categoriaId} onChange={cambiar} aria-invalid={Boolean(errores.categoriaId)}>
              <option value="">Selecciona…</option>
              {catalogos.categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Campo>
          <Campo id="prioridadId" etiqueta="Prioridad sugerida *" error={errores.prioridadId}>
            <select id="prioridadId" name="prioridadId" value={datos.prioridadId} onChange={cambiar} aria-invalid={Boolean(errores.prioridadId)}>
              <option value="">Selecciona…</option>
              {catalogos.prioridades.map((p) => <option key={p.id} value={p.id}>{p.nombre} (máx. {p.horasMaximas} h)</option>)}
            </select>
          </Campo>
        </div>
        <Campo id="ubicacion" etiqueta="Ubicación *" error={errores.ubicacion}>
          <input id="ubicacion" name="ubicacion" maxLength={150} placeholder="Ej.: Facultad de Ingeniería – Aula 204"
                 value={datos.ubicacion} onChange={cambiar} aria-invalid={Boolean(errores.ubicacion)} />
        </Campo>
        <Campo id="descripcion" etiqueta="Descripción *" error={errores.descripcion}
               ayuda={`${datos.descripcion.length}/1000 caracteres · mínimo 20`}>
          <textarea id="descripcion" name="descripcion" rows={5} maxLength={1000} placeholder="¿Qué ocurre? ¿Desde cuándo?"
                    value={datos.descripcion} onChange={cambiar} aria-invalid={Boolean(errores.descripcion)} />
        </Campo>
        {!editando && (
          <Campo id="archivo" etiqueta="Evidencias (opcional)" error={errores.archivo} ayuda="JPG, PNG o PDF · hasta 3 archivos de 5 MB">
            <input id="archivo" type="file" accept=".jpg,.jpeg,.png,.pdf" multiple
                   onChange={(e) => setArchivos([...e.target.files])} />
            {archivos.length > 0 && (
              <ul className="evidencias">
                {archivos.map((f) => <li key={f.name}>{f.name} · {(f.size / 1024 / 1024).toFixed(2)} MB</li>)}
              </ul>
            )}
          </Campo>
        )}
        <div className="acciones">
          <Link className="btn btn--ghost" to={editando ? `/solicitudes/${id}` : '/solicitudes'}>Cancelar</Link>
          <button className="btn btn--primario" type="submit" disabled={enviando}>
            {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar solicitud'}
          </button>
        </div>
      </form>
    </section>
  );
}
