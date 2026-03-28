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
import { validateEmail } from '@utils/validators';
import type { AuthScreenProps } from 'src/@types/navigation.types';

// ─── Screen ───────────────────────────────────────────────────────────────────

export const ForgotPasswordScreen: React.FC<AuthScreenProps<'ForgotPassword'>> = ({ navigation }) => {
  const { resetPassword, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const err = validateEmail(email);
    setEmailError(err);
    return !err;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;

    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch {
      // Erro já é tratado pelo hook useAuth
    }
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
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🔑</Text>
            <Text style={styles.title}>Esqueceu a senha?</Text>
            <Text style={styles.subtitle}>
              Digite seu e-mail e enviaremos um link para redefinir sua senha
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {success ? (
              <View style={styles.successBanner}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>E-mail enviado!</Text>
                <Text style={styles.successText}>
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </Text>
                <Button
                  label="Voltar para login"
                  onPress={() => navigation.navigate('Login')}
                  fullWidth
                  style={styles.successBtn}
                />
              </View>
            ) : (
              <>
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
                  error={emailError}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />

                <Button
                  label="Enviar link de recuperação"
                  onPress={handleResetPassword}
                  loading={isLoading}
                  fullWidth
                  style={styles.submitBtn}
                />
              </>
            )}
          </View>

          {/* Footer */}
          {!success && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Lembrou a senha? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          )}
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
  back: { marginBottom: Spacing.lg },
  backText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: { fontSize: 56, marginBottom: Spacing.sm },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  form: {
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
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
  successBanner: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  successIcon: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success,
    textAlign: 'center',
  },
  successText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  successBtn: {
    marginTop: Spacing.sm,
  },
  submitBtn: { marginTop: Spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
  },
  footerLink: {
    color: Colors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
});
