import * as SecureStore from 'expo-secure-store';

const KEY_SECURITY = 'hermnet.prefs.security';
const KEY_NOTIFICATIONS = 'hermnet.prefs.notifications';
const KEY_ACCESSIBILITY = 'hermnet.prefs.accessibility';
const KEY_THEME = 'hermnet.prefs.theme';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface ThemePrefs {
    mode: ThemeMode;
}

export interface SecurityPrefs {
    biometric: boolean;
    screenLock: boolean;
}

export interface NotificationPrefs {
    pushEnabled: boolean;
    preview: boolean;
    sound: boolean;
    vibration: boolean;
}

export interface AccessibilityPrefs {
    textSize: 'small' | 'normal' | 'large';
    highContrast: boolean;
    reduceMotion: boolean;
}

const DEFAULT_SECURITY: SecurityPrefs = { biometric: false, screenLock: false };
const DEFAULT_NOTIFICATIONS: NotificationPrefs = { pushEnabled: true, preview: false, sound: true, vibration: true };
const DEFAULT_ACCESSIBILITY: AccessibilityPrefs = {
    textSize: 'normal', highContrast: false, reduceMotion: false,
};

async function load<T>(key: string, fallback: T): Promise<T> {
    try {
        const raw = await SecureStore.getItemAsync(key);
        if (!raw) return fallback;
        return { ...fallback, ...JSON.parse(raw) };
    } catch {
        return fallback;
    }
}

async function save(key: string, value: unknown): Promise<void> {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
}

class PrefsService {
    getSecurityPrefs = () => load<SecurityPrefs>(KEY_SECURITY, DEFAULT_SECURITY);
    setSecurityPrefs = (prefs: SecurityPrefs) => save(KEY_SECURITY, prefs);

    getNotificationPrefs = () => load<NotificationPrefs>(KEY_NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    setNotificationPrefs = (prefs: NotificationPrefs) => save(KEY_NOTIFICATIONS, prefs);

    getAccessibilityPrefs = () => load<AccessibilityPrefs>(KEY_ACCESSIBILITY, DEFAULT_ACCESSIBILITY);
    setAccessibilityPrefs = (prefs: AccessibilityPrefs) => save(KEY_ACCESSIBILITY, prefs);

    getThemePrefs = () => load<ThemePrefs>(KEY_THEME, { mode: 'auto' });
    setThemePrefs = (prefs: ThemePrefs) => save(KEY_THEME, prefs);

    async clearAll(): Promise<void> {
        await Promise.all([
            SecureStore.deleteItemAsync(KEY_SECURITY),
            SecureStore.deleteItemAsync(KEY_NOTIFICATIONS),
            SecureStore.deleteItemAsync(KEY_ACCESSIBILITY),
            SecureStore.deleteItemAsync(KEY_THEME),
        ]);
    }
}

export const prefsService = new PrefsService();
