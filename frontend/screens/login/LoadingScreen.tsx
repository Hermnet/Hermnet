import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, FlatList, StyleSheet, TouchableOpacity, ViewStyle, useWindowDimensions } from 'react-native';
import {
    Fingerprint, Shield, Lock, Key, QrCode,
    Smartphone, Mail, Eye, EyeOff, Database,
    Paintbrush, Download, RefreshCw,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles, localAnimStyles } from '../../styles/loadingStyles';
import { styles as loginStyles } from '../../styles/loginStyles';

const SLIDES = [
    {
        id: '1',
        title: 'IDENTIDAD CRIPTOGRÁFICA',
        description: 'Sin correos, sin contraseñas. Tu dispositivo genera un par de claves RSA-2048 único. Tú eres tu propia autoridad de identidad.',
    },
    {
        id: '2',
        title: 'CIFRADO INQUEBRANTABLE',
        description: 'Cada mensaje se protege con AES-256-GCM y la clave se sella con RSA-OAEP. Solo tu contacto puede descifrar lo que envías.',
    },
    {
        id: '3',
        title: 'SERVIDOR CIEGO',
        description: 'Arquitectura Zero-Knowledge: el servidor solo transporta blobs opacos. No puede leer mensajes, ni saber quién habla con quién.',
    },
    {
        id: '4',
        title: 'CONTACTOS POR QR',
        description: 'Intercambia claves públicas escaneando un QR. Sin números de teléfono, sin listas de contactos. Tú decides quién entra.',
    },
    {
        id: '5',
        title: 'TU BÓVEDA LOCAL',
        description: 'Tus conversaciones viven solo en tu dispositivo, cifradas en SQLite. Exporta un archivo .hnet protegido como respaldo seguro.',
    },
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

// ════════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — IDENTITY: Fingerprint materializing with key orbit
// ════════════════════════════════════════════════════════════════════════════════
const IdentityAnimation = () => {
    const anim = useLoopAnim(1, 3200, Easing.inOut(Easing.ease));

    const fingerprintScale = anim.interpolate({
        inputRange: [0, 0.3, 0.5, 0.7, 1],
        outputRange: [0.6, 1.1, 1, 1, 0.6],
    });
    const fingerprintOpacity = anim.interpolate({
        inputRange: [0, 0.15, 0.85, 1],
        outputRange: [0, 1, 1, 0],
    });

    // Key orbiting around fingerprint
    const keyRotation = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });
    const keyOpacity = anim.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 0.9, 0.9, 0],
    });

    // Glow pulse
    const glowScale = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.8, 1.3, 0.8],
    });
    const glowOpacity = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.1, 0.35, 0.1],
    });

    return (
        <LoadingAnimationStep>
            {/* Glow ring */}
            <Animated.View style={{
                position: 'absolute',
                width: 120, height: 120, borderRadius: 60,
                backgroundColor: '#3b82f6',
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
            }} />

            {/* Main fingerprint */}
            <Animated.View style={{
                transform: [{ scale: fingerprintScale }],
                opacity: fingerprintOpacity,
            }}>
                <Fingerprint size={72} color="#3b82f6" />
            </Animated.View>

            {/* Orbiting key */}
            <Animated.View style={{
                position: 'absolute',
                width: 130, height: 130,
                alignItems: 'center',
                justifyContent: 'flex-start',
                opacity: keyOpacity,
                transform: [{ rotate: keyRotation }],
            }}>
                <Key size={20} color="#60a5fa" />
            </Animated.View>
        </LoadingAnimationStep>
    );
};

// ════════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — ENCRYPTION: Lock sealing with shield pulse
// ════════════════════════════════════════════════════════════════════════════════
const EncryptionAnimation = () => {
    const anim = useLoopAnim(1, 2800, Easing.linear);

    // Lock enters and seals
    const lockScale = anim.interpolate({
        inputRange: [0, 0.2, 0.35, 0.5, 1],
        outputRange: [0.5, 1, 1.15, 1, 0.5],
    });
    const lockOpacity = anim.interpolate({
        inputRange: [0, 0.1, 0.85, 1],
        outputRange: [0, 1, 1, 0],
    });

    // Shield appears behind on seal
    const shieldScale = anim.interpolate({
        inputRange: [0, 0.3, 0.4, 0.6, 1],
        outputRange: [0, 0, 1.2, 1, 0],
    });
    const shieldOpacity = anim.interpolate({
        inputRange: [0, 0.3, 0.4, 0.7, 1],
        outputRange: [0, 0, 0.7, 0.7, 0],
    });

    // Ripple burst on lock
    const ripple1Scale = anim.interpolate({
        inputRange: [0, 0.3, 0.6, 1],
        outputRange: [0.5, 0.5, 1.6, 1.6],
    });
    const ripple1Opacity = anim.interpolate({
        inputRange: [0, 0.3, 0.35, 0.55, 1],
        outputRange: [0, 0, 0.5, 0, 0],
    });

    return (
        <LoadingAnimationStep>
            {/* Ripple burst */}
            <Animated.View style={{
                position: 'absolute',
                width: 100, height: 100, borderRadius: 50,
                borderWidth: 2, borderColor: '#22c55e',
                opacity: ripple1Opacity,
                transform: [{ scale: ripple1Scale }],
            }} />

            {/* Shield behind */}
            <Animated.View style={{
                position: 'absolute',
                opacity: shieldOpacity,
                transform: [{ scale: shieldScale }],
            }}>
                <Shield size={90} color="#1e3a5f" />
            </Animated.View>

            {/* Main lock */}
            <Animated.View style={{
                transform: [{ scale: lockScale }],
                opacity: lockOpacity,
            }}>
                <Lock size={60} color="#22c55e" />
            </Animated.View>
        </LoadingAnimationStep>
    );
};

