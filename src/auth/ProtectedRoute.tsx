import type { Role } from './roles';
import { ErrorNotice } from '../components/residentes/shared';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ canAccess }: { canAccess?: (role: Role | undefined) => boolean } = {}) {
  const { loading, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}>Cargando sesión...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (canAccess && !canAccess(role)) return <ErrorNotice message="Acceso no autorizado." />;
  return <Outlet />;
}