import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof Spacing;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  padding = 'md',
  shadow = 'sm',
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        { padding: Spacing[padding] },
        shadow !== 'none' && Shadows[shadow],
        style,
      ]}
    >
      {children}
    </Container>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
