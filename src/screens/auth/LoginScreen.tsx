import React, { useState } from 'react';
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
import { useAuth } from '@hooks/useAuth';
import { Input } from '@components/forms/Input';
import { Button } from '@components/common/Button';
import { Colors, Typography, Spacing, BorderRadius } from '@constants/theme';
import { validateEmail, getPasswordError } from '@utils/validators';
import type { AuthScreenProps } from 'src/@types/navigation.types';

// ─── Screen ───────────────────────────────────────────────────────────────────

export const LoginScreen: React.FC<AuthScreenProps<'Login'>> = ({ navigation }) => {
  const { login, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const emailErr = validateEmail(email);
    const passErr = getPasswordError(password);
    if (emailErr) newErrors.email = emailErr;
    if (passErr) newErrors.password = passErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (!validate()) return;
    login({ email: email.trim(), password });
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🚌</Text>
            <Text style={styles.title}>Rodaki</Text>
            <Text style={styles.subtitle}>Gestão de transporte simplificada</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Entrar na conta</Text>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <Input
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                  <Text style={styles.togglePassword}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />

            <Button
              label="Entrar"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.submitBtn}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Cadastre-se</Text>
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
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: { fontSize: 56, marginBottom: Spacing.sm },
  title: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  form: {
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: Typography.fontSize.sm,
  },
  submitBtn: { marginTop: Spacing.sm },
  togglePassword: { fontSize: 18 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  footerText: { color: Colors.textSecondary, fontSize: Typography.fontSize.md },
  footerLink: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
});
