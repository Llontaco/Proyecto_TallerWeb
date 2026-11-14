import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { BadgeEstado, Cargando, Prioridad, Vencida } from '../components/ui.jsx';
import Icono from '../components/Iconos.jsx';
import { ESTADOS } from '../constants.js';

const CLAVE_FILTROS = 'sigsu_filtros_solicitudes';
const SIN_FILTROS = { q: '', estado: '', categoriaId: '', prioridad: '', orden: 'recientes' };
const ENCABEZADOS = {
  ESTUDIANTE: ['Mis solicitudes', 'Consulta el estado y el historial de lo que has registrado.'],
  TECNICO: ['Mis asignaciones', 'Solicitudes que tienes asignadas para atender.'],
  SUPERVISOR: ['Solicitudes', 'Todas las solicitudes registradas en la universidad.'],
  ADMIN: ['Solicitudes', 'Todas las solicitudes registradas en la universidad.']
};
const DIA = 24 * 3600 * 1000;

// localStorage: los filtros elegidos se mantienen al volver a la lista o recargar la página.
function filtrosGuardados() {
  try {
    return { ...SIN_FILTROS, ...JSON.parse(localStorage.getItem(CLAVE_FILTROS)) };
  } catch {
    return SIN_FILTROS;
  }
}

function Plazo({ s }) {
  if (s.estado === 'RESUELTA' || s.estado === 'CERRADA') {
    return <span className="plazo plazo--ok"><Icono nombre="check" size={16} /> Atendida</span>;
  }
  if (s.vencida) return <Vencida />;
  const restante = new Date(s.fechaLimite) - Date.now();
  const texto = restante >= DIA ? `Vence en ${Math.floor(restante / DIA)} día(s)` : `Vence en ${Math.max(1, Math.floor(restante / 3600000))} h`;
  return <span className={`plazo${restante < DIA ? ' plazo--pronto' : ''}`}><Icono nombre="reloj" size={16} /> {texto}</span>;
}

export default function Solicitudes() {
  const { usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const [filtros, setFiltros] = useState(() => {
    const q = params.get('q');
    return q ? { ...filtrosGuardados(), q } : filtrosGuardados();
  });
  const [catalogos, setCatalogos] = useState({ categorias: [], prioridades: [] });
  const [lista, setLista] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.catalogos().then(setCatalogos).catch(() => {});
  }, []);

  // La búsqueda de la barra superior llega como ?q=...
  useEffect(() => {
    const q = params.get('q');
    if (q !== null) {
      setFiltros((f) => ({ ...f, q }));
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  // Búsqueda con espera de 300 ms para no llamar a la API en cada tecla.
  useEffect(() => {
    localStorage.setItem(CLAVE_FILTROS, JSON.stringify(filtros));
    const t = setTimeout(() => {
      const { q, estado, categoriaId } = filtros;
      api.listarSolicitudes({ q, estado, categoriaId })
        .then((datos) => { setLista(datos); setError(''); })
        .catch((err) => setError(err.message));
    }, 300);
    return () => clearTimeout(t);
  }, [filtros.q, filtros.estado, filtros.categoriaId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prioridad y orden se aplican en el navegador sobre la lista ya cargada.
  const visibles = useMemo(() => {
    if (!lista) return [];
    let r = filtros.prioridad ? lista.filter((s) => s.prioridad === filtros.prioridad) : [...lista];
    if (filtros.orden === 'antiguas') r.sort((a, b) => a.fechaRegistro.localeCompare(b.fechaRegistro));
    else if (filtros.orden === 'prioridad') r.sort((a, b) => b.prioridadNivel - a.prioridadNivel || b.fechaRegistro.localeCompare(a.fechaRegistro));
    return r;
  }, [lista, filtros.prioridad, filtros.orden]);

  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  const hayFiltros = filtros.q || filtros.estado || filtros.categoriaId || filtros.prioridad;
  const esSolicitante = usuario.rol === 'ESTUDIANTE';
  const [titulo, subtitulo] = ENCABEZADOS[usuario.rol];

  return (
    <section className="pagina">
      <div className="pagina__encabezado">
        <div>
          <h1>{titulo}</h1>
          <p className="pagina__subtitulo">{subtitulo}</p>
        </div>
        {esSolicitante && (
          <Link className="btn btn--primario" to="/solicitudes/nueva"><Icono nombre="mas" size={18} /> Nueva solicitud</Link>
        )}
      </div>

      <div className="card card--tabla">
        <form className="filtros-barra" onSubmit={(e) => e.preventDefault()}>
          <label className="campo-buscar">
            <Icono nombre="buscar" size={18} />
            <input name="q" type="search" placeholder="Buscar por código, ubicación o descripción" aria-label="Buscar"
                   value={filtros.q} onChange={cambiar} />
          </label>
          <select name="estado" aria-label="Filtrar por estado" value={filtros.estado} onChange={cambiar}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select name="categoriaId" aria-label="Filtrar por categoría" value={filtros.categoriaId} onChange={cambiar}>
            <option value="">Todas las categorías</option>
            {catalogos.categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select name="prioridad" aria-label="Filtrar por prioridad" value={filtros.prioridad} onChange={cambiar}>
            <option value="">Todas las prioridades</option>
            {catalogos.prioridades.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>
          <select name="orden" aria-label="Ordenar" value={filtros.orden} onChange={cambiar}>
            <option value="recientes">Más recientes primero</option>
            <option value="antiguas">Más antiguas primero</option>
            <option value="prioridad">Mayor prioridad primero</option>
          </select>
        </form>

        {error && <p className="alerta" role="alert">{error}</p>}
        {lista === null ? <Cargando /> : visibles.length === 0 ? (
          <div className="vacio">
            <p>{hayFiltros ? 'Ninguna solicitud coincide con los filtros.' : 'No hay solicitudes para mostrar.'}</p>
            {hayFiltros && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFiltros(SIN_FILTROS)}>Limpiar filtros</button>}
            {esSolicitante && !hayFiltros && <Link className="btn btn--primario" to="/solicitudes/nueva">Registrar la primera</Link>}
          </div>
        ) : (
          <table className="tabla">
            <thead>
              <tr><th>Código</th><th>Categoría</th><th>Ubicación</th><th>Fecha</th><th>Prioridad</th><th>Estado</th><th>Plazo</th><th>Responsable</th><th><span className="sr-only">Detalle</span></th></tr>
            </thead>
            <tbody>
              {visibles.map((s) => (
                <tr key={s.id}>
                  <td data-label="Código"><Link to={`/solicitudes/${s.id}`} className="codigo">{s.codigo}</Link></td>
                  <td data-label="Categoría">{s.categoria}</td>
                  <td data-label="Ubicación" className="celda-fuerte">{s.ubicacion}</td>
                  <td data-label="Fecha" className="sin-corte">{new Date(s.fechaRegistro).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td data-label="Prioridad"><Prioridad nombre={s.prioridad} /></td>
                  <td data-label="Estado"><BadgeEstado estado={s.estado} /></td>
                  <td data-label="Plazo"><Plazo s={s} /></td>
                  <td data-label="Responsable">{s.tecnico || <span className="tenue">Sin asignar</span>}</td>
                  <td data-label="Detalle"><Link className="btn btn--ghost btn--sm" to={`/solicitudes/${s.id}`}>Ver detalle</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {lista !== null && <div className="tabla__pie">Mostrando {visibles.length} de {lista.length} solicitud(es)</div>}
      </div>
    </section>
  );
}
