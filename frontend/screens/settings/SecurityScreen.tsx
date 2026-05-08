import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StatusBar, Modal, Platform } from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { ArrowLeft, Fingerprint, Users, X } from 'lucide-react-native';
let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try { LocalAuthentication = require('expo-local-authentication'); } catch { /* Expo Go */ }
import QuickCrypto from 'react-native-quick-crypto';
import { createStyles } from '../../styles/settingsStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { prefsService, SecurityPrefs } from '../../services/PrefsService';
import { useAuthStore } from '../../store/authStore';
import { authSessionService } from '../../services/AuthSessionService';
import { apiClient, TOR_NATIVE_AVAILABLE } from '../../services/ApiClient';
import PinScreen from '../login/PinScreen';

function hashPin(pin: string, salt: string): string {
    return QuickCrypto.createHash('sha256').update(pin + salt).digest('hex') as string;
}

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

    // ── Modo pánico ─────────────────────────────────────────────────────────
    const [panicSetupOpen, setPanicSetupOpen] = useState(false);
    const identity = useAuthStore((st) => st.identity);

    const handlePanicToggle = async (enabled: boolean) => {
        if (enabled) {
            setPanicSetupOpen(true);
            return;
        }
        // Desactivar: borra el hash del PIN de pánico y baja el flag.
        await authSessionService.clearPanicPinHash();
        await updatePrefs({ ...prefs, panicPinEnabled: false });
    };

    // ── Modo Tor ────────────────────────────────────────────────────────────
    const handleTorToggle = async (enabled: boolean) => {
        await updatePrefs({ ...prefs, torEnabled: enabled });
        // Solo activamos el routing si el módulo nativo está disponible. Si no,
        // la pref queda guardada para cuando se integre, pero la app sigue
        // operando en clearnet para no romperse.
        apiClient.setTorEnabled(enabled && TOR_NATIVE_AVAILABLE);
    };

    const handlePanicPinComplete = async (pin: string) => {
        if (!identity) {
            setPanicSetupOpen(false);
            showModal({ type: 'error', title: 'No disponible', message: 'No hay sesión para configurar el PIN de pánico.' });
            return;
        }
        // No permitimos que coincida con el PIN normal: sería inutilizable.
        const normalHash = await authSessionService.getPinHash();
        const candidateHash = hashPin(pin, identity.id);
        if (normalHash && normalHash === candidateHash) {
            setPanicSetupOpen(false);
            showModal({
                type: 'error',
                title: 'PIN no válido',
                message: 'El PIN de pánico no puede ser igual a tu PIN habitual.',
            });
            return;
        }
        await authSessionService.setPanicPinHash(candidateHash);
        await updatePrefs({ ...prefs, panicPinEnabled: true });
        setPanicSetupOpen(false);
        showModal({
            type: 'info',
            title: 'PIN de pánico activado',
            message: 'Si lo introduces al desbloquear la app, tu identidad y todos tus mensajes se borrarán de inmediato.',
        });
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
                    <View style={[s.toggleRow, { paddingVertical: 12 }]}>
                        <View style={s.toggleInfo}>
                            <Text style={s.toggleLabel}>Bloqueo de la app</Text>
                            <Text style={s.toggleSub}>
                                Siempre activo: Hermnet exige autenticación cada vez que vuelves del background.
                            </Text>
                        </View>
                        <Text style={[s.toggleSub, { color: colors.accentLight, fontWeight: '700' }]}>Obligatorio</Text>
                    </View>
                    <View style={s.rowSeparator} />
                    <ToggleRow
                        label="Biometría"
                        sub={
                            biometricAvailable
                                ? 'Usar huella o Face ID para desbloquear (más rápido que el PIN)'
                                : 'No hay biometría configurada en este dispositivo'
                        }
                        value={prefs.biometric}
                        onChange={handleBiometricChange}
                        disabled={!biometricAvailable}
                        last
                    />
                </View>

                <Text style={s.sectionLabel}>Modo paranoico</Text>
                <View style={s.sectionCard}>
                    <ToggleRow
                        label="Detección de root / jailbreak"
                        sub={
                            prefs.paranoidMode
                                ? 'Al arrancar, te avisaremos si el dispositivo está modificado.'
                                : 'Activa esto si te preocupa que tu dispositivo esté comprometido. Hermnet te avisará al arrancar.'
                        }
                        value={!!prefs.paranoidMode}
                        onChange={(v) => updatePrefs({ ...prefs, paranoidMode: v })}
                        last
                    />
                </View>

                {Platform.OS !== 'ios' && (
                    <>
                        <Text style={s.sectionLabel}>Red anónima (Tor)</Text>
                        <View style={s.sectionCard}>
                            <ToggleRow
                                label="Modo Tor"
                                sub={
                                    TOR_NATIVE_AVAILABLE
                                        ? (prefs.torEnabled !== false
                                            ? 'Tu IP queda oculta al backend. El tráfico va por Tor.'
                                            : 'Tráfico directo al backend (más rápido, menos privado).')
                                        : 'Activado por defecto. Pendiente de integrar el módulo nativo de Tor para que sea efectivo en este dispositivo.'
                                }
                                value={prefs.torEnabled !== false}
                                onChange={handleTorToggle}
                                last
                            />
                        </View>
                    </>
                )}

                <Text style={s.sectionLabel}>Modo pánico</Text>
                <View style={s.sectionCard}>
                    <ToggleRow
                        label="PIN de pánico"
                        sub={
                            prefs.panicPinEnabled
                                ? 'Activo. Al introducirlo al desbloquear, se borra todo el dispositivo.'
                                : 'Configura un PIN distinto que, al introducirlo bajo coacción, borre tu identidad y mensajes.'
                        }
                        value={!!prefs.panicPinEnabled}
                        onChange={handlePanicToggle}
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

            {/* Modal de setup del PIN de pánico */}
            <Modal
                visible={panicSetupOpen}
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setPanicSetupOpen(false)}
            >
                <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
                    <View style={s.header}>
                        <TouchableOpacity style={s.backBtn} onPress={() => setPanicSetupOpen(false)} activeOpacity={0.6}>
                            <X size={26} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={s.headerTitle}>PIN de pánico</Text>
                        <View style={s.headerSpacer} />
                    </View>
                    <PinScreen mode="setup" onComplete={handlePanicPinComplete} />
                </View>
            </Modal>

            {modalNode}
        </View>
    );
}
