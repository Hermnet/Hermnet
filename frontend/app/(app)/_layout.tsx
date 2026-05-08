import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Slot, Redirect } from 'expo-router';
import { useSafeAreaInsets, SafeAreaInsetsContext } from 'react-native-safe-area-context';
let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try { LocalAuthentication = require('expo-local-authentication'); } catch { /* Expo Go */ }
import { useAuthStore } from '../../store/authStore';
import LoadingScreen from '../../screens/login/LoadingScreen';
import { prefsService } from '../../services/PrefsService';
import { dataKeyService } from '../../services/DataKeyService';
import { rootDetectionService } from '../../services/RootDetectionService';
import { OfflineBanner } from '../../components/OfflineBanner';
import { TorBootstrapBanner } from '../../components/TorBootstrapBanner';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { TOR_NATIVE_AVAILABLE } from '../../services/ApiClient';
import { getHermnetTor } from '../../modules/hermnet-tor/src';

export default function AppLayout() {
    const { isLoaded, jwt, identity } = useAuthStore();
    const [isLocked, setIsLocked] = useState(false);
    const [paranoidWarning, setParanoidWarning] = useState<'idle' | 'open' | 'risks' | 'dismissed'>('idle');
    const appState = useRef<AppStateStatus>(AppState.currentState);
    const authenticating = useRef(false);

    // Estado de banners superiores (Tor bootstrapping, sin conexión).
    // Lo gestionamos aquí para poder ajustar el safe-area inset que ven las
    // pantallas hijas cuando hay un banner ocupando la zona del notch.
    const insets = useSafeAreaInsets();
    const networkStatus = useNetworkStatus();
    const [torActive, setTorActive] = useState<boolean>(false);
    useEffect(() => {
        if (!TOR_NATIVE_AVAILABLE) return;
        const tor = getHermnetTor();
        if (!tor) return;
        let cancelled = false;
        const poll = async () => {
            while (!cancelled) {
                try {
                    const p = await tor.bootstrapProgress();
                    setTorActive(p < 100);
                    if (p >= 100) return;
                } catch { /* swallow */ }
                await new Promise(r => setTimeout(r, 1500));
            }
        };
        poll();
        return () => { cancelled = true; };
    }, []);
    const showOffline = networkStatus === 'offline';
    const showTorBanner = torActive;
    const anyBannerVisible = showOffline || showTorBanner;
    // Cuando hay banner ocupando el área del notch, las pantallas hijas no
    // deben volver a añadir `insets.top` (sería doble padding). Sustituimos el
    // contexto de safe-area-context para que vean top=0 en ese caso.
    const slotInsets = anyBannerVisible
        ? { top: 0, bottom: insets.bottom, left: insets.left, right: insets.right }
        : insets;

    // Modo paranoico: si el usuario lo activó, comprobamos al entrar si el
    // dispositivo está rooteado/jailbreakado. Solo se muestra el warning
    // una vez por sesión (ver `paranoidWarning === 'dismissed'`).
    useEffect(() => {
        (async () => {
            const prefs = await prefsService.getSecurityPrefs();
            if (!prefs.paranoidMode) return;
            const compromised = await rootDetectionService.isCompromised().catch(() => false);
            if (compromised) setParanoidWarning('open');
        })();
    }, []);

    const unlock = useCallback(async () => {
        if (authenticating.current) return;
        authenticating.current = true;
        try {
            // Sin módulo nativo (Expo Go) o sin biometría configurada: desbloquear directo
            if (!LocalAuthentication) {
                await dataKeyService.ensureLoaded();
                setIsLocked(false);
                return;
            }
            const prefs = await prefsService.getSecurityPrefs();
            if (!prefs.biometric) {
                await dataKeyService.ensureLoaded();
                setIsLocked(false);
                return;
            }
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Desbloquear Hermnet',
                cancelLabel: 'Cancelar',
                disableDeviceFallback: false,
            });
            if (result.success) {
                await dataKeyService.ensureLoaded();
                setIsLocked(false);
            }
        } finally {
            authenticating.current = false;
        }
    }, []);

    useEffect(() => {
        const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
            const prevState = appState.current;
            appState.current = nextState;

            if (nextState === 'background') {
                // Bloqueo siempre activo: limpia el DEK de memoria al ir a background.
                // Hasta que el usuario se reautentique, ningún módulo podrá descifrar.
                // Solo en 'background' real, NO en 'inactive': en iOS 'inactive' se
                // dispara por diálogos del sistema (Face ID, centro de notificaciones,
                // control center…) y bloquear ahí causa un bucle infinito con biometría.
                dataKeyService.lock();
            }

            if (prevState === 'background' && nextState === 'active') {
                // Solo re-bloquear al volver de 'background' real (home, app switcher).
                // Ignorar transiciones inactive→active (Face ID dialog, notificaciones).
                const prefs = await prefsService.getSecurityPrefs();
                setIsLocked(true);
                // Lanzar biometría automáticamente solo si el usuario la habilitó
                if (prefs.biometric) {
                    unlock();
                }
            }
        });
        return () => sub.remove();
    }, [unlock]);

    if (!isLoaded) return <LoadingScreen />;
    // Permitimos entrar a la app si hay identidad local, aunque el JWT esté
    // ausente (modo offline / re-auth fallida). Las peticiones al backend
    // fallarán con 401/403 y el unauthorizedHandler refrescará el JWT cuando
    // haya conectividad. Solo redirigimos a login si NI siquiera hay identidad.
    if (!jwt && !identity) return <Redirect href="/(auth)/login" />;

    return (
        <View style={{ flex: 1 }}>
            {showTorBanner && <TorBootstrapBanner />}
            {showOffline && <OfflineBanner />}
            <View style={{ flex: 1 }}>
                <SafeAreaInsetsContext.Provider value={slotInsets}>
                    <Slot />
                </SafeAreaInsetsContext.Provider>
            </View>
            {isLocked && (
                <View style={lockStyles.overlay}>
                    <View style={lockStyles.card}>
                        <Text style={lockStyles.title}>Hermnet bloqueado</Text>
                        <Text style={lockStyles.sub}>Autentícate para continuar</Text>
                        <TouchableOpacity style={lockStyles.btn} activeOpacity={0.8} onPress={unlock}>
                            <Text style={lockStyles.btnText}>Desbloquear</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {paranoidWarning === 'open' && (
                <View style={lockStyles.overlay}>
                    <View style={[lockStyles.card, { gap: 14, paddingHorizontal: 28 }]}>
                        <Text style={lockStyles.title}>⚠ Dispositivo modificado</Text>
                        <Text style={lockStyles.sub}>
                            Hemos detectado que tu dispositivo está rooteado o jailbreakado.
                            La protección que ofrece Hermnet se reduce significativamente
                            en estas condiciones.
                        </Text>
                        <TouchableOpacity style={lockStyles.btn} activeOpacity={0.8} onPress={() => setParanoidWarning('risks')}>
                            <Text style={lockStyles.btnText}>Ver riesgos</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[lockStyles.btn, { backgroundColor: '#7f1d1d', marginTop: 4 }]} activeOpacity={0.8} onPress={() => setParanoidWarning('dismissed')}>
                            <Text style={lockStyles.btnText}>Continuar bajo mi responsabilidad</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {paranoidWarning === 'risks' && (
                <View style={lockStyles.overlay}>
                    <View style={[lockStyles.card, { gap: 14, paddingHorizontal: 28, alignItems: 'flex-start' }]}>
                        <Text style={lockStyles.title}>Qué puedes perder</Text>
                        <Text style={[lockStyles.sub, { textAlign: 'left' }]}>
                            • Una app maliciosa con permisos de root puede leer la memoria de Hermnet y extraer la clave maestra que cifra tu base local.{'\n\n'}
                            • Puede inyectarse un keylogger que capture tu PIN antes de que llegue a la app.{'\n\n'}
                            • Puede modificarse el binario de Hermnet para desactivar la firma de mensajes o el routing por Tor sin que lo notes.{'\n\n'}
                            • La app no puede garantizar la integridad del entorno en el que corre cuando hay root.
                        </Text>
                        <TouchableOpacity style={[lockStyles.btn, { alignSelf: 'stretch' }]} activeOpacity={0.8} onPress={() => setParanoidWarning('open')}>
                            <Text style={lockStyles.btnText}>Volver</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const lockStyles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0d111b',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        elevation: 999,
    },
    card: {
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 32,
    },
    title: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '600',
    },
    sub: {
        color: '#a0aec0',
        fontSize: 14,
        textAlign: 'center',
    },
    btn: {
        marginTop: 8,
        backgroundColor: '#354d8b',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 10,
    },
    btnText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
});
