import { Alert, Platform } from 'react-native';

/** Alert.alert is unreliable on web; use window.alert there. */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    if (typeof window !== 'undefined') {
      window.alert(text);
    }
    return;
  }
  Alert.alert(title, message);
}

/** Confirm dialog that works on web (window.confirm) and native (Alert). */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: { confirmLabel?: string; cancelLabel?: string },
) {
  const confirmLabel = options?.confirmLabel ?? 'Remove';
  const cancelLabel = options?.cancelLabel ?? 'Cancel';

  if (Platform.OS === 'web') {
    const text = `${title}\n\n${message}`;
    if (typeof window !== 'undefined' && window.confirm(text)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
