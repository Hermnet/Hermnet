import * as SecureStore from 'expo-secure-store';

const KEY_SECURITY = 'hermnet.prefs.security';
const KEY_NOTIFICATIONS = 'hermnet.prefs.notifications';
const KEY_ACCESSIBILITY = 'hermnet.prefs.accessibility';
const KEY_THEME = 'hermnet.prefs.theme';
const KEY_CHAT = 'hermnet.prefs.chat';
const KEY_PROFILE = 'hermnet.prefs.profile';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface ThemePrefs {
    mode: ThemeMode;
}

export interface SecurityPrefs {
    biometric: boolean;
    screenLock: boolean;
    /** Si el usuario ha cerrado el banner "tus mensajes solo viven en este dispositivo". */
    privacyBannerDismissed?: boolean;
    /** PIN de pánico configurado: al introducirlo en lugar del PIN normal,
     *  la app borra toda la identidad y el historial local. Útil bajo coacción. */
    panicPinEnabled?: boolean;
    /** Routing por Tor (hidden service .onion). Por defecto ACTIVO: la app ya
     *  arranca anónima. El usuario puede desactivarlo a cambio de menor latencia
     *  pero más exposición de IP al backend. */
    torEnabled?: boolean;
    /** Modo paranoico: si está activado, al arrancar comprueba si el dispositivo
     *  está rooteado/jailbreakado y avisa al usuario. Por defecto OFF para no
     *  molestar a usuarios técnicos legítimos. */
    paranoidMode?: boolean;
    /** Efecto Matrix: ofusca los mensajes del chat con caracteres aleatorios.
     *  Tap para revelar, doble-tap para re-ocultar. Por defecto ACTIVO. */
    matrixReveal?: boolean;
    /** Si el usuario ya ha visto el tooltip "toca un mensaje para revelarlo".
     *  Se muestra una sola vez en toda la vida de la app. */
    matrixHintShown?: boolean;
}

export interface NotificationPrefs {
    pushEnabled: boolean;
    preview: boolean;
    sound: boolean;
    vibration: boolean;
}

export interface ProfilePrefs {
    displayName: string;
}

export interface AccessibilityPrefs {
    textSize: 'small' | 'normal' | 'large';
    highContrast: boolean;
    reduceMotion: boolean;
}

export type BackgroundPattern = 'dots' | 'grid' | 'hexagons' | 'diagonal' | 'none';
export type BubbleCorner = 'rounded' | 'square';

export interface ChatPrefs {
    outgoingBubbleColor: string;
    incomingBubbleColor: string;
    backgroundPattern: BackgroundPattern;
    patternColor: string;
    bubbleCorner: BubbleCorner;
}

// screenLock arranca SIEMPRE en true: el bloqueo de la app es obligatorio en
// Hermnet por diseño. Lo dejamos en el shape por compatibilidad pero la UI
// no expone el toggle.
const DEFAULT_SECURITY: SecurityPrefs = { biometric: false, screenLock: true, torEnabled: true };
const DEFAULT_NOTIFICATIONS: NotificationPrefs = { pushEnabled: true, preview: false, sound: true, vibration: true };
const DEFAULT_ACCESSIBILITY: AccessibilityPrefs = {
    textSize: 'normal', highContrast: false, reduceMotion: false,
};
// Sentinel value meaning "use theme default". Stored as empty string.
const THEME_DEFAULT = '';
const DEFAULT_CHAT: ChatPrefs = {
    outgoingBubbleColor: THEME_DEFAULT,
    incomingBubbleColor: THEME_DEFAULT,
    backgroundPattern: 'dots',
    patternColor: THEME_DEFAULT,
    bubbleCorner: 'rounded',
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

    getChatPrefs = () => load<ChatPrefs>(KEY_CHAT, DEFAULT_CHAT);
    setChatPrefs = (prefs: ChatPrefs) => save(KEY_CHAT, prefs);

    getProfilePrefs = () => load<ProfilePrefs>(KEY_PROFILE, { displayName: '' });
    setProfilePrefs = (prefs: ProfilePrefs) => save(KEY_PROFILE, prefs);

    async clearAll(): Promise<void> {
        await Promise.all([
            SecureStore.deleteItemAsync(KEY_SECURITY),
            SecureStore.deleteItemAsync(KEY_NOTIFICATIONS),
            SecureStore.deleteItemAsync(KEY_ACCESSIBILITY),
            SecureStore.deleteItemAsync(KEY_THEME),
            SecureStore.deleteItemAsync(KEY_CHAT),
            SecureStore.deleteItemAsync(KEY_PROFILE),
        ]);
    }
}

export const prefsService = new PrefsService();
