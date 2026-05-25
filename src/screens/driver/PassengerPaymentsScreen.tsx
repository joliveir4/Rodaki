import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@constants/theme';
import { Button } from '@components/common/Button';
import type { DriverStackScreenProps } from 'src/@types/navigation.types';

type Props = DriverStackScreenProps<'PassengerPayments'>;

export const PassengerPaymentsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { passengerId } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Ainda não há dados para ver aqui</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          Nenhum histórico de pagamentos disponível para o passageiro selecionado.
        </Text>

        <Button label="Voltar" onPress={() => navigation.goBack()} style={styles.btn} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.lg, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  btn: { alignSelf: 'stretch' },
});

export default PassengerPaymentsScreen;
