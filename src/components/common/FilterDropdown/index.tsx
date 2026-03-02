import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  type ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DropdownOption {
  label: string;
  value: string;
}

interface FilterDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  value,
  onChange,
  style,
}) => {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, style]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerLabel} numberOfLines={1}>
          {selected?.label ?? options[0]?.label}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.value === value && styles.optionSelected]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      item.value === value && styles.optionLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  triggerLabel: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  chevron: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  option: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  optionLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  optionLabelSelected: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
});