// ════════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — ZERO KNOWLEDGE: Eye closing / blinding with data passing through
// ════════════════════════════════════════════════════════════════════════════════
const ZeroKnowledgeAnimation = () => {
    const anim = useLoopAnim(1, 3000, Easing.inOut(Easing.ease));

    // Eye opens then closes (server trying to see but failing)
    const eyeOpacity = anim.interpolate({
        inputRange: [0, 0.2, 0.4, 0.6, 1],
        outputRange: [1, 1, 0, 0, 1],
    });
    const eyeOffOpacity = anim.interpolate({
        inputRange: [0, 0.2, 0.4, 0.6, 1],
        outputRange: [0, 0, 1, 1, 0],
    });

    // Mail envelope flying through
    const mailTranslateX = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [-80, 0, 80],
    });
    const mailOpacity = anim.interpolate({
        inputRange: [0, 0.1, 0.5, 0.9, 1],
        outputRange: [0, 0.8, 1, 0.8, 0],
    });
    const mailScale = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.6, 1, 0.6],
    });

    // Strike-through line — use scaleX instead of width (native driver can't animate width)
    const strikeScaleX = anim.interpolate({
        inputRange: [0, 0.2, 0.4, 0.8, 1],
        outputRange: [0, 0, 1, 1, 0],
    });
    const strikeOpacity = anim.interpolate({
        inputRange: [0, 0.2, 0.4, 0.8, 1],
        outputRange: [0, 0, 1, 1, 0],
    });

    return (
        <LoadingAnimationStep>
            {/* Eye (open) */}
            <Animated.View style={{ position: 'absolute', opacity: eyeOpacity }}>
                <Eye size={70} color="#64748b" />
            </Animated.View>
            {/* Eye (closed/off) */}
            <Animated.View style={{ position: 'absolute', opacity: eyeOffOpacity }}>
                <EyeOff size={70} color="#ef4444" />
            </Animated.View>

            {/* Mail passing underneath */}
            <Animated.View style={{
                position: 'absolute',
                top: '65%',
                transform: [{ translateX: mailTranslateX }, { scale: mailScale }],
                opacity: mailOpacity,
            }}>
                <Mail size={28} color="#3b82f6" />
            </Animated.View>

            {/* Strike line — fixed width, animated via scaleX */}
            <Animated.View style={{
                position: 'absolute',
                height: 3, borderRadius: 2,
                backgroundColor: '#ef4444',
                width: 60,
                opacity: strikeOpacity,
                transform: [{ rotate: '-20deg' }, { scaleX: strikeScaleX }],
            }} />
        </LoadingAnimationStep>
    );
};

// ════════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — QR EXCHANGE: Two phones scanning QR
// ════════════════════════════════════════════════════════════════════════════════
const QRExchangeAnimation = () => {
    const anim = useLoopAnim(1, 3000, Easing.linear);

    // Phones slide in from sides
    const leftPhoneX = anim.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [-60, -40, -40, -60],
    });
    const rightPhoneX = anim.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [60, 40, 40, 60],
    });
    const phoneOpacity = anim.interpolate({
        inputRange: [0, 0.15, 0.85, 1],
        outputRange: [0.3, 1, 1, 0.3],
    });

    // QR code pulses in center
    const qrScale = anim.interpolate({
        inputRange: [0, 0.3, 0.5, 0.7, 1],
        outputRange: [0, 0.8, 1.1, 1, 0],
    });
    const qrOpacity = anim.interpolate({
        inputRange: [0, 0.25, 0.75, 1],
        outputRange: [0, 1, 1, 0],
    });

    // Connection beam
    const beamOpacity = anim.interpolate({
        inputRange: [0, 0.35, 0.5, 0.65, 1],
        outputRange: [0, 0, 0.7, 0, 0],
    });
    const beamScale = anim.interpolate({
        inputRange: [0, 0.35, 0.5, 0.65, 1],
        outputRange: [0.5, 0.5, 1, 1.3, 1.3],
    });

    return (
        <LoadingAnimationStep style={{ flexDirection: 'row' }}>
            {/* Left phone */}
            <Animated.View style={{
                transform: [{ translateX: leftPhoneX }],
                opacity: phoneOpacity,
            }}>
                <Smartphone size={48} color="#94a3b8" />
            </Animated.View>

            {/* QR code center */}
            <Animated.View style={{
                position: 'absolute',
                transform: [{ scale: qrScale }],
                opacity: qrOpacity,
            }}>
                <QrCode size={44} color="#3b82f6" />
            </Animated.View>

            {/* Connection burst */}
            <Animated.View style={{
                position: 'absolute',
                width: 80, height: 80, borderRadius: 40,
                borderWidth: 2, borderColor: '#3b82f6',
                opacity: beamOpacity,
                transform: [{ scale: beamScale }],
            }} />

            {/* Right phone */}
            <Animated.View style={{
                transform: [{ translateX: rightPhoneX }],
                opacity: phoneOpacity,
            }}>
                <Smartphone size={48} color="#94a3b8" />
            </Animated.View>
        </LoadingAnimationStep>
    );
};

// ════════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — LOCAL VAULT: Database with download/backup
// ════════════════════════════════════════════════════════════════════════════════
const LocalVaultAnimation = () => {
    const anim = useLoopAnim(1, 3500, Easing.inOut(Easing.ease));

    // Database scale pulse
    const dbScale = anim.interpolate({
        inputRange: [0, 0.3, 0.5, 0.7, 1],
        outputRange: [1, 1, 1.08, 1, 1],
    });

    // Lock icon fading in/out on top
    const lockOpacity = anim.interpolate({
        inputRange: [0, 0.2, 0.5, 0.8, 1],
        outputRange: [0.4, 1, 1, 1, 0.4],
    });
    const lockY = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [5, -5, 5],
    });

    // Download arrow descending
    const downloadY = anim.interpolate({
        inputRange: [0, 0.4, 0.6, 0.8, 1],
        outputRange: [-30, -30, 10, 10, -30],
    });
    const downloadOpacity = anim.interpolate({
        inputRange: [0, 0.4, 0.5, 0.7, 0.8, 1],
        outputRange: [0, 0, 0.8, 0.8, 0, 0],
    });

    // .hnet label flash
    const labelOpacity = anim.interpolate({
        inputRange: [0, 0.6, 0.75, 0.9, 1],
        outputRange: [0, 0, 1, 1, 0],
    });
    const labelScale = anim.interpolate({
        inputRange: [0, 0.6, 0.75, 0.9, 1],
        outputRange: [0.5, 0.5, 1, 1, 0.5],
    });

    return (
        <LoadingAnimationStep>
            {/* Main database icon */}
            <Animated.View style={{
                transform: [{ scale: dbScale }],
            }}>
                <Database size={64} color="#3b82f6" />
            </Animated.View>

            {/* Lock floating on top */}
            <Animated.View style={{
                position: 'absolute',
                top: 25,
                opacity: lockOpacity,
                transform: [{ translateY: lockY }],
            }}>
                <Lock size={22} color="#22c55e" />
            </Animated.View>

            {/* Download arrow on the side */}
            <Animated.View style={{
                position: 'absolute',
                right: '22%',
                opacity: downloadOpacity,
                transform: [{ translateY: downloadY }],
            }}>
                <Download size={26} color="#60a5fa" />
            </Animated.View>

            {/* .hnet label */}
            <Animated.View style={{
                position: 'absolute',
                bottom: 20,
                opacity: labelOpacity,
                transform: [{ scale: labelScale }],
            }}>
                <View style={animLocal.hnetBadge}>
                    <Text style={animLocal.hnetText}>.hnet</Text>
                </View>
            </Animated.View>
        </LoadingAnimationStep>
    );
};

// ── Local animation styles ───────────────────────────────────────────────────
const animLocal = StyleSheet.create({
    hnetBadge: {
        backgroundColor: 'rgba(59,130,246,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(59,130,246,0.5)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    hnetText: {
        color: '#60a5fa',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

// ── Animation map ────────────────────────────────────────────────────────────
const ANIMATIONS = [
    IdentityAnimation,
    EncryptionAnimation,
    ZeroKnowledgeAnimation,
    QRExchangeAnimation,
    LocalVaultAnimation,
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
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
        // Progress bar — slightly longer for 5 slides
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

        // Auto-advance slides
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
        }, 3500);

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

    const renderSlide = useCallback(({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
        const AnimComponent = ANIMATIONS[index];
        return (
            <View style={{ width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
                <View style={styles.card}>
                    <View style={{ width: '100%', alignItems: 'center' }}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.description}>{item.description}</Text>
                    </View>
                    <View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <AnimComponent />
                    </View>
                </View>
            </View>
        );
    }, []);

    return (
        <View style={[styles.container, { paddingTop: isShort ? 40 : 90 }]}>
            <Animated.View style={{ flex: 1, width: '100%', alignItems: 'center', transform: [{ translateY: contentTranslateY }] }}>
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
