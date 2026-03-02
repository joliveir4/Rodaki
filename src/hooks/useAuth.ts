import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@store/auth.store';
import { authService } from '@services/auth.service';
import type { AuthCredentials, RegisterData } from 'src/@types/user.types';

// ─── useAuth ──────────────────────────────────────────────────────────────────
// Orquestra autenticação: estado global + serviço Firebase

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, error, setUser, setLoading, setError, signOut } =
    useAuthStore();

  // ─── Listener de sessão (executado uma vez no mount do AuthNavigator) ──────
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await authService.fetchUserData(firebaseUser.uid);
          setUser(userData);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const login = useCallback(
    async (credentials: AuthCredentials) => {
      try {
        setLoading(true);
        const userData = await authService.login(credentials);
        setUser(userData);
      } catch (err: any) {
        const message = mapFirebaseError(err.code);
        setError(message);
      }
    },
    [],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      try {
        setLoading(true);
        const userData = await authService.register(data);
        setUser(userData);
      } catch (err: any) {
        const message = mapFirebaseError(err.code);
        setError(message);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    signOut();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
  };
};

// ─── Firebase Error Messages (pt-BR) ─────────────────────────────────────────

function mapFirebaseError(code: string): string {
  const messages: Record<string, string> = {
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/email-already-in-use': 'E-mail já cadastrado',
    'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres)',
    'auth/invalid-email': 'E-mail inválido',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos',
    'auth/network-request-failed': 'Sem conexão com a internet',
  };
  return messages[code] ?? 'Ocorreu um erro. Tente novamente';
}
