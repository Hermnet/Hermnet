import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Image, TouchableOpacity, Text, Animated, StyleSheet, Dimensions, Easing, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useAppModal } from '../../components/AppModal';
import { Eye, EyeOff } from 'lucide-react-native';
import QuickCrypto from 'react-native-quick-crypto';
import ShimmerText from './ShimmerText';
import LoadingScreen from './LoadingScreen';
import PinScreen from './PinScreen';
import { createStyles as createLoginStyles } from '../../styles/loginStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { authFlowService, LoginFlowResult } from '../../services/AuthFlowService';
import { authSessionService } from '../../services/AuthSessionService';
import { useAuthStore } from '../../store/authStore';
import { recoveryService } from '../../services/RecoveryService';

const { height } = Dimensions.get('window');

function hashPin(pin: string, salt: string): string {
    return QuickCrypto.createHash('sha256').update(pin + salt).digest('hex') as string;
}

export default function HomeScreen({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
    const { colors } = useTheme();
    const loginStyles = useMemo(() => createLoginStyles(colors), [colors]);
    const [hasAccount, setHasAccount] = useState<boolean | null>(null);
    const [showPin, setShowPin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const { showModal, modalNode } = useAppModal();

    const bootstrapPromiseRef = useRef<Promise<LoginFlowResult> | null>(null);
    const pinRef = useRef<string>('');
    const { login: authStoreLogin } = useAuthStore();

    const fadeHomeAnim       = useRef(new Animated.Value(1)).current;
    const translateYHomeAnim = useRef(new Animated.Value(0)).current;
    const fadePinAnim        = useRef(new Animated.Value(0)).current;
    const translateYPinAnim  = useRef(new Animated.Value(40)).current;
    const slideLoadingAnim   = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        const checkExistingVault = async () => {
            const identity = await authSessionService.getIdentity();
            setHasAccount(identity !== null);
        };
        setTimeout(checkExistingVault, 400);
    }, []);

    const animateToPinScreen = () => {
        setShowPin(true);
        Animated.parallel([
            Animated.timing(fadeHomeAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
            Animated.timing(translateYHomeAnim, { toValue: -50, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(fadePinAnim, { toValue: 1, duration: 400, delay: 50, useNativeDriver: true }),
            Animated.timing(translateYPinAnim, { toValue: 0, duration: 400, delay: 50, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
    };

    const handleGenerateClick = () => {
        setIsRestoring(false);
        animateToPinScreen();
    };

    /* ─── Restore flow state ─── */
    const [restorePasswordModal, setRestorePasswordModal] = useState(false);
    const [restorePassword, setRestorePassword] = useState('');
    const [showRestorePassword, setShowRestorePassword] = useState(false);
    const [restoreBusy, setRestoreBusy] = useState(false);
    const restoreFileUri = useRef<string>('');

    const handleRestoreClick = async () => {
        let fileUri: string | null = null;
        try {
            fileUri = await recoveryService.pickBackupFile();
        } catch {
            return;
        }
        if (!fileUri) return;
        restoreFileUri.current = fileUri;
        setRestorePassword('');
        setShowRestorePassword(false);
        setRestorePasswordModal(true);
    };

    const doRestore = async () => {
        if (!restorePassword) {
            showModal({ type: 'error', title: 'Sin contraseña', message: 'Debes introducir la contraseña.' });
            return;
        }
        setRestorePasswordModal(false);
        setRestoreBusy(true);
        try {
            const identity = await recoveryService.importBackup(restoreFileUri.current, restorePassword);
            // Restaurado — ahora autenticar con el servidor
            const result = await authFlowService.bootstrapLogin();
            await authStoreLogin(result.identity, result.jwtToken);
            if (onAuthSuccess) onAuthSuccess();
        } catch (e: any) {
            setRestoreBusy(false);
            showModal({
                type: 'error',
                title: 'Error al restaurar',
                message: e?.message ?? 'No se pudo restaurar la identidad.',
            });
        }
    };

    const handlePinComplete = (pin: string) => {
        pinRef.current = pin;
        setIsLoading(true);
        bootstrapPromiseRef.current = authFlowService.bootstrapLogin();
        Animated.spring(slideLoadingAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }).start();
    };

    const handleLoadingFinish = useCallback(async () => {
        const pin = pinRef.current;
        pinRef.current = '';
        try {
            const result = await bootstrapPromiseRef.current!;
            await authSessionService.setPinHash(hashPin(pin, result.identity.id));
            await authStoreLogin(result.identity, result.jwtToken);
            if (onAuthSuccess) onAuthSuccess();
        } catch {
            showModal({
                type: 'error',
                title: 'Error de conexión',
                message: 'No se pudo conectar al servidor. ¿Reintentar?',
                buttons: [
                    {
                        text: 'Reintentar',
                        onPress: () => {
                            bootstrapPromiseRef.current = authFlowService.bootstrapLogin();
                        },
                    },
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        onPress: () => {
                            Animated.timing(slideLoadingAnim, { toValue: height, duration: 300, useNativeDriver: true })
                                .start(() => setIsLoading(false));
                        },
                    },
                ],
            });
        }
    }, [authStoreLogin, onAuthSuccess, showModal, slideLoadingAnim]);

    const handleLoginComplete = useCallback(async (pin: string) => {
        setLoginLoading(true);
        try {
            const result = await authFlowService.bootstrapLogin();
            await authStoreLogin(result.identity, result.jwtToken);
            if (onAuthSuccess) onAuthSuccess();
        } catch {
            const [cachedIdentity, cachedJwt, storedHash] = await Promise.all([
                authSessionService.getIdentity(),
                authSessionService.getJwtToken(),
                authSessionService.getPinHash(),
            ]);
            if (cachedIdentity && cachedJwt && storedHash) {
                if (hashPin(pin, cachedIdentity.id) !== storedHash) {
                    showModal({ type: 'error', title: 'PIN incorrecto', message: 'No se pudo acceder a tu bóveda local.' });
                    return;
                }
                await authStoreLogin(cachedIdentity, cachedJwt);
                if (onAuthSuccess) onAuthSuccess();
            } else {
                showModal({ type: 'error', title: 'Error de autenticación', message: 'No se pudo verificar tu identidad. Comprueba la conexión.' });
            }
        } finally {
            setLoginLoading(false);
        }
    }, [authStoreLogin, onAuthSuccess, showModal]);

    if (hasAccount === null) {
        return <View style={{ flex: 1, backgroundColor: colors.bgPrimary }} />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
            {!hasAccount && (
                <Animated.View style={[loginStyles.container, StyleSheet.absoluteFill, { opacity: fadeHomeAnim, transform: [{ translateY: translateYHomeAnim }] }]}>
                    <View style={loginStyles.content}>
                        <Image
                            source={require('../../assets/logo_tight.png')}
                            style={loginStyles.logo}
                            resizeMode="contain"
                        />
                        <ShimmerText
                            text="HERMNET"
                            style={loginStyles.title}
                            duration={3000}
                        />
                    </View>

                    <TouchableOpacity
                        style={loginStyles.secondaryButton}
                        onPress={handleRestoreClick}
                        activeOpacity={0.6}
                        accessibilityLabel="Restaurar identidad existente"
                    >
                        <Text style={loginStyles.secondaryButtonText}>¿Ya tienes cuenta? / Restaurar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={loginStyles.button}
                        onPress={handleGenerateClick}
                        activeOpacity={0.8}
                        accessibilityLabel="Generar nueva clave privada"
                    >
                        <Text style={loginStyles.buttonText}>Generar Clave Privada</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {(showPin || hasAccount) && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            opacity: hasAccount ? 1 : fadePinAnim,
                            transform: hasAccount ? [] : [{ translateY: translateYPinAnim }],
                            zIndex: 5,
                            elevation: 5,
                            backgroundColor: colors.bgPrimary
                        }
                    ]}
                >
                    <PinScreen
                        mode={hasAccount ? 'login' : (isRestoring ? 'restore' : 'setup')}
                        onComplete={hasAccount ? handleLoginComplete : handlePinComplete}
                    />

                    {hasAccount && (
                        <TouchableOpacity
                            style={[loginStyles.secondaryButton, { position: 'absolute', bottom: 40, alignSelf: 'center' }]}
                            onPress={handleRestoreClick}
                            activeOpacity={0.6}
                            accessibilityLabel="Olvidé mi PIN, restaurar archivo .hnet"
                        >
                            <Text style={loginStyles.secondaryButtonText}>Olvidó su PIN / Restaurar Archivo .hnet</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            )}

            {isLoading && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { transform: [{ translateY: slideLoadingAnim }], zIndex: 10, elevation: 10, backgroundColor: colors.bgPrimary }
                    ]}
                >
                    <LoadingScreen onFinish={handleLoadingFinish} />
                </Animated.View>
            )}

            {loginLoading && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgPrimary, zIndex: 30, elevation: 30, alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color={colors.accentPrimary} />
                    <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>Autenticando...</Text>
                </View>
            )}
            {restoreBusy && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgPrimary, zIndex: 30, elevation: 30, alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color={colors.accentPrimary} />
                    <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>Restaurando...</Text>
                </View>
            )}

            {/* Password modal for restore */}
            <Modal visible={restorePasswordModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setRestorePasswordModal(false)}>
                <TouchableOpacity style={restoreSh.overlay} activeOpacity={1} onPress={() => setRestorePasswordModal(false)}>
                    <TouchableOpacity activeOpacity={1} style={[restoreSh.card, { backgroundColor: colors.bgSurface, borderColor: colors.borderLight }]} onPress={() => {}}>
                        <Text style={[restoreSh.title, { color: colors.textPrimary }]}>Descifrar respaldo</Text>
                        <Text style={[restoreSh.subtitle, { color: colors.textMuted }]}>
                            Introduce la contraseña con la que cifraste este archivo .hnet.
                        </Text>
                        <View style={[restoreSh.inputRow, { backgroundColor: colors.inputFieldBg, borderColor: colors.borderSubtle }]}>
                            <TextInput
                                style={[restoreSh.input, { color: colors.textPrimary }]}
                                placeholder="Contraseña"
                                placeholderTextColor={colors.textHint}
                                secureTextEntry={!showRestorePassword}
                                value={restorePassword}
                                onChangeText={setRestorePassword}
                                autoFocus
                            />
                            <TouchableOpacity onPress={() => setShowRestorePassword(v => !v)} style={restoreSh.eyeBtn}>
                                {showRestorePassword
                                    ? <EyeOff size={20} color={colors.textMuted} />
                                    : <Eye size={20} color={colors.textMuted} />}
                            </TouchableOpacity>
                        </View>
                        <View style={restoreSh.btnRow}>
                            <TouchableOpacity style={[restoreSh.btn, { backgroundColor: colors.bgElevated }]} onPress={() => setRestorePasswordModal(false)}>
                                <Text style={[restoreSh.btnText, { color: colors.textPrimary }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[restoreSh.btn, { backgroundColor: colors.accentPrimary }]} onPress={doRestore}>
                                <Text style={[restoreSh.btnText, { color: '#fff' }]}>Restaurar</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {modalNode}
        </View>
    );
}

const restoreSh = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    card: {
        borderRadius: 24,
        padding: 28,
        width: '100%',
        borderWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 20,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 14,
    },
    eyeBtn: {
        padding: 8,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    btn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    btnText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
