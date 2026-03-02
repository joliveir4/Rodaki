import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@store/auth.store';
import { notificationService } from '@services/notification.service';

// ─── useNotifications ─────────────────────────────────────────────────────────

export const useNotifications = () => {
  const user = useAuthStore((s) => s.user);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  // ─── Registrar push token ao autenticar ───────────────────────────────────

  useEffect(() => {
    if (!user) return;

    notificationService.registerForPushNotifications(user.id);

    // Listener: notificação recebida com app aberto
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[Notification received]', notification);
      },
    );

    // Listener: usuário interagiu com notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('[Notification response]', response);
        // TODO: navegar para tela correspondente com base nos dados da notificação
      },
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id]);

  // ─── Agendar lembrete diário ──────────────────────────────────────────────

  const scheduleReminder = useCallback(async (hour: number, minute: number) => {
    await notificationService.schedulePresenceReminder(hour, minute);
  }, []);

  const cancelReminders = useCallback(async () => {
    await notificationService.cancelAllScheduled();
  }, []);

  return {
    scheduleReminder,
    cancelReminders,
  };
};
