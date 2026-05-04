import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, FlatList, StyleSheet, TouchableOpacity, ViewStyle, useWindowDimensions } from 'react-native';
import { Folder, ShieldAlert, Smartphone, Mail, Image as LucideImage, Zap, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles, localAnimStyles } from '../../styles/loadingStyles';
import { styles as loginStyles } from '../../styles/loginStyles';

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

// ── Shared hook: looping Animated.timing ──────────────────────────────────────
function useLoopAnim(toValue: number, duration: number, easing: (t: number) => number) {
    const animValue = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(animValue, { toValue, duration, easing, useNativeDriver: true })
        );
        loop.start();
        return () => loop.stop();
    }, []);
    return animValue;
}

// ── Shared container for each animation scene ─────────────────────────────────
const LoadingAnimationStep = ({ style, children }: { style?: ViewStyle; children: React.ReactNode }) => (
    <View style={[localAnimStyles.sceneContainer, style]}>{children}</View>
);

// -------- ANIMATION: SLIDE 1 (SAFE AND FOLDER) --------
const SafeVaultAnimation = () => {
    const animValue = useLoopAnim(2, 3500, Easing.linear);

    const folderTranslateX = animValue.interpolate({
        inputRange: [0, 0.4, 0.6, 1, 2],
        outputRange: [100, 20, 0, 0, 0]
    });

    const folderScale = animValue.interpolate({
        inputRange: [0, 0.4, 0.7, 1, 2],
        outputRange: [1, 1, 0, 0, 0]
    });

    const vaultScale = animValue.interpolate({
        inputRange: [0, 0.6, 0.7, 0.8, 1, 2],
        outputRange: [1, 1, 1.1, 1, 1, 1]
    });

    return (
        <LoadingAnimationStep>
            <Animated.View style={{ zIndex: 1, transform: [{ translateX: folderTranslateX }, { scale: folderScale }] }}>
                <Folder size={40} color="#3182ce" />
            </Animated.View>
            <Animated.View style={[localAnimStyles.vaultCube, { transform: [{ scale: vaultScale }] }]}>
                <View style={localAnimStyles.vaultDoor}>
                    <ShieldAlert size={30} color="#1a202c" />
                </View>
            </Animated.View>
        </LoadingAnimationStep>
    );
};

// -------- ANIMATION: SLIDE 2 (PHONES SENDING DATA/LETTERS) --------
const PhonesCommunicationAnimation = () => {
    const animValue = useLoopAnim(1, 2500, Easing.inOut(Easing.ease));

    const envelopeTranslateX = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-45, 45]
    });

    const envelopeOpacity = animValue.interpolate({
        inputRange: [0, 0.1, 0.4, 0.6, 0.9, 1],
        outputRange: [0, 1, 0, 0, 1, 0]
    });

    const imageOpacity = animValue.interpolate({
        inputRange: [0, 0.3, 0.5, 0.7, 1],
        outputRange: [0, 0, 1, 0, 0]
    });

    return (
        <LoadingAnimationStep style={{ flexDirection: 'row' }}>
            <Smartphone size={50} color="#1a202c" style={{ marginRight: 40 }} />

            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', transform: [{ translateX: envelopeTranslateX }], opacity: envelopeOpacity }]}>
                <Mail size={24} color="#3182ce" />
            </Animated.View>

            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', opacity: imageOpacity }]}>
                <LucideImage size={34} color="#a0aec0" />
            </Animated.View>

            <Smartphone size={50} color="#1a202c" style={{ marginLeft: 40 }} />
        </LoadingAnimationStep>
    );
};

// -------- ANIMATION: SLIDE 3 (SHIELD REPELLING ATTACKS/DATA) --------
const ShieldDefenseAnimation = () => {
    const animValue = useLoopAnim(1, 2200, Easing.linear);

    const dataTranslateX = animValue.interpolate({
        inputRange: [0, 0.4],
        outputRange: [-140, -42],
        extrapolate: 'clamp',
    });

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

    const incomingOpacity = animValue.interpolate({
        inputRange: [0, 0.1, 0.39, 0.4], outputRange: [0, 1, 1, 0]
    });

    const brokenOpacity = animValue.interpolate({
        inputRange: [0, 0.39, 0.4, 0.7, 1], outputRange: [0, 0, 1, 0, 0]
    });

    const shieldScale = animValue.interpolate({
        inputRange: [0, 0.35, 0.4, 0.5, 1], outputRange: [1, 1, 1.15, 1, 1]
    });
    const shieldRotate = animValue.interpolate({
        inputRange: [0, 0.35, 0.4, 0.6, 1], outputRange: ['0deg', '0deg', '15deg', '0deg', '0deg']
    });

    const rippleScale = animValue.interpolate({
        inputRange: [0, 0.4, 0.7, 1], outputRange: [0.8, 0.8, 1.4, 1.4]
    });
    const rippleOpacity = animValue.interpolate({
        inputRange: [0, 0.39, 0.4, 0.6, 1], outputRange: [0, 0, 0.6, 0, 0]
    });

    return (
        <LoadingAnimationStep>
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

            <Animated.View style={{ position: 'absolute', opacity: incomingOpacity, transform: [{ translateX: dataTranslateX }, { rotate: '90deg' }] }}>
                <Zap size={36} color="#e53e3e" />
            </Animated.View>

            <Animated.View style={{ position: 'absolute', opacity: brokenOpacity, transform: [{ translateX: piece1TranslateX }, { translateY: piece1TranslateY }, { rotate: '-45deg' }] }}>
                <View style={{ width: 14, height: 5, backgroundColor: '#e53e3e', borderRadius: 3 }} />
            </Animated.View>
            <Animated.View style={{ position: 'absolute', opacity: brokenOpacity, transform: [{ translateX: piece2TranslateX }, { translateY: piece2TranslateY }, { rotate: '45deg' }] }}>
                <View style={{ width: 14, height: 5, backgroundColor: '#e53e3e', borderRadius: 3 }} />
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: shieldScale }, { rotate: shieldRotate }] }}>
                <Shield size={100} color="#1a202c" />
            </Animated.View>
        </LoadingAnimationStep>
    );
};


export default function LoadingScreen({ onFinish }: { onFinish?: () => void }) {
    const { width: SCREEN_WIDTH, height: screenHeight } = useWindowDimensions();
    const isShort = screenHeight < 680;
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const progressAnimation = useRef(new Animated.Value(0)).current;

    const userInteracted = useRef(false);
    const [showButton, setShowButton] = useState(false);
    const enterAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(progressAnimation, {
            toValue: 100,
            duration: 9000,
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

    const renderSlide = useCallback(({ item, index }: { item: typeof SLIDES[0]; index: number }) => (
        <View style={{ width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
            <View style={styles.card}>
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
                <View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    {index === 0 ? <SafeVaultAnimation /> : index === 1 ? <PhonesCommunicationAnimation /> : <ShieldDefenseAnimation />}
                </View>
            </View>
        </View>
    ), []);

    return (
        <View style={[styles.container, { paddingTop: isShort ? 40 : 90 }]}>
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
                            const newInd = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                            setCurrentIndex(newInd);
                        }}
                        scrollEnabled={true}
                        renderItem={renderSlide}
                    />
                </View>

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

            {showButton && (
                <Animated.View style={{
                    position: 'absolute',
                    bottom: isShort ? 20 : 40,
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
