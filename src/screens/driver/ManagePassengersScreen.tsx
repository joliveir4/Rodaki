import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  type ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DriverStackParamList } from '../../@types/navigation.types';
import { DRIVER_STACK_ROUTES } from '@constants/routes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/theme';
import { Avatar } from '@components/common/Avatar';
import { Badge } from '@components/common/Badge';
import { Button } from '@components/common/Button';
import { SearchBar } from '@components/common/SearchBar';
import { FilterDropdown } from '@components/common/FilterDropdown';
import { formatPhone } from '@utils/formatters';
import { usePassengersStore } from '@store/passengers.store';
import { useAuthStore, selectAsDriver } from '@store/auth.store';
import { passengerService } from '@services/passenger.service';
import type { Passenger } from '../../@types/user.types';
import type { PaymentStatus } from '../../@types/payment.types';

// ─── Local Types ──────────────────────────────────────────────────────────────

// PassengerItem é derivado do tipo de domínio Passenger + status de pagamento.
// O receiptStatus será integrado ao PaymentStore em versões futuras.
interface PassengerItem {
  id: string;
  code: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  city: string;
  university: string;
  isActive: boolean;
  receiptStatus: PaymentStatus; // TODO: buscar do payment store quando integrado
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converte Passenger do domínio → PassengerItem da UI */
function toPassengerItem(p: Passenger, index: number): PassengerItem {
  return {
    id: p.id,
    code: `#PS${String(index + 1).padStart(3, '0')}`,
    name: p.name,
    phone: p.phone,
    avatarUrl: p.avatarUrl,
    city: p.address?.city ?? '',
    university: p.university ?? '',
    isActive: p.isActive,
    receiptStatus: 'pending', // TODO: integrar com payment store
  };
}

// ─── Filter Options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'Todos os Status', value: 'all' },
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
];

// ─── PassengerCard ────────────────────────────────────────────────────────────

interface PassengerCardProps {
  item: PassengerItem;
  onEdit: (id: string) => void;
  onPayment: (id: string) => void;
}

