// ─── Email ────────────────────────────────────────────────────────────────────

export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

// ─── Password ─────────────────────────────────────────────────────────────────

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const getPasswordError = (password: string): string | null => {
  if (!password) return 'Senha obrigatória';
  if (password.length < 6) return 'Mínimo 6 caracteres';
  return null;
};

// ─── Phone ────────────────────────────────────────────────────────────────────

export const isValidPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
};

// ─── CPF ──────────────────────────────────────────────────────────────────────

export const isValidCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]);
};

// ─── Name ─────────────────────────────────────────────────────────────────────

export const isValidName = (name: string): boolean => {
  return name.trim().split(' ').length >= 2 && name.trim().length >= 4;
};

// ─── Form Validators (retornam string de erro ou null) ───────────────────────

export const validateEmail = (email: string): string | null => {
  if (!email) return 'E-mail obrigatório';
  if (!isValidEmail(email)) return 'E-mail inválido';
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name) return 'Nome obrigatório';
  if (!isValidName(name)) return 'Informe nome e sobrenome';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Telefone obrigatório';
  if (!isValidPhone(phone)) return 'Telefone inválido';
  return null;
};

export const validateRequired = (value: string, label: string): string | null => {
  if (!value || !value.trim()) return `${label} obrigatório(a)`;
  return null;
};
