import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { firestore, firebaseStorage } from './firebase';
import type { Payment, PaymentStatus } from 'src/@types/payment.types';
import { getCurrentMonthISO } from '@utils/formatters';

// ─── Collections ──────────────────────────────────────────────────────────────

const PAYMENTS_COLLECTION = 'payments';

// ─── Payment Service ──────────────────────────────────────────────────────────

export const paymentService = {
  /**
   * Busca pagamento do mês atual de um passageiro
   */
  async getCurrentMonthPayment(passengerId: string): Promise<Payment | null> {
    const month = getCurrentMonthISO();
    const q = query(
      collection(firestore, PAYMENTS_COLLECTION),
      where('passengerId', '==', passengerId),
      where('referenceMonth', '==', month),
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return {
      ...docSnap.data(),
      id: docSnap.id,
      createdAt: docSnap.data().createdAt?.toDate?.() ?? new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate?.() ?? new Date(),
    } as Payment;
  },

  /**
   * Busca pagamentos pendentes de revisão para um motorista (tempo real)
   */
  subscribeToPendingReviews(
    driverId: string,
    callback: (payments: Payment[]) => void,
  ): Unsubscribe {
    const q = query(
      collection(firestore, PAYMENTS_COLLECTION),
      where('driverId', '==', driverId),
      where('status', '==', 'under_review'),
    );

    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
      })) as Payment[];
      callback(payments);
    });
  },

  /**
   * Passageiro envia comprovante de pagamento
   */
  async submitPaymentReceipt(
    passengerId: string,
    passengerName: string,
    driverId: string,
    amount: number,
    imageUri: string,
    referenceMonth?: string,   // 'YYYY-MM' — padrão: mês atual
  ): Promise<Payment> {
    // 1. Upload da imagem no Storage
    const receiptUrl = await paymentService.uploadReceipt(passengerId, imageUri);

    // 2. Cria ou atualiza documento do pagamento
    const paymentData = {
      passengerId,
      passengerName,
      driverId,
      amount,
      referenceMonth: referenceMonth ?? getCurrentMonthISO(),
      status: 'under_review' as PaymentStatus,
      method: 'pix' as const,
      receiptUrl,
      receiptUploadedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(firestore, PAYMENTS_COLLECTION), paymentData);

    return {
      ...paymentData,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      receiptUploadedAt: new Date(),
    };
  },

  /**
   * Motorista aprova ou rejeita comprovante
   */
  async reviewPayment(
    paymentId: string,
    status: Extract<PaymentStatus, 'approved' | 'rejected'>,
    notes?: string,
  ): Promise<void> {
    const docRef = doc(firestore, PAYMENTS_COLLECTION, paymentId);
    await updateDoc(docRef, {
      status,
      reviewNotes: notes ?? null,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Upload de imagem do comprovante no Firebase Storage
   */
  async uploadReceipt(passengerId: string, imageUri: string): Promise<string> {
    const timestamp = Date.now();
    const storageRef = ref(
      firebaseStorage,
      `receipts/${passengerId}/${timestamp}.jpg`,
    );

    const response = await fetch(imageUri);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(storageRef);
  },
};
