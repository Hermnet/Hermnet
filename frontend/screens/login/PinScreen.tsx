import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Vibration } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../styles/pinStyles';

const PIN_LENGTH = 6;

interface PinScreenProps {
    onComplete: (pin: string) => void;
}

export default function PinScreen({ onComplete }: PinScreenProps) {
    const [pin, setPin] = useState<string>('');
    const [confirmPin, setConfirmPin] = useState<string>('');
    const [step, setStep] = useState<'create' | 'confirm'>('create');
    const [error, setError] = useState(false);

    const shakeAnimation = useRef(new Animated.Value(0)).current;

    // Al alcanzar 6 dígitos, evaluamos automáticamente
    useEffect(() => {
        if (step === 'create' && pin.length === PIN_LENGTH) {
            // Breve pausa para que se vea el último punto encenderse
            setTimeout(() => {
                setStep('confirm');
            }, 300);
        } else if (step === 'confirm' && confirmPin.length === PIN_LENGTH) {
            handleConfirm();
        }
    }, [pin, confirmPin, step]);

    const triggerShake = () => {
        Vibration.vibrate(400); // feedback háptico si es dispositivo físico
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    const handleConfirm = () => {
        if (pin === confirmPin) {
            // ¡Éxito!
            setTimeout(() => {
                onComplete(pin);
            }, 300);
        } else {
            // Error en la confirmación
            setError(true);
            triggerShake();
            setTimeout(() => {
                setConfirmPin('');
                setError(false);
            }, 800);
        }
    };

    const handlePress = (num: string) => {
        if (error) return; // bloquea input durante la sacudida

        if (step === 'create' && pin.length < PIN_LENGTH) {
            setPin(prev => prev + num);
        } else if (step === 'confirm' && confirmPin.length < PIN_LENGTH) {
            setConfirmPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (error) return;

        if (step === 'create') {
            setPin(prev => prev.slice(0, -1));
        } else {
            setConfirmPin(prev => prev.slice(0, -1));
        }
    };

    // Array estático del teclado para iterar limpiamente
    const KEYPAD = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'delete']
    ];

    const currentLength = step === 'create' ? pin.length : confirmPin.length;

    // Generar layout de puntos
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

            {/* Header / Titular */}
            <View style={styles.header}>
                <Text style={styles.title}>
                    {step === 'create' ? 'CREA TU PIN DE SEGURIDAD' : 'CONFIRMA TU PIN'}
                </Text>
                <Text style={styles.subtitle}>
                    {step === 'create'
                        ? 'Este PIN blindará tu clave local. Si lo olvidas, perderás tu identidad.'
                        : 'Introduce el PIN nuevamente para confirmar tu bóveda.'}
                </Text>
            </View>

            {/* Puntos de Indicación con Animación de Error */}
            <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnimation }] }]}>
                {renderDots()}
            </Animated.View>

            {/* Teclado Numérico Custom dentro de su Caja Aislada */}
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
