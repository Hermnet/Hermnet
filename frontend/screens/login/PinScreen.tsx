import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Vibration, ScrollView, Dimensions } from 'react-native';
import { Delete, ShieldCheck } from 'lucide-react-native';
import { createStyles } from '../../styles/pinStyles';
import { useTheme } from '../../contexts/ThemeContext';

const PIN_LENGTH = 6;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface PinScreenProps {
    mode?: 'setup' | 'login' | 'restore';
    onComplete: (pin: string) => void;
}

export default function PinScreen({ mode = 'setup', onComplete }: PinScreenProps) {
    const { colors } = useTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const [pin, setPin] = useState<string>('');
    const [confirmPin, setConfirmPin] = useState<string>('');
    const [step, setStep] = useState<'create' | 'confirm' | 'login' | 'restore'>(mode === 'setup' ? 'create' : (mode === 'restore' ? 'restore' : 'login'));
    const [error, setError] = useState(false);

    const shakeAnimation = useRef(new Animated.Value(0)).current;

    // ── Transition animation for create → confirm ──
    const transitionAnim = useRef(new Animated.Value(0)).current;
    const stepIndicatorAnim = useRef(new Animated.Value(1)).current; // 1 = step 1, 2 = step 2

    const headerTranslateX = transitionAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, -SCREEN_WIDTH * 0.3, 0],
    });
    const headerOpacity = transitionAnim.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [1, 0, 0, 1],
    });

    useEffect(() => {
        if (step === 'create' && pin.length === PIN_LENGTH) {
            setTimeout(() => {
                // Animate the transition from create to confirm
                Animated.parallel([
                    Animated.timing(transitionAnim, {
                        toValue: 1, duration: 450,
                        easing: Easing.bezier(0.4, 0, 0.2, 1),
                        useNativeDriver: true,
                    }),
                    Animated.timing(stepIndicatorAnim, {
                        toValue: 2, duration: 350,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: false,
                    }),
                ]).start(() => {
                    setStep('confirm');
                    transitionAnim.setValue(0);
                });
            }, 300);
        } else if (step === 'confirm' && confirmPin.length === PIN_LENGTH) {
            handleConfirm();
        } else if ((step === 'login' || step === 'restore') && pin.length === PIN_LENGTH) {
            setTimeout(() => {
                onComplete(pin);
                setPin('');
            }, 300);
        }
    }, [pin, confirmPin, step]);

    const triggerShake = () => {
        Vibration.vibrate(400);
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    const handleConfirm = () => {
        if (pin === confirmPin) {
            setTimeout(() => {
                onComplete(pin);
            }, 300);
        } else {
            setError(true);
            triggerShake();
            setTimeout(() => {
                setConfirmPin('');
                setError(false);
            }, 800);
        }
    };

    const handlePress = useCallback((num: string) => {
        if (error) return;
        if (step === 'create' || step === 'login' || step === 'restore') {
            setPin(prev => prev.length < PIN_LENGTH ? prev + num : prev);
        } else if (step === 'confirm') {
            setConfirmPin(prev => prev.length < PIN_LENGTH ? prev + num : prev);
        }
    }, [error, step]);

    const handleDelete = useCallback(() => {
        if (error) return;
        if (step === 'create' || step === 'login' || step === 'restore') {
            setPin(prev => prev.slice(0, -1));
        } else {
            setConfirmPin(prev => prev.slice(0, -1));
        }
    }, [error, step]);

    const KEYPAD = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'delete']
    ];

    const currentLength = (step === 'create' || step === 'login' || step === 'restore') ? pin.length : confirmPin.length;
    const isSetupFlow = mode === 'setup';

    const renderDots = () => {
        const dots = [];
        for (let i = 0; i < PIN_LENGTH; i++) {
            const isFilled = i < currentLength;
            dots.push(
                <View
                    key={i}
                    style={[
                        s.dot,
                        isFilled && s.dotFilled,
                        isFilled && step === 'confirm' && !error && { backgroundColor: colors.successMsg || '#22c55e' },
                        error && isFilled && s.dotError
                    ]}
                />
            );
        }
        return dots;
    };

    // Step indicator for setup flow (1/2 → 2/2)
    const stepIndicatorWidth = stepIndicatorAnim.interpolate({
        inputRange: [1, 2],
        outputRange: ['50%', '100%'],
    });

    return (
        <View style={s.container}>
            <ScrollView
                contentContainerStyle={s.scrollContent}
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Step progress indicator — only during setup */}
                {isSetupFlow && (
                    <View style={{
                        width: '60%', height: 3, borderRadius: 2,
                        backgroundColor: colors.borderFaint || 'rgba(255,255,255,0.1)',
                        alignSelf: 'center', marginBottom: 16, overflow: 'hidden',
                    }}>
                        <Animated.View style={{
                            height: '100%', borderRadius: 2,
                            backgroundColor: step === 'confirm' ? (colors.successMsg || '#22c55e') : colors.accentPrimary,
                            width: stepIndicatorWidth,
                        }} />
                    </View>
                )}

                <Animated.View style={[s.header, {
                    transform: [{ translateX: headerTranslateX }],
                    opacity: headerOpacity,
                }]}>
                    {/* Step badge for setup */}
                    {isSetupFlow && (
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 6,
                            alignSelf: 'center', marginBottom: 10,
                            backgroundColor: step === 'confirm'
                                ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                            paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
                        }}>
                            {step === 'confirm' && <ShieldCheck size={14} color={colors.successMsg || '#22c55e'} />}
                            <Text style={{
                                color: step === 'confirm'
                                    ? (colors.successMsg || '#22c55e') : colors.accentLight,
                                fontSize: 11, fontWeight: '700', letterSpacing: 0.5,
                            }}>
                                {step === 'confirm' ? 'PASO 2 DE 2' : 'PASO 1 DE 2'}
                            </Text>
                        </View>
                    )}

                    <Text style={s.title}>
                        {step === 'create' ? 'CREA TU PIN DE SEGURIDAD' : step === 'confirm' ? 'CONFIRMA TU PIN' : step === 'restore' ? 'CONTRASEÑA DE RESPALDO' : 'DESBLOQUEA TU BÓVEDA'}
                    </Text>
                    <Text style={s.subtitle}>
                        {step === 'create'
                            ? 'Este PIN blindará tu clave local. Si lo olvidas, perderás tu identidad.'
                            : step === 'confirm'
                                ? 'Vuelve a introducir el mismo PIN para asegurar tu bóveda.'
                                : step === 'restore'
                                    ? 'Introduce la contraseña con la que cifraste tu archivo de respaldo (.hnet).'
                                    : 'Introduce tu PIN de seguridad para acceder a tu identidad local.'}
                    </Text>
                </Animated.View>

                <Animated.View style={[s.dotsContainer, { transform: [{ translateX: shakeAnimation }] }]}>
                    {renderDots()}
                </Animated.View>

                <View style={s.padBox}>
                    <View style={s.padContainer}>
                        {KEYPAD.flat().map((key, idx) => {
                            if (key === '') {
                                return <View key={idx} style={s.keyEmpty} />;
                            }
                            if (key === 'delete') {
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={s.key}
                                        onPress={handleDelete}
                                        activeOpacity={0.6}
                                        accessibilityLabel="Borrar dígito"
                                    >
                                        <Delete size={26} color={colors.textMuted} />
                                    </TouchableOpacity>
                                );
                            }
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={s.key}
                                    onPress={() => handlePress(key)}
                                    activeOpacity={0.6}
                                    accessibilityLabel={`Dígito ${key}`}
                                >
                                    <Text style={s.keyText}>{key}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
