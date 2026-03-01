import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Vibration } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { styles } from '../../styles/seedStyles';

// Mock simple de diccionario BIP39 para generar 12 palabras orgánicas
const BIP39_MOCK = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident",
    "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
    "crystal", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad", "damage"
];

const generateRandomSeed = () => {
    return [...BIP39_MOCK].sort(() => 0.5 - Math.random()).slice(0, 12);
};

interface SeedScreenProps {
    onComplete: (seedPhrase: string[]) => void;
}

export default function SeedScreen({ onComplete }: SeedScreenProps) {
    const [step, setStep] = useState<'generate' | 'verify'>('generate');
    const [seedWords, setSeedWords] = useState<string[]>([]);

    // Estado y refs para el contador
    const [countdown, setCountdown] = useState(15);
    const [copied, setCopied] = useState(false);

    // Estado de la verificación (6 palabras random a comprobar)
    const [verifyIndices, setVerifyIndices] = useState<number[]>([]);
    const [filledWords, setFilledWords] = useState<(string | null)[]>(Array(6).fill(null));
    const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
    const [error, setError] = useState(false);

    const shakeAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Al montar generamos las palabras aleatoriamente como si fuera la Bóveda en RAM
        const words = generateRandomSeed();
        setSeedWords(words);

        // Elegir 6 índices aleatorios para preguntar en el paso de verificación
        const randomIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
            .sort(() => 0.5 - Math.random())
            .slice(0, 6)
            .sort((a, b) => a - b); // Ordenar para que pregunten en orden lógico (#3, #5, #10...)
        setVerifyIndices(randomIndices);

        // Barajar las 12 palabras para el grid de opciones
        setShuffledOptions([...words].sort(() => 0.5 - Math.random()));
    }, []);

    // Timer de seguridad
    useEffect(() => {
        if (step === 'generate' && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown, step]);

    const copyToClipboard = async () => {
        const textToCopy = seedWords.map((word, index) => `${index + 1}. ${word}`).join('\n');
        await Clipboard.setStringAsync(textToCopy);
        setCopied(true);
        Vibration.vibrate([0, 50, 50, 50]); // vibración sutil de éxito doble
        setTimeout(() => setCopied(false), 2000);
    };

    const handleContinueToVerify = () => {
        if (countdown > 0) return; // Bloquear si el tiempo no terminó
        setStep('verify');
    };

    const triggerErrorShake = () => {
        Vibration.vibrate(400); // Háptica pesada de error
        setError(true);
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();

        // Limpiar los slots tras 1 segundo para reintentar
        setTimeout(() => {
            setFilledWords(Array(6).fill(null));
            setError(false);
        }, 1000);
    };

    const handleOptionSelect = (word: string) => {
        if (error) return;

        // Encontrar el primer slot vacío
        const firstEmptyIndex = filledWords.findIndex(w => w === null);
        if (firstEmptyIndex !== -1) {
            const updatedFilling = [...filledWords];
            updatedFilling[firstEmptyIndex] = word;
            setFilledWords(updatedFilling);

            // Si fue el último slot (el sexto), verificamos automáticamente
            if (firstEmptyIndex === 5) {
                checkVerifications(updatedFilling);
            }
        }
    };

    const handleRemoveSlot = (index: number) => {
        if (error) return;
        const updatedFilling = [...filledWords];
        updatedFilling[index] = null;
        setFilledWords(updatedFilling);
    };

    const checkVerifications = (currentFilled: (string | null)[]) => {
        // Obtenemos las palabras reales correspondientes a esos 6 índices
        const correctAnswers = verifyIndices.map(idx => seedWords[idx]);

        let isCorrect = true;
        for (let i = 0; i < 6; i++) {
            if (currentFilled[i] !== correctAnswers[i]) {
                isCorrect = false;
                break;
            }
        }

        if (isCorrect) {
            // ¡Semilla confirmada! Avanzamos al proceso local del PIN.
            setTimeout(() => {
                onComplete(seedWords);
            }, 400);
        } else {
            triggerErrorShake();
        }
    };

    return (
        <View style={styles.container}>
            {step === 'generate' ? (
                <>
                    <View style={styles.header}>
                        <Text style={styles.title}>TU IDENTIDAD MAESTRA</Text>
                        <Text style={styles.subtitle}>
                            Anota estas 12 palabras en un papel físico.
                        </Text>
                    </View>

                    {/* Warning de Peligro Zero-Knowledge */}
                    <View style={styles.warningBox}>
                        <MaterialCommunityIcons name="alert-decagram" size={24} color="#fca5a5" style={styles.warningIcon} />
                        <Text style={styles.warningText}>
                            No podemos restaurar esta constraseña. Si pierdes este dispositivo y olvidas estas palabras, <Text style={{ fontWeight: 'bold' }}>tu cuenta morirá permanentemente.</Text>
                        </Text>
                    </View>

                    {/* Las 12 palabras generadas */}
                    <View style={styles.seedGrid}>
                        {seedWords.map((w, i) => (
                            <View key={i} style={styles.wordBox}>
                                <Text style={styles.wordIndex}>{(i + 1).toString().padStart(2, '0')}</Text>
                                <Text style={styles.wordText}>{w}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Acciones de Copiado y Continuar Temporizado */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard} activeOpacity={0.7}>
                            <Feather name={copied ? "check" : "copy"} size={22} color={copied ? "#4ade80" : "#94a3b8"} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.mainBtn, countdown > 0 && styles.mainBtnDisabled]}
                            onPress={handleContinueToVerify}
                            activeOpacity={countdown > 0 ? 1 : 0.8}
                        >
                            <Text style={[styles.mainBtnText, countdown > 0 && styles.mainBtnTextDisabled]}>
                                {countdown > 0 ? `Entendido (${countdown}s)` : 'He guardado las claves'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <>
                    <View style={styles.header}>
                        <Text style={styles.title}>VERIFICA TU SEMILLA</Text>
                        <Text style={styles.subtitle}>
                            Demuestra que tienes tu llave segura. Toca las palabras en el orden correcto solicitado.
                        </Text>
                    </View>

                    {/* Cajas a rellenar con Shake si hay error */}
                    <Animated.View style={[styles.verifySlotsContainer, { transform: [{ translateX: shakeAnimation }] }]}>
                        {verifyIndices.map((realSeedIndex, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.verifySlot,
                                    filledWords[i] && styles.verifySlotFilled,
                                    error && styles.verifySlotError
                                ]}
                                onPress={() => handleRemoveSlot(i)}
                                activeOpacity={0.6}
                            >
                                <Text style={styles.verifySlotNumber}>#{realSeedIndex + 1}</Text>
                                {filledWords[i] && <Text style={styles.verifySlotText}>{filledWords[i]}</Text>}
                            </TouchableOpacity>
                        ))}
                    </Animated.View>

                    {/* Opciones barajadas (Ocultar las que ya están elegidas) */}
                    <View style={styles.verifyOptionsGrid}>
                        {shuffledOptions.map((word, i) => {
                            const isUsed = filledWords.includes(word);
                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.optionBtn, isUsed && styles.optionBtnHidden]}
                                    disabled={isUsed || error}
                                    onPress={() => handleOptionSelect(word)}
                                    activeOpacity={0.6}
                                >
                                    <Text style={styles.optionBtnText}>{word}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </>
            )}
        </View>
    );
}