const PassengerCard: React.FC<PassengerCardProps> = ({ item, onEdit, onPayment }) => (
  <View style={cardStyles.card}>
    {/* Topo: avatar + dados + badge Ativo */}
    <View style={cardStyles.topRow}>
      <Avatar name={item.name} uri={item.avatarUrl} size="lg" />

      <View style={cardStyles.info}>
        <View style={cardStyles.nameRow}>
          <Text style={cardStyles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              cardStyles.statusBadge,
              !item.isActive && cardStyles.statusBadgeInactive,
            ]}
          >
            <Text
              style={[
                cardStyles.statusBadgeText,
                !item.isActive && cardStyles.statusBadgeTextInactive,
              ]}
            >
              {item.isActive ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </View>

        <Text style={cardStyles.code}>{item.code}</Text>
        <Text style={cardStyles.meta}>{formatPhone(item.phone)}</Text>
        <Text style={cardStyles.meta} numberOfLines={1}>
          {item.university || 'Universidade não informada'}
        </Text>
        {item.city ? <Text style={cardStyles.meta}>{item.city}</Text> : null}
      </View>
    </View>

    {/* Linha do comprovante */}
    <View style={cardStyles.receiptRow}>
      <Text style={cardStyles.receiptLabel}>Comprovante:</Text>
      <Badge paymentStatus={item.receiptStatus} />
    </View>

    {/* Ações */}
    <View style={cardStyles.actionRow}>
      <Button
        label="✏️  Editar"
        variant="primary"
        onPress={() => onEdit(item.id)}
        style={cardStyles.editBtn}
      />
      <TouchableOpacity
        style={cardStyles.paymentBtn}
        onPress={() => onPayment(item.id)}
        activeOpacity={0.7}
        accessibilityLabel="Ver pagamento"
      >
        <Text style={cardStyles.paymentBtnText}>$</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── SummaryBar ───────────────────────────────────────────────────────────────

interface SummaryBarProps {
  passengers: PassengerItem[];
}

const SummaryBar: React.FC<SummaryBarProps> = ({ passengers }) => {
  const active = passengers.filter((p) => p.isActive).length;
  const inactive = passengers.filter((p) => !p.isActive).length;

  return (
    <View style={summaryStyles.bar}>
      <Text style={summaryStyles.title}>Resumo dos Passageiros</Text>
      <View style={summaryStyles.stats}>
        <View style={summaryStyles.stat}>
          <View style={[summaryStyles.dot, { backgroundColor: Colors.success }]} />
          <Text style={summaryStyles.statText}>{active} Ativos</Text>
        </View>
        <View style={summaryStyles.stat}>
          <View style={[summaryStyles.dot, { backgroundColor: Colors.textSecondary }]} />
          <Text style={summaryStyles.statText}>{inactive} Inativos</Text>
        </View>
        <View style={summaryStyles.stat}>
          <View style={[summaryStyles.dot, { backgroundColor: Colors.primary }]} />
          <Text style={summaryStyles.statText}>{passengers.length} Total</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

type ManageNav = NativeStackNavigationProp<DriverStackParamList>;

export const ManagePassengersScreen: React.FC = () => {
  const navigation = useNavigation<ManageNav>();
  const driver = useAuthStore(selectAsDriver);
  const { passengers: domainPassengers, isLoading } = usePassengersStore();
  const setPassengers = usePassengersStore((s) => s.setPassengers);
  const setError = usePassengersStore((s) => s.setError);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ─── Listener em tempo real no Firestore ───────────────────────────────
  useEffect(() => {
    if (!driver) return;

    const unsubscribe = passengerService.subscribeToPassengers(
      driver.id,
      (data) => setPassengers(data),
      (err) => setError(err.message),
    );

    return unsubscribe;
  }, [driver?.id]);

  // Mapeia do domínio para o modelo de UI com códigos seqüenciais
  const allItems = useMemo(
    () => domainPassengers.map(toPassengerItem),
    [domainPassengers],
  );

  const filtered = useMemo(() => {
    return allItems.filter((p) => {
      const matchSearch =
        search.trim() === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search.replace(/\D/g, '')) ||
        p.university.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.isActive) ||
        (statusFilter === 'inactive' && !p.isActive);

      return matchSearch && matchStatus;
    });
  }, [allItems, search, statusFilter]);

  const handleAddPassenger = () => {
    navigation.navigate(DRIVER_STACK_ROUTES.ADD_PASSENGER);
  };

  const handleEdit = (id: string) => {
    // TODO: navigation.navigate(DRIVER_STACK_ROUTES.EDIT_PASSENGER, { passengerId: id })
    console.log('Editar passageiro', id);
  };

  const handlePayment = (id: string) => {
    // TODO: navigation.navigate para tela de pagamento
    console.log('Ver pagamento', id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gerenciamento de Passageiros</Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: ListRenderItemInfo<PassengerItem>) => (
          <PassengerCard item={item} onEdit={handleEdit} onPayment={handlePayment} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* Botão adicionar */}
            <Button
              label="+ Adicionar Novo Passageiro"
              variant="primary"
              onPress={handleAddPassenger}
              fullWidth
              style={styles.addBtn}
            />

            {/* Busca */}
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar passageiro..."
              style={styles.search}
            />

            {/* Filtros */}
            <View style={styles.filters}>
              <FilterDropdown
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
                style={styles.filterItem}
              />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyTitle}>Nenhum passageiro encontrado</Text>
            <Text style={styles.emptySubtitle}>
              {search || statusFilter !== 'all'
                ? 'Tente ajustar os filtros ou a busca.'
                : 'Adicione seu primeiro passageiro.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          filtered.length > 0 ? <SummaryBar passengers={filtered} /> : null
        }
      />
    </SafeAreaView>
  );
};

// ─── Card Styles ──────────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  statusBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusBadgeInactive: {
    backgroundColor: Colors.surfaceVariant,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.success,
  },
  statusBadgeTextInactive: {
    color: Colors.textSecondary,
  },
  code: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  meta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  receiptLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  editBtn: {
    flex: 1,
  },
  paymentBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBtnText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
});

// ─── Summary Styles ───────────────────────────────────────────────────────────

const summaryStyles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  addBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  search: {
    marginBottom: Spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterItem: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
