import type { PaymentStatus } from 'src/@types/payment.types';
import type { PixKeyType } from 'src/@types/user.types';
import type { PresenceStatus } from 'src/@types/trip.types';

// ─── Currency ─────────────────────────────────────────────────────────────────

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// ─── Date & Time ──────────────────────────────────────────────────────────────

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

export const formatDateLong = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(d);
};

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatMonth = (yearMonth: string): string => {
  // Input: 'YYYY-MM', Output: 'Fevereiro de 2026'
  const [year, month] = yearMonth.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getCurrentMonthISO = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// ─── Phone ────────────────────────────────────────────────────────────────────

export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

// ─── CPF ──────────────────────────────────────────────────────────────────────

export const formatCPF = (cpf: string): string => {
  const digits = cpf.replace(/\D/g, '');
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

// ─── PIX Key ──────────────────────────────────────────────────────────────────

export const formatPixKeyType = (type: PixKeyType): string => {
  const labels: Record<PixKeyType, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
    email: 'E-mail',
    phone: 'Telefone',
    random: 'Chave Aleatória',
  };
  return labels[type];
};

// ─── Status Labels ────────────────────────────────────────────────────────────

export const formatPaymentStatus = (status: PaymentStatus): string => {
  const labels: Record<PaymentStatus, string> = {
    pending: 'Pendente',
    under_review: 'Em análise',
    approved: 'Aprovado',
    rejected: 'Recusado',
  };
  return labels[status];
};

export const formatPresenceStatus = (status: PresenceStatus): string => {
  const labels: Record<PresenceStatus, string> = {
    pending: 'Não confirmado',
    confirmed: 'Confirmado',
    absent: 'Ausente',
  };
  return labels[status];
};

// ─── Initials ─────────────────────────────────────────────────────────────────

export const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
