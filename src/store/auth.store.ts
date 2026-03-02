import { create } from 'zustand';
import type { User, Driver, Passenger } from 'src/@types/user.types';

// ─── State Interface ──────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,   // true inicial para verificar sessão salva
  error: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  signOut: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }),
}));

// ─── Selector Helpers ─────────────────────────────────────────────────────────

export const selectIsDriver = (state: AuthState) =>
  state.user?.role === 'driver';

export const selectIsPassenger = (state: AuthState) =>
  state.user?.role === 'passenger';

export const selectAsDriver = (state: AuthState): Driver | null =>
  state.user?.role === 'driver' ? (state.user as Driver) : null;

export const selectAsPassenger = (state: AuthState): Passenger | null =>
  state.user?.role === 'passenger' ? (state.user as Passenger) : null;
