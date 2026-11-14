import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import Icono from './Iconos.jsx';

const INTERVALO_MS = 30000;

function haceCuanto(iso) {
  const min = Math.round((Date.now() - new Date(iso)) / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} d`;
}

/** Campana de notificaciones (HU-13): consulta la API cada 30 s y muestra las últimas 20. */
export default function Campana() {
  const [bandeja, setBandeja] = useState({ noLeidas: 0, items: [] });
  const [abierta, setAbierta] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const cargar = useCallback(() => {
    api.notificaciones().then(setBandeja).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, INTERVALO_MS);
    return () => clearInterval(t);
  }, [cargar]);

  // Cierra el panel al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!abierta) return undefined;
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierta(false); };
    const escape = (e) => { if (e.key === 'Escape') setAbierta(false); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', escape); };
  }, [abierta]);

  async function abrir(n) {
    setAbierta(false);
    if (!n.leida) await api.marcarNotificacion(n.id).catch(() => {});
    cargar();
    if (n.solicitudId) navigate(`/solicitudes/${n.solicitudId}`);
  }

  async function marcarTodas() {
    await api.marcarTodasNotificaciones().catch(() => {});
    cargar();
  }

  return (
    <div className="campana" ref={ref}>
      <button type="button" className="icono-btn" onClick={() => { setAbierta(!abierta); if (!abierta) cargar(); }}
              aria-label={`Notificaciones${bandeja.noLeidas ? `, ${bandeja.noLeidas} sin leer` : ''}`} aria-expanded={abierta}>
        <Icono nombre="campana" />
        {bandeja.noLeidas > 0 && <span className="campana__contador">{bandeja.noLeidas > 9 ? '9+' : bandeja.noLeidas}</span>}
      </button>
      {abierta && (
        <div className="campana__panel" role="dialog" aria-label="Notificaciones">
          <div className="campana__cabecera">
            <strong>Notificaciones</strong>
            {bandeja.noLeidas > 0 && <button type="button" className="enlace" onClick={marcarTodas}>Marcar todas como leídas</button>}
          </div>
          {bandeja.items.length === 0 ? (
            <p className="campana__vacio">No tienes notificaciones.</p>
          ) : (
            <ul className="campana__lista">
              {bandeja.items.map((n) => (
                <li key={n.id}>
                  <button type="button" className={`campana__item${n.leida ? '' : ' campana__item--nueva'}`} onClick={() => abrir(n)}>
                    <span className="campana__mensaje">{n.mensaje}</span>
                    <span className="campana__fecha">{haceCuanto(n.fecha)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
