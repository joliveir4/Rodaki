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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@constants/theme';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { useAuthStore, selectAsDriver } from '@store/auth.store';
import { usePassengersStore } from '@store/passengers.store';
import { passengerService } from '@services/passenger.service';
import type { DriverStackParamList } from '../../@types/navigation.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Navigation = NativeStackNavigationProp<DriverStackParamList, 'AddPassenger'>;
    
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
  icon: string;
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ icon, title, children }) => (
  <View style={sectionStyles.container}>
    <View style={sectionStyles.header}>
      <Text style={sectionStyles.icon}>{icon}</Text>
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
  icon: {
    fontSize: 18,
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
  const driver = useAuthStore(selectAsDriver);
  const addPassenger = usePassengersStore((s) => s.addPassenger);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      const createdPassenger = await passengerService.createPassenger(
        {
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
        },
        driver.id,
      );

      addPassenger(createdPassenger);

      Alert.alert(
        'Passageiro criado com sucesso',
        'O passageiro foi vinculado ao motorista e ja aparece na lista.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      const message: string = err?.code === 'auth/email-already-in-use'
        ? 'Este e-mail já está cadastrado na plataforma.'
        : err?.message ?? 'Ocorreu um erro ao cadastrar o passageiro.';
      Alert.alert('Erro ao cadastrar', message);
    } finally {
      setSaving(false);
    }
  }, [values, driver, navigation, addPassenger]);

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
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Novo Passageiro</Text>
          <Text style={styles.headerSubtitle}>Preencha os dados do aluno</Text>
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
          <FormSection icon="👤" title="Dados Pessoais">
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
          <FormSection icon="📍" title="Endereço">
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
              rightElement={cepLoading ? undefined : '🔍'}
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
          <FormSection icon="🎓" title="Instituição">
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

          {/* Espaço extra para o botão flutuante */}
          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Footer com botão Salvar ─────────────────────────────────────────── */}
      <View style={styles.footer}>
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
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
});
