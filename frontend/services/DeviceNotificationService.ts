import { Platform } from 'react-native';
import { prefsService } from './PrefsService';
import { userApiService } from './UserApiService';

type NotificationsModule = {
  AndroidImportance: { HIGH: number };
  setNotificationHandler: (handler: unknown) => void;
  setNotificationChannelAsync: (id: string, channel: unknown) => Promise<void>;
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getDevicePushTokenAsync: () => Promise<{ data: unknown }>;
  scheduleNotificationAsync: (request: unknown) => Promise<unknown>;
};

type DeviceModule = { isDevice: boolean };

let notificationsModule: NotificationsModule | null | undefined;
let deviceModule: DeviceModule | null | undefined;

function isExpoGo(): boolean {
  try {
    const Constants = require('expo-constants');
    return Constants?.default?.appOwnership === 'expo' || Constants?.appOwnership === 'expo';
  } catch {
    return false;
  }
}

function getNotifications(): NotificationsModule | null {
  if (notificationsModule !== undefined) return notificationsModule;
  if (isExpoGo()) {
    notificationsModule = null;
    if (__DEV__) console.warn('[notifications] Expo Go no soporta push Android en SDK 53+; usa development build para notificaciones.');
    return notificationsModule;
  }
  try {
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch (err) {
    notificationsModule = null;
    if (__DEV__) console.warn('[notifications] módulo nativo no disponible:', err);
  }
  return notificationsModule;
}

function getDevice(): DeviceModule | null {
  if (deviceModule !== undefined) return deviceModule;
  try {
    deviceModule = require('expo-device') as DeviceModule;
  } catch {
    deviceModule = null;
  }
  return deviceModule;
}

class DeviceNotificationService {
  private configured = false;

  async configure(): Promise<void> {
    if (this.configured) return;
    this.configured = true;
    const Notifications = getNotifications();
    if (!Notifications) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Mensajes',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 180, 80, 180],
        lightColor: '#3b82f6',
      });
    }
  }

  async registerDeviceTokenIfEnabled(): Promise<void> {
    await this.configure();
    const Notifications = getNotifications();
    if (!Notifications) return;
    const prefs = await prefsService.getNotificationPrefs();
    if (!prefs.pushEnabled) {
      await userApiService.updatePushToken(null).catch(() => {});
      return;
    }
    const Device = getDevice();
    if (!Device) return;
    if (!Device.isDevice) return;

    const current = await Notifications.getPermissionsAsync();
    const finalStatus = current.status === 'granted'
      ? current.status
      : (await Notifications.requestPermissionsAsync()).status;
    if (finalStatus !== 'granted') return;

    try {
      const token = await Notifications.getDevicePushTokenAsync();
      await userApiService.updatePushToken(String(token.data));
    } catch (err) {
      if (__DEV__) console.warn('[notifications] no se pudo registrar push token:', err);
    }
  }

  async showMessageNotification(contactName: string, text?: string): Promise<void> {
    await this.configure();
    const Notifications = getNotifications();
    if (!Notifications) return;
    const prefs = await prefsService.getNotificationPrefs();
    if (!prefs.pushEnabled) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hermnet',
        body: prefs.preview && text ? `${contactName}: ${text}` : 'Tienes un nuevo mensaje',
        sound: prefs.sound ? 'default' : undefined,
      },
      trigger: null,
    });
  }
}

export const deviceNotificationService = new DeviceNotificationService();
