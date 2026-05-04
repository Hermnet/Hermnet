import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StatusBar } from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { ArrowLeft, Fingerprint, Users } from 'lucide-react-native';
let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try { LocalAuthentication = require('expo-local-authentication'); } catch { /* Expo Go */ }
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { prefsService, SecurityPrefs } from '../../services/PrefsService';
import { useAuthStore } from '../../store/authStore';

interface Props {
    onBack: () => void;
}

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

export default function SecurityScreen({ onBack }: Props) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const jwt = useAuthStore((st) => st.jwt);
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

    const ToggleRow = ({
        label, sub, value, onChange, disabled = false, last = false,
    }: {
        label: string; sub?: string; value: boolean; onChange: (v: boolean) => void;
        disabled?: boolean; last?: boolean;
    }) => (
        <>
            <View style={s.toggleRow}>
                <View style={s.toggleInfo}>
                    <Text style={[s.toggleLabel, disabled && { color: colors.textFaint }]}>{label}</Text>
                    {sub && <Text style={s.toggleSub}>{sub}</Text>}
                </View>
                <Switch
                    value={value}
                    onValueChange={onChange}
                    disabled={disabled}
                    trackColor={{ false: colors.switchTrackOff, true: colors.switchTrackOn }}
                    thumbColor={colors.switchThumb}
                    ios_backgroundColor={colors.switchTrackOff}
                />
            </View>
            {!last && <View style={s.rowSeparator} />}
        </>
    );

    if (loading) return <View style={s.container} />;

    return (
        <View style={s.container}>
            <StatusBar barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'} />
            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.6}>
                    <ArrowLeft size={26} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Seguridad</Text>
                <View style={s.headerSpacer} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={s.sectionLabel}>Autenticación</Text>
                <View style={s.sectionCard}>
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

                <Text style={s.sectionLabel}>Sesión actual</Text>
                <View style={s.sectionCard}>
                    <View style={[s.toggleRow, { paddingVertical: 14 }]}>
                        <View style={[s.rowIconWrap, { backgroundColor: colors.bgElevated }]}>
                            <Users size={17} color={colors.accentLight} />
                        </View>
                        <View style={s.toggleInfo}>
                            <Text style={s.toggleLabel}>ID de sesión (JTI)</Text>
                            <Text style={[s.toggleSub, { fontFamily: 'monospace', fontSize: 11 }]} selectable>
                                {jti}
                            </Text>
                        </View>
                    </View>
                    <View style={s.rowSeparator} />
                    <View style={[s.toggleRow, { paddingVertical: 12 }]}>
                        <View style={[s.rowIconWrap, { backgroundColor: colors.bgElevated }]}>
                            <Fingerprint size={17} color="#34d399" />
                        </View>
                        <View style={s.toggleInfo}>
                            <Text style={s.toggleLabel}>Clave privada</Text>
                            <Text style={s.toggleSub}>
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
