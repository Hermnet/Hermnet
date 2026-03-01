import React, { useState, useRef } from 'react';
import { View, Image, TouchableOpacity, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import ShimmerText from './ShimmerText';
import LoadingScreen from './LoadingScreen';
import { styles as loginStyles } from '../../styles/loginStyles';

const { height } = Dimensions.get('window');

export default function HomeScreen() {
    const [isLoading, setIsLoading] = useState(false);

    // Animaciones para la transición
    const fadeHomeAnim = useRef(new Animated.Value(1)).current;
    // Iniciamos la pantalla de carga completamente debajo de la pantalla
    const slideLoadingAnim = useRef(new Animated.Value(height)).current;

    const handleGenerateClick = () => {
        if (isLoading) return;
        setIsLoading(true);

        // Desvanece sutilmente la pantalla de inicio hacia atrás
        Animated.timing(fadeHomeAnim, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
        }).start();

        // Desliza imponentemente la pantalla de carga desde abajo hacia arriba (Y = 0)
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
            <Animated.View style={[loginStyles.container, StyleSheet.absoluteFill, { opacity: fadeHomeAnim }]}>
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
