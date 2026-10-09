import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { TOKEN_KEY } from '../api/client';
import { authApi } from '../api/endpoints';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** true mientras se recupera la sesión guardada al cargar la app. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Permiso efectivo, p. ej. can('syllabus:update'). */
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  // Al recargar, /me devuelve el usuario con sus permisos vigentes.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user: userData } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  };

  const logout = () => {
    authApi.logout().catch(() => undefined);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const can = useCallback((permission: string) => !!user?.permissions.includes(permission), [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
