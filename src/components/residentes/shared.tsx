import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../api/apiClient';
import { useAuth } from '../../auth/AuthContext';
import { USER_ROLES } from '../../auth/roles';

export const cardStyle = { background: 'var(--card)', border: '1px solid var(--border)' };
export const inputStyle = { border: '1.5px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' };
export const primaryStyle = { background: 'var(--primary)', color: 'var(--primary-foreground)' };

export function useResidentesPermissions() {
  const { user } = useAuth();
  return {
    canRead: !!user && USER_ROLES.includes(user.rol),
    canWrite: user?.rol === 'ADMINISTRADOR' || user?.rol === 'ADMINISTRATIVO',
  };
}

export function formatFecha(value: string | null) {
  if (!value) return '—';
  const parts = value.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 403 ? `Acceso no autorizado. ${error.message}` : error.message;
  }
  return 'No fue posible conectar con el servidor. Intente nuevamente.';
}

export function fieldErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!(error instanceof ApiError) || !error.body || typeof error.body !== 'object') return result;
  if (!('fieldErrors' in error.body) || !Array.isArray(error.body.fieldErrors)) return result;
  for (const item of error.body.fieldErrors) {
    if (item && typeof item.field === 'string' && typeof item.message === 'string') result[item.field] = item.message;
  }
  return result;
}

export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return <div role="alert" className="rounded-lg p-4 text-sm" style={{ background: '#FEF2F2', color: '#991B1B' }}>
    {message}
    {retry && <button type="button" onClick={retry} className="ml-3 underline font-medium">Reintentar</button>}
  </div>;
}

export function EstadoBadge({ estado }: { estado: string }) {
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--muted)', color: 'var(--primary)' }}>{estado}</span>;
}

// Cada cambio de clave cancela la lectura anterior y descarta respuestas tardías.
export function useApiResource<T>(loader: (signal: AbortSignal) => Promise<T>, key: string, enabled = true) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ key: string; data?: T; loading: boolean; error: string }>({ key, loading: true, error: '' });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState({ key, loading: true, error: '' });
    loaderRef.current(controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ key, data, loading: false, error: '' });
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setState({ key, loading: false, error: errorMessage(error) });
    });
    return () => controller.abort();
  }, [key, revision, enabled]);
  return {
    ...(state.key === key ? state : { data: undefined, loading: true, error: '' }),
    reload: () => setRevision(value => value + 1),
  };
}
