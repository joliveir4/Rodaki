// ─── Payment Domain Types ─────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export type PaymentMethod = 'pix' | 'cash' | 'transfer';

export interface Payment {
  id: string;
  passengerId: string;
  passengerName: string;
  driverId: string;
  amount: number;
  referenceMonth: string;    // 'YYYY-MM' ex: '2026-02'
  status: PaymentStatus;
  method: PaymentMethod;
  receiptUrl?: string;       // URL do comprovante no Firebase Storage
  receiptUploadedAt?: Date;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PixInfo {
  key: string;
  keyType: import('./user.types').PixKeyType;
  ownerName: string;
  bankName?: string;
}

export interface PaymentSummary {
  passengerId: string;
  totalMonths: number;
  paidMonths: number;
  pendingMonths: number;
  overdueMonths: number;
  currentMonthStatus: PaymentStatus;
}
