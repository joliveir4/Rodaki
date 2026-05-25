import type { Payment, PaymentStatus } from 'src/@types/payment.types';
import { getCurrentMonthISO } from '@utils/formatters';
import { getLocalPaymentReceipt, saveLocalPaymentReceipt } from '@utils/localPayment';

// ─── Collections ──────────────────────────────────────────────────────────────

// ─── Payment Service ──────────────────────────────────────────────────────────

export const paymentService = {
  /**
   * Busca pagamento do mês atual de um passageiro (local-only)
   */
  async getCurrentMonthPayment(passengerId: string): Promise<Payment | null> {
    return getLocalPaymentReceipt(passengerId, getCurrentMonthISO());
  },

  /**
   * Busca pagamentos pendentes de revisão para um motorista (local-only)
   */
  subscribeToPendingReviews(
    _driverId: string,
    callback: (payments: Payment[]) => void,
  ): () => void {
    callback([]);
    return () => undefined;
  },

  /**
   * Passageiro salva comprovante de pagamento localmente
   */
  async submitPaymentReceipt(
    passengerId: string,
    passengerName: string,
    driverId: string,
    amount: number,
    imageUri: string,
    referenceMonth?: string,   // 'YYYY-MM' — padrão: mês atual
    imageFile?: Blob,
  ): Promise<Payment> {
    return saveLocalPaymentReceipt({
      passengerId,
      passengerName,
      driverId,
      amount,
      imageUri,
      referenceMonth,
      imageFile,
    });
  },

  /**
   * Motorista aprova ou rejeita comprovante (local-only)
   */
  async reviewPayment(
    _paymentId: string,
    status: Extract<PaymentStatus, 'approved' | 'rejected'>,
    notes?: string,
  ): Promise<void> {
    console.warn('Modo local-only: revisão de comprovante ignorada.', { status, notes });
  },
};
