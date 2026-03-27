import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Image, TouchableOpacity, Text, Animated, StyleSheet, Dimensions, Easing, Alert, ActivityIndicator } from 'react-native';
import ShimmerText from './ShimmerText';
import LoadingScreen from './LoadingScreen';
import PinScreen from './PinScreen';
import { styles as loginStyles } from '../../styles/loginStyles';
import { authFlowService, LoginFlowResult } from '../../services/AuthFlowService';
import { authSessionService } from '../../services/AuthSessionService';
import { useAuthStore } from '../../store/authStore';

const { height } = Dimensions.get('window');

export default function HomeScreen({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
    const [hasAccount, setHasAccount] = useState<boolean | null>(null);
    const [showPin, setShowPin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    const bootstrapPromiseRef = useRef<Promise<LoginFlowResult> | null>(null);
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
        Alert.alert(
            'Restaurar Identidad',
            'Aquí se abrirá el explorador de archivos para seleccionar tu Bóveda de Respaldo (.hnet). Tras seleccionarlo, te pediremos tu contraseña de cifrado.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Simular Selección',
                    onPress: () => {
                        setIsRestoring(true);
                        animateToPinScreen();
                    }
                }
            ]
        );
    };

    const handlePinComplete = (_pin: string) => {
        setIsLoading(true);
        bootstrapPromiseRef.current = authFlowService.bootstrapLogin();
        Animated.spring(slideLoadingAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }).start();
    };

    const handleLoadingFinish = useCallback(async () => {
        try {
            const result = await bootstrapPromiseRef.current!;
            await authStoreLogin(result.identity, result.jwtToken);
            if (onAuthSuccess) onAuthSuccess();
        } catch {
            Alert.alert(
                'Error de conexión',
                'No se pudo conectar al servidor. ¿Reintentar?',
                [
                    {
                        text: 'Reintentar',
                        onPress: () => {
                            bootstrapPromiseRef.current = authFlowService.bootstrapLogin();
                        }
                    },
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                        onPress: () => {
                            Animated.timing(slideLoadingAnim, { toValue: height, duration: 300, useNativeDriver: true })
                                .start(() => setIsLoading(false));
                        }
                    },
                ]
            );
        }
    }, [authStoreLogin, onAuthSuccess, slideLoadingAnim]);

    const handleLoginComplete = useCallback(async (_pin: string) => {
        setLoginLoading(true);
        try {
            const result = await authFlowService.bootstrapLogin();
            await authStoreLogin(result.identity, result.jwtToken);
            if (onAuthSuccess) onAuthSuccess();
        } catch {
            Alert.alert('Error de autenticación', 'No se pudo verificar tu identidad. Comprueba la conexión.');
        } finally {
            setLoginLoading(false);
        }
    }, [authStoreLogin, onAuthSuccess]);

    if (hasAccount === null) {
        return <View style={{ flex: 1, backgroundColor: '#0d111b' }} />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0d111b' }}>
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
                            backgroundColor: '#0d111b'
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
                        { transform: [{ translateY: slideLoadingAnim }], zIndex: 10, elevation: 10, backgroundColor: '#0d111b' }
                    ]}
                >
                    <LoadingScreen onFinish={handleLoadingFinish} />
                </Animated.View>
            )}

            {loginLoading && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0d111b', zIndex: 30, elevation: 30, alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={{ color: '#a0aec0', marginTop: 12, fontSize: 14 }}>Autenticando...</Text>
                </View>
            )}
        </View>
    );
}
