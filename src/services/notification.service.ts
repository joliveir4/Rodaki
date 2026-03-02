import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase';

// ─── Notification Handler ─────────────────────────────────────────────────────
// Define como notificações são exibidas enquanto o app está aberto

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Notification Service ─────────────────────────────────────────────────────

export const notificationService = {
  /**
   * Solicita permissão e retorna o token Expo Push
   */
  async registerForPushNotifications(userId: string): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('[Notifications] Push só funciona em dispositivo físico');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permissão negada');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    // Salva o token no Firestore para envio via backend/Cloud Functions
    await notificationService.savePushToken(userId, token.data);

    return token.data;
  },

  /**
   * Salva (ou atualiza) push token do usuário no Firestore
   */
  async savePushToken(userId: string, token: string): Promise<void> {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { pushToken: token });
  },

  /**
   * Agenda notificação local (para lembretes de confirmação de presença)
   */
  async schedulePresenceReminder(triggerHour: number, triggerMinute: number): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lembrete de presença',
        body: 'Não esqueça de confirmar sua presença no transporte de hoje!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: triggerHour,
        minute: triggerMinute,
      },
    });
    return id;
  },

  /**
   * Cancela todas as notificações agendadas
   */
  async cancelAllScheduled(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
