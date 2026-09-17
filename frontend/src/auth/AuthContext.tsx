import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authControllerLogin, authControllerLogout } from '../api/generated/auth/auth';
import { usersControllerMe } from '../api/generated/users/users';
import { refreshAccessToken } from '../api/axios-instance';
import { onSessionExpired, setAccessToken } from '../api/auth-tokens';
import type { AuthUser } from './auth.types';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: Status;
  login: (login: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  marcarSenhaTrocada: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const queryClient = useQueryClient();

  const encerrarSessaoLocal = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus('unauthenticated');
    queryClient.clear();
  }, [queryClient]);

  // Sessão expira em outra aba, ou o refresh falha em background (ex: token revogado) —
  // qualquer chamada que passe pelo interceptor de resposta do axios cai aqui.
  useEffect(() => onSessionExpired(encerrarSessaoLocal), [encerrarSessaoLocal]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        await refreshAccessToken();
        const me = await usersControllerMe();
        if (cancelado) return;
        setUser({ role: me.role, precisaTrocarSenha: me.precisaTrocarSenha });
        setStatus('authenticated');
      } catch {
        if (!cancelado) {
          setAccessToken(null);
          setStatus('unauthenticated');
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const login = useCallback(async (loginValue: string, senha: string) => {
    const resposta = await authControllerLogin({ login: loginValue, senha });
    setAccessToken(resposta.accessToken);
    setUser({ role: resposta.role, precisaTrocarSenha: resposta.precisaTrocarSenha });
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authControllerLogout();
    } finally {
      encerrarSessaoLocal();
    }
  }, [encerrarSessaoLocal]);

  const marcarSenhaTrocada = useCallback(() => {
    setUser((atual) => (atual ? { ...atual, precisaTrocarSenha: false } : atual));
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout, marcarSenhaTrocada }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
