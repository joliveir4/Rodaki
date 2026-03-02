import { create } from 'zustand';
import type { Payment, PaymentStatus } from 'src/@types/payment.types';
import { getCurrentMonthISO } from '@utils/formatters';

// ─── State Interface ──────────────────────────────────────────────────────────

interface PaymentState {
  payments: Payment[];
  currentMonthPayment: Payment | null;
  pendingReviews: Payment[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;

  // Actions
  setPayments: (payments: Payment[]) => void;
  setCurrentMonthPayment: (payment: Payment | null) => void;
  setPendingReviews: (payments: Payment[]) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus, notes?: string) => void;
  setUploading: (uploading: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ─── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  payments: [] as Payment[],
  currentMonthPayment: null,
  pendingReviews: [] as Payment[],
  isLoading: false,
  isUploading: false,
  error: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePaymentStore = create<PaymentState>((set) => ({
  ...initialState,

  setPayments: (payments) => set({ payments }),

  setCurrentMonthPayment: (currentMonthPayment) => set({ currentMonthPayment }),

  setPendingReviews: (pendingReviews) => set({ pendingReviews }),

  updatePaymentStatus: (id, status, reviewNotes) =>
    set((state) => ({
      payments: state.payments.map((p) =>
        p.id === id
          ? { ...p, status, reviewNotes, reviewedAt: new Date(), updatedAt: new Date() }
          : p,
      ),
      pendingReviews: state.pendingReviews.filter((p) => p.id !== id),
      currentMonthPayment:
        state.currentMonthPayment?.id === id
          ? { ...state.currentMonthPayment, status, reviewNotes, reviewedAt: new Date(), updatedAt: new Date() }
          : state.currentMonthPayment,
    })),

  setUploading: (isUploading) => set({ isUploading }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () => set(initialState),
}));
