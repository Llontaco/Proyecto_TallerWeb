import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Cargando } from '../components/ui.jsx';
import { ROL_TEXTO } from '../constants.js';

function Categorias({ areas }) {
  const [lista, setLista] = useState(null);
  const [form, setForm] = useState({ id: null, nombre: '', areaId: '' });
  const [error, setError] = useState('');
  const toast = useToast();

  const cargar = useCallback(() => api.categorias().then(setLista), []);
  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { if (areas.length && !form.areaId) setForm((f) => ({ ...f, areaId: areas[0].id })); }, [areas, form.areaId]);

  async function guardar(e) {
    e.preventDefault();
    if (form.nombre.trim().length < 3) { setError('Ingresa un nombre de al menos 3 caracteres'); return; }
    setError('');
    const datos = { nombre: form.nombre, areaId: Number(form.areaId) };
    try {
      if (form.id) await api.actualizarCategoria(form.id, { ...datos, activa: form.activa });
      else await api.crearCategoria(datos);
      toast(form.id ? 'Categoría actualizada' : 'Categoría creada');
      setForm({ id: null, nombre: '', areaId: areas[0]?.id ?? '' });
      cargar();
    } catch (err) {
      setError(err.errores.nombre || err.message);
    }
  }

  async function alternar(c) {
    await api.actualizarCategoria(c.id, { nombre: c.nombre, areaId: c.areaId, activa: !c.activa });
    toast(c.activa ? 'Categoría desactivada' : 'Categoría activada');
    cargar();
  }

  async function eliminar(c) {
    if (!window.confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
    try {
      await api.eliminarCategoria(c.id);
      toast('Categoría eliminada');
      cargar();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <article className="card">
      <h2>Categorías</h2>
      {!lista ? <Cargando /> : (
        <ul className="lista-admin">
          {lista.map((c) => (
            <li key={c.id}>
              <span>{c.nombre} {!c.activa && <span className="vencida">Inactiva</span>}<br /><span className="tenue">{c.area}</span></span>
              <span className="botones">
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => setForm({ ...c })}>Editar</button>
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => alternar(c)}>{c.activa ? 'Desactivar' : 'Activar'}</button>
                <button className="btn btn--ghost btn--sm" type="button" onClick={() => eliminar(c)} aria-label={`Eliminar ${c.nombre}`}>Eliminar</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form className="fila-form" onSubmit={guardar} noValidate>
        <input placeholder={form.id ? 'Nuevo nombre' : 'Nueva categoría'} aria-label="Nombre de la categoría"
               value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <select aria-label="Área responsable" value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })}>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <button className="btn btn--primario btn--sm" type="submit">{form.id ? 'Guardar' : 'Agregar'}</button>
        {form.id && <button className="btn btn--ghost btn--sm" type="button" onClick={() => setForm({ id: null, nombre: '', areaId: areas[0]?.id })}>Cancelar</button>}
        <span className="campo__error">{error}</span>
      </form>
    </article>
  );
}

function Prioridades() {
  const [lista, setLista] = useState([]);
  const toast = useToast();
  useEffect(() => { api.catalogos().then((c) => setLista(c.prioridades)); }, []);

  async function guardar(p, valor) {
    const horas = Number(valor);
    if (!horas || horas === p.horasMaximas) return;
    try {
      const nueva = await api.actualizarPrioridad(p.id, horas);
      setLista(lista.map((x) => (x.id === p.id ? nueva : x)));
      toast(`Prioridad ${p.nombre}: ${horas} h`);
    } catch (err) {
      toast(err.errores.horasMaximas || err.message, 'error');
    }
  }

  return (
    <article className="card">
      <h2>Prioridades</h2>
      <p className="tenue">Tiempo máximo de atención; define cuándo una solicitud está vencida.</p>
      <ul className="lista-admin">
        {lista.map((p) => (
          <li key={p.id}>
            <label htmlFor={`prio-${p.id}`}>{p.nombre}</label>
            <span><input id={`prio-${p.id}`} type="number" min={1} max={720} defaultValue={p.horasMaximas} className="input-corto"
                         onBlur={(e) => guardar(p, e.target.value)} /> h</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Usuarios({ areas }) {
  const { usuario } = useAuth();
  const [lista, setLista] = useState(null);
  const toast = useToast();
  useEffect(() => { api.usuarios().then(setLista); }, []);

  async function actualizar(u, cambios) {
    try {
      const nuevo = await api.actualizarUsuario(u.id, cambios);
      setLista(lista.map((x) => (x.id === u.id ? nuevo : x)));
      toast('Usuario actualizado');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <article className="card card--ancha">
      <h2>Usuarios y roles</h2>
      {!lista ? <Cargando /> : (
        <ul className="lista-admin">
          {lista.map((u) => (
            <li key={u.id}>
              <span>{u.nombre} {!u.activo && <span className="vencida">Inactivo</span>}<br /><span className="tenue">{u.correo}</span></span>
              <span className="botones">
                <select aria-label={`Rol de ${u.nombre}`} value={u.rol} disabled={u.id === usuario.id}
                        onChange={(e) => actualizar(u, { rol: e.target.value })}>
                  {Object.entries(ROL_TEXTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {u.rol === 'TECNICO' && (
                  <select aria-label={`Área de ${u.nombre}`} value={u.areaId ?? ''} onChange={(e) => actualizar(u, { areaId: Number(e.target.value) })}>
                    <option value="" disabled>Área…</option>
                    {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                )}
                <button className="btn btn--ghost btn--sm" type="button" disabled={u.id === usuario.id}
                        onClick={() => actualizar(u, { activo: !u.activo })}>{u.activo ? 'Desactivar' : 'Activar'}</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function Admin() {
  const [areas, setAreas] = useState([]);
  useEffect(() => { api.catalogos().then((c) => setAreas(c.areas)); }, []);
  return (
    <section className="contenedor">
      <div className="encabezado"><h1>Administración</h1></div>
      <div className="grid-graficos">
        <Categorias areas={areas} />
        <Prioridades />
        <Usuarios areas={areas} />
      </div>
    </section>
  );
}
