import { create } from 'zustand';
import type { Passenger } from 'src/@types/user.types';

// ─── State Interface ──────────────────────────────────────────────────────────

interface PassengersState {
  passengers: Passenger[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setPassengers: (passengers: Passenger[]) => void;
  addPassenger: (passenger: Passenger) => void;
  updatePassenger: (id: string, updates: Partial<Passenger>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePassengersStore = create<PassengersState>((set) => ({
  passengers: [],
  isLoading: false,
  error: null,

  setPassengers: (passengers) => set({ passengers, isLoading: false, error: null }),

  addPassenger: (passenger) =>
    set((state) => ({
      passengers: [passenger, ...state.passengers],
    })),

  updatePassenger: (id, updates) =>
    set((state) => ({
      passengers: state.passengers.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () => set({ passengers: [], isLoading: false, error: null }),
}));
