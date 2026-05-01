import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, Vibration } from 'react-native';
import { Delete } from 'lucide-react-native';
import { createStyles } from '../../styles/pinStyles';
import { useTheme } from '../../contexts/ThemeContext';

const PIN_LENGTH = 6;

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

    useEffect(() => {
        if (step === 'create' && pin.length === PIN_LENGTH) {
            setTimeout(() => {
                setStep('confirm');
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
                        error && isFilled && s.dotError
                    ]}
                />
            );
        }
        return dots;
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.title}>
                    {step === 'create' ? 'CREA TU PIN DE SEGURIDAD' : step === 'confirm' ? 'CONFIRMA TU PIN' : step === 'restore' ? 'CONTRASEÑA DE RESPALDO' : 'DESBLOQUEA TU BÓVEDA'}
                </Text>
                <Text style={s.subtitle}>
                    {step === 'create'
                        ? 'Este PIN blindará tu clave local. Si lo olvidas, perderás tu identidad.'
                        : step === 'confirm'
                            ? 'Introduce el PIN nuevamente para confirmar tu bóveda.'
                            : step === 'restore'
                                ? 'Introduce la contraseña con la que cifraste tu archivo de respaldo (.hnet).'
                                : 'Introduce tu PIN de seguridad para acceder a tu identidad local.'}
                </Text>
            </View>

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
        </View>
    );
}
