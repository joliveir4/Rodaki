import React, { useMemo, useState } from 'react';
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
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { usePayments } from '@hooks/usePayments';
import { Avatar } from '@components/common/Avatar';
import { Badge } from '@components/common/Badge';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { EmptyState } from '@components/common/EmptyState';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import { formatCurrency, formatDate } from '@utils/formatters';
import type { Payment } from 'src/@types/payment.types';

const createReceiptPreviewUri = (title: string, value: string, name: string, date: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="1320" viewBox="0 0 900 1320">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#F7F7FB" />
        </linearGradient>
      </defs>
      <rect width="900" height="1320" rx="42" fill="url(#bg)" />
      <rect x="64" y="64" width="772" height="116" rx="24" fill="#6D28D9" />
      <text x="112" y="138" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#FFFFFF">${title}</text>
      <rect x="64" y="224" width="772" height="2" fill="#E5E7EB" />
      <text x="64" y="312" font-family="Arial, sans-serif" font-size="28" fill="#6B7280">Valor transferido</text>
      <text x="64" y="400" font-family="Arial, sans-serif" font-size="86" font-weight="700" fill="#6D28D9">${value}</text>
      <text x="64" y="492" font-family="Arial, sans-serif" font-size="28" fill="#6B7280">Para</text>
      <text x="64" y="542" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#111827">${name}</text>
      <text x="64" y="600" font-family="Arial, sans-serif" font-size="24" fill="#6B7280">${date}</text>
      <rect x="64" y="700" width="772" height="1" fill="#E5E7EB" />
      <text x="64" y="770" font-family="Arial, sans-serif" font-size="28" fill="#6B7280">Mensagem</text>
      <rect x="64" y="804" width="520" height="64" rx="18" fill="#F3E8FF" />
      <text x="92" y="846" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#6D28D9">Comprovante enviado para análise</text>
      <text x="64" y="960" font-family="Arial, sans-serif" font-size="24" fill="#6B7280">Tipo de transferência</text>
      <text x="64" y="1018" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#111827">Pix</text>
      <rect x="64" y="1104" width="772" height="120" rx="28" fill="#111827" />
      <text x="450" y="1182" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#FFFFFF">Comprovante</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const DEMO_PAYMENTS: Payment[] = [
  {
    id: 'demo-payment-1',
    passengerId: 'demo-passenger-1',
    passengerName: 'Gabriel Campelo',
    driverId: 'demo-driver-1',
    amount: 165.9,
    referenceMonth: '2026-05',
    status: 'under_review',
    method: 'pix',
    receiptUrl: createReceiptPreviewUri('Transferindo', 'R$ 3.200,00', 'Gabriel Campelo', '29/01/2025 - 17:30'),
    receiptUploadedAt: new Date('2026-05-21T09:15:00Z'),
    createdAt: new Date('2026-05-21T09:10:00Z'),
    updatedAt: new Date('2026-05-21T09:15:00Z'),
  },
  {
    id: 'demo-payment-2',
    passengerId: 'demo-passenger-2',
    passengerName: 'Kauê',
    driverId: 'demo-driver-1',
    amount: 180,
    referenceMonth: '2026-05',
    status: 'under_review',
    method: 'pix',
    receiptUrl: createReceiptPreviewUri('Transferência PIX', 'R$ 286,00', 'Kauê', '29/01/2025 - 17:30'),
    receiptUploadedAt: new Date('2026-05-20T14:32:00Z'),
    createdAt: new Date('2026-05-20T14:28:00Z'),
    updatedAt: new Date('2026-05-20T14:32:00Z'),
  },
  {
    id: 'demo-payment-3',
    passengerId: 'demo-passenger-3',
    passengerName: 'João Paulo',
    driverId: 'demo-driver-1',
    amount: 149.5,
    referenceMonth: '2026-05',
    status: 'under_review',
    method: 'transfer',
    receiptUrl: createReceiptPreviewUri('Comprovante', 'R$ 149,50', 'João Paulo', '29/01/2025 - 17:30'),
    receiptUploadedAt: new Date('2026-05-19T18:05:00Z'),
    createdAt: new Date('2026-05-19T18:00:00Z'),
    updatedAt: new Date('2026-05-19T18:05:00Z'),
  },
];

