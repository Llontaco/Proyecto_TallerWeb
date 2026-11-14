import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Campo } from '../components/ui.jsx';
import { inicioDe } from '../constants.js';

const CLAVE_RECORDAR = 'sigsu_recordar_correo';
const DEMOS = [
  ['Estudiante', 'estudiante@uni.edu.pe'],
  ['Técnico', 'tecnico@uni.edu.pe'],
  ['Supervisor', 'supervisor@uni.edu.pe'],
  ['Administrador', 'admin@uni.edu.pe']
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  // localStorage: el correo recordado sobrevive al cerrar el navegador (nunca la contraseña).
  const [correo, setCorreo] = useState(() => localStorage.getItem(CLAVE_RECORDAR) || '');
  const [password, setPassword] = useState('');
  const [recordar, setRecordar] = useState(() => Boolean(localStorage.getItem(CLAVE_RECORDAR)));
  const [errores, setErrores] = useState({});
  const expirada = new URLSearchParams(location.search).has('expirada');
  const [error, setError] = useState(expirada ? 'Tu sesión expiró. Vuelve a iniciar sesión.' : '');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const errs = {};
    if (!correo.trim()) errs.correo = 'Ingresa tu correo';
    if (!password) errs.password = 'Ingresa tu contraseña';
    setErrores(errs);
    if (Object.keys(errs).length) return;

    setEnviando(true);
    setError('');
    try {
      const u = await login(correo, password);
      if (recordar) localStorage.setItem(CLAVE_RECORDAR, correo.trim());
      else localStorage.removeItem(CLAVE_RECORDAR);
      toast(`Bienvenido(a), ${u.nombre}`);
      navigate(location.state?.desde || inicioDe(u.rol), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="auth">
      <div className="auth__marca">
        <h1>SIGSU</h1>
        <p>Sistema Integral de Gestión de Servicios Universitarios</p>
        <ul className="auth__beneficios">
          <li>Registra solicitudes de mantenimiento, soporte y trámites</li>
          <li>Sigue el estado de tu pedido en tiempo real</li>
          <li>Sin correos perdidos ni llamadas repetidas</li>
        </ul>
      </div>
      <form className="card auth__form" onSubmit={enviar} noValidate>
        <h2>Iniciar sesión</h2>
        <Campo id="correo" etiqueta="Correo institucional" error={errores.correo}>
          <input id="correo" type="email" autoComplete="username" placeholder="nombre@uni.edu.pe"
                 value={correo} onChange={(e) => setCorreo(e.target.value)} aria-invalid={Boolean(errores.correo)} />
        </Campo>
        <Campo id="password" etiqueta="Contraseña" error={errores.password}>
          <input id="password" type="password" autoComplete="current-password"
                 value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(errores.password)} />
        </Campo>
        <label className="check">
          <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
          Recordar mi correo en este equipo
        </label>
        {error && <p className="alerta" role="alert">{error}</p>}
        <button className="btn btn--primario btn--bloque" type="submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <p className="auth__alt">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
        <details className="demo">
          <summary>Usuarios de demostración</summary>
          <p>Contraseña definida en <code>SEED_DEMO_PASSWORD</code> del backend.</p>
          <div className="demo__botones">
            {DEMOS.map(([texto, c]) => (
              <button key={c} type="button" onClick={() => setCorreo(c)}>{texto}</button>
            ))}
          </div>
        </details>
      </form>
    </section>
  );
}
