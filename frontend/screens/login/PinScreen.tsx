import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Vibration } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../styles/pinStyles';

const PIN_LENGTH = 6;

interface PinScreenProps {
    mode?: 'setup' | 'login';
    onComplete: (pin: string) => void;
}

export default function PinScreen({ mode = 'setup', onComplete }: PinScreenProps) {
    const [pin, setPin] = useState<string>('');
    const [confirmPin, setConfirmPin] = useState<string>('');
    const [step, setStep] = useState<'create' | 'confirm' | 'login'>(mode === 'setup' ? 'create' : 'login');
    const [error, setError] = useState(false);

    const shakeAnimation = useRef(new Animated.Value(0)).current;

    // Automatically evaluate when reaching 6 digits
    useEffect(() => {
        if (step === 'create' && pin.length === PIN_LENGTH) {
            // Brief pause to see the last dot light up
            setTimeout(() => {
                setStep('confirm');
            }, 300);
        } else if (step === 'confirm' && confirmPin.length === PIN_LENGTH) {
            handleConfirm();
        } else if (step === 'login' && pin.length === PIN_LENGTH) {
            // If login, resolve immediately (vault validation will be done by HomeScreen)
            setTimeout(() => {
                onComplete(pin);
                // Clear the pin in case validation fails and it returns here
                setPin('');
            }, 300);
        }
    }, [pin, confirmPin, step]);

    const triggerShake = () => {
        Vibration.vibrate(400); // Haptic feedback for physical device
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    const handleConfirm = () => {
        if (pin === confirmPin) {
            // Success!
            setTimeout(() => {
                onComplete(pin);
            }, 300);
        } else {
            // Confirmation error
            setError(true);
            triggerShake();
            setTimeout(() => {
                setConfirmPin('');
                setError(false);
            }, 800);
        }
    };

    const handlePress = (num: string) => {
        if (error) return; // Block input during shake

        if ((step === 'create' || step === 'login') && pin.length < PIN_LENGTH) {
            setPin(prev => prev + num);
        } else if (step === 'confirm' && confirmPin.length < PIN_LENGTH) {
            setConfirmPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (error) return;

        if (step === 'create' || step === 'login') {
            setPin(prev => prev.slice(0, -1));
        } else {
            setConfirmPin(prev => prev.slice(0, -1));
        }
    };

    // Static keypad array for clean iteration
    const KEYPAD = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'delete']
    ];

    const currentLength = (step === 'create' || step === 'login') ? pin.length : confirmPin.length;

    // Generate dots layout
    const renderDots = () => {
        const dots = [];
        for (let i = 0; i < PIN_LENGTH; i++) {
            const isFilled = i < currentLength;
            dots.push(
                <View
                    key={i}
                    style={[
                        styles.dot,
                        isFilled && styles.dotFilled,
                        error && isFilled && styles.dotError
                    ]}
                />
            );
        }
        return dots;
    };

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>
                    {step === 'create' ? 'CREA TU PIN DE SEGURIDAD' : step === 'confirm' ? 'CONFIRMA TU PIN' : 'DESBLOQUEA TU BÓVEDA'}
                </Text>
                <Text style={styles.subtitle}>
                    {step === 'create'
                        ? 'Este PIN blindará tu clave local. Si lo olvidas, perderás tu identidad.'
                        : step === 'confirm'
                            ? 'Introduce el PIN nuevamente para confirmar tu bóveda.'
                            : 'Introduce tu PIN de seguridad para acceder a tu identidad local.'}
                </Text>
            </View>

            {/* Indicator Dots with Error Animation */}
            <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnimation }] }]}>
                {renderDots()}
            </Animated.View>

            {/* Custom Numeric Keypad inside Isolated Box */}
            <View style={styles.padBox}>
                <View style={styles.padContainer}>
                    {KEYPAD.flat().map((key, idx) => {
                        if (key === '') {
                            return <View key={idx} style={styles.keyEmpty} />;
                        }

                        if (key === 'delete') {
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={styles.key}
                                    onPress={handleDelete}
                                    activeOpacity={0.6}
                                >
                                    <Feather name="delete" size={28} color="#a0aec0" />
                                </TouchableOpacity>
                            );
                        }

                        return (
                            <TouchableOpacity
                                key={idx}
                                style={styles.key}
                                onPress={() => handlePress(key)}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.keyText}>{key}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}
