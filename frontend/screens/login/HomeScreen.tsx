import React, { useState, useRef, useEffect } from 'react';
import { View, Image, TouchableOpacity, Text, Animated, StyleSheet, Dimensions, Easing, Alert } from 'react-native';
import ShimmerText from './ShimmerText';
import LoadingScreen from './LoadingScreen';
import PinScreen from './PinScreen';
import { styles as loginStyles } from '../../styles/loginStyles';

const { height } = Dimensions.get('window');

export default function HomeScreen({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
    const [hasAccount, setHasAccount] = useState<boolean | null>(null);
    const [showPin, setShowPin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        const checkExistingVault = async () => {
            // TODO: Integrate with SQLite/SecureStore 
            // Quick test mock (change to true and reload Expo to see Cold Start magic)
            const exists = false;

            setHasAccount(exists);
        };


        setTimeout(checkExistingVault, 400);
    }, []);

    const fadeHomeAnim = useRef(new Animated.Value(1)).current;
    const translateYHomeAnim = useRef(new Animated.Value(0)).current;

    const fadePinAnim = useRef(new Animated.Value(0)).current;
    const translateYPinAnim = useRef(new Animated.Value(40)).current;

    const slideLoadingAnim = useRef(new Animated.Value(height)).current;

    const handleGenerateClick = () => {
        setIsRestoring(false);
        setShowPin(true);

        Animated.parallel([
            Animated.timing(fadeHomeAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(translateYHomeAnim, {
                toValue: -50,
                duration: 400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(fadePinAnim, {
                toValue: 1,
                duration: 400,
                delay: 50,
                useNativeDriver: true,
            }),
            Animated.timing(translateYPinAnim, {
                toValue: 0,
                duration: 400,
                delay: 50,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleRestoreClick = () => {
        Alert.alert(
            "Restaurar Identidad",
            "Aquí se abrirá el explorador de archivos para seleccionar tu Bóveda de Respaldo (.hnet). Tras seleccionarlo, te pediremos tu contraseña de cifrado.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Simular Selección",
                    onPress: () => {
                        setIsRestoring(true);
                        setShowPin(true);

                        Animated.parallel([
                            Animated.timing(fadeHomeAnim, {
                                toValue: 0,
                                duration: 350,
                                useNativeDriver: true,
                            }),
                            Animated.timing(translateYHomeAnim, {
                                toValue: -50,
                                duration: 400,
                                easing: Easing.out(Easing.quad),
                                useNativeDriver: true,
                            }),
                            Animated.timing(fadePinAnim, {
                                toValue: 1,
                                duration: 400,
                                delay: 50,
                                useNativeDriver: true,
                            }),
                            Animated.timing(translateYPinAnim, {
                                toValue: 0,
                                duration: 400,
                                delay: 50,
                                easing: Easing.out(Easing.cubic),
                                useNativeDriver: true,
                            })
                        ]).start();
                    }
                }
            ]
        );
    };

const handlePinComplete = (pinCode: string) => {
    setIsLoading(true);

    Animated.spring(slideLoadingAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
    }).start();
};

const handleLoginComplete = (pinCode: string) => {
    if (onAuthSuccess) {
        onAuthSuccess();
    }
};

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
                >
                    <Text style={loginStyles.secondaryButtonText}>¿Ya tienes cuenta? / Restaurar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={loginStyles.button}
                    onPress={handleGenerateClick}
                    activeOpacity={0.8}
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
                <LoadingScreen onFinish={() => { if (onAuthSuccess) onAuthSuccess(); }} />
            </Animated.View>
        )}
    </View>
);
}
