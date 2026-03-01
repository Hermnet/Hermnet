import React, { useState, useRef } from 'react';
import { View, Image, TouchableOpacity, Text, Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import ShimmerText from './ShimmerText';
import LoadingScreen from './LoadingScreen';
import SeedScreen from './SeedScreen';
import PinScreen from './PinScreen';
import { styles as loginStyles } from '../../styles/loginStyles';

const { height } = Dimensions.get('window');

export default function HomeScreen() {
    const [showSeed, setShowSeed] = useState(false);
    const [showPin, setShowPin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Transición de salida de Home
    const fadeHomeAnim = useRef(new Animated.Value(1)).current;
    const translateYHomeAnim = useRef(new Animated.Value(0)).current;

    // Transición de entrada de Seed
    const fadeSeedAnim = useRef(new Animated.Value(0)).current;
    const translateYSeedAnim = useRef(new Animated.Value(40)).current;

    // Transición de entrada de PIN 
    const fadePinAnim = useRef(new Animated.Value(0)).current;
    const translateYPinAnim = useRef(new Animated.Value(40)).current;

    const slideLoadingAnim = useRef(new Animated.Value(height)).current;

    const handleGenerateClick = () => {
        if (showSeed) return;
        setShowSeed(true);

        // Push Up: Sube el contenido viejo al 0% y trae Semillas desde abajo
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
            Animated.timing(fadeSeedAnim, {
                toValue: 1,
                duration: 400,
                delay: 50,
                useNativeDriver: true,
            }),
            Animated.timing(translateYSeedAnim, {
                toValue: 0,
                duration: 400,
                delay: 50,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleSeedComplete = (seedPhrase: string[]) => {
        setShowPin(true);

        Animated.parallel([
            Animated.timing(fadeSeedAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }),
            Animated.timing(translateYSeedAnim, {
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

    const handlePinComplete = (pinCode: string) => {
        console.log("PIN Registrado exitosamente: ", pinCode);
        // Aquí pasaremos el PIN al motor criptográfico después. Por ahora avanzamos a la carga.
        setIsLoading(true);

        // Desliza imponentemente la pantalla de carga tapeando el PIN
        Animated.spring(slideLoadingAnim, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0d111b' }}>
            {/* Pantalla principal base */}
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
                    style={loginStyles.button}
                    onPress={handleGenerateClick}
                    activeOpacity={0.8}
                >
                    <Text style={loginStyles.buttonText}>Generar Clave Privada</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Pantalla de las 12 Palabras Semilla */}
            {showSeed && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { opacity: fadeSeedAnim, transform: [{ translateY: translateYSeedAnim }], zIndex: 4, elevation: 4, backgroundColor: '#0d111b' }
                    ]}
                >
                    <SeedScreen onComplete={handleSeedComplete} />
                </Animated.View>
            )}

            {/* Pantalla de Entrada de PIN superpuesta */}
            {showPin && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { opacity: fadePinAnim, transform: [{ translateY: translateYPinAnim }], zIndex: 5, elevation: 5, backgroundColor: '#0d111b' }
                    ]}
                >
                    <PinScreen onComplete={handlePinComplete} />
                </Animated.View>
            )}

            {/* Pantalla de carga superpuesta, oculta abajo esperando para deslizar */}
            {isLoading && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { transform: [{ translateY: slideLoadingAnim }], zIndex: 10, elevation: 10, backgroundColor: '#0d111b' }
                    ]}
                >
                    <LoadingScreen onFinish={() => console.log("Finalizado")} />
                </Animated.View>
            )}
        </View>
    );
}
