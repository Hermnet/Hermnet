import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Slot, Redirect } from 'expo-router';
let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try { LocalAuthentication = require('expo-local-authentication'); } catch { /* Expo Go */ }
import { useAuthStore } from '../../store/authStore';
import LoadingScreen from '../../screens/login/LoadingScreen';
import { prefsService } from '../../services/PrefsService';

export default function AppLayout() {
    const { isLoaded, jwt } = useAuthStore();
    const [isLocked, setIsLocked] = useState(false);
    const appState = useRef<AppStateStatus>(AppState.currentState);
    const authenticating = useRef(false);

    const unlock = useCallback(async () => {
        if (authenticating.current) return;
        authenticating.current = true;
        try {
            // Sin módulo nativo (Expo Go) o sin biometría configurada: desbloquear directo
            if (!LocalAuthentication) {
                setIsLocked(false);
                return;
            }
            const prefs = await prefsService.getSecurityPrefs();
            if (!prefs.biometric) {
                setIsLocked(false);
                return;
            }
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Desbloquear Hermnet',
                cancelLabel: 'Cancelar',
                disableDeviceFallback: false,
            });
            if (result.success) {
                setIsLocked(false);
            }
        } finally {
            authenticating.current = false;
        }
    }, []);

    useEffect(() => {
        const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
            const wasBackground = appState.current.match(/inactive|background/);
            appState.current = nextState;

            if (wasBackground && nextState === 'active') {
                const prefs = await prefsService.getSecurityPrefs();
                if (prefs.screenLock) {
                    setIsLocked(true);
                    // Lanzar biometría automáticamente solo si está habilitada
                    if (prefs.biometric) {
                        unlock();
                    }
                }
            }
        });
        return () => sub.remove();
    }, [unlock]);

    if (!isLoaded) return <LoadingScreen />;
    if (!jwt) return <Redirect href="/(auth)/login" />;

    return (
        <>
            <Slot />
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
        </>
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
