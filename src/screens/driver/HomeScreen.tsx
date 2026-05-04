import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePassengers } from '@hooks/usePassengers';
import { useAuthStore, selectAsDriver } from '@store/auth.store';
import { usePassengersStore } from '@store/passengers.store';
import { passengerService } from '@services/passenger.service';
import { authService } from '@services/auth.service';
import { Badge } from '@components/common/Badge';
import { EmptyState } from '@components/common/EmptyState';
import { SearchBar } from '@components/common/SearchBar';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/theme';
import type { CheckInOption, DailyPresence, PresenceStatus } from 'src/@types/trip.types';

// ─── Filter Tabs Definition ───────────────────────────────────────────────────

type FilterTab = 'all' | PresenceStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'confirmed', label: 'Presentes' },
  { key: 'absent', label: 'Ausentes' },
  { key: 'pending', label: 'Pendentes' },
];

const checkInLabels: Record<CheckInOption, string> = {
  going: 'Só vou',
  returning: 'Só volto',
  both: 'Vou e volto',
  absent: 'Não vou',
};

const getTripSegmentBadge = (
  presence: DailyPresence,
): { label: string; variant: 'info' | 'warning' | 'error' | 'neutral' } => {
  if (presence.checkIn) {
    const variant = presence.checkIn === 'absent' ? 'error' : 'info';
    return { label: checkInLabels[presence.checkIn], variant };
  }

  if (presence.status === 'absent') {
    return { label: 'Não vou', variant: 'error' };
  }

  return { label: 'Pendente de confirmar', variant: 'warning' };
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export const DriverHomeScreen: React.FC = () => {
  const driver = useAuthStore(selectAsDriver);
  const setUser = useAuthStore((s) => s.setUser);
  const { passengers } = usePassengersStore();
  const setPassengers = usePassengersStore((s) => s.setPassengers);
  const setPassengersError = usePassengersStore((s) => s.setError);
  const {
    todayPresences,
    selectedDate,
    isLoading,
    error,
  } = usePassengers();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const didSyncDriver = useRef(false);

  useEffect(() => {
    if (!driver?.id || didSyncDriver.current) return;

    didSyncDriver.current = true;
    authService.fetchUserData(driver.id).then(setUser).catch(() => undefined);
  }, [driver?.id, setUser]);

  useEffect(() => {
    if (!driver) return;

    const unsubscribe = passengerService.subscribeToPassengers(
      driver.id,
      (data) => setPassengers(data),
      (err) => setPassengersError(err.message),
    );

    return unsubscribe;
  }, [driver?.id, setPassengers, setPassengersError]);

  useEffect(() => {
    if (!driver?.passengerIds?.length) return;
    if (passengers.length) return;

    let isActive = true;

    const fetchPassengers = async () => {
      try {
        const results = await Promise.all(
          driver.passengerIds.map((id) => passengerService.getById(id)),
        );
        const resolved = results.filter(Boolean) as typeof passengers;
        if (resolved.length && isActive) {
          setPassengers(resolved);
        }
      } catch (err: any) {
        if (isActive) {
          setPassengersError(err?.message ?? 'Erro ao carregar passageiros');
        }
      }
    };

    fetchPassengers();

    return () => {
      isActive = false;
    };
  }, [driver?.passengerIds, passengers.length, setPassengers, setPassengersError]);

  const mergedPresences = useMemo(() => {
    const presenceByPassengerId = new Map(
      todayPresences.map((presence) => [presence.passengerId, presence]),
    );
    const activePassengers = passengers.filter((passenger) => passenger.isActive !== false);
    const activeIds = new Set(activePassengers.map((passenger) => passenger.id));

    const merged = activePassengers.map((passenger) =>
      presenceByPassengerId.get(passenger.id) ?? {
        id: `${passenger.id}_${selectedDate}`,
        passengerId: passenger.id,
        passengerName: passenger.name,
        date: selectedDate,
        status: 'pending',
      },
    );

    return merged;
  }, [passengers, todayPresences, selectedDate]);

  const totalCount = mergedPresences.length;
  const confirmedCount = mergedPresences.filter((p) => p.status === 'confirmed').length;
  const absentCount = mergedPresences.filter((p) => p.status === 'absent').length;
  const pendingCount = mergedPresences.filter((p) => p.status === 'pending').length;

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = activeTab === 'all'
      ? mergedPresences
      : mergedPresences.filter((p) => p.status === activeTab);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.passengerName.toLowerCase().includes(q));
    }
    return list;
  }, [mergedPresences, activeTab, search]);

  // ─── Render item ──────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: DailyPresence }) => (
    <PassengerRow item={item} />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isLoading} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <>
            {/* ── Header ─────────────────────────────────────── */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Rodaki</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.dateBtn}>
                  <Text style={styles.dateBtnText}>📅 Hoje</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.refreshBtn}>
                  <Text style={styles.refreshIcon}>↻</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Stats Grid 2×2 ─────────────────────────────── */}
            <View style={styles.statsGrid}>
              <StatCard value={totalCount}     label="Total"    valueColor={Colors.textPrimary} />
              <StatCard value={confirmedCount} label="Presente" valueColor={Colors.success} />
              <StatCard value={absentCount}    label="Ausente"  valueColor={Colors.error} />
              <StatCard value={pendingCount}   label="Pendente" valueColor={Colors.warning} />
            </View>

            {/* ── Filter Tabs ─────────────────────────────────── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContainer}
              style={styles.tabsScroll}
            >
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                >
                  <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── Search ──────────────────────────────────────── */}
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar passageiro..."
              style={styles.search}
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="🚌"
              title="Nenhum passageiro encontrado"
              description={
                search
                  ? 'Tente outro nome na busca.'
                  : 'Os passageiros ainda não confirmaram presença para hoje.'
              }
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// ─── PassengerRow ─────────────────────────────────────────────────────────────

const PassengerRow: React.FC<{ item: DailyPresence }> = ({ item }) => {
  const tripSegment = getTripSegmentBadge(item);

  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.info}>
        <Text style={rowStyles.name}>{item.passengerName}</Text>
        {/* route e horário serão vindos do Firestore quando integrado */}
        <Text style={rowStyles.meta}>
          {item.notes ?? 'Rota padrão'}
        </Text>
      </View>
      <View style={rowStyles.badges}>
        <Badge label={tripSegment.label} variant={tripSegment.variant} />
      </View>
    </View>
  );
};

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  badges: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  name: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  meta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});

// ─── StatCard ─────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  value: number;
  label: string;
  valueColor: string;
}> = ({ value, label, valueColor }) => (
  <View style={statStyles.card}>
    <Text style={[statStyles.value, { color: valueColor }]}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  value: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 36,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  dateBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  refreshIcon: {
    fontSize: 18,
    color: Colors.textPrimary,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },

  // Tabs
  tabsScroll: {
    marginBottom: Spacing.sm,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.white,
  },

  // Search
  search: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorText: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
  },
});
