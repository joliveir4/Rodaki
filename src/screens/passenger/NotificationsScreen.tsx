import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '@components/common/EmptyState';
import { Colors, Typography, Spacing } from '@constants/theme';

// ─── Screen ───────────────────────────────────────────────────────────────────
// Tela placeholder — será expandida com lista de notificações do Firestore

export const NotificationsScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificações</Text>
      </View>

      <EmptyState
        icon="🔔"
        title="Sem notificações"
        description="Você será notificado sobre confirmações de pagamento e avisos do motorista."
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, paddingBottom: 0 },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
});
