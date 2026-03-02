import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '@constants/theme';

// Tela placeholder reutilizável enquanto a implementação real não é feita
const PlaceholderScreen: React.FC<{ title: string; description: string; icon: string }> = ({
  title,
  description,
  icon,
}) => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.body}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  icon: { fontSize: 56 },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export { WeeklyScheduleScreen as PassengerScheduleScreen } from './WeeklyScheduleScreen';
export { UploadReceiptScreen as PassengerUploadReceiptScreen } from './UploadReceiptScreen';

export const PassengerEditProfileScreen: React.FC = () => (
  <PlaceholderScreen
    icon="✏️"
    title="Editar Dados"
    description="Aqui você poderá editar suas informações pessoais como endereço, telefone e foto."
  />
);
