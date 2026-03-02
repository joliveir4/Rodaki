import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePassengers } from '@hooks/usePassengers';
import { usePayments } from '@hooks/usePayments';
import { useAuthStore, selectAsPassenger } from '@store/auth.store';
import { useAuth } from '@hooks/useAuth';
import { Avatar } from '@components/common/Avatar';
import { Button } from '@components/common/Button';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/theme';
import { formatPhone } from '@utils/formatters';
import type { CheckInOption } from '../../@types/trip.types';
import type { PassengerStackParamList } from '../../@types/navigation.types';
import { PASSENGER_STACK_ROUTES } from '@constants/routes';

// ─── Navigation helper ────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<PassengerStackParamList>;

// ─── Static data ──────────────────────────────────────────────────────────────

interface CheckInTile {
  option: CheckInOption;
  label: string;
  sublabel: string;
  icon: string;
}

const CHECK_IN_TILES: CheckInTile[] = [
  { option: 'going',     label: 'Ida',     sublabel: 'Apenas vou',       icon: '→' },
  { option: 'returning', label: 'Volta',   sublabel: 'Apenas volto',       icon: '←' },
  { option: 'both',      label: 'Ambas',   sublabel: 'Ida e Volta', icon: '↔' },
  { option: 'absent',    label: 'Ausente', sublabel: 'Não vou',     icon: '✕' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getCheckInLabel(option: CheckInOption | null): string {
  if (!option) return 'Pendente';
  const map: Record<CheckInOption, string> = {
    going:     'Confirmado: IDA',
    returning: 'Confirmado: VOLTA',
    both:      'Confirmado: AMBOS',
    absent:    'Ausente',
  };
  return map[option];
}

function getCheckInColor(option: CheckInOption | null): string {
  if (!option) return Colors.warning;
  return option === 'absent' ? Colors.error : Colors.success;
}

function getOptionAccent(opt: CheckInOption): string {
  return opt === 'absent' ? Colors.error : Colors.success;
}

function getOptionBg(opt: CheckInOption): string {
  return opt === 'absent' ? '#FEF2F2' : '#F0FDF4';
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ option: CheckInOption | null; saved: boolean }> = ({
  option,
  saved,
}) => (
  <View
    style={[
      badgeStyles.container,
      { backgroundColor: saved ? getCheckInColor(option) : Colors.warning },
    ]}
  >
    <Text style={badgeStyles.text}>
      {saved ? getCheckInLabel(option) : 'Pendente'}
    </Text>
  </View>
);

const badgeStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    maxWidth: 180,
  },
  text: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});

// ─── CheckInTileButton ────────────────────────────────────────────────────────

const CheckInTileButton: React.FC<{
  tile: CheckInTile;
  selected: boolean;
  onPress: () => void;
}> = ({ tile, selected, onPress }) => (
  <TouchableOpacity
    style={[
      tileStyles.tile,
      {
        borderColor: selected ? getOptionAccent(tile.option) : Colors.border,
        backgroundColor: selected ? getOptionBg(tile.option) : Colors.surface,
      },
    ]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <Text style={[tileStyles.icon, { color: selected ? getOptionAccent(tile.option) : Colors.textSecondary }]}>
      {tile.icon}
    </Text>
    <Text style={[tileStyles.label, { color: selected ? getOptionAccent(tile.option) : Colors.textPrimary }]}>
      {tile.label}
    </Text>
    <Text style={[tileStyles.sublabel, { color: selected ? getOptionAccent(tile.option) : Colors.textSecondary }]}>
      {tile.sublabel}
    </Text>
  </TouchableOpacity>
);

const tileStyles = StyleSheet.create({
  tile: {
    // 2 per row with gap
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: 2,
    minHeight: 80,
  },
  icon: {
    fontSize: 22,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 28,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  sublabel: {
    fontSize: Typography.fontSize.xs,
  },
});

// ─── SectionCard ──────────────────────────────────────────────────────────────

const SectionCard: React.FC<{ children: React.ReactNode; style?: object }> = ({
  children,
  style,
}) => <View style={[cardStyles.card, style]}>{children}</View>;

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
});

