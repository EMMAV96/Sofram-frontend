import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>Cargando sesión...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}