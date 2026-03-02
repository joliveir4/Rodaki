import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '@hooks/useAuth';
import { useNotifications } from '@hooks/useNotifications';
import { AuthNavigator } from './AuthNavigator';
import { PassengerNavigator } from './PassengerNavigator';
import { DriverNavigator } from './DriverNavigator';
import { Colors } from '@constants/theme';

// ─── AppNavigator ─────────────────────────────────────────────────────────────
// Responsável por decidir qual navigator renderizar com base no estado de auth

export const AppNavigator: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  useNotifications();   // registra listeners de push globalmente

  // ─── Splash / Loading ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // ─── Routing por role ──────────────────────────────────────────────────────

  const renderNavigator = () => {
    if (!isAuthenticated || !user) return <AuthNavigator />;
    if (user.role === 'driver') return <DriverNavigator />;
    return <PassengerNavigator />;
  };

  return (
    <NavigationContainer>
      {renderNavigator()}
    </NavigationContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
