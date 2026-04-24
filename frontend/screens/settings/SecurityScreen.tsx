import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StatusBar } from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { ArrowLeft, Fingerprint, Users } from 'lucide-react-native';
// expo-local-authentication requiere un development build; en Expo Go se degrada sin biometría
let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try { LocalAuthentication = require('expo-local-authentication'); } catch { /* Expo Go */ }
import { styles } from '../../styles/settingsStyles';
import { prefsService, SecurityPrefs } from '../../services/PrefsService';
import { useAuthStore } from '../../store/authStore';

interface Props {
    onBack: () => void;
}

// ── Toggle row ─────────────────────────────────────────────────────────────────
function ToggleRow({
    label, sub, value, onChange, disabled = false, last = false,
}: {
    label: string; sub?: string; value: boolean; onChange: (v: boolean) => void;
    disabled?: boolean; last?: boolean;
}) {
    return (
        <>
            <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                    <Text style={[styles.toggleLabel, disabled && { color: '#4a5568' }]}>{label}</Text>
                    {sub && <Text style={styles.toggleSub}>{sub}</Text>}
                </View>
                <Switch
                    value={value}
                    onValueChange={onChange}
                    disabled={disabled}
                    trackColor={{ false: '#1e2d4a', true: '#3b82f6' }}
                    thumbColor="#ffffff"
                    ios_backgroundColor="#1e2d4a"
                />
            </View>
            {!last && <View style={styles.rowSeparator} />}
        </>
    );
}

// ── Decodifica el JTI del JWT actual ──────────────────────────────────────────
function extractJti(token: string | null): string {
    if (!token) return '—';
    try {
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = atob(base64);
        const parsed = JSON.parse(json);
        return parsed.jti ?? '—';
    } catch {
        return '—';
    }
}

// ── SecurityScreen ─────────────────────────────────────────────────────────────
export default function SecurityScreen({ onBack }: Props) {
    const jwt = useAuthStore((s) => s.jwt);
    const [prefs, setPrefs] = useState<SecurityPrefs>({ biometric: false, screenLock: false });
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [loading, setLoading] = useState(true);
    const { showModal, modalNode } = useAppModal();

    useEffect(() => {
        const init = async () => {
            const loaded = await prefsService.getSecurityPrefs();
            let available = false;
            if (LocalAuthentication) {
                const [hasHardware, isEnrolled] = await Promise.all([
                    LocalAuthentication.hasHardwareAsync(),
                    LocalAuthentication.isEnrolledAsync(),
                ]);
                available = hasHardware && isEnrolled;
            }
            setPrefs(loaded);
            setBiometricAvailable(available);
            setLoading(false);
        };
        init();
    }, []);

    const updatePrefs = async (next: SecurityPrefs) => {
        const prev = prefs;
        setPrefs(next);
        try {
            await prefsService.setSecurityPrefs(next);
        } catch {
            setPrefs(prev);
        }
    };

    const handleBiometricChange = async (enabled: boolean) => {
        if (!enabled) {
            await updatePrefs({ ...prefs, biometric: false });
            return;
        }
        if (!LocalAuthentication) {
            showModal({ type: 'info', title: 'No disponible', message: 'La biometría requiere un build nativo de la app.' });
            return;
        }
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Confirma tu identidad para activar la biometría',
            cancelLabel: 'Cancelar',
        });
        if (result.success) {
            await updatePrefs({ ...prefs, biometric: true, screenLock: true });
        } else {
            showModal({ type: 'error', title: 'No autenticado', message: 'La biometría no se activó.' });
        }
    };

    const handleScreenLockChange = async (enabled: boolean) => {
        const next: SecurityPrefs = enabled
            ? { ...prefs, screenLock: true }
            : { biometric: false, screenLock: false };
        await updatePrefs(next);
    };

    const jti = extractJti(jwt);

    if (loading) return <View style={styles.container} />;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seguridad</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>Autenticación</Text>
                <View style={styles.sectionCard}>
                    <ToggleRow
                        label="Bloqueo de pantalla"
                        sub="Requiere autenticación al volver a la app"
                        value={prefs.screenLock}
                        onChange={handleScreenLockChange}
                    />
                    <ToggleRow
                        label="Biometría"
                        sub={
                            biometricAvailable
                                ? 'Usar huella o Face ID para desbloquear'
                                : 'No hay biometría configurada en este dispositivo'
                        }
                        value={prefs.biometric}
                        onChange={handleBiometricChange}
                        disabled={!biometricAvailable || !prefs.screenLock}
                        last
                    />
                </View>

                <Text style={styles.sectionLabel}>Sesión actual</Text>
                <View style={styles.sectionCard}>
                    <View style={[styles.toggleRow, { paddingVertical: 14 }]}>
                        <View style={[styles.rowIconWrap, { backgroundColor: '#1e2d4a' }]}>
                            <Users size={17} color="#60a5fa" />
                        </View>
                        <View style={styles.toggleInfo}>
                            <Text style={styles.toggleLabel}>ID de sesión (JTI)</Text>
                            <Text style={[styles.toggleSub, { fontFamily: 'monospace', fontSize: 11 }]} selectable>
                                {jti}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.rowSeparator} />
                    <View style={[styles.toggleRow, { paddingVertical: 12 }]}>
                        <View style={[styles.rowIconWrap, { backgroundColor: '#1e2d4a' }]}>
                            <Fingerprint size={17} color="#34d399" />
                        </View>
                        <View style={styles.toggleInfo}>
                            <Text style={styles.toggleLabel}>Clave privada</Text>
                            <Text style={styles.toggleSub}>
                                Almacenada cifrada en este dispositivo. Compártela mediante QR si cambias de móvil.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
            {modalNode}
        </View>
    );
}