// ─── NavActionCard ────────────────────────────────────────────────────────────

const NavActionCard: React.FC<{
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}> = ({ icon, iconBg, title, subtitle, onPress }) => (
  <TouchableOpacity style={navStyles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={[navStyles.iconWrapper, { backgroundColor: iconBg }]}>
      <Text style={navStyles.icon}>{icon}</Text>
    </View>
    <View style={navStyles.texts}>
      <Text style={navStyles.title}>{title}</Text>
      <Text style={navStyles.subtitle}>{subtitle}</Text>
    </View>
    <Text style={navStyles.chevron}>›</Text>
  </TouchableOpacity>
);

const navStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  texts: { flex: 1, gap: 2 },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  chevron: {
    fontSize: 26,
    color: Colors.textDisabled,
    lineHeight: 28,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const PassengerHomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const passenger = useAuthStore(selectAsPassenger);
  const { logout } = useAuth();

  const { myPresence, isLoading, fetchMyPresence, confirmPresence, markAbsent } =
    usePassengers();
  const { currentMonthPayment } = usePayments();

  // Opção selecionada localmente antes de salvar
  const [selectedOption, setSelectedOption] = useState<CheckInOption | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // "saved" = true quando a opção local bate com o que está confirmado no servidor
  const [saved, setSaved] = useState(false);

  // Sincroniza seleção local com presença carregada do servidor
  useEffect(() => {
    if (myPresence?.checkIn) {
      setSelectedOption(myPresence.checkIn);
      setSaved(true);
    } else if (myPresence?.status === 'absent') {
      setSelectedOption('absent');
      setSaved(true);
    } else if (myPresence?.status === 'confirmed') {
      setSelectedOption('both');
      setSaved(true);
    } else {
      setSaved(false);
    }
  }, [myPresence]);

  useEffect(() => {
    fetchMyPresence();
  }, []);

  // ── Salvar check-in ────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!selectedOption || isSaving) return;
    setIsSaving(true);
    try {
      if (selectedOption === 'absent') {
        await markAbsent();
      } else {
        await confirmPresence();
      }
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  }, [selectedOption, isSaving, confirmPresence, markAbsent]);

  const handleSelectOption = (opt: CheckInOption) => {
    setSelectedOption(opt);
    setSaved(false);
  };

  // ── Payment helpers ────────────────────────────────────────────────────────

  const paymentOk =
    currentMonthPayment?.status === 'approved' ||
    currentMonthPayment?.status === 'under_review';
  const paymentLabel = paymentOk ? 'Pagamento em Dia' : 'Pagamento Pendente';
  const paymentColor = paymentOk ? Colors.success : Colors.warning;
  const paymentIconBg = paymentOk ? '#F0FDF4' : '#FFFBEB';

  const now = new Date();
  const nextDue = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  const nextDueLabel = `${String(nextDue.getDate()).padStart(2, '0')}/${String(
    nextDue.getMonth() + 1,
  ).padStart(2, '0')}`;

  const firstName = passenger?.name.split(' ')[0] ?? '';

  const addressLine = passenger?.address
    ? `${passenger.address.street}, ${passenger.address.number} - ${passenger.address.neighborhood}`
    : null;

  if (!passenger) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchMyPresence}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName}!
            </Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusPrefix}>Status de hoje: </Text>
              <StatusBadge option={selectedOption} saved={saved} />
            </View>
          </View>
        </View>

        {/* ── Check-in de Hoje ───────────────────────────────────────────── */}
        <SectionCard>
          <Text style={styles.sectionTitle}>Check-in de Hoje</Text>

          {/* Grid 2×2 */}
          <View style={styles.tilesGrid}>
            {CHECK_IN_TILES.map((tile) => (
              <CheckInTileButton
                key={tile.option}
                tile={tile}
                selected={selectedOption === tile.option}
                onPress={() => handleSelectOption(tile.option)}
              />
            ))}
          </View>

          {/* Aviso de prazo */}
          <View style={styles.deadlineRow}>
            <Text style={styles.deadlineIcon}>🕐</Text>
            <Text style={styles.deadlineText}>Alterações até 05:00 PM</Text>
          </View>

          {/* Botão salvar */}
          <Button
            label={isSaving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar'}
            variant="primary"
            onPress={handleSave}
            loading={isSaving}
            disabled={!selectedOption || isSaving || saved}
            fullWidth
            style={styles.saveBtn}
          />
        </SectionCard>

        {/* ── Perfil do Passageiro ───────────────────────────────────────── */}
        <SectionCard>
          <View style={styles.profileRow}>
            <Avatar name={passenger.name} uri={passenger.avatarUrl} size="lg" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{passenger.name}</Text>
              {addressLine ? (
                <View style={styles.profileDetailRow}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <Text style={styles.detailText} numberOfLines={2}>
                    {addressLine}
                  </Text>
                </View>
              ) : null}
              {passenger.phone ? (
                <View style={styles.profileDetailRow}>
                  <Text style={styles.detailIcon}>📞</Text>
                  <Text style={styles.detailText}>{formatPhone(passenger.phone)}</Text>
                </View>
              ) : null}
              <View style={styles.profileDetailRow}>
                <Text style={styles.detailIcon}>✉️</Text>
                <Text style={styles.detailText} numberOfLines={1}>
                  {passenger.email}
                </Text>
              </View>
            </View>
          </View>

          <Button
            label="✏️  Editar Dados"
            variant="primary"
            onPress={() => navigation.navigate(PASSENGER_STACK_ROUTES.EDIT_PROFILE)}
            fullWidth
          />
        </SectionCard>

        {/* ── Situação de Pagamento ──────────────────────────────────────── */}
        <SectionCard style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <View style={[styles.paymentIconBox, { backgroundColor: paymentIconBg }]}>
              <Text style={styles.paymentIconText}>💳</Text>
            </View>
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentLabel, { color: paymentColor }]}>
                {paymentLabel}
              </Text>
              <Text style={styles.paymentSub}>Próximo vencimento: {nextDueLabel}</Text>
            </View>
            <View style={[styles.paymentDot, { backgroundColor: paymentColor }]} />
          </View>
        </SectionCard>

        {/* ── Agenda Semanal ─────────────────────────────────────────────── */}
        <NavActionCard
          icon="📅"
          iconBg="#EFF6FF"
          title="Minha Agenda Semanal"
          subtitle="Visualizar cronograma"
          onPress={() => navigation.navigate(PASSENGER_STACK_ROUTES.SCHEDULE)}
        />

        {/* ── Comprovante de Pagamento ───────────────────────────────────── */}
        <NavActionCard
          icon="🧾"
          iconBg="#F5F3FF"
          title="Enviar Comprovante"
          subtitle="Anexar comprovante de pagamento"
          onPress={() => navigation.navigate(PASSENGER_STACK_ROUTES.UPLOAD_RECEIPT)}
        />

        {/* ── Logout ─────────────────────────────────────────────────────── */}
        <View style={styles.logoutWrapper}>
          <Button
            label="Sair da conta"
            variant="danger"
            onPress={() =>
              Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: logout },
              ])
            }
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    paddingVertical: Spacing.xs,
  },
  headerLeft: {
    gap: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  statusPrefix: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },

  // ── Check-in ─────────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  deadlineIcon: { fontSize: 13 },
  deadlineText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  saveBtn: {
    marginTop: Spacing.md,
  },

  // ── Perfil ───────────────────────────────────────────────────────────────────
  profileRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  profileDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  detailIcon: {
    fontSize: 13,
    lineHeight: 19,
    width: 18,
  },
  detailText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  // ── Pagamento ────────────────────────────────────────────────────────────────
  paymentCard: { paddingVertical: Spacing.md },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  paymentIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconText: { fontSize: 22 },
  paymentInfo: { flex: 1 },
  paymentLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  paymentSub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  paymentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // ── Logout ─────────────────────────────────────────────────────────────
  logoutWrapper: {
    paddingHorizontal: 0,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
});
