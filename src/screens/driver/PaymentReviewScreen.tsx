import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePayments } from '@hooks/usePayments';
import { Avatar } from '@components/common/Avatar';
import { Badge } from '@components/common/Badge';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { EmptyState } from '@components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import { formatCurrency, formatDate } from '@utils/formatters';
import type { Payment } from 'src/@types/payment.types';

export const PaymentReviewScreen: React.FC = () => {
  const { pendingReviews, isLoading, approvePayment, rejectPayment } = usePayments();
  const [selected, setSelected] = useState<Payment | null>(null);

  const handleApprove = (payment: Payment) => {
    Alert.alert('Aprovar pagamento', `Confirmar pagamento de ${payment.passengerName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprovar',
        onPress: () => {
          approvePayment(payment.id);
          setSelected(null);
        },
      },
    ]);
  };

  const handleReject = (payment: Payment) => {
    Alert.alert('Recusar pagamento', 'Tem certeza que deseja recusar este comprovante?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Recusar',
        style: 'destructive',
        onPress: () => {
          rejectPayment(payment.id, 'Comprovante não aceito');
          setSelected(null);
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Payment }) => (
    <Card onPress={() => setSelected(item)} style={styles.card}>
      <View style={styles.row}>
        <Avatar name={item.passengerName} size="md" />
        <View style={styles.info}>
          <Text style={styles.name}>{item.passengerName}</Text>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          {item.receiptUploadedAt && (
            <Text style={styles.date}>Enviado em {formatDate(item.receiptUploadedAt)}</Text>
          )}
        </View>
        <Badge paymentStatus={item.status} />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={pendingReviews}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Comprovantes</Text>
            <Text style={styles.subtitle}>
              {pendingReviews.length} aguardando revisão
            </Text>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="💳"
              title="Tudo em dia!"
              description="Não há comprovantes pendentes de revisão."
            />
          ) : null
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Avatar name={selected.passengerName} size="lg" />
                <View style={styles.modalInfo}>
                  <Text style={styles.modalName}>{selected.passengerName}</Text>
                  <Text style={styles.modalAmount}>{formatCurrency(selected.amount)}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {selected.receiptUrl && (
                <Image source={{ uri: selected.receiptUrl }} style={styles.receipt} resizeMode="contain" />
              )}

              <View style={styles.modalActions}>
                <Button
                  label="Recusar"
                  variant="danger"
                  onPress={() => handleReject(selected)}
                  style={styles.actionBtn}
                />
                <Button
                  label="Aprovar"
                  variant="secondary"
                  onPress={() => handleApprove(selected)}
                  style={styles.actionBtn}
                />
              </View>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.md, gap: Spacing.sm, flexGrow: 1 },
  header: { marginBottom: Spacing.md },
  title: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  info: { flex: 1 },
  name: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  amount: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: Typography.fontWeight.semibold },
  date: { fontSize: Typography.fontSize.xs, color: Colors.textDisabled, marginTop: 2 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  modalInfo: { flex: 1 },
  modalName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  modalAmount: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.semibold },
  closeBtn: { fontSize: 20, color: Colors.textSecondary, padding: Spacing.sm },
  receipt: { width: '100%', height: 240, borderRadius: BorderRadius.md },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: { flex: 1 },
});
