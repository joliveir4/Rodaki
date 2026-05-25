import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  type TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/theme';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { useAuthStore, selectAsDriver } from '@store/auth.store';
import { usePassengersStore } from '@store/passengers.store';
import { passengerService } from '@services/passenger.service';
import type { DriverStackParamList } from '../../@types/navigation.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Navigation = NativeStackNavigationProp<DriverStackParamList, 'AddPassenger' | 'EditPassenger'>;

type Route = {
  params?: {
    passengerId?: string;
  };
};
    
interface FormValues {
  name: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  university: string;
}

interface FormErrors extends Partial<Record<keyof FormValues, string>> {}

// ─── FormSection ──────────────────────────────────────────────────────────────
// Agrupa campos com título e ícone

interface FormSectionProps {
  iconName: string;
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ iconName, title, children }) => (
  <View style={sectionStyles.container}>
    <View style={sectionStyles.header}>
      <Icon name={iconName} size={18} color={Colors.textSecondary} />
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
    <View style={sectionStyles.body}>{children}</View>
  </View>
);

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
});

// ─── Row helper ───────────────────────────────────────────────────────────────

const Row: React.FC<{ children: React.ReactNode; gap?: number }> = ({
  children,
  gap = Spacing.md,
}) => <View style={{ flexDirection: 'row', gap, alignItems: 'flex-start' }}>{children}</View>;

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10,11}$/;
const CEP_RE = /^\d{8}$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) errors.name = 'Nome obrigatório';
  else if (values.name.trim().split(' ').length < 2) errors.name = 'Informe o nome completo';

  if (!values.email.trim()) errors.email = 'E-mail obrigatório';
  else if (!EMAIL_RE.test(values.email)) errors.email = 'E-mail inválido';

  const rawPhone = values.phone.replace(/\D/g, '');
  if (!rawPhone) errors.phone = 'Telefone obrigatório';
  else if (!PHONE_RE.test(rawPhone)) errors.phone = 'Telefone inválido (DDD + número)';

  const rawCep = values.cep.replace(/\D/g, '');
  if (!rawCep) errors.cep = 'CEP obrigatório';
  else if (!CEP_RE.test(rawCep)) errors.cep = 'CEP deve ter 8 dígitos';

  if (!values.street.trim()) errors.street = 'Endereço obrigatório';
  if (!values.city.trim()) errors.city = 'Cidade obrigatória';
  if (!values.state.trim()) errors.state = 'Estado obrigatório';
  if (!values.university.trim()) errors.university = 'Faculdade obrigatória';

  return errors;
}

// ─── CEP helpers ─────────────────────────────────────────────────────────────

