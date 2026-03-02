import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/theme';
import { useAuthStore, selectAsPassenger } from '@store/auth.store';
import { tripService } from '@services/trip.service';
import type {
  WeekDay,
  WeekDayConfig,
  WeeklyScheduleMap,
  TripOption,
} from 'src/@types/trip.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEK_DAYS: { key: WeekDay; label: string }[] = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terça-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
];

const TRIP_OPTIONS: { key: TripOption; label: string }[] = [
  { key: 'going', label: 'Ida' },
  { key: 'returning', label: 'Volta' },
  { key: 'both', label: 'Ambas' },
];

const DEFAULT_SCHEDULE: WeeklyScheduleMap = {
  segunda: { enabled: false, option: null },
  terca: { enabled: false, option: null },
  quarta: { enabled: false, option: null },
  quinta: { enabled: false, option: null },
  sexta: { enabled: false, option: null },
};

// ─── TripChipGroup ────────────────────────────────────────────────────────────

interface TripChipGroupProps {
  value: TripOption | null;
  onChange: (option: TripOption) => void;
}

const TripChipGroup: React.FC<TripChipGroupProps> = ({ value, onChange }) => (
  <View style={chipStyles.row}>
    {TRIP_OPTIONS.map(({ key, label }) => {
      const selected = value === key;
      return (
        <TouchableOpacity
          key={key}
          style={[chipStyles.chip, selected && chipStyles.chipSelected]}
          onPress={() => onChange(key)}
          activeOpacity={0.75}
        >
          <Text style={[chipStyles.chipLabel, selected && chipStyles.chipLabelSelected]}>
            {label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const chipStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  chipSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary,
  },
  chipLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  chipLabelSelected: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
});

// ─── DayRow ───────────────────────────────────────────────────────────────────

interface DayRowProps {
  label: string;
  config: WeekDayConfig;
  onToggle: (val: boolean) => void;
  onSelectOption: (option: TripOption) => void;
}

const DayRow: React.FC<DayRowProps> = ({ label, config, onToggle, onSelectOption }) => (
  <View style={dayStyles.card}>
    <View style={dayStyles.topRow}>
      <Text style={dayStyles.dayLabel}>{label}</Text>
      <Switch
        value={config.enabled}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.secondary }}
        thumbColor={Colors.white}
        ios_backgroundColor={Colors.border}
      />
    </View>
    {config.enabled && (
      <TripChipGroup value={config.option} onChange={onSelectOption} />
    )}
  </View>
);

const dayStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
});

// ─── WeeklyScheduleScreen ─────────────────────────────────────────────────────

export const WeeklyScheduleScreen: React.FC = () => {
  const navigation = useNavigation();
  const passenger = useAuthStore(selectAsPassenger);

  const [schedule, setSchedule] = useState<WeeklyScheduleMap>({ ...DEFAULT_SCHEDULE });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ── Load saved schedule from Firestore ──────────────────────────────────

  useEffect(() => {
    if (!passenger) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await tripService.getWeeklySchedule(passenger.id);
        if (data?.schedule) setSchedule(data.schedule);
      } catch {
        // fall back to defaults silently
      } finally {
        setIsLoading(false);
      }
    })();
  }, [passenger?.id]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleDay = useCallback((day: WeekDay, val: boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: val,
        // Clear option when disabling the day
        option: val ? prev[day].option : null,
      },
    }));
  }, []);

  const selectOption = useCallback((day: WeekDay, option: TripOption) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], option },
    }));
  }, []);

  const handleSave = async () => {
    if (!passenger) return;

    // Validation: every enabled day must have an option selected
    const incompleteDay = WEEK_DAYS.find(
      ({ key }) => schedule[key].enabled && schedule[key].option === null,
    );
    if (incompleteDay) {
      Alert.alert(
        'Seleção incompleta',
        `Selecione "Ida", "Volta" ou "Ambas" para ${incompleteDay.label} antes de salvar.`,
      );
      return;
    }

    try {
      setIsSaving(true);
      await tripService.saveWeeklySchedule(passenger.id, passenger.driverId, schedule);
      Alert.alert('Agenda salva!', 'Sua agenda semanal foi salva com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a agenda. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha Agenda Semanal</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Warning banner ───────────────────────────────────────────── */}
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              🟡  Limite para alterações diárias: 06:00 AM
            </Text>
          </View>

          {/* ── Section title ────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Configure sua agenda</Text>

          {/* ── Day rows ─────────────────────────────────────────────────── */}
          {WEEK_DAYS.map(({ key, label }) => (
            <DayRow
              key={key}
              label={label}
              config={schedule[key]}
              onToggle={(val) => toggleDay(key, val)}
              onSelectOption={(opt) => selectOption(key, opt)}
            />
          ))}

          {/* ── Save button ──────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveBtnLabel}>Salvar Agenda Semanal</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
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
  backBtn: {
    width: 36,
    alignItems: 'flex-start',
  },
  backIcon: {
    fontSize: 28,
    color: Colors.primary,
    lineHeight: 32,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },

  // Loading state
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scroll: { flex: 1 },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Warning banner
  warningBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  warningText: {
    fontSize: Typography.fontSize.sm,
    color: '#92400E',        // amber-800 for readable contrast on yellow bg
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },

  // Section title
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  // Save button
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    minHeight: 52,
    ...Shadows.md,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
