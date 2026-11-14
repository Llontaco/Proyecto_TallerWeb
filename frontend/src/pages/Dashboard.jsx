import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Barras, Cargando, Kpi } from '../components/ui.jsx';

export default function Dashboard() {
  const [filtros, setFiltros] = useState({ desde: '', hasta: '' });
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard(filtros).then(setD).catch((err) => setError(err.message));
  }, [filtros]);

  const cambiar = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

  return (
    <section className="contenedor">
      <div className="encabezado">
        <h1>Dashboard de atención</h1>
        <form className="rango" onSubmit={(e) => e.preventDefault()}>
          <label htmlFor="desde">Desde</label>
          <input id="desde" name="desde" type="date" value={filtros.desde} onChange={cambiar} />
          <label htmlFor="hasta">Hasta</label>
          <input id="hasta" name="hasta" type="date" value={filtros.hasta} onChange={cambiar} />
        </form>
      </div>
      {error && <p className="alerta" role="alert">{error}</p>}
      {!d ? <Cargando /> : (
        <>
          <div className="kpis">
            <Kpi titulo="Registradas" valor={d.registradas} nota="en el periodo" />
            <Kpi titulo="Pendientes" valor={d.pendientes} nota="sin resolver" />
            <Kpi titulo="Atendidas" valor={d.atendidas} nota="resueltas + cerradas" />
            <Kpi titulo="% resueltas" valor={`${d.porcentajeResueltas}%`} />
            <Kpi titulo="Tiempo promedio" valor={`${d.tiempoPromedioHoras} h`} nota="registro → resolución" />
            <Kpi titulo="Vencidas" valor={d.vencidas} nota="superan su tiempo máximo" alerta={d.vencidas > 0} />
          </div>
          <div className="grid-graficos">
            <Barras titulo="Por estado" datos={d.porEstado} />
            <Barras titulo="Por categoría" datos={d.porCategoria} />
            <Barras titulo="Por prioridad" datos={d.porPrioridad} />
            <Barras titulo="Por responsable" datos={d.porResponsable} />
          </div>
        </>
      )}
    </section>
  );
}
