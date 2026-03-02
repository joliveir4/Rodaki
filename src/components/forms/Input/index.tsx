import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  rightIcon,
  containerStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : isFocused
    ? Colors.borderFocus
    : Colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputWrapper, { borderColor }]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textDisabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {!error && hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
  error: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
});
