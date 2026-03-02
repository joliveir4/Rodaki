import React, { useState, forwardRef } from 'react';
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
  error?: string;
  hint?: string;
  required?: boolean;
  /** Ícone à direita (emoji ou elemento React) */
  rightElement?: React.ReactNode;
  onRightElementPress?: () => void;
  containerStyle?: ViewStyle;
  loading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Input = forwardRef<TextInput, InputProps>(function Input({
  label,
  error,
  hint,
  required = false,
  rightElement,
  onRightElementPress,
  containerStyle,
  loading = false,
  editable = true,
  ...rest
}, ref) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : focused
    ? Colors.borderFocus
    : Colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}> *</Text>}
        </View>
      )}

      {/* Input wrapper */}
      <View
        style={[
          styles.inputWrapper,
          { borderColor },
          focused && styles.inputWrapperFocused,
          !editable && styles.inputWrapperDisabled,
          error ? styles.inputWrapperError : null,
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.input, !editable && styles.inputDisabled]}
          placeholderTextColor={Colors.textDisabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable && !loading}
          {...rest}
        />

        {loading ? (
          <View style={styles.rightSlot}>
            <Text style={styles.loadingDots}>···</Text>
          </View>
        ) : rightElement ? (
          onRightElementPress ? (
            <TouchableOpacity
              style={styles.rightSlot}
              onPress={onRightElementPress}
              activeOpacity={0.7}
            >
              {typeof rightElement === 'string' ? (
                <Text style={styles.rightIcon}>{rightElement}</Text>
              ) : (
                rightElement
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.rightSlot}>
              {typeof rightElement === 'string' ? (
                <Text style={styles.rightIcon}>{rightElement}</Text>
              ) : (
                rightElement
              )}
            </View>
          )
        ) : null}
      </View>

      {/* Mensagens de erro / hint */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  required: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    fontWeight: Typography.fontWeight.semibold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  inputWrapperFocused: {
    borderColor: Colors.borderFocus,
    backgroundColor: Colors.white,
  },
  inputWrapperDisabled: {
    backgroundColor: Colors.surfaceVariant,
    borderColor: Colors.border,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: '#FFF8F8',
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  inputDisabled: {
    color: Colors.textSecondary,
  },
  rightSlot: {
    paddingLeft: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIcon: {
    fontSize: 18,
  },
  loadingDots: {
    fontSize: Typography.fontSize.md,
    color: Colors.textDisabled,
    letterSpacing: 2,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    fontWeight: Typography.fontWeight.medium,
  },
  hintText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
});
