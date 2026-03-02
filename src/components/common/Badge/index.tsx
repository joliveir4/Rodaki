import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import type { PaymentStatus } from '../../../@types/payment.types';
import type { PresenceStatus } from '../../../@types/trip.types';
import {
  formatPaymentStatus,
  formatPresenceStatus,
} from '@utils/formatters';

// ─── Types ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | PaymentStatus | PresenceStatus;

interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  paymentStatus?: PaymentStatus;
  presenceStatus?: PresenceStatus;
  style?: ViewStyle;
}

// ─── Variant Map ──────────────────────────────────────────────────────────────

const variantStyle: Record<string, { bg: string; text: string }> = {
  success:       { bg: Colors.successLight,   text: Colors.success },
  warning:       { bg: Colors.warningLight,   text: Colors.warning },
  error:         { bg: Colors.errorLight,     text: Colors.error },
  info:          { bg: Colors.infoLight,      text: Colors.info },
  neutral:       { bg: Colors.surfaceVariant, text: Colors.textSecondary },
  pending:       { bg: Colors.warningLight,   text: Colors.warning },
  under_review:  { bg: Colors.infoLight,      text: Colors.info },
  approved:      { bg: Colors.successLight,   text: Colors.success },
  rejected:      { bg: Colors.errorLight,     text: Colors.error },
  confirmed:     { bg: Colors.successLight,   text: Colors.success },
  absent:        { bg: Colors.errorLight,     text: Colors.error },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  paymentStatus,
  presenceStatus,
  style,
}) => {
  const resolvedVariant = paymentStatus ?? presenceStatus ?? variant;
  const resolvedLabel =
    label ??
    (paymentStatus ? formatPaymentStatus(paymentStatus) : null) ??
    (presenceStatus ? formatPresenceStatus(presenceStatus) : String(resolvedVariant));

  const colors = variantStyle[resolvedVariant] ?? variantStyle.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.label, { color: colors.text }]}>{resolvedLabel}</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
