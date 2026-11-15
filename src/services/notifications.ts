import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }
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

  const id = await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return id;
}

type DailyScheduleOptions = {
  identifier: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
};

/** Schedule a repeating daily reminder at the given local time. */
export async function scheduleDailyNotification({
  identifier,
  title,
  body,
  hour,
  minute,
}: DailyScheduleOptions): Promise<string | null> {
  const allowed = await ensureNotificationPermissions();
  if (!allowed) {
    return null;
  }

  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);

  const id = await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

