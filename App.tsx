import 'react-native-gesture-handler';
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from '@navigation/AppNavigator';
import { AppTheme } from '@constants/theme';

// ─── App Root ─────────────────────────────────────────────────────────────────
// Ordem dos providers:
//   GestureHandler → PaperProvider (tema) → NavigationContainer (dentro do AppNavigator)

export default function App() {
  return (
    <PaperProvider theme={AppTheme}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <AppNavigator />
    </PaperProvider>
  );
}