function maskCEP(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function maskPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

interface ViaCepResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

async function fetchAddressByCEP(cep: string): Promise<ViaCepResponse | null> {
  try {
    const clean = cep.replace(/\D/g, '');
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data: ViaCepResponse = await res.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const INITIAL_VALUES: FormValues = {
  name: '',
  email: '',
  phone: '',
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  university: '',
};

export const AddPassengerScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const passengerId = route.params?.passengerId;
  const driver = useAuthStore(selectAsDriver);
  const addPassenger = usePassengersStore((s) => s.addPassenger);
  const updatePassengerStore = usePassengersStore((s) => s.updatePassenger);
  const removePassengerStore = usePassengersStore((s) => s.removePassenger);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Refs para avançar foco entre campos com "next" keyboard
  const emailRef = useRef<RNTextInput>(null);
  const phoneRef = useRef<RNTextInput>(null);
  const cepRef = useRef<RNTextInput>(null);
  const streetRef = useRef<RNTextInput>(null);
  const numberRef = useRef<RNTextInput>(null);
  const neighborhoodRef = useRef<RNTextInput>(null);
  const cityRef = useRef<RNTextInput>(null);
  const stateRef = useRef<RNTextInput>(null);
  const universityRef = useRef<RNTextInput>(null);

  const set = useCallback((field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  // ─── CEP lookup ─────────────────────────────────────────────────────────────

  const handleCEPBlur = useCallback(async () => {
    const raw = values.cep.replace(/\D/g, '');
    if (raw.length !== 8) return;

    setCepLoading(true);
    const address = await fetchAddressByCEP(raw);
    setCepLoading(false);

    if (!address) {
      setErrors((prev) => ({ ...prev, cep: 'CEP não encontrado' }));
      return;
    }

    setValues((prev) => ({
      ...prev,
      street: address.logradouro || prev.street,
      neighborhood: address.bairro || prev.neighborhood,
      city: address.localidade || prev.city,
      state: address.uf || prev.state,
    }));
    setErrors((prev) => ({ ...prev, cep: undefined, city: undefined, state: undefined }));
    // Move o foco para o campo Número após preencher o endereço
    numberRef.current?.focus();
  }, [values.cep]);

  // ─── Load passenger when editing ─────────────────────────────────────
  React.useEffect(() => {
    if (!passengerId) return;

    let mounted = true;
    (async () => {
      const p = await passengerService.getById(passengerId);
      if (!p || !mounted) return;

      setValues({
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || '',
        cep: p.address?.cep || '',
        street: p.address?.street || '',
        number: p.address?.number || '',
        neighborhood: p.address?.neighborhood || '',
        city: p.address?.city || '',
        state: p.address?.state || '',
        university: p.university || '',
      });
      setIsActive(p.isActive !== false);
    })();

    return () => { mounted = false; };
  }, [passengerId]);

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!driver) {
      Alert.alert('Erro', 'Sessão do motorista não encontrada. Faça login novamente.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.replace(/\D/g, ''),
        university: values.university.trim(),
        address: {
          cep: values.cep.replace(/\D/g, ''),
          street: values.street.trim(),
          number: values.number.trim(),
          neighborhood: values.neighborhood.trim(),
          city: values.city.trim(),
          state: values.state.trim().toUpperCase(),
        },
        isActive,
      };

      if (passengerId) {
        // Edit mode
        await passengerService.updatePassenger(passengerId, payload);
        updatePassengerStore(passengerId, payload as any);
        Alert.alert('Passageiro atualizado', 'As alterações foram salvas.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        // Create mode
        if (!driver) {
          Alert.alert('Erro', 'Sessão do motorista não encontrada. Faça login novamente.');
          return;
        }

        const createdPassenger = await passengerService.createPassenger(payload, driver.id);
        addPassenger(createdPassenger);
        Alert.alert('Passageiro criado com sucesso', 'O passageiro foi vinculado ao motorista e ja aparece na lista.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      const message: string = err?.code === 'auth/email-already-in-use'
        ? 'Este e-mail já está cadastrado na plataforma.'
        : err?.message ?? 'Ocorreu um erro ao salvar os dados do passageiro.';
      Alert.alert('Erro', message);
    } finally {
      setSaving(false);
    }
  }, [values, driver, navigation, addPassenger, passengerId, isActive, updatePassengerStore]);

  const handleDeletePassenger = useCallback(() => {
    if (!passengerId || !driver) return;

    Alert.alert(
      'Excluir passageiro',
      'Essa ação remove o passageiro da lista do motorista e não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await passengerService.deletePassenger(passengerId, driver.id);
              removePassengerStore(passengerId);
              Alert.alert('Passageiro excluído', 'O passageiro foi removido com sucesso.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              Alert.alert('Erro', err?.message ?? 'Não foi possível excluir o passageiro.');
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }, [passengerId, driver, navigation, removePassengerStore]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={18} color={Colors.textPrimary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{passengerId ? 'Editar Passageiro' : 'Novo Passageiro'}</Text>
          <Text style={styles.headerSubtitle}>{passengerId ? 'Altere os dados do aluno' : 'Preencha os dados do aluno'}</Text>
        </View>

        {/* Espaço reservado para alinhar o título ao centro */}
        <View style={styles.backBtn} />
      </View>

      {/* ── Form ───────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Seção 1: Dados Pessoais ─────────────────────────────────── */}
          <FormSection iconName="account-outline" title="Dados Pessoais">
            <Input
              label="Nome completo"
              required
              placeholder="Ex: Maria da Silva Santos"
              value={values.name}
              onChangeText={(v) => set('name', v)}
              error={errors.name}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Input
              ref={emailRef}
              label="E-mail"
              required
              placeholder="aluno@email.com"
              value={values.email}
              onChangeText={(v) => set('email', v.toLowerCase())}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />

            <Input
              ref={phoneRef}
              label="Telefone"
              required
              placeholder="(11) 99999-9999"
              value={values.phone}
              onChangeText={(v) => set('phone', maskPhone(v))}
              error={errors.phone}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => cepRef.current?.focus()}
              maxLength={15}
            />
          </FormSection>

          {/* ── Seção 2: Endereço ───────────────────────────────────────── */}
          <FormSection iconName="map-marker-outline" title="Endereço">
            <Input
              ref={cepRef}
              label="CEP"
              required
              placeholder="00000-000"
              value={values.cep}
              onChangeText={(v) => set('cep', maskCEP(v))}
              onBlur={handleCEPBlur}
              error={errors.cep}
              keyboardType="numeric"
              returnKeyType="next"
              maxLength={9}
              loading={cepLoading}
              rightElement={
                cepLoading ? undefined : <Icon name="magnify" size={18} color={Colors.textSecondary} />
              }
              onRightElementPress={handleCEPBlur}
              hint={cepLoading ? undefined : 'Digite o CEP para preencher o endereço automaticamente'}
            />

            <Input
              ref={streetRef}
              label="Endereço (rua, avenida...)"
              required
              placeholder="Ex: Rua das Flores"
              value={values.street}
              onChangeText={(v) => set('street', v)}
              error={errors.street}
              returnKeyType="next"
              onSubmitEditing={() => numberRef.current?.focus()}
              autoCapitalize="words"
            />

            <Row>
              <View style={styles.flex}>
                <Input
                  ref={numberRef}
                  label="Número"
                  placeholder="Ex: 123"
                  value={values.number}
                  onChangeText={(v) => set('number', v)}
                  error={errors.number}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => neighborhoodRef.current?.focus()}
                />
              </View>
              <View style={styles.flex2}>
                <Input
                  ref={neighborhoodRef}
                  label="Bairro"
                  placeholder="Ex: Centro"
                  value={values.neighborhood}
                  onChangeText={(v) => set('neighborhood', v)}
                  error={errors.neighborhood}
                  returnKeyType="next"
                  onSubmitEditing={() => cityRef.current?.focus()}
                  autoCapitalize="words"
                />
              </View>
            </Row>

            <Row>
              <View style={styles.flex2}>
                <Input
                  ref={cityRef}
                  label="Cidade"
                  required
                  placeholder="Ex: São Paulo"
                  value={values.city}
                  onChangeText={(v) => set('city', v)}
                  error={errors.city}
                  returnKeyType="next"
                  onSubmitEditing={() => stateRef.current?.focus()}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.stateField}>
                <Input
                  ref={stateRef}
                  label="UF"
                  required
                  placeholder="SP"
                  value={values.state}
                  onChangeText={(v) => set('state', v.toUpperCase().slice(0, 2))}
                  error={errors.state}
                  returnKeyType="next"
                  onSubmitEditing={() => universityRef.current?.focus()}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
            </Row>
          </FormSection>

          {/* ── Seção 3: Instituição ────────────────────────────────────── */}
          <FormSection iconName="school-outline" title="Instituição">
            <Input
              ref={universityRef}
              label="Faculdade / Universidade"
              required
              placeholder="Ex: Universidade Estadual de São Paulo"
              value={values.university}
              onChangeText={(v) => set('university', v)}
              error={errors.university}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              autoCapitalize="words"
            />
          </FormSection>

          {passengerId ? (
            <FormSection iconName="account-check-outline" title="Status do Passageiro">
              <View style={statusStyles.statusCard}>
                <View style={statusStyles.statusTextRow}>
                  <Text style={statusStyles.statusLabel}>Passageiro ativo</Text>
                  <Text style={statusStyles.statusHelper}>
                    Defina se ele deve aparecer como ativo ou inativo na lista do motorista.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[statusStyles.toggle, isActive ? statusStyles.toggleActive : statusStyles.toggleInactive]}
                  onPress={() => setIsActive((current) => !current)}
                  activeOpacity={0.8}
                >
                  <View style={[statusStyles.switchThumb, isActive ? statusStyles.switchThumbActive : statusStyles.switchThumbInactive]}>
                    <Icon name={isActive ? 'check' : 'close'} size={16} color={Colors.white} />
                  </View>
                  <View style={statusStyles.toggleTextWrap}>
                    <Text style={statusStyles.toggleTitle}>{isActive ? 'Ativo' : 'Inativo'}</Text>
                    <Text style={statusStyles.toggleSubtitle}>
                      {isActive ? 'Disponível para acompanhamento' : 'Oculto da lista ativa'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </FormSection>
          ) : null}

          {/* Espaço extra para o botão flutuante */}
          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Footer com botão Salvar ─────────────────────────────────────────── */}
      <View style={styles.footer}>
        {passengerId ? (
          <Button
            label={saving ? 'Salvando...' : 'Excluir Passageiro'}
            variant="danger"
            onPress={handleDeletePassenger}
            fullWidth
            disabled={saving}
            style={styles.deleteBtn}
          />
        ) : null}
        <Button
          label={saving ? 'Salvando...' : 'Salvar Passageiro'}
          variant="primary"
          onPress={handleSave}
          fullWidth
          loading={saving}
          disabled={saving}
        />
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  stateField: {
    width: 72,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 56,
    paddingHorizontal: Spacing.sm,
  },
  backText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Content
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  bottomPad: {
    height: Spacing.xl,
  },

  // Footer
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },
  deleteBtn: {
    marginBottom: Spacing.sm,
  },
});

const statusStyles = StyleSheet.create({
  statusCard: {
    gap: Spacing.md,
  },
  statusTextRow: {
    gap: 4,
  },
  statusLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  statusHelper: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  toggleActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  toggleInactive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  switchThumb: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchThumbActive: {
    backgroundColor: Colors.success,
  },
  switchThumbInactive: {
    backgroundColor: Colors.error,
  },
  toggleTextWrap: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  toggleSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
