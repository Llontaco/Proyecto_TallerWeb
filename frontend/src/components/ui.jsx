import { ESTADOS, ETIQUETA_ESTADO } from '../constants.js';

/** Componentes pequeños y reutilizables de la interfaz. */

export function BadgeEstado({ estado }) {
  return <span className={`badge badge--${estado.toLowerCase()}`}>{ETIQUETA_ESTADO[estado]}</span>;
}

export function Prioridad({ nombre }) {
  const clase = (nombre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return <span className={`prio prio--${clase}`}>{nombre}</span>;
}

export function Vencida() {
  return <span className="vencida" title="Superó el tiempo máximo de su prioridad">Vencida</span>;
}

export function Cargando({ texto = 'Cargando…' }) {
  return <div className="cargando" aria-live="polite">{texto}</div>;
}

export function Vacio({ children }) {
  return <div className="vacio card">{children}</div>;
}

/** Envuelve un control de formulario con su etiqueta, ayuda y mensaje de error. */
export function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {ayuda && <span className="campo__ayuda">{ayuda}</span>}
      <span className="campo__error" role={error ? 'alert' : undefined}>{error}</span>
    </div>
  );
}

export function FlujoEstados({ actual }) {
  const idx = ESTADOS.findIndex(([k]) => k === actual);
  return (
    <ol className="flujo" aria-label="Avance de la solicitud">
      {ESTADOS.map(([k, texto], i) => (
        <li key={k} className={`flujo__paso${i < idx ? ' flujo__paso--hecho' : ''}${i === idx ? ' flujo__paso--actual' : ''}`}
            aria-current={i === idx ? 'step' : undefined}>
          {texto}
        </li>
      ))}
    </ol>
  );
}

export function Barras({ titulo, datos }) {
  const entradas = Object.entries(datos || {}).filter(([, v]) => v > 0);
  const max = Math.max(1, ...entradas.map(([, v]) => v));
  return (
    <article className="card">
      <h2>{titulo}</h2>
      {entradas.length === 0 ? <p className="tenue">Sin datos</p> : (
        <ul className="barras">
          {entradas.map(([k, v]) => (
            <li key={k}>
              <span className="barras__etiqueta">{k}</span>
              <span className="barras__pista"><span className="barras__valor" style={{ width: `${(v / max) * 100}%` }} /></span>
              <span className="barras__num">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function Kpi({ titulo, valor, nota, alerta }) {
  return (
    <div className={`kpi card${alerta ? ' kpi--alerta' : ''}`}>
      <span className="kpi__titulo">{titulo}</span>
      <span className="kpi__valor">{valor}</span>
      {nota && <span className="kpi__nota">{nota}</span>}
    </div>
  );
}
