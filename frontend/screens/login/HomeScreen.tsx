import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Image, TouchableOpacity, Text, Animated, StyleSheet, Dimensions, Easing, ActivityIndicator } from 'react-native';
import { useAppModal } from '../../components/AppModal';
import QuickCrypto from 'react-native-quick-crypto';
import ShimmerText from './ShimmerText';
import LoadingScreen from './LoadingScreen';
import PinScreen from './PinScreen';
import { createStyles as createLoginStyles } from '../../styles/loginStyles';
import { useTheme } from '../../contexts/ThemeContext';
import { authFlowService, LoginFlowResult } from '../../services/AuthFlowService';
import { authSessionService } from '../../services/AuthSessionService';
import { useAuthStore } from '../../store/authStore';

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

    const handleRestoreClick = () => {
        showModal({
            type: 'warning',
            title: 'Restaurar Identidad',
            message: 'Aquí se abrirá el explorador de archivos para seleccionar tu Bóveda de Respaldo (.hnet). Tras seleccionarlo, te pediremos tu contraseña de cifrado.',
            buttons: [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Simular Selección',
                    onPress: () => {
                        setIsRestoring(true);
                        animateToPinScreen();
                    },
                },
            ],
        });
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
            {modalNode}
        </View>
    );
}
