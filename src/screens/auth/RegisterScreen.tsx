import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@hooks/useAuth';
import { Input } from '@components/forms/Input';
import { Button } from '@components/common/Button';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import {
  validateEmail,
  validateName,
  validatePhone,
  getPasswordError,
  isValidCPF,
  validateRequired,
} from '@utils/validators';
import type { AuthScreenProps } from 'src/@types/navigation.types';

// ─── Screen ───────────────────────────────────────────────────────────────────

export const RegisterScreen: React.FC<AuthScreenProps<'Register'>> = ({ navigation }) => {
  const { register, isLoading, error } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [stateField, setStateField] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    const passErr = getPasswordError(password);
    if (nameErr) newErrors.name = nameErr;
    if (emailErr) newErrors.email = emailErr;
    if (phoneErr) newErrors.phone = phoneErr;
    if (passErr) newErrors.password = passErr;
    // Driver-specific validations
    if (!isValidCPF(cpf)) newErrors.cpf = 'CPF inválido';
    const vehicleModelErr = validateRequired(vehicleModel, 'Veículo');
    const vehiclePlateErr = validateRequired(vehiclePlate, 'Placa do veículo');
    if (vehicleModelErr) newErrors.vehicleModel = vehicleModelErr;
    if (vehiclePlateErr) newErrors.vehiclePlate = vehiclePlateErr;
    const streetErr = validateRequired(street, 'Rua');
    const numberErr = validateRequired(number, 'Número');
    const cityErr = validateRequired(city, 'Cidade');
    const stateErr = validateRequired(stateField, 'Estado');
    if (streetErr) newErrors.street = streetErr;
    if (numberErr) newErrors.number = numberErr;
    if (cityErr) newErrors.city = cityErr;
    if (stateErr) newErrors.state = stateErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchCep = useCallback(async (digits: string) => {
    try {
      setCepLoading(true);
      setErrors((p) => {
        const copy = { ...p };
        delete copy.cep;
        return copy;
      });
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!res.ok) throw new Error('network');
      const data = await res.json();
      if (data.erro) {
        setErrors((p) => ({ ...p, cep: 'CEP não encontrado' }));
        return;
      }
      setStreet(data.logradouro ?? '');
      setNeighborhood(data.bairro ?? '');
      setCity(data.localidade ?? '');
      setStateField(data.uf ?? '');
    } catch (err) {
      setErrors((p) => ({ ...p, cep: 'Erro ao buscar CEP' }));
    } finally {
      setCepLoading(false);
    }
  }, []);

  useEffect(() => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    const id = setTimeout(() => fetchCep(digits), 500);
    return () => clearTimeout(id);
  }, [cep, fetchCep]);

  const handleRegister = () => {
    if (!validate()) return;
    const address = {
      cep,
      street,
      number,
      neighborhood,
      city,
      state: stateField,
    };

    register({
      name: name.trim(),
      email: email.trim(),
      phone,
      password,
      role: 'driver',
      cpf,
      vehicleModel,
      vehiclePlate,
      address,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Icon name="arrow-left" size={18} color={Colors.textPrimary} />
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Cadastro de Motorista</Text>
            <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <Input
              label="Nome completo"
              placeholder="João da Silva"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />

            <Input
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Telefone"
              placeholder="(11) 99999-9999"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              keyboardType="phone-pad"
            />

            <Input
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
            />

            <Input
              label="CPF"
              placeholder="000.000.000-00"
              value={cpf}
              onChangeText={setCpf}
              error={errors.cpf}
              keyboardType="numeric"
            />

            <Input
              label="Veículo (modelo)"
              placeholder="Ex: Fiat Uno"
              value={vehicleModel}
              onChangeText={setVehicleModel}
              error={errors.vehicleModel}
            />

            <Input
              label="Placa do veículo"
              placeholder="AAA0A00"
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
              error={errors.vehiclePlate}
            />

            <Input
              label="CEP"
              placeholder="00000-000"
              value={cep}
              onChangeText={setCep}
              onBlur={() => {
                const digits = cep.replace(/\D/g, '');
                if (digits.length === 8) fetchCep(digits);
              }}
              loading={cepLoading}
              error={errors.cep}
            />

            <Input
              label="Rua"
              placeholder="Rua Exemplo"
              value={street}
              onChangeText={setStreet}
              error={errors.street}
            />

            <Input
              label="Número"
              placeholder="123"
              value={number}
              onChangeText={setNumber}
              error={errors.number}
            />

            <Input
              label="Bairro"
              placeholder="Centro"
              value={neighborhood}
              onChangeText={setNeighborhood}
            />

            <Input
              label="Cidade"
              placeholder="São Paulo"
              value={city}
              onChangeText={setCity}
              error={errors.city}
            />

            <Input
              label="Estado"
              placeholder="SP"
              value={stateField}
              onChangeText={setStateField}
              error={errors.state}
            />

            <Button
              label="Criar conta"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              style={styles.submitBtn}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: Spacing.lg },
  back: {
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 56,
  },
  backText: { color: Colors.primary, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.medium },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: Typography.fontSize.xxl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
  form: { gap: Spacing.md },
  errorBanner: { backgroundColor: Colors.errorLight, padding: Spacing.md, borderRadius: BorderRadius.md },
  errorBannerText: { color: Colors.error, fontSize: Typography.fontSize.sm },
  submitBtn: { marginTop: Spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  footerText: { color: Colors.textSecondary, fontSize: Typography.fontSize.md },
  footerLink: { color: Colors.primary, fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
});
