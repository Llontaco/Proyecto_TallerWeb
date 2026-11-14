/** Íconos SVG en línea (sin dependencias). Heredan el color del texto con currentColor. */
const RUTAS = {
  inicio: <><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>,
  lista: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 3v2h6V3M9 10h6M9 14h6M9 18h3" /></>,
  mas: <path d="M12 5v14M5 12h14" />,
  grafico: <><path d="M3 3v18h18" /><path d="M7 15v3M12 10v8M17 6v12" /></>,
  ajustes: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
  usuario: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  herramienta: <><path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.3-1.3a4 4 0 0 1-5-5z" /><path d="M3 21l6-6" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  buscar: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  salir: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  reloj: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
  check: <path d="M5 12l5 5L20 7" />,
  alerta: <><path d="M12 3l10 18H2z" /><path d="M12 10v4M12 18h.01" /></>,
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  campana: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>
};

export default function Icono({ nombre, size = 20, className = '' }) {
  return (
    <svg className={`icono ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {RUTAS[nombre]}
    </svg>
  );
}
