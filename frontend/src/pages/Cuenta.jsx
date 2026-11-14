import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Campo } from '../components/ui.jsx';
import { ROL_TEXTO } from '../constants.js';

export default function Cuenta() {
  const { usuario } = useAuth();
  const toast = useToast();
  const [datos, setDatos] = useState({ actual: '', nueva: '', nueva2: '' });
  const [errores, setErrores] = useState({});

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const errs = {};
    if (!datos.actual) errs.actual = 'Ingresa tu contraseña actual';
    if (datos.nueva.length < 8) errs.nueva = 'La contraseña debe tener al menos 8 caracteres';
    else if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(datos.nueva) || !/\d/.test(datos.nueva)) errs.nueva = 'La contraseña debe incluir letras y números';
    if (datos.nueva !== datos.nueva2) errs.nueva2 = 'Las contraseñas no coinciden';
    setErrores(errs);
    if (Object.keys(errs).length) return;
    try {
      await api.cambiarPassword(datos.actual, datos.nueva);
      toast('Contraseña actualizada');
      setDatos({ actual: '', nueva: '', nueva2: '' });
    } catch (err) {
      setErrores(err.errores);
      if (!Object.keys(err.errores).length) toast(err.message, 'error');
    }
  }

  return (
    <section className="contenedor contenedor--angosto">
      <article className="card">
        <h1>Mi cuenta</h1>
        <dl className="datos">
          <dt>Nombre</dt><dd>{usuario.nombre}</dd>
          <dt>Correo</dt><dd>{usuario.correo}</dd>
          <dt>Rol</dt><dd>{ROL_TEXTO[usuario.rol]}</dd>
        </dl>
      </article>
      <form className="card" onSubmit={enviar} noValidate>
        <h2>Cambiar contraseña</h2>
        <Campo id="actual" etiqueta="Contraseña actual" error={errores.actual}>
          <input id="actual" name="actual" type="password" autoComplete="current-password" value={datos.actual} onChange={cambiar} />
        </Campo>
        <Campo id="nueva" etiqueta="Nueva contraseña" error={errores.nueva}>
          <input id="nueva" name="nueva" type="password" autoComplete="new-password" value={datos.nueva} onChange={cambiar} />
        </Campo>
        <Campo id="nueva2" etiqueta="Repite la nueva contraseña" error={errores.nueva2}>
          <input id="nueva2" name="nueva2" type="password" autoComplete="new-password" value={datos.nueva2} onChange={cambiar} />
        </Campo>
        <button className="btn btn--primario btn--bloque" type="submit">Actualizar contraseña</button>
      </form>
    </section>
  );
}