const ReceiptFallback: React.FC<{ payment: Payment }> = ({ payment }) => (
  <View style={styles.receiptFallback}>
    <View style={styles.receiptFallbackHeader}>
      <Text style={styles.receiptFallbackBrand}>Comprovante</Text>
      <Text style={styles.receiptFallbackDate}>
        {payment.receiptUploadedAt ? formatDate(payment.receiptUploadedAt) : ''}
      </Text>
    </View>

    <View style={styles.receiptFallbackAmountBox}>
      <Text style={styles.receiptFallbackAmountLabel}>Valor</Text>
      <Text style={styles.receiptFallbackAmount}>{formatCurrency(payment.amount)}</Text>
    </View>

    <View style={styles.receiptFallbackDivider} />

    <View style={styles.receiptFallbackRow}>
      <Text style={styles.receiptFallbackLabel}>Passageiro</Text>
      <Text style={styles.receiptFallbackValue}>{payment.passengerName}</Text>
    </View>

    <View style={styles.receiptFallbackRow}>
      <Text style={styles.receiptFallbackLabel}>Status</Text>
      <Text style={styles.receiptFallbackValue}>Pendente Análise</Text>
    </View>

    <View style={styles.receiptFallbackStamp}>
      <Text style={styles.receiptFallbackStampText}>Comprovante</Text>
    </View>
  </View>
);

export const PaymentReviewScreen: React.FC = () => {
  const { pendingReviews, isLoading, approvePayment, rejectPayment } = usePayments();
  const [selected, setSelected] = useState<Payment | null>(null);
  const [demoPayments, setDemoPayments] = useState<Payment[]>(DEMO_PAYMENTS);
  const [receiptImageError, setReceiptImageError] = useState(false);

  React.useEffect(() => {
    setReceiptImageError(false);
  }, [selected?.id]);

  const visiblePayments = useMemo(
    () => (pendingReviews.length > 0 ? pendingReviews : demoPayments),
    [demoPayments, pendingReviews],
  );
  const useDemoData = pendingReviews.length === 0;

  const handleApprove = (payment: Payment) => {
    Alert.alert('Aprovar pagamento', `Confirmar pagamento de ${payment.passengerName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprovar',
        onPress: () => {
          if (useDemoData) {
            setDemoPayments((current) => current.filter((item) => item.id !== payment.id));
          } else {
            approvePayment(payment.id);
          }
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
          if (useDemoData) {
            setDemoPayments((current) => current.filter((item) => item.id !== payment.id));
          } else {
            rejectPayment(payment.id, 'Comprovante não aceito');
          }
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
        data={visiblePayments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Comprovantes</Text>
            <Text style={styles.subtitle}>
              {visiblePayments.length} aguardando revisão
            </Text>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              iconName="credit-card-outline"
              title={useDemoData ? 'Comprovantes de demonstração' : 'Aguardando comprovantes'}
              description={
                useDemoData
                  ? 'Esses dados são mockados para a apresentação da tela do motorista.'
                  : 'Não há nenhum comprovante pendente de revisão no momento.'
              }
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
                  <View style={styles.closeBtn}>
                    <Icon name="close" size={16} color={Colors.textSecondary} />
                    <Text style={styles.closeText}>Fechar</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {(selected.receiptUrl || selected.receiptLocalUri) && !receiptImageError ? (
                <Image
                  source={{ uri: selected.receiptUrl ?? selected.receiptLocalUri! }}
                  style={styles.receipt}
                  resizeMode="contain"
                  onError={() => setReceiptImageError(true)}
                />
              ) : (selected.receiptUrl || selected.receiptLocalUri) ? (
                <ReceiptFallback payment={selected} />
              ) : null}

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
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    minHeight: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
  },
  closeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.semibold,
  },
  receipt: { width: '100%', height: 240, borderRadius: BorderRadius.md },
  receiptFallback: {
    width: '100%',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.sm,
  },
  receiptFallbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptFallbackBrand: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  receiptFallbackDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  receiptFallbackAmountBox: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#EEF2FF',
  },
  receiptFallbackAmountLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  receiptFallbackAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginTop: 2,
  },
  receiptFallbackDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  receiptFallbackRow: {
    gap: 2,
  },
  receiptFallbackLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  receiptFallbackValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
  },
  receiptFallbackStamp: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#111827',
  },
  receiptFallbackStampText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: { flex: 1 },
});
