import * as Notifications from 'expo-notifications';

export async function ensureNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const request = await Notifications.requestPermissionsAsync();
  return request.granted || request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

type ScheduleOptions = {
  identifier: string;
  title: string;
  body: string;
  triggerDate: Date;
};

export async function scheduleOneOffNotification({
  identifier,
  title,
  body,
  triggerDate,
}: ScheduleOptions): Promise<string | null> {
  const allowed = await ensureNotificationPermissions();
  if (!allowed) {
    return null;
  }

  const trigger = triggerDate;

  const id = await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: true,
    },
    trigger,
  });

  return id;
}

