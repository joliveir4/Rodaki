import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/theme';
import { useAuthStore, selectAsPassenger } from '@store/auth.store';
import { authService } from '@services/auth.service';
import { saveLocalPaymentReceipt } from '@utils/localPayment';
import { formatMonth, getCurrentMonthISO } from '@utils/formatters';
import type { Driver } from 'src/@types/user.types';
import type { PixKeyType } from 'src/@types/user.types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PIX_TYPE_LABELS: Record<PixKeyType, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  random: 'Chave Aleatória',
};

/** Generate last 12 months as 'YYYY-MM' strings (newest first) */
const buildMonthOptions = (): { value: string; label: string }[] => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}`;
    return { value, label: formatMonth(value) };
  });
};

const MONTH_OPTIONS = buildMonthOptions();

// ─── Currency helpers ─────────────────────────────────────────────────────────

/** Convert raw cents integer → display string: 1050 → "10,50" */
const centsToDisplay = (cents: number): string => {
  if (cents === 0) return '';
  const str = String(cents).padStart(3, '0');
  const intPart = str.slice(0, -2);
  const decPart = str.slice(-2);
  return `${intPart},${decPart}`;
};

/** Parse display text back to cents integer: "10,50" → 1050 */
const displayToCents = (text: string): number => {
  const digits = text.replace(/\D/g, '');
  return digits === '' ? 0 : parseInt(digits, 10);
};

/** Cents integer → BRL amount value: 1050 → 10.50 */
const centsToAmount = (cents: number): number => cents / 100;

// ─── SectionCard ──────────────────────────────────────────────────────────────

interface SectionCardProps {
  iconName: string;
  title: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ iconName, title, children }) => (
  <View style={cardStyles.card}>
    <View style={cardStyles.header}>
      <Icon name={iconName} size={16} color={Colors.textSecondary} />
      <Text style={cardStyles.headerTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

// ─── MonthPickerModal ─────────────────────────────────────────────────────────

interface MonthPickerModalProps {
  visible: boolean;
  selected: string | null;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const MonthPickerModal: React.FC<MonthPickerModalProps> = ({
  visible,
  selected,
  onSelect,
  onClose,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <TouchableOpacity style={modalStyles.backdrop} activeOpacity={1} onPress={onClose} />
    <View style={modalStyles.sheet}>
      <View style={modalStyles.handle} />
      <Text style={modalStyles.sheetTitle}>Selecionar mês</Text>
      <FlatList
        data={MONTH_OPTIONS}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => {
          const isSelected = item.value === selected;
          return (
            <TouchableOpacity
              style={[modalStyles.monthRow, isSelected && modalStyles.monthRowSelected]}
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={[modalStyles.monthLabel, isSelected && modalStyles.monthLabelSelected]}>
                {item.label}
              </Text>
              {isSelected && <Icon name="check" size={16} color={Colors.primary} />}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={modalStyles.separator} />}
        style={modalStyles.list}
      />
    </View>
  </Modal>
);

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    maxHeight: '65%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  list: { flexGrow: 0 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  monthRowSelected: {
    backgroundColor: Colors.primaryLight,
  },
  monthLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.regular,
    textTransform: 'capitalize',
  },
  monthLabelSelected: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
});

// ─── ReceiptDropzone ──────────────────────────────────────────────────────────

interface ReceiptDropzoneProps {
  uri: string | null;
  onCamera: () => void;
  onLibrary: () => void;
  onClear: () => void;
}

const ReceiptDropzone: React.FC<ReceiptDropzoneProps> = ({
  uri,
  onCamera,
  onLibrary,
  onClear,
}) => {
  if (uri) {
    return (
      <View style={dropStyles.previewContainer}>
        <Image source={{ uri }} style={dropStyles.preview} resizeMode="contain" />
        <TouchableOpacity style={dropStyles.clearBtn} onPress={onClear}>
          <View style={dropStyles.clearBtnContent}>
            <Icon name="close" size={16} color={Colors.error} />
            <Text style={dropStyles.clearBtnLabel}>Remover</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={dropStyles.zone}>
      <View style={dropStyles.iconCircle}>
        <Icon name="upload" size={22} color={Colors.primary} />
      </View>
      <Text style={dropStyles.zoneTitle}>Adicionar arquivo</Text>
      <Text style={dropStyles.zoneSubtitle}>Toque abaixo para selecionar</Text>

      <TouchableOpacity style={dropStyles.cameraBtn} onPress={onCamera} activeOpacity={0.85}>
        <Icon name="camera" size={18} color={Colors.white} />
        <Text style={dropStyles.cameraBtnLabel}>Tirar Foto</Text>
      </TouchableOpacity>

      <TouchableOpacity style={dropStyles.libraryBtn} onPress={onLibrary} activeOpacity={0.85}>
        <Icon name="folder-outline" size={18} color={Colors.textPrimary} />
        <Text style={dropStyles.libraryBtnLabel}>Selecionar Arquivo</Text>
      </TouchableOpacity>

      <Text style={dropStyles.hint}>Apenas Imagens. Máx: 10MB</Text>
    </View>
  );
};

const dropStyles = StyleSheet.create({
  zone: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  zoneSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    minHeight: 56,
    width: '100%',
    marginTop: Spacing.xs,
  },
  cameraBtnLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  libraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 56,
    width: '100%',
  },
  libraryBtnLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textDisabled,
    marginTop: Spacing.xs,
  },

  // Preview state
  previewContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
  },
  preview: {
    width: '100%',
    height: 220,
  },
  clearBtn: {
    padding: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    minHeight: 56,
  },
  clearBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  clearBtnLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.error,
  },
});

// ─── UploadReceiptScreen ──────────────────────────────────────────────────────

export const UploadReceiptScreen: React.FC = () => {
  const navigation = useNavigation();
  const passenger = useAuthStore(selectAsPassenger);

  // ── Driver info ────────────────────────────────────────────────────────────
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoadingDriver, setIsLoadingDriver] = useState(true);

  useEffect(() => {
    if (!passenger?.driverId) { setIsLoadingDriver(false); return; }
    (async () => {
      try {
        const data = await authService.fetchUserData(passenger.driverId);
        setDriver(data as Driver);
      } catch {
        // Leave driver null — PIX section will show placeholder
      } finally {
        setIsLoadingDriver(false);
      }
    })();
  }, [passenger?.driverId]);

  const driverPixKey = driver?.pixKey ?? passenger?.driverPixKey ?? null;
  const driverPixKeyType = driver?.pixKeyType ?? passenger?.driverPixKeyType ?? null;

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthISO());
  const [amountCents, setAmountCents] = useState<number>(0);       // integer cents
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<Blob | null>(null);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Amount input handler ───────────────────────────────────────────────────
  const handleAmountChange = useCallback((text: string) => {
    setAmountCents(displayToCents(text));
  }, []);

  // ── Image Picker ───────────────────────────────────────────────────────────
  const requestPermission = async (type: 'camera' | 'library'): Promise<boolean> => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita o acesso à câmera nas configurações do dispositivo.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita o acesso à galeria nas configurações do dispositivo.');
        return false;
      }
    }
    return true;
  };

  const handleCamera = useCallback(async () => {
    if (!(await requestPermission('camera'))) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
      setReceiptFile(null);
    }
  }, []);

  const handleLibrary = useCallback(async () => {
    // Web: use input[file] to obtain a Blob
    if (Platform.OS === 'web') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const documentRef = (globalThis as any).document;
      if (documentRef?.createElement) {
        const file = await new Promise<File | null>((resolve) => {
          const input = documentRef.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = () => resolve(input.files?.[0] ?? null);
          input.click();
        });
        if (file) {
          const url = URL.createObjectURL(file);
          setReceiptUri(url);
          setReceiptFile(file);
        }
      }
      return;
    }

    if (!(await requestPermission('library'))) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
      setReceiptFile(null);
    }
  }, []);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!passenger) return;

    if (!selectedMonth) {
      Alert.alert('Campo obrigatório', 'Selecione o mês de referência.');
      return;
    }
    if (amountCents === 0) {
      Alert.alert('Campo obrigatório', 'Informe o valor pago.');
      return;
    }
    if (!receiptUri) {
      Alert.alert('Campo obrigatório', 'Adicione o comprovante de pagamento.');
      return;
    }

    try {
      setIsSubmitting(true);
      await saveLocalPaymentReceipt({
        passengerId: passenger.id,
        passengerName: passenger.name,
        driverId: passenger.driverId,
        amount: centsToAmount(amountCents),
        imageUri: receiptUri!,
        referenceMonth: selectedMonth,
        imageFile: receiptFile ?? undefined,
      });
      Alert.alert(
        'Comprovante salvo!',
        'Seu comprovante foi salvo neste dispositivo.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o comprovante. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const isFormValid = !!selectedMonth && amountCents > 0 && !!receiptUri;
  const selectedMonthLabel = selectedMonth
    ? MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ?? ''
    : 'Selecione o mês';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={18} color={Colors.textPrimary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enviar Comprovante</Text>
        <View style={styles.backSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── PIX Key ──────────────────────────────────────────────────────── */}
        <SectionCard iconName="account-outline" title="Chave Pix do Motorista">
          {isLoadingDriver ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.sm }} />
          ) : (driver || driverPixKey) ? (
            <View style={styles.pixRow}>
              <View style={styles.pixMetaRow}>
                <Text style={styles.pixMetaLabel}>Tipo da chave</Text>
                <Text style={styles.pixType}>
                  {driverPixKeyType ? PIX_TYPE_LABELS[driverPixKeyType] : 'PIX'}
                </Text>
              </View>
              {driverPixKey ? (
                <View style={styles.pixValueCard}>
                  <Text style={styles.pixValueLabel}>Chave PIX do motorista</Text>
                  <Text style={styles.pixKey} selectable>
                    {driverPixKey}
                  </Text>
                  <Text style={styles.pixOwner}>{driver?.name ?? 'Motorista'}</Text>
                </View>
              ) : (
                <Text style={styles.pixPlaceholder}>O motorista ainda não definiu uma chave PIX.</Text>
              )}
            </View>
          ) : (
            <Text style={styles.pixPlaceholder}>Chave PIX não disponível</Text>
          )}
        </SectionCard>

        {/* ── Month selector ────────────────────────────────────────────────── */}
        <SectionCard iconName="calendar-month-outline" title="Mês de Referência">
          <TouchableOpacity
            style={styles.monthSelector}
            onPress={() => setIsMonthModalOpen(true)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.monthSelectorText,
                !selectedMonth && styles.monthSelectorPlaceholder,
              ]}
            >
              {selectedMonthLabel}
            </Text>
            <Icon name="chevron-down" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </SectionCard>

        {/* ── Amount ────────────────────────────────────────────────────────── */}
        <SectionCard iconName="cash" title="Valor Pago">
          <View style={styles.amountRow}>
            <Text style={styles.currencyPrefix}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={centsToDisplay(amountCents)}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="0,00"
              placeholderTextColor={Colors.textDisabled}
              returnKeyType="done"
              maxLength={12}
            />
          </View>
        </SectionCard>

        {/* ── Comprovante ───────────────────────────────────────────────────── */}
        <SectionCard iconName="paperclip" title="Comprovante de Pagamento">
          <ReceiptDropzone
            uri={receiptUri}
            onCamera={handleCamera}
            onLibrary={handleLibrary}
            onClear={() => setReceiptUri(null)}
          />
        </SectionCard>

        {/* ── Submit ────────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!isFormValid || isSubmitting) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Icon name="send" size={16} color={Colors.white} />
              <Text style={styles.submitBtnLabel}>Enviar Comprovante</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Month picker modal ────────────────────────────────────────────── */}
      <MonthPickerModal
        visible={isMonthModalOpen}
        selected={selectedMonth}
        onSelect={setSelectedMonth}
        onClose={() => setIsMonthModalOpen(false)}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 56,
  },
  backText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  backSpacer: {
    width: 72,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },

  // Scroll
  scroll: { flex: 1 },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // PIX
  pixRow: {
    gap: Spacing.sm,
  },
  pixMetaRow: {
    gap: 2,
  },
  pixMetaLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textDisabled,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pixType: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  pixValueCard: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 4,
  },
  pixValueLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textDisabled,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pixKey: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  pixOwner: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  pixPlaceholder: {
    fontSize: Typography.fontSize.md,
    color: Colors.textDisabled,
    fontStyle: 'italic',
  },

  // Month selector
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
  },
  monthSelectorText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    textTransform: 'capitalize',
  },
  monthSelectorPlaceholder: {
    color: Colors.textDisabled,
    fontWeight: Typography.fontWeight.regular,
  },

  // Amount
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    gap: Spacing.xs,
  },
  currencyPrefix: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    paddingVertical: 12,
    fontWeight: Typography.fontWeight.medium,
  },

  // Submit button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
