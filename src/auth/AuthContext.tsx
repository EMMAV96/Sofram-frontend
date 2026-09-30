import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, setUnauthorizedHandler } from '../api/apiClient';
import { getCurrentUser, login as loginRequest, type CurrentUserResponse, type LoginRequest } from '../api/authApi';
import { clearStoredToken, getStoredToken, setStoredToken } from '../api/tokenStorage';
import { getUserRole, type Role } from './roles';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  loading: boolean;
  isAuthenticated: boolean;
  user: CurrentUserResponse | null;
  role: Role | undefined;
  login: (request: LoginRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<CurrentUserResponse | null>(null);

  function logout(redirect = true) {
    clearStoredToken();
    setUser(null);
    setStatus('unauthenticated');
    if (redirect) window.location.assign('/login');
  }

  useEffect(() => {
    const handleUnauthorized = () => logout();
    setUnauthorizedHandler(handleUnauthorized);

    const storedToken = getStoredToken();
    if (!storedToken) {
      setStatus('unauthenticated');
      return () => setUnauthorizedHandler(undefined);
    }

    getCurrentUser()
      .then(currentUser => {
        setUser(currentUser);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) return;
        logout(false);
      });

    return () => setUnauthorizedHandler(undefined);
  }, []);

  async function login(request: LoginRequest): Promise<void> {
    const response = await loginRequest(request);
    setStoredToken(response.accessToken);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setStatus('authenticated');
  }

  const value = useMemo(() => ({
    loading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    user,
    role: user ? getUserRole(user.rol) : undefined,
    login,
    logout: () => logout(),
  }), [status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe utilizarse dentro de AuthProvider.');
  return context;
}