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

// -------- ANIMATION: SLIDE 1 (SAFE AND FOLDER) --------
const SafeVaultAnimation = () => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(animValue, {
                toValue: 2, // Phases: 0 to 1 (enters), 1 to 2 (resets and waits)
                duration: 3500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [animValue]);

    // Folder comes from the right and enters the safe (center)
    const folderTranslateX = animValue.interpolate({
        inputRange: [0, 0.4, 0.6, 1, 2],
        outputRange: [100, 20, 0, 0, 0] // Starts at 100px, stops when entering the safe (0)
    });
    // Shrinks when entering to simulate being "saved" inside
    const folderScale = animValue.interpolate({
        inputRange: [0, 0.4, 0.7, 1, 2],
        outputRange: [1, 1, 0, 0, 0]
    });
    // The safe blinks when receiving the folder
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
                {/* Safe door */}
                <View style={localAnimStyles.vaultDoor}>
                    <MaterialCommunityIcons name="shield-lock-outline" size={30} color="#1a202c" />
                </View>
            </Animated.View>
        </View>
    );
};

// -------- ANIMATION: SLIDE 2 (PHONES SENDING DATA/LETTERS) --------
const PhonesCommunicationAnimation = () => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // The letter goes from one phone to another
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

    // Interpolation for the flying envelope
    const envelopeTranslateX = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-60, 60] // From left to right
    });
    //  The envelope disappears and reappears (camouflages) mid-transmission
    const envelopeOpacity = animValue.interpolate({
        inputRange: [0, 0.1, 0.4, 0.6, 0.9, 1],
        outputRange: [0, 1, 0, 0, 1, 0] // Disappears completely in the middle (ghost camouflage)
    });

    // Small icon floating in the middle while the letter is transparent, symbolizing "Image"
    const imageOpacity = animValue.interpolate({
        inputRange: [0, 0.3, 0.5, 0.7, 1],
        outputRange: [0, 0, 1, 0, 0] // Appears only exactly in the middle
    });

    return (
        <View style={[localAnimStyles.sceneContainer, { flexDirection: 'row' }]}>
            {/* Sender Phone */}
            <Feather name="smartphone" size={60} color="#1a202c" style={{ marginRight: 60 }} />

            {/* Data in transit (Envelope) */}
            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', transform: [{ translateX: envelopeTranslateX }], opacity: envelopeOpacity }]}>
                <Feather name="mail" size={24} color="#3182ce" />
            </Animated.View>

            {/* Vehicle in middle (Camouflaged image) */}
            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: imageOpacity }]}>
                <Feather name="image" size={34} color="#a0aec0" />
            </Animated.View>

            {/* Receiver Phone */}
            <Feather name="smartphone" size={60} color="#1a202c" style={{ marginLeft: 60 }} />
        </View>
    );
};


