import { useEffect, useCallback } from 'react';
import { usePaymentStore } from '@store/payment.store';
import { useAuthStore, selectAsDriver, selectAsPassenger } from '@store/auth.store';
import { getLocalPaymentReceipt, saveLocalPaymentReceipt } from '@utils/localPayment';

// ─── usePayments ──────────────────────────────────────────────────────────────

export const usePayments = () => {
  const {
    currentMonthPayment,
    pendingReviews,
    isLoading,
    isUploading,
    error,
    setCurrentMonthPayment,
    setPendingReviews,
    updatePaymentStatus,
    setUploading,
    setLoading,
    setError,
  } = usePaymentStore();

  const driver = useAuthStore(selectAsDriver);
  const passenger = useAuthStore(selectAsPassenger);

  // ─── Passageiro: busca pagamento do mês ───────────────────────────────────

  useEffect(() => {
    if (!passenger) return;

    const load = async () => {
      try {
        setLoading(true);
        const payment = await getLocalPaymentReceipt(passenger.id);
        setCurrentMonthPayment(payment);
      } catch (err: any) {
        setError(err.message ?? 'Erro ao carregar pagamento');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [passenger?.id]);

  // ─── Motorista: listener de comprovantes pendentes ────────────────────────

  useEffect(() => {
    if (!driver) return;

    // Modo local-only: não há sincronização de comprovantes para revisão no motorista.
    setPendingReviews([]);
  }, [driver?.id]);

  // ─── Passageiro: envio de comprovante ─────────────────────────────────────

  const submitReceipt = useCallback(
    async (imageUri: string, imageFile?: Blob) => {
      if (!passenger || !driver) return;

      try {
        setUploading(true);
        const payment = await saveLocalPaymentReceipt({
          passengerId: passenger.id,
          passengerName: passenger.name,
          driverId: passenger.driverId,
          amount: passenger.monthlyFee,
          imageUri,
          imageFile,
        });
        setCurrentMonthPayment(payment);
      } catch (err: any) {
        setError(err.message ?? 'Erro ao enviar comprovante');
      } finally {
        setUploading(false);
      }
    },
    [passenger, driver],
  );

  // ─── Motorista: aprovar / rejeitar ────────────────────────────────────────

  const approvePayment = useCallback(
    async (paymentId: string) => {
      setError('Revisão de comprovantes está indisponível no modo local.');
    },
    [],
  );

  const rejectPayment = useCallback(
    async (paymentId: string, notes?: string) => {
      setError('Revisão de comprovantes está indisponível no modo local.');
    },
    [],
  );

  return {
    currentMonthPayment,
    pendingReviews,
    pendingReviewsCount: pendingReviews.length,
    isLoading,
    isUploading,
    error,
    submitReceipt,
    approvePayment,
    rejectPayment,
  };
};
