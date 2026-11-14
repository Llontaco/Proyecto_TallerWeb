import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onSesionExpirada } from '../api/client.js';

const AuthContext = createContext(null);
const CLAVE_USUARIO = 'sigsu_usuario';

// sessionStorage: el perfil del usuario dura lo que dura la pestaña. El token NO se guarda aquí:
// vive en una cookie HttpOnly que JavaScript no puede leer.
function leerUsuarioGuardado() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_USUARIO));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);
  const [verificando, setVerificando] = useState(true);

  const guardar = useCallback((u) => {
    setUsuario(u);
    if (u) sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(u));
    else sessionStorage.removeItem(CLAVE_USUARIO);
  }, []);

  // Al cargar la app, confirma con el servidor si la cookie de sesión sigue siendo válida.
  useEffect(() => {
    api.yo()
      .then(guardar)
      .catch(() => guardar(null))
      .finally(() => setVerificando(false));
  }, [guardar]);

  // Al cerrar o perder la sesión se recarga la app en /login: así no queda en memoria
  // ningún dato del usuario anterior (estado de React, listas, formularios).
  useEffect(() => {
    onSesionExpirada(() => {
      sessionStorage.removeItem(CLAVE_USUARIO);
      window.location.replace('/login?expirada=1');
    });
  }, []);

  const login = useCallback(async (correo, password) => {
    const { usuario: u } = await api.login(correo, password);
    guardar(u);
    return u;
  }, [guardar]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      sessionStorage.removeItem(CLAVE_USUARIO);
      window.location.replace('/login');
    }
  }, []);

  const valor = useMemo(() => ({ usuario, verificando, login, logout }), [usuario, verificando, login, logout]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
