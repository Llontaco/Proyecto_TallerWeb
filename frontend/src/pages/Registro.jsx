import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { Campo } from '../components/ui.jsx';

const INICIAL = { nombre: '', correo: '', tipo: 'Estudiante', password: '', password2: '' };

export default function Registro() {
  const [datos, setDatos] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const errs = {};
    if (datos.nombre.trim().length < 3) errs.nombre = 'Ingresa tu nombre completo';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) errs.correo = 'Ingresa un correo válido';
    if (datos.password.length < 8) errs.password = 'La contraseña debe tener al menos 8 caracteres';
    else if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(datos.password) || !/\d/.test(datos.password)) errs.password = 'La contraseña debe incluir letras y números';
    if (datos.password !== datos.password2) errs.password2 = 'Las contraseñas no coinciden';
    setErrores(errs);
    if (Object.keys(errs).length) return;

    setEnviando(true);
    setError('');
    try {
      const { password2, ...cuerpo } = datos;
      await api.registro(cuerpo);
      toast('Cuenta creada. Ya puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      setErrores(err.errores);
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="contenedor contenedor--angosto">
      <form className="card" onSubmit={enviar} noValidate>
        <h1>Crear cuenta</h1>
        <Campo id="nombre" etiqueta="Nombre completo" error={errores.nombre}>
          <input id="nombre" name="nombre" autoComplete="name" value={datos.nombre} onChange={cambiar} />
        </Campo>
        <Campo id="correo" etiqueta="Correo institucional" error={errores.correo}>
          <input id="correo" name="correo" type="email" autoComplete="email" placeholder="nombre@uni.edu.pe"
                 value={datos.correo} onChange={cambiar} />
        </Campo>
        <Campo id="tipo" etiqueta="Soy">
          <select id="tipo" name="tipo" value={datos.tipo} onChange={cambiar}>
            <option>Estudiante</option>
            <option>Docente</option>
            <option>Personal administrativo</option>
          </select>
        </Campo>
        <Campo id="password" etiqueta="Contraseña" ayuda="Mínimo 8 caracteres, con letras y números" error={errores.password}>
          <input id="password" name="password" type="password" autoComplete="new-password" value={datos.password} onChange={cambiar} />
        </Campo>
        <Campo id="password2" etiqueta="Repite la contraseña" error={errores.password2}>
          <input id="password2" name="password2" type="password" autoComplete="new-password" value={datos.password2} onChange={cambiar} />
        </Campo>
        {error && <p className="alerta" role="alert">{error}</p>}
        <button className="btn btn--primario btn--bloque" type="submit" disabled={enviando}>
          {enviando ? 'Creando…' : 'Crear cuenta'}
        </button>
        <p className="auth__alt">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </form>
    </section>
  );
}
