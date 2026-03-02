import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`], textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
  },

  // Sizes
  size_sm: { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md },
  size_md: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg },
  size_lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },

  // Labels
  label: {
    fontWeight: Typography.fontWeight.semibold,
  },
  label_primary: { color: Colors.white },
  label_secondary: { color: Colors.white },
  label_outline: { color: Colors.primary },
  label_ghost: { color: Colors.primary },
  label_danger: { color: Colors.white },

  labelSize_sm: { fontSize: Typography.fontSize.sm },
  labelSize_md: { fontSize: Typography.fontSize.md },
  labelSize_lg: { fontSize: Typography.fontSize.lg },
});
