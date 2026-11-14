import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { MENU, ROL_TEXTO, iniciales, inicioDe } from '../constants.js';
import Icono from './Iconos.jsx';
import Campana from './Campana.jsx';
import escudo from '../assets/escudo-unmsm.png';

const CLAVE_COLAPSADO = 'sigsu_sidebar_colapsado';

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [abierto, setAbierto] = useState(false); // menú en celular
  const [colapsado, setColapsado] = useState(() => localStorage.getItem(CLAVE_COLAPSADO) === '1'); // escritorio
  const [busqueda, setBusqueda] = useState('');

  // Al cambiar de página se cierra el menú en celular.
  useEffect(() => { setAbierto(false); }, [location.pathname]);

  function alternarMenu() {
    if (window.matchMedia('(min-width: 960px)').matches) {
      const nuevo = !colapsado;
      setColapsado(nuevo);
      localStorage.setItem(CLAVE_COLAPSADO, nuevo ? '1' : '0');
    } else {
      setAbierto(!abierto);
    }
  }

  function buscar(e) {
    e.preventDefault();
    const q = busqueda.trim();
    navigate(`/solicitudes${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    setBusqueda('');
  }

  const enlaces = [...MENU[usuario.rol], ['/cuenta', 'Mi perfil', 'usuario']];

  return (
    <div className={`app${colapsado ? ' app--colapsada' : ''}${abierto ? ' app--menu-abierto' : ''}`}>
      <a className="saltar" href="#contenido">Saltar al contenido</a>

      <aside className="sidebar" aria-label="Menú principal">
        <Link className="sidebar__marca" to={inicioDe(usuario.rol)}>
          <span className="sidebar__logo" aria-hidden="true"><img src={escudo} alt="" width="36" height="42" /></span>
          <span className="sidebar__texto">
            <strong>SIGSU</strong>
            <small>Gestión de servicios</small>
          </span>
        </Link>
        <nav className="sidebar__nav">
          {enlaces.map(([ruta, texto, icono]) => (
            <NavLink key={ruta} to={ruta} end title={texto}
                     className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--activo' : ''}`}>
              <Icono nombre={icono} />
              <span className="sidebar__texto">{texto}</span>
            </NavLink>
          ))}
        </nav>
        <Link to="/cuenta" className="sidebar__usuario" title={usuario.nombre}>
          <span className="avatar">{iniciales(usuario.nombre)}</span>
          <span className="sidebar__texto">
            <strong>{usuario.nombre}</strong>
            <small>{ROL_TEXTO[usuario.rol]}</small>
          </span>
        </Link>
      </aside>
      <div className="sidebar__velo" onClick={() => setAbierto(false)} aria-hidden="true" />

      <div className="principal">
        <header className="topbar">
          <button type="button" className="icono-btn" onClick={alternarMenu} aria-label="Mostrar u ocultar menú">
            <Icono nombre="menu" />
          </button>
          <form className="topbar__buscar" onSubmit={buscar} role="search">
            <Icono nombre="buscar" size={18} />
            <input type="search" placeholder="Buscar solicitud por código, ubicación o descripción"
                   aria-label="Buscar solicitud" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </form>
          <div className="topbar__acciones">
            <Campana />
            <button type="button" className="icono-btn" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
              <Icono nombre="salir" />
            </button>
            <Link to="/cuenta" className="avatar avatar--claro" title="Mi perfil">{iniciales(usuario.nombre)}</Link>
          </div>
        </header>
        <main id="contenido" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="pie">SIGSU v0.3 · Taller de Construcción de Software Web</footer>
      </div>
    </div>
  );
}
