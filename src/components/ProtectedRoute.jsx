import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, token } = useContext(AuthContext);

  // 1. Si no hay token ni usuario guardado en el localStorage, al login directo
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si el usuario está logueado pero su rol no está autorizado para esta pantalla
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Si es operario y pretende entrar a la oficina, le mandamos a su app móvil
    if (user.rol === 'operario') return <Navigate to="/operario" replace />;
    // Al revés, si el admin pretende ir al móvil, le mandamos a la oficina
    return <Navigate to="/" replace />;
  }

  // 3. Si todo está correcto, le dejamos pasar a la página correspondiente
  return <Outlet />;
};