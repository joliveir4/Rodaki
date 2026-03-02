import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  type TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/theme';
import { Avatar } from '@components/common/Avatar';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { useAuthStore, selectAsDriver } from '@store/auth.store';
import { useAuth } from '@hooks/useAuth';
import { authService } from '@services/auth.service';
import { formatPhone, formatPixKeyType } from '@utils/formatters';
import type { PassengerAddress, PixKeyType } from '../../@types/user.types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressForm {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

const EMPTY_ADDRESS: AddressForm = {
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
};

interface VehicleForm {
  vehicleModel: string;
  vehiclePlate: string;
}

interface PixForm {
  pixKeyType: PixKeyType;
  pixKey: string;
}

interface PhoneForm {
  phone: string;
}

const PIX_KEY_OPTIONS: { value: PixKeyType; label: string; placeholder: string }[] = [
  { value: 'cpf',    label: 'CPF',            placeholder: '000.000.000-00' },
  { value: 'cnpj',   label: 'CNPJ',           placeholder: '00.000.000/0001-00' },
  { value: 'email',  label: 'E-mail',         placeholder: 'seu@email.com' },
  { value: 'phone',  label: 'Telefone',       placeholder: '+55 11 91234-5678' },
  { value: 'random', label: 'Chave aleatória', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maskCEP(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

async function fetchAddressByCEP(cep: string): Promise<Partial<AddressForm> | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return {
      street: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
    };
  } catch {
    return null;
  }
}

// ─── InfoRow ─────────────────────────────────────────────────────────────────
// Linha de informação read-only usada dentro dos cards

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono = false,
}) => (
  <View style={infoRowStyles.row}>
    <Text style={infoRowStyles.label}>{label}</Text>
    <Text
      style={[infoRowStyles.value, mono && infoRowStyles.mono]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {value}
    </Text>
  </View>
);

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    flex: 2,
    textAlign: 'right',
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: Typography.fontSize.xs,
  },
});

// ─── InfoCard ─────────────────────────────────────────────────────────────────
// Card com título, ícone e linhas de informação

interface InfoCardProps {
  icon: string;
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, onEdit, children }) => (
  <View style={cardStyles.card}>
    <View style={cardStyles.header}>
      <View style={cardStyles.titleRow}>
        <Text style={cardStyles.icon}>{icon}</Text>
        <Text style={cardStyles.title}>{title}</Text>
      </View>
      {onEdit && (
        <TouchableOpacity onPress={onEdit} activeOpacity={0.7} style={cardStyles.editBtn}>
          <Text style={cardStyles.editBtnText}>✏️ Editar</Text>
        </TouchableOpacity>
      )}
    </View>
    <View style={cardStyles.body}>{children}</View>
  </View>
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: { fontSize: 18 },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  editBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  editBtnText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  body: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
});

// ─── StatBadge ────────────────────────────────────────────────────────────────

const StatBadge: React.FC<{ count: number; label: string }> = ({ count, label }) => (
  <View style={statStyles.container}>
    <Text style={statStyles.count}>{count}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: 2 },
  count: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.75)',
  },
});

// ─── EditAddressModal ─────────────────────────────────────────────────────────

interface EditAddressModalProps {
  visible: boolean;
  initial: AddressForm;
  onClose: () => void;
  onSave: (address: PassengerAddress) => Promise<void>;
}

const EditAddressModal: React.FC<EditAddressModalProps> = ({
  visible,
  initial,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<AddressForm>(initial);
  const [errors, setErrors] = useState<Partial<AddressForm>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const streetRef = useRef<RNTextInput>(null);
  const numberRef = useRef<RNTextInput>(null);
  const neighborhoodRef = useRef<RNTextInput>(null);
  const cityRef = useRef<RNTextInput>(null);
  const stateRef = useRef<RNTextInput>(null);

  const set = useCallback((field: keyof AddressForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleCEPBlur = useCallback(async () => {
    const raw = form.cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    setCepLoading(true);
    const result = await fetchAddressByCEP(raw);
    setCepLoading(false);
    if (!result) {
      setErrors((prev) => ({ ...prev, cep: 'CEP não encontrado' }));
      return;
    }
    setForm((prev) => ({ ...prev, ...result }));
    numberRef.current?.focus();
  }, [form.cep]);

  const validate = (): boolean => {
    const e: Partial<AddressForm> = {};
    if (!form.street.trim()) e.street = 'Obrigatório';
    if (!form.city.trim()) e.city = 'Obrigatório';
    if (!form.state.trim()) e.state = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        cep: form.cep.replace(/\D/g, ''),
        street: form.street.trim(),
        number: form.number.trim(),
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível salvar o endereço.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={modalStyles.kav}
        >
          <View style={modalStyles.sheet}>
            {/* Handle bar */}
            <View style={modalStyles.handle} />

            {/* Header */}
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Editar Endereço</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={modalStyles.closeBtn}>
                <Text style={modalStyles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={modalStyles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Input
                label="CEP"
                placeholder="00000-000"
                value={form.cep}
                onChangeText={(v) => set('cep', maskCEP(v))}
                onBlur={handleCEPBlur}
                error={errors.cep}
                keyboardType="numeric"
                maxLength={9}
                loading={cepLoading}
                rightElement={cepLoading ? undefined : '🔍'}
                onRightElementPress={handleCEPBlur}
                returnKeyType="next"
                hint="Preenche o endereço automaticamente"
              />

              <Input
                ref={streetRef}
                label="Rua / Avenida"
                required
                placeholder="Ex: Rua das Flores"
                value={form.street}
                onChangeText={(v) => set('street', v)}
                error={errors.street}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => numberRef.current?.focus()}
              />

              <View style={modalStyles.row}>
                <View style={{ flex: 1 }}>
                  <Input
                    ref={numberRef}
                    label="Número"
                    placeholder="123"
                    value={form.number}
                    onChangeText={(v) => set('number', v)}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => neighborhoodRef.current?.focus()}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Input
                    ref={neighborhoodRef}
                    label="Bairro"
                    placeholder="Ex: Centro"
                    value={form.neighborhood}
                    onChangeText={(v) => set('neighborhood', v)}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => cityRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={modalStyles.row}>
                <View style={{ flex: 2 }}>
                  <Input
                    ref={cityRef}
                    label="Cidade"
                    required
                    placeholder="Ex: São Paulo"
                    value={form.city}
                    onChangeText={(v) => set('city', v)}
                    error={errors.city}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => stateRef.current?.focus()}
                  />
                </View>
                <View style={{ width: 72 }}>
                  <Input
                    ref={stateRef}
                    label="UF"
                    required
                    placeholder="SP"
                    value={form.state}
                    onChangeText={(v) => set('state', v.toUpperCase().slice(0, 2))}
                    error={errors.state}
                    autoCapitalize="characters"
                    maxLength={2}
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={modalStyles.footer}>
              <Button
                label={saving ? 'Salvando...' : 'Salvar Endereço'}
                variant="primary"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                fullWidth
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  kav: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    ...Shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.bold,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

// ─── EditPhoneModal ──────────────────────────────────────────────────────────

interface EditPhoneModalProps {
  visible: boolean;
  initial: PhoneForm;
  onClose: () => void;
  onSave: (data: PhoneForm) => Promise<void>;
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const EditPhoneModal: React.FC<EditPhoneModalProps> = ({ visible, initial, onClose, onSave }) => {
  const [form, setForm] = useState<PhoneForm>(initial);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const digits = form.phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Número inválido');
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({ phone: form.phone.replace(/\D/g, '') });
      onClose();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível salvar o telefone.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={modalStyles.kav}
        >
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Editar Telefone</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={modalStyles.closeBtn}>
                <Text style={modalStyles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.content}>
              <Input
                label="Número de telefone"
                required
                placeholder="(11) 91234-5678"
                value={maskPhone(form.phone)}
                onChangeText={(v) => {
                  setForm({ phone: v });
                  setError(undefined);
                }}
                error={error}
                keyboardType="phone-pad"
                maxLength={15}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            <View style={modalStyles.footer}>
              <Button
                label={saving ? 'Salvando...' : 'Salvar Telefone'}
                variant="primary"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                fullWidth
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── EditVehicleModal ─────────────────────────────────────────────────────────

interface EditVehicleModalProps {
  visible: boolean;
  initial: VehicleForm;
  onClose: () => void;
  onSave: (data: VehicleForm) => Promise<void>;
}

const EditVehicleModal: React.FC<EditVehicleModalProps> = ({
  visible,
  initial,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<VehicleForm>(initial);
  const [errors, setErrors] = useState<Partial<VehicleForm>>({});
  const [saving, setSaving] = useState(false);

  const plateRef = useRef<RNTextInput>(null);

  const set = useCallback((field: keyof VehicleForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const validate = (): boolean => {
    const e: Partial<VehicleForm> = {};
    if (!form.vehicleModel.trim()) e.vehicleModel = 'Obrigatório';
    if (!form.vehiclePlate.trim()) e.vehiclePlate = 'Obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        vehicleModel: form.vehicleModel.trim(),
        vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível salvar os dados do veículo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={modalStyles.kav}
        >
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Editar Veículo</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={modalStyles.closeBtn}>
                <Text style={modalStyles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={modalStyles.content}>
              <Input
                label="Modelo do veículo"
                required
                placeholder="Ex: Toyota Corolla"
                value={form.vehicleModel}
                onChangeText={(v) => set('vehicleModel', v)}
                error={errors.vehicleModel}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => plateRef.current?.focus()}
              />
              <Input
                ref={plateRef}
                label="Placa"
                required
                placeholder="Ex: ABC1D23"
                value={form.vehiclePlate}
                onChangeText={(v) => set('vehiclePlate', v.toUpperCase())}
                error={errors.vehiclePlate}
                autoCapitalize="characters"
                maxLength={8}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            <View style={modalStyles.footer}>
              <Button
                label={saving ? 'Salvando...' : 'Salvar Veículo'}
                variant="primary"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                fullWidth
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── EditPixModal ─────────────────────────────────────────────────────────────

interface EditPixModalProps {
  visible: boolean;
  initial: PixForm;
  onClose: () => void;
  onSave: (data: PixForm) => Promise<void>;
}

const EditPixModal: React.FC<EditPixModalProps> = ({ visible, initial, onClose, onSave }) => {
  const [form, setForm] = useState<PixForm>(initial);
  const [errors, setErrors] = useState<{ pixKey?: string }>({});
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    if (!form.pixKey.trim()) {
      setErrors({ pixKey: 'Obrigatório' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({ pixKeyType: form.pixKeyType, pixKey: form.pixKey.trim() });
      onClose();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível salvar a chave PIX.');
    } finally {
      setSaving(false);
    }
  };

  const selectedOption = PIX_KEY_OPTIONS.find((o) => o.value === form.pixKeyType) ?? PIX_KEY_OPTIONS[0]!;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={modalStyles.kav}
        >
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Editar Chave PIX</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={modalStyles.closeBtn}>
                <Text style={modalStyles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={modalStyles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Tipo de chave */}
              <Text style={pixStyles.typeLabel}>Tipo de chave <Text style={pixStyles.required}>*</Text></Text>
              <View style={pixStyles.typeGrid}>
                {PIX_KEY_OPTIONS.map((opt) => {
                  const active = form.pixKeyType === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[pixStyles.typeChip, active && pixStyles.typeChipActive]}
                      onPress={() => setForm((prev) => ({ ...prev, pixKeyType: opt.value, pixKey: '' }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[pixStyles.typeChipText, active && pixStyles.typeChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Chave */}
              <Input
                label="Chave PIX"
                required
                placeholder={selectedOption.placeholder}
                value={form.pixKey}
                onChangeText={(v) => {
                  setForm((prev) => ({ ...prev, pixKey: v }));
                  setErrors({});
                }}
                error={errors.pixKey}
                keyboardType={
                  form.pixKeyType === 'phone' ? 'phone-pad'
                  : form.pixKeyType === 'cpf' || form.pixKeyType === 'cnpj' ? 'numeric'
                  : 'default'
                }
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </ScrollView>

            <View style={modalStyles.footer}>
              <Button
                label={saving ? 'Salvando...' : 'Salvar Chave PIX'}
                variant="primary"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                fullWidth
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const pixStyles = StyleSheet.create({
  typeLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.error,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  typeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  typeChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  typeChipTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const DriverProfileScreen: React.FC = () => {
  const driver = useAuthStore(selectAsDriver);
  const setUser = useAuthStore((s) => s.setUser);
  const { logout } = useAuth();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);
  const [pixModalVisible, setPixModalVisible] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);

  if (!driver) return null;

  const passengerCount = driver.passengerIds?.length ?? 0;

  const currentAddress: AddressForm = {
    cep: driver.address?.cep ?? '',
    street: driver.address?.street ?? '',
    number: driver.address?.number ?? '',
    neighborhood: driver.address?.neighborhood ?? '',
    city: driver.address?.city ?? '',
    state: driver.address?.state ?? '',
  };

  // ─── Alterar foto ─────────────────────────────────────────────────────────

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso à galeria para trocar a foto de perfil.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setUploadingPhoto(true);

    try {
      const updates = await authService.updateDriverProfile(driver.id, { avatarUri: uri });
      setUser({ ...driver, ...updates });
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível atualizar a foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ─── Salvar endereço ──────────────────────────────────────────────────────

  const handleSaveAddress = useCallback(
    async (address: PassengerAddress) => {
      const updates = await authService.updateDriverProfile(driver.id, { address });
      setUser({ ...driver, ...updates });
    },
    [driver, setUser],
  );

  // ─── Salvar telefone ──────────────────────────────────────────────────────

  const handleSavePhone = useCallback(
    async (data: PhoneForm) => {
      const updates = await authService.updateDriverProfile(driver.id, data);
      setUser({ ...driver, ...updates });
    },
    [driver, setUser],
  );

  // ─── Salvar veículo ───────────────────────────────────────────────────────

  const handleSaveVehicle = useCallback(
    async (data: VehicleForm) => {
      const updates = await authService.updateDriverProfile(driver.id, data);
      setUser({ ...driver, ...updates });
    },
    [driver, setUser],
  );

  // ─── Salvar PIX ───────────────────────────────────────────────────────────

  const handleSavePix = useCallback(
    async (data: PixForm) => {
      const updates = await authService.updateDriverProfile(driver.id, data);
      setUser({ ...driver, ...updates });
    },
    [driver, setUser],
  );

  // ─── Logout ───────────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Avatar com botão de câmera */}
          <View style={styles.avatarWrapper}>
            <Avatar name={driver.name} uri={driver.avatarUrl} size="xl" />
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handleChangePhoto}
              activeOpacity={0.8}
              disabled={uploadingPhoto}
              accessibilityLabel="Alterar foto de perfil"
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.cameraIcon}>📷</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.heroName}>{driver.name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>🚌 Motorista</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatBadge count={passengerCount} label="Passageiros" />
          </View>
        </View>

        {/* ── Cards de informação ────────────────────────────────────────── */}
        <View style={styles.cards}>

          {/* Dados pessoais */}
          <InfoCard icon="👤" title="Dados Pessoais" onEdit={() => setPhoneModalVisible(true)}>
            <InfoRow label="Nome" value={driver.name} />
            <InfoRow label="E-mail" value={driver.email} />
            <InfoRow label="Telefone" value={formatPhone(driver.phone)} />
          </InfoCard>

          {/* Veículo */}
          <InfoCard icon="🚗" title="Veículo" onEdit={() => setVehicleModalVisible(true)}>
            <InfoRow label="Modelo" value={driver.vehicleModel} />
            <InfoRow label="Placa" value={driver.vehiclePlate} mono />
          </InfoCard>

          {/* PIX */}
          <InfoCard icon="💸" title="Chave PIX" onEdit={() => setPixModalVisible(true)}>
            <InfoRow label="Tipo" value={formatPixKeyType(driver.pixKeyType)} />
            <InfoRow label="Chave" value={driver.pixKey} mono />
          </InfoCard>

          {/* Endereço — editável */}
          <InfoCard
            icon="📍"
            title="Endereço"
            onEdit={() => setAddressModalVisible(true)}
          >
            {driver.address ? (
              <>
                <InfoRow
                  label="Logradouro"
                  value={`${driver.address.street}${driver.address.number ? `, ${driver.address.number}` : ''}`}
                />
                {driver.address.neighborhood ? (
                  <InfoRow label="Bairro" value={driver.address.neighborhood} />
                ) : null}
                <InfoRow
                  label="Cidade/UF"
                  value={`${driver.address.city} / ${driver.address.state}`}
                />
                <InfoRow label="CEP" value={driver.address.cep} mono />
              </>
            ) : (
              <TouchableOpacity
                style={styles.addAddressBtn}
                onPress={() => setAddressModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.addAddressIcon}>＋</Text>
                <Text style={styles.addAddressText}>Adicionar endereço</Text>
              </TouchableOpacity>
            )}
          </InfoCard>

        </View>

        {/* ── Logout ─────────────────────────────────────────────────────── */}
        <View style={styles.logoutWrapper}>
          <Button
            label="Sair da conta"
            variant="danger"
            onPress={handleLogout}
            fullWidth
          />
        </View>
      </ScrollView>

      {/* ── Modal de endereço ─────────────────────────────────────────────── */}
      <EditAddressModal
        visible={addressModalVisible}
        initial={currentAddress}
        onClose={() => setAddressModalVisible(false)}
        onSave={handleSaveAddress}
      />

      {/* ── Modal de veículo ──────────────────────────────────────────────── */}
      <EditVehicleModal
        visible={vehicleModalVisible}
        initial={{ vehicleModel: driver.vehicleModel, vehiclePlate: driver.vehiclePlate }}
        onClose={() => setVehicleModalVisible(false)}
        onSave={handleSaveVehicle}
      />

      {/* ── Modal de PIX ──────────────────────────────────────────────────── */}
      <EditPixModal
        visible={pixModalVisible}
        initial={{ pixKeyType: driver.pixKeyType, pixKey: driver.pixKey }}
        onClose={() => setPixModalVisible(false)}
        onSave={handleSavePix}
      />

      {/* ── Modal de telefone ─────────────────────────────────────────────── */}
      <EditPhoneModal
        visible={phoneModalVisible}
        initial={{ phone: driver.phone }}
        onClose={() => setPhoneModalVisible(false)}
        onSave={handleSavePhone}
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
  content: {
    paddingBottom: Spacing.xl,
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl + 8,
    borderBottomRightRadius: BorderRadius.xl + 8,
    gap: Spacing.sm,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryDark,
    borderWidth: 2.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 16,
  },
  heroName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    marginTop: Spacing.sm,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // ── Cards ────────────────────────────────────────────────────────────────────
  cards: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // ── Endereço vazio ──────────────────────────────────────────────────────────
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  addAddressIcon: {
    fontSize: Typography.fontSize.xl,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  addAddressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },

  // ── Logout ───────────────────────────────────────────────────────────────────
  logoutWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
});
