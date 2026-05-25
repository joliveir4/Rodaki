import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from '@navigation/AppNavigator';
import { AppTheme } from '@constants/theme';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// ─── App Root ─────────────────────────────────────────────────────────────────
// Ordem dos providers:
//   GestureHandler → PaperProvider (tema) → NavigationContainer (dentro do AppNavigator)

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={AppTheme.colors.primary} />
      </View>
    );
  }

  // Ensure icon fonts are registered (fixes web glyph/code rendering)
  // Call loadFont once — works on native and web.
  MaterialCommunityIcons.loadFont?.();

  return (
    <PaperProvider theme={AppTheme}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <AppNavigator />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppTheme.colors.background },
});
