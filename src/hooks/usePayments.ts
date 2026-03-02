import { useEffect, useCallback } from 'react';
import { usePaymentStore } from '@store/payment.store';
import { useAuthStore, selectAsDriver, selectAsPassenger } from '@store/auth.store';
import { paymentService } from '@services/payment.service';
import type { PaymentStatus } from 'src/@types/payment.types';

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
        const payment = await paymentService.getCurrentMonthPayment(passenger.id);
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

    const unsubscribe = paymentService.subscribeToPendingReviews(
      driver.id,
      (payments) => {
        setPendingReviews(payments);
      },
    );

    return unsubscribe;
  }, [driver?.id]);

  // ─── Passageiro: envio de comprovante ─────────────────────────────────────

  const submitReceipt = useCallback(
    async (imageUri: string) => {
      if (!passenger || !driver) return;

      try {
        setUploading(true);
        const payment = await paymentService.submitPaymentReceipt(
          passenger.id,
          passenger.name,
          passenger.driverId,
          passenger.monthlyFee,
          imageUri,
        );
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
      try {
        setLoading(true);
        await paymentService.reviewPayment(paymentId, 'approved');
        updatePaymentStatus(paymentId, 'approved');
      } catch (err: any) {
        setError(err.message ?? 'Erro ao aprovar pagamento');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const rejectPayment = useCallback(
    async (paymentId: string, notes?: string) => {
      try {
        setLoading(true);
        await paymentService.reviewPayment(paymentId, 'rejected', notes);
        updatePaymentStatus(paymentId, 'rejected', notes);
      } catch (err: any) {
        setError(err.message ?? 'Erro ao rejeitar pagamento');
      } finally {
        setLoading(false);
      }
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
