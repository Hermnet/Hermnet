import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, Dimensions, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../../styles/loadingStyles';
import { styles as loginStyles } from '../../styles/loginStyles';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'IDENTIDAD MATEMÁTICA',
        description: 'Olvida los correos y contraseñas. Tu dispositivo está calculando ahora mismo un par de llaves criptográficas únicas. Tú eres el dueño absoluto de tu acceso.',
    },
    {
        id: '2',
        title: 'EL MENSAJERO FANTASMA',
        description: 'Tus mensajes se cifran y se camuflan dentro de imágenes comunes. Para el mundo, solo envías fotos. Para tu contacto, envías secretos indescifrables.',
    },
    {
        id: '3',
        title: 'BÓVEDA LOCAL SEGURA',
        description: 'Tus conversaciones nunca se guardan en servidores centrales. Tu dispositivo es la única bóveda que almacena tus chats bajo una potente llave de cifrado.',
    }
];

// -------- ANIMACIÓN: DIAPOSITIVA 1 (CAJA FUERTE Y CARPETA) --------
const SafeVaultAnimation = () => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(animValue, {
                toValue: 2, // Fases: 0 a 1 (entra), 1 a 2 (resetea y espera)
                duration: 3500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [animValue]);

    // La carpeta viene desde la derecha y entra a la caja (centro)
    const folderTranslateX = animValue.interpolate({
        inputRange: [0, 0.4, 0.6, 1, 2],
        outputRange: [100, 20, 0, 0, 0] // Empieza en 100px, frena al entrar a la caja (0)
    });
    // Se achica al entrar para simular que es "guardado" adentro
    const folderScale = animValue.interpolate({
        inputRange: [0, 0.4, 0.7, 1, 2],
        outputRange: [1, 1, 0, 0, 0]
    });
    // La caja vibra o "pestañea" cuando recibe la carpeta
    const vaultScale = animValue.interpolate({
        inputRange: [0, 0.6, 0.7, 0.8, 1, 2],
        outputRange: [1, 1, 1.1, 1, 1, 1]
    });

    return (
        <View style={localAnimStyles.sceneContainer}>
            <Animated.View style={{ zIndex: 1, transform: [{ translateX: folderTranslateX }, { scale: folderScale }] }}>
                <Feather name="folder" size={40} color="#3182ce" />
            </Animated.View>
            <Animated.View style={[localAnimStyles.vaultCube, { transform: [{ scale: vaultScale }] }]}>
                {/* Puerta de la caja fuerte */}
                <View style={localAnimStyles.vaultDoor}>
                    <MaterialCommunityIcons name="shield-lock-outline" size={30} color="#1a202c" />
                </View>
            </Animated.View>
        </View>
    );
};

// -------- ANIMACIÓN: DIAPOSITIVA 2 (MÓVILES ENVIANDO DATOS/CARTAS) --------
const PhonesCommunicationAnimation = () => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // La carta atraviesa de un móvil a otro
        const loop = Animated.loop(
            Animated.timing(animValue, {
                toValue: 1,
                duration: 2500,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [animValue]);

    // Interpolación para el sobre volador
    const envelopeTranslateX = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-60, 60] // Desde el de la izquierda al de la derecha
    });
    // Efecto esteganografía: El sobre desaparece y reaparece (se camufla) en medio de la transmisión
    const envelopeOpacity = animValue.interpolate({
        inputRange: [0, 0.1, 0.4, 0.6, 0.9, 1],
        outputRange: [0, 1, 0, 0, 1, 0] // Desaparece total al medio (camuflaje fantasma)
    });

    // Pequeño icono flotando en el medio mientras la carta está transparente, simbolizando "Imagen"
    const imageOpacity = animValue.interpolate({
        inputRange: [0, 0.3, 0.5, 0.7, 1],
        outputRange: [0, 0, 1, 0, 0] // Aparece solo justo al medio
    });

    return (
        <View style={[localAnimStyles.sceneContainer, { flexDirection: 'row' }]}>
            {/* Móvil Emisor */}
            <Feather name="smartphone" size={60} color="#1a202c" style={{ marginRight: 60 }} />

            {/* Datos en tránsito (Sobre) */}
            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', transform: [{ translateX: envelopeTranslateX }], opacity: envelopeOpacity }]}>
                <Feather name="mail" size={24} color="#3182ce" />
            </Animated.View>

            {/* Vehículo en medio (Imagen camuflada) */}
            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: imageOpacity }]}>
                <Feather name="image" size={34} color="#a0aec0" />
            </Animated.View>

            {/* Móvil Receptor */}
            <Feather name="smartphone" size={60} color="#1a202c" style={{ marginLeft: 60 }} />
        </View>
    );
};


