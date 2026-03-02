import { create } from 'zustand';
import type { DailyPresence, TripDay } from 'src/@types/trip.types';
import { getTodayISO } from '@utils/formatters';

// ─── State Interface ──────────────────────────────────────────────────────────

interface TripState {
  todayPresences: DailyPresence[];
  selectedDate: string;
  tripDay: TripDay | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTodayPresences: (presences: DailyPresence[]) => void;
  updatePresence: (id: string, updates: Partial<DailyPresence>) => void;
  setTripDay: (tripDay: TripDay | null) => void;
  setSelectedDate: (date: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  todayPresences: [] as DailyPresence[],
  selectedDate: getTodayISO(),
  tripDay: null,
  isLoading: false,
  error: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTripStore = create<TripState>((set) => ({
  ...initialState,

  setTodayPresences: (todayPresences) => set({ todayPresences }),

  updatePresence: (id, updates) =>
    set((state) => ({
      todayPresences: state.todayPresences.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),

  setTripDay: (tripDay) => set({ tripDay }),

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () => set(initialState),
}));
