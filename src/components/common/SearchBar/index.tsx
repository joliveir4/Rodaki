import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrapper}>
        {/* Search icon via unicode — sem dependência extra */}
        <TextInput
          editable={false}
          style={styles.icon}
          value="🔍"
        />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDisabled}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  iconWrapper: {
    marginRight: Spacing.xs,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 14,
    padding: 0,
    color: Colors.textDisabled,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
});
