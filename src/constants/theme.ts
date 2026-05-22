import { MD3LightTheme } from 'react-native-paper';

// ─── Color Palette ────────────────────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: '#1A4FCC',
  primaryLight: '#E6ECFF',
  primaryDark: '#123B99',

  secondary: '#FFD700',
  secondaryLight: '#FFF4B3',
  secondaryDark: '#E5C100',

  // Feedback
  success: '#1B873F',
  successLight: '#DFF2E6',
  warning: '#B7791F',
  warningLight: '#FCECC5',
  error: '#D32F2F',
  errorLight: '#F7D6D6',
  info: '#1A4FCC',
  infoLight: '#E6ECFF',

  // Neutrals
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F7FB',

  // Text
  textPrimary: '#121212',
  textSecondary: '#3C3C3C',
  textDisabled: '#8E8E8E',
  textInverse: '#FFFFFF',

  // Border
  border: '#E0E4EA',
  borderFocus: '#1A4FCC',

  // Status badges
  statusPending: '#B7791F',
  statusConfirmed: '#1B873F',
  statusAbsent: '#D32F2F',
  statusReview: '#1A4FCC',
  statusApproved: '#1B873F',
  statusRejected: '#D32F2F',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const Typography = {
  fontFamily: {
    regular: 'Inter',
    medium: 'Inter-Medium',
    bold: 'Inter-Bold',
  },
  fontSize: {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24,
    xxl: 28,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ─── React Native Paper Theme ─────────────────────────────────────────────────

export const AppTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    secondary: Colors.secondary,
    background: Colors.background,
    surface: Colors.surface,
    error: Colors.error,
    onPrimary: Colors.white,
    onBackground: Colors.textPrimary,
    onSurface: Colors.textPrimary,
  },
};

export type AppThemeType = typeof AppTheme;
