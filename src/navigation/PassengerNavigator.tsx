import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PassengerTabParamList, PassengerStackParamList } from 'src/@types/navigation.types';
import { PASSENGER_ROUTES, PASSENGER_STACK_ROUTES } from '@constants/routes';
import { Colors, Typography } from '@constants/theme';

// ─── Screens ──────────────────────────────────────────────────────────────────

import { PassengerHomeScreen } from '@screens/passenger/HomeScreen';
import { NotificationsScreen } from '@screens/passenger/NotificationsScreen';
import {
  PassengerScheduleScreen,
  PassengerUploadReceiptScreen,
  PassengerEditProfileScreen,
} from '@screens/passenger/PlaceholderScreens';

// ─── Navigators ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<PassengerTabParamList>();
const Stack = createNativeStackNavigator<PassengerStackParamList>();

const tabIcons: Record<string, string> = {
  [PASSENGER_ROUTES.HOME]: '🏠',
  [PASSENGER_ROUTES.PAYMENT]: '💳',
  [PASSENGER_ROUTES.NOTIFICATIONS]: '🔔',
};

const tabLabels: Record<string, string> = {
  [PASSENGER_ROUTES.HOME]: 'Início',
  [PASSENGER_ROUTES.PAYMENT]: 'Pagamento',
  [PASSENGER_ROUTES.NOTIFICATIONS]: 'Notificações',
};

const PassengerTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) =>
        React.createElement(
          Text,
          { style: { fontSize: 22, opacity: focused ? 1 : 0.5 } },
          tabIcons[route.name] ?? '•',
        ),
      tabBarLabel: tabLabels[route.name] ?? route.name,
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textDisabled,
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border,
        paddingBottom: 6,
        height: 62,
      },
      tabBarLabelStyle: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
      },
    })}
  >
    <Tab.Screen name={PASSENGER_ROUTES.HOME} component={PassengerHomeScreen} />
    <Tab.Screen name={PASSENGER_ROUTES.NOTIFICATIONS} component={NotificationsScreen} />
  </Tab.Navigator>
);

export const PassengerNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={PASSENGER_STACK_ROUTES.TABS} component={PassengerTabs} />
    <Stack.Screen
      name={PASSENGER_STACK_ROUTES.SCHEDULE}
      component={PassengerScheduleScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name={PASSENGER_STACK_ROUTES.UPLOAD_RECEIPT}
      component={PassengerUploadReceiptScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name={PASSENGER_STACK_ROUTES.EDIT_PROFILE}
      component={PassengerEditProfileScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
  </Stack.Navigator>
);