// -------- ANIMACIÓN: DIAPOSITIVA 3 (ESCUDO REPUDIANDO ATAQUES/DATOS) --------
const ShieldDefenseAnimation = () => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(animValue, {
                toValue: 1,
                duration: 1800,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [animValue]);

    // Los datos "peligrosos" caen desde arriba hacia el centro (donde está el escudo)
    const dataTranslateY = animValue.interpolate({
        inputRange: [0, 0.5],
        outputRange: [-80, 0], // Caen hacia el escudo (y=0)
        extrapolate: 'clamp',
    });

    // Al chocar (0.5), el rayo rojo rebota y se desvía a la izquierda / derecha y cae
    const dataLeftTranslateX = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, -60]
    });
    const dataRightTranslateX = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 60]
    });
    const dataBounceY = animValue.interpolate({
        inputRange: [0, 0.5, 0.7, 1],
        outputRange: [-80, -20, -40, 40] // Desvío parabólico abajo
    });

    // El rayo solo es visible antes de chocar, y pedazos rotos después 
    const incomingOpacity = animValue.interpolate({
        inputRange: [0, 0.1, 0.49, 0.5], outputRange: [0, 1, 1, 0]
    });
    const brokenOpacity = animValue.interpolate({
        inputRange: [0, 0.49, 0.5, 0.8, 1], outputRange: [0, 0, 1, 1, 0]
    });

    // El escudo vibra sutilmente al recibir el impacto en 0.5
    const shieldScale = animValue.interpolate({
        inputRange: [0, 0.4, 0.5, 0.6, 1], outputRange: [1, 1, 1.15, 1, 1]
    });

    return (
        <View style={localAnimStyles.sceneContainer}>
            {/* Impacto / Troyano o datos intrusos bajando */}
            <Animated.View style={{ position: 'absolute', opacity: incomingOpacity, transform: [{ translateY: dataTranslateY }] }}>
                <Feather name="zap" size={28} color="#e53e3e" />
            </Animated.View>

            <Animated.View style={{ position: 'absolute', opacity: brokenOpacity, transform: [{ translateX: dataLeftTranslateX }, { translateY: dataBounceY }, { rotate: '-45deg' }] }}>
                <View style={{ width: 10, height: 4, backgroundColor: '#e53e3e', borderRadius: 2 }} />
            </Animated.View>
            <Animated.View style={{ position: 'absolute', opacity: brokenOpacity, transform: [{ translateX: dataRightTranslateX }, { translateY: dataBounceY }, { rotate: '45deg' }] }}>
                <View style={{ width: 10, height: 4, backgroundColor: '#e53e3e', borderRadius: 2 }} />
            </Animated.View>

            {/* Escudo Protector Gigante Constante */}
            <Animated.View style={{ transform: [{ scale: shieldScale }] }}>
                <Feather name="shield" size={100} color="#1a202c" />
            </Animated.View>
        </View>
    );
}

