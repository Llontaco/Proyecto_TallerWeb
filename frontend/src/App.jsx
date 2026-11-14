import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { useToast } from './context/ToastContext.jsx';
import { inicioDe } from './constants.js';
import { Cargando } from './components/ui.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Registro from './pages/Registro.jsx';
import Solicitudes from './pages/Solicitudes.jsx';
import FormularioSolicitud from './pages/FormularioSolicitud.jsx';
import DetalleSolicitud from './pages/DetalleSolicitud.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import Cuenta from './pages/Cuenta.jsx';

/** Protege rutas: exige sesión y, si se indican, roles concretos. */
function RutaProtegida({ roles, children }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const sinPermiso = usuario && roles && !roles.includes(usuario.rol);

  useEffect(() => {
    if (sinPermiso) toast('No tienes permiso para ver esa página', 'error');
  }, [sinPermiso, toast]);

  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  if (sinPermiso) return <Navigate to={inicioDe(usuario.rol)} replace />;
  return children;
}

function SoloPublica({ children }) {
  const { usuario } = useAuth();
  return usuario ? <Navigate to={inicioDe(usuario.rol)} replace /> : children;
}

export default function App() {
  const { usuario, verificando } = useAuth();
  if (verificando) return <Cargando texto="Verificando sesión…" />;

  return (
    <Routes>
      <Route path="/login" element={<SoloPublica><Login /></SoloPublica>} />
      <Route path="/registro" element={<SoloPublica><Registro /></SoloPublica>} />
      <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route path="/solicitudes" element={<Solicitudes />} />
        <Route path="/solicitudes/nueva" element={<RutaProtegida roles={['ESTUDIANTE']}><FormularioSolicitud /></RutaProtegida>} />
        <Route path="/solicitudes/:id" element={<DetalleSolicitud />} />
        <Route path="/solicitudes/:id/editar" element={<RutaProtegida roles={['ESTUDIANTE']}><FormularioSolicitud /></RutaProtegida>} />
        <Route path="/dashboard" element={<RutaProtegida roles={['SUPERVISOR', 'ADMIN']}><Dashboard /></RutaProtegida>} />
        <Route path="/admin" element={<RutaProtegida roles={['ADMIN']}><Admin /></RutaProtegida>} />
        <Route path="/cuenta" element={<Cuenta />} />
      </Route>
      <Route path="*" element={<Navigate to={usuario ? inicioDe(usuario.rol) : '/login'} replace />} />
    </Routes>
  );
}
