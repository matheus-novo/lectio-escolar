import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from '../services/api';
import { usuarioService } from '../services/usuarioService';
import {
  type LoginDto,
  normalizePerfilUsuario,
  type PerfilUsuario,
  type Usuario,
} from '../types';

interface JwtPayloadClaims {
  nameid?: string;
  role?: string;
  email?: string;
  exp?: number;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
}

function parseJwtClaims(token: string): {
  id?: number;
  role?: PerfilUsuario;
  isExpired: boolean;
} {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isExpired: true };
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const claims = JSON.parse(jsonPayload) as JwtPayloadClaims;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const isExpired = typeof claims.exp === 'number' ? claims.exp <= nowSeconds : false;

    const rawId =
      claims.nameid ??
      claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    const rawRole =
      claims.role ??
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    return {
      id: rawId ? Number(rawId) : undefined,
      role: rawRole ? normalizePerfilUsuario(rawRole) : undefined,
      isExpired,
    };
  } catch {
    return { isExpired: true };
  }
}

function getInitialStoredUser(): Usuario | null {
  const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const storedUserRaw = localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!storedToken || !storedUserRaw) {
    return null;
  }

  const { id, role: claimRole, isExpired } = parseJwtClaims(storedToken);
  if (isExpired) {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUserRaw) as Usuario;
    return {
      ...parsedUser,
      id: id ?? parsedUser.id,
      perfil: claimRole ?? normalizePerfilUsuario(parsedUser.perfil),
    };
  } catch {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export interface AuthContextData {
  user: Usuario | null;
  isAuthenticated: boolean;
  role: PerfilUsuario | null;
  loading: boolean;
  login: (credentials: LoginDto) => Promise<Usuario>;
  logout: () => void;
  updateProfileState: (updatedData: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Usuario | null>(() => getInitialStoredUser());
  const [loading, setLoading] = useState<boolean>(false);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('lectio:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('lectio:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = useCallback(async (credentials: LoginDto): Promise<Usuario> => {
    setLoading(true);
    try {
      const response = await usuarioService.login(credentials);
      const claims = parseJwtClaims(response.token);

      const authenticatedUser: Usuario = {
        ...response.usuario,
        id: claims.id ?? response.usuario.id,
        perfil: claims.role ?? response.usuario.perfil,
      };

      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, response.token);
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);

      return authenticatedUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfileState = useCallback((updatedData: Partial<Usuario>) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const nextUser: Usuario = { ...prevUser, ...updatedData };
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const contextValue = useMemo<AuthContextData>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      role: user?.perfil ?? null,
      loading,
      login,
      logout,
      updateProfileState,
    }),
    [user, loading, login, logout, updateProfileState]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }
  return context;
}
