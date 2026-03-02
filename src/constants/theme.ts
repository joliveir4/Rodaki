import { MD3LightTheme } from 'react-native-paper';

// ─── Color Palette ────────────────────────────────────────────────────────────

export const Colors = {
  // Brand
  primary: '#2563EB',       // Azul principal
  primaryLight: '#DBEAFE',
  primaryDark: '#1D4ED8',

  secondary: '#10B981',     // Verde confirmação
  secondaryLight: '#D1FAE5',
  secondaryDark: '#059669',

  // Feedback
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutrals
  white: '#FFFFFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textDisabled: '#94A3B8',
  textInverse: '#FFFFFF',

  // Border
  border: '#E2E8F0',
  borderFocus: '#2563EB',

  // Status badges
  statusPending: '#F59E0B',
  statusConfirmed: '#22C55E',
  statusAbsent: '#EF4444',
  statusReview: '#8B5CF6',
  statusApproved: '#22C55E',
  statusRejected: '#EF4444',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
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
