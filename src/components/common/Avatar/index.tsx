import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius } from '@constants/theme';
import { getInitials } from '@utils/formatters';

// ─── Types ────────────────────────────────────────────────────────────────────

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string;
  uri?: string;
  size?: AvatarSize;
}

// ─── Size Map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<AvatarSize, { container: number; font: number }> = {
  sm: { container: 32, font: Typography.fontSize.xs },
  md: { container: 44, font: Typography.fontSize.md },
  lg: { container: 60, font: Typography.fontSize.xl },
  xl: { container: 80, font: Typography.fontSize.xxl },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Avatar: React.FC<AvatarProps> = ({ name, uri, size = 'md' }) => {
  const { container, font } = sizeMap[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: container, height: container, borderRadius: container / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: container, height: container, borderRadius: container / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize: font }]}>{getInitials(name)}</Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },
});
