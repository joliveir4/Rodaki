import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { getCurrentMonthISO } from '@utils/formatters';
import type { Payment, PaymentStatus } from 'src/@types/payment.types';

const PAYMENT_KEY_PREFIX = 'payment:receipt:';
const PAYMENT_DIR = `${FileSystem.documentDirectory ?? ''}receipts/`;

type LocalPaymentInput = {
  passengerId: string;
  passengerName: string;
  driverId: string;
  amount: number;
  imageUri: string;
  referenceMonth?: string;
  imageFile?: Blob;
};

type LocalPaymentRecord = Payment & {
  createdAt: string;
  updatedAt: string;
  receiptUploadedAt?: string;
};

function buildKey(passengerId: string, referenceMonth: string): string {
  return `${PAYMENT_KEY_PREFIX}${passengerId}:${referenceMonth}`;
}

async function ensureDir(): Promise<void> {
  if (!PAYMENT_DIR) return;
  const info = await FileSystem.getInfoAsync(PAYMENT_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PAYMENT_DIR, { intermediates: true });
  }
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(blob);
  });
}

async function persistReceiptFile(passengerId: string, imageUri: string, imageFile?: Blob): Promise<string> {
  if (imageFile) {
    return readAsDataUrl(imageFile);
  }

  if (imageUri.startsWith('data:')) {
    return imageUri;
  }

  await ensureDir();
  const extension = imageUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const targetUri = `${PAYMENT_DIR}${passengerId}-${Date.now()}.${extension}`;

  if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
    await FileSystem.copyAsync({ from: imageUri, to: targetUri });
    return targetUri;
  }

  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    const downloaded = await FileSystem.downloadAsync(imageUri, targetUri);
    return downloaded.uri;
  }

  return imageUri;
}

export async function saveLocalPaymentReceipt(input: LocalPaymentInput): Promise<Payment> {
  const referenceMonth = input.referenceMonth ?? getCurrentMonthISO();
  const localReceiptUri = await persistReceiptFile(input.passengerId, input.imageUri, input.imageFile);

  const now = new Date();
  const payment: Payment = {
    id: buildKey(input.passengerId, referenceMonth),
    passengerId: input.passengerId,
    passengerName: input.passengerName,
    driverId: input.driverId,
    amount: input.amount,
    referenceMonth,
    status: 'under_review' as PaymentStatus,
    method: 'pix',
    receiptLocalUri: localReceiptUri,
    receiptUploadedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const record: LocalPaymentRecord = {
    ...payment,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    receiptUploadedAt: now.toISOString(),
  };

  await AsyncStorage.setItem(buildKey(input.passengerId, referenceMonth), JSON.stringify(record));
  return payment;
}

export async function getLocalPaymentReceipt(
  passengerId: string,
  referenceMonth?: string,
): Promise<Payment | null> {
  const month = referenceMonth ?? getCurrentMonthISO();

  try {
    const raw = await AsyncStorage.getItem(buildKey(passengerId, month));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as LocalPaymentRecord;
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      receiptUploadedAt: parsed.receiptUploadedAt ? new Date(parsed.receiptUploadedAt) : undefined,
    } satisfies Payment;
  } catch {
    return null;
  }
}