// -------- ANIMATION: SLIDE 3 (SHIELD REPELLING ATTACKS/DATA) --------
const ShieldDefenseAnimation = () => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(animValue, {
                toValue: 1,
                duration: 2200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [animValue]);

    // "Dangerous" laser speeds in from the left side
    const dataTranslateX = animValue.interpolate({
        inputRange: [0, 0.4],
        outputRange: [-140, -42], // Shoots from left towards center shield
        extrapolate: 'clamp',
    });

    // Upon collision (0.4), it breaks into pieces and deflects backward-up and backward-down
    const piece1TranslateX = animValue.interpolate({
        inputRange: [0, 0.4, 1], outputRange: [0, -42, -120]
    });
    const piece1TranslateY = animValue.interpolate({
        inputRange: [0, 0.4, 1], outputRange: [0, 0, -80]
    });

    const piece2TranslateX = animValue.interpolate({
        inputRange: [0, 0.4, 1], outputRange: [0, -42, -100]
    });
    const piece2TranslateY = animValue.interpolate({
        inputRange: [0, 0.4, 1], outputRange: [0, 0, 90]
    });

    // The incoming attack is visible until it hits the shield
    const incomingOpacity = animValue.interpolate({
        inputRange: [0, 0.1, 0.39, 0.4], outputRange: [0, 1, 1, 0]
    });

    // The broken pieces appear at impact and fade out as they fly away
    const brokenOpacity = animValue.interpolate({
        inputRange: [0, 0.39, 0.4, 0.7, 1], outputRange: [0, 0, 1, 0, 0]
    });

    // The shield braces for impact: scales up and tilts slightly backward to absorb the blow
    const shieldScale = animValue.interpolate({
        inputRange: [0, 0.35, 0.4, 0.5, 1], outputRange: [1, 1, 1.15, 1, 1]
    });
    const shieldRotate = animValue.interpolate({
        inputRange: [0, 0.35, 0.4, 0.6, 1], outputRange: ['0deg', '0deg', '15deg', '0deg', '0deg']
    });

    // Energy ripple effect when the laser hits the shield
    const rippleScale = animValue.interpolate({
        inputRange: [0, 0.4, 0.7, 1], outputRange: [0.8, 0.8, 1.4, 1.4]
    });
    const rippleOpacity = animValue.interpolate({
        inputRange: [0, 0.39, 0.4, 0.6, 1], outputRange: [0, 0, 0.6, 0, 0]
    });

    return (
        <View style={localAnimStyles.sceneContainer}>
            {/* Energy Force Field Ripple */}
            <Animated.View style={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 3,
                borderColor: '#3182ce',
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }]
            }} />

            {/* Incoming intruder laser from left */}
            <Animated.View style={{ position: 'absolute', opacity: incomingOpacity, transform: [{ translateX: dataTranslateX }, { rotate: '90deg' }] }}>
                <Feather name="zap" size={36} color="#e53e3e" />
            </Animated.View>

            {/* Broken deflected pieces flying backwards */}
            <Animated.View style={{ position: 'absolute', opacity: brokenOpacity, transform: [{ translateX: piece1TranslateX }, { translateY: piece1TranslateY }, { rotate: '-45deg' }] }}>
                <View style={{ width: 14, height: 5, backgroundColor: '#e53e3e', borderRadius: 3 }} />
            </Animated.View>
            <Animated.View style={{ position: 'absolute', opacity: brokenOpacity, transform: [{ translateX: piece2TranslateX }, { translateY: piece2TranslateY }, { rotate: '45deg' }] }}>
                <View style={{ width: 14, height: 5, backgroundColor: '#e53e3e', borderRadius: 3 }} />
            </Animated.View>

            {/* Giant Protective Shield */}
            <Animated.View style={{ transform: [{ scale: shieldScale }, { rotate: shieldRotate }] }}>
                <Feather name="shield" size={100} color="#1a202c" />
            </Animated.View>
        </View>
    );
}

// -------- AUXILIARY INTERNAL STYLES --------
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
        // Base progress bar filling smoothly over 12 seconds
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

        // Auto-advances screen if the user does not drag manually.
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
            {/* Page indicators (white dots), now fixed outside the slide-up animation */}
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
                {/* Swipeable Carousel */}
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
                            // Resolves exactly where the user's scroll left us
                            const newInd = Math.round(event.nativeEvent.contentOffset.x / width);
                            setCurrentIndex(newInd);
                        }}
                        scrollEnabled={true} // Allows user to swipe naturally!
                        renderItem={({ item, index }) => (
                            <View style={{ width, alignItems: 'center', justifyContent: 'center' }}>
                                <View style={styles.card}>
                                    <View style={{ width: '100%', alignItems: 'center' }}>
                                        <Text style={styles.title}>{item.title}</Text>
                                        <Text style={styles.description}>{item.description}</Text>
                                    </View>

                                    {/* Container to load the 2D scene/complex animation */}
                                    <View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                        <DynamicGraphicsRenderer index={index} />
                                    </View>
                                </View>
                            </View>
                        )}
                    />
                </View>

                {/* Bottom Section - Improved Progress Bar */}
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

            {/* New Continue button */}
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