// -------- ESTILOS INTERNOS AUXILIARES --------
const localAnimStyles = StyleSheet.create({
    sceneContainer: {
        width: '100%',
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    vaultCube: {
        width: 80,
        height: 80,
        backgroundColor: '#cbd5e1',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        shadowColor: '#1a202c', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8
    },
    vaultDoor: {
        width: 60,
        height: 60,
        borderWidth: 2,
        borderColor: '#94a3b8',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e2e8f0',
    }
});


export default function LoadingScreen({ onFinish }: { onFinish?: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const progressAnimation = useRef(new Animated.Value(0)).current;

    const userInteracted = useRef(false);
    const [showButton, setShowButton] = useState(false);
    const enterAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Barra de carga base progresando fluidamente en 12 segundos
        Animated.timing(progressAnimation, {
            toValue: 100,
            duration: 12000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start(() => {
            setShowButton(true);
            Animated.timing(enterAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }).start();
        });

        // Hacemos que la pantalla avance sola si el usuario no arrastra manualmente.
        let interval = setInterval(() => {
            if (userInteracted.current) {
                clearInterval(interval);
                return;
            }
            setCurrentIndex((prev) => {
                const nextIndex = (prev + 1) % SLIDES.length;
                flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
                return nextIndex;
            });
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const progressBarWidth = progressAnimation.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%']
    });

    const contentTranslateY = enterAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -40]
    });

    const buttonTranslateY = enterAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0]
    });

    const DynamicGraphicsRenderer = ({ index }: { index: number }) => {
        if (index === 0) return <SafeVaultAnimation />;
        if (index === 1) return <PhonesCommunicationAnimation />;
        if (index === 2) return <ShieldDefenseAnimation />;
        return null;
    };

    return (
        <View style={[styles.container, { paddingTop: 90 }]}>
            {/* Indicadores de página (Puntos blancos), ahora fijos fuera de la animación de subida */}
            <View style={[styles.paginationContainer, { marginBottom: 20 }]}>
                {SLIDES.map((_, index) => (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            currentIndex === index ? styles.activeDot : null,
                            currentIndex === index && { transform: [{ scale: 1.2 }] }
                        ]}
                    />
                ))}
            </View>

            <Animated.View style={{ flex: 1, width: '100%', alignItems: 'center', transform: [{ translateY: contentTranslateY }] }}>
                {/* Carrusel Deslizable */}
                <View style={{ flex: 1, alignSelf: 'stretch' }}>
                    <FlatList
                        ref={flatListRef}
                        data={SLIDES}
                        keyExtractor={(item) => item.id}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScrollBeginDrag={() => { userInteracted.current = true; }}
                        onMomentumScrollEnd={(event) => {
                            // Resuelve en qué punto exacto nos dejó el deslizamiento del usuario
                            const newInd = Math.round(event.nativeEvent.contentOffset.x / width);
                            setCurrentIndex(newInd);
                        }}
                        scrollEnabled={true} // ¡Permite que el usuario deslice naturalmente!
                        renderItem={({ item, index }) => (
                            <View style={{ width, alignItems: 'center', justifyContent: 'center' }}>
                                <View style={styles.card}>
                                    <View style={{ width: '100%', alignItems: 'center' }}>
                                        <Text style={styles.title}>{item.title}</Text>
                                        <Text style={styles.description}>{item.description}</Text>
                                    </View>

                                    {/* Contenedor para cargar la escena 2D/Animación compleja */}
                                    <View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                        <DynamicGraphicsRenderer index={index} />
                                    </View>
                                </View>
                            </View>
                        )}
                    />
                </View>

                {/* Bottom Section - Progress Bar Mejorada */}
                <View style={[styles.bottomSection, { marginBottom: 20 }]}>
                    <Text style={styles.loadingText}>
                        {showButton ? "Clave Creada Exitosamente" : "Generando Clave Privada..."}
                    </Text>

                    <View style={styles.progressBarBackground}>
                        <Animated.View style={[styles.progressBar, styles.progressBarGlow, { width: progressBarWidth }]}>
                            <LinearGradient
                                colors={['#1D4ED8', '#3B82F6', '#60A5FA']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                        </Animated.View>
                    </View>
                </View>
            </Animated.View>

            {/* Nuevo botón Continuar */}
            {showButton && (
                <Animated.View style={{
                    position: 'absolute',
                    bottom: 40,
                    width: '100%',
                    alignItems: 'center',
                    opacity: enterAnim,
                    transform: [{ translateY: buttonTranslateY }]
                }}>
                    <TouchableOpacity
                        style={[loginStyles.button, { paddingVertical: 14, width: '60%', marginBottom: 0 }]}
                        onPress={() => { if (onFinish) onFinish(); }}
                        activeOpacity={0.8}
                    >
                        <Text style={[loginStyles.buttonText, { fontSize: 16 }]}>Continuar</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}
