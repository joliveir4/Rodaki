import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DriverTabParamList, DriverStackParamList } from 'src/@types/navigation.types';
import { DRIVER_ROUTES, DRIVER_STACK_ROUTES } from '@constants/routes';
import { Colors, Typography } from '@constants/theme';
import { usePaymentStore } from '@store/payment.store';

// ─── Screens ──────────────────────────────────────────────────────────────────

import { DriverHomeScreen } from '@screens/driver/HomeScreen';
import { PaymentReviewScreen } from '@screens/driver/PaymentReviewScreen';
import { ManagePassengersScreen } from '@screens/driver/ManagePassengersScreen';
import { AddPassengerScreen } from '../screens/driver/AddPassengerScreen';
import { DriverProfileScreen } from '@screens/driver/DriverProfileScreen';

// ─── Navigators ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<DriverTabParamList>();
const Stack = createNativeStackNavigator<DriverStackParamList>();

const tabIcons: Record<string, string> = {
  [DRIVER_ROUTES.HOME]: '🚌',
  [DRIVER_ROUTES.PASSENGER_LIST]: '👥',
  [DRIVER_ROUTES.PAYMENT_REVIEW]: '💰',
  [DRIVER_ROUTES.MANAGE_PASSENGERS]: '⚙️',
  [DRIVER_ROUTES.PROFILE]: '👤',
};

const tabLabels: Record<string, string> = {
  [DRIVER_ROUTES.HOME]: 'Início',
  [DRIVER_ROUTES.PASSENGER_LIST]: 'Passageiros',
  [DRIVER_ROUTES.PAYMENT_REVIEW]: 'Pagamentos',
  [DRIVER_ROUTES.MANAGE_PASSENGERS]: 'Gerenciar',
  [DRIVER_ROUTES.PROFILE]: 'Perfil',
};

// Tabs internas
const DriverTabs: React.FC = () => {
  const pendingCount = usePaymentStore((s) => s.pendingReviews.length);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const icon = tabIcons[route.name] ?? '•';
          return React.createElement(
            Text,
            { style: { fontSize: 22, opacity: focused ? 1 : 0.5 } },
            icon,
          );
        },
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
      <Tab.Screen name={DRIVER_ROUTES.HOME} component={DriverHomeScreen} />
      <Tab.Screen
        name={DRIVER_ROUTES.PAYMENT_REVIEW}
        component={PaymentReviewScreen}
        options={{
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.error, fontSize: 10 },
        }}
      />
      <Tab.Screen name={DRIVER_ROUTES.MANAGE_PASSENGERS} component={ManagePassengersScreen} />
      <Tab.Screen name={DRIVER_ROUTES.PROFILE} component={DriverProfileScreen} />
    </Tab.Navigator>
  );
};

// Stack principal: tabs + telas de detalhe/cadastro
export const DriverNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={DRIVER_STACK_ROUTES.TABS} component={DriverTabs} />
    <Stack.Screen
      name={DRIVER_STACK_ROUTES.ADD_PASSENGER}
      component={AddPassengerScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name={DRIVER_STACK_ROUTES.EDIT_PASSENGER}
      component={AddPassengerScreen}
      options={{ animation: 'slide_from_right' }}
    />
  </Stack.Navigator>
);
