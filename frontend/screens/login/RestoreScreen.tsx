import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Animated, Easing, Vibration, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../../styles/seedStyles';

interface RestoreScreenProps {
    onComplete: (seedPhrase: string[]) => void;
    onCancel: () => void;
}

export default function RestoreScreen({ onComplete, onCancel }: RestoreScreenProps) {
    // Array para almacenar las 12 palabras ingresadas
    const [seedWords, setSeedWords] = useState<string[]>(Array(12).fill(''));
    const [error, setError] = useState(false);
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    const handleWordChange = (text: string, index: number) => {
        const newWords = [...seedWords];
        // Convertimos a minúsculas y quitamos espacios molestos al pegar/escribir
        newWords[index] = text.toLowerCase().trim();
        setSeedWords(newWords);
        setError(false);
    };

    const triggerErrorShake = () => {
        Vibration.vibrate(400);
        setError(true);
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    const handleRestoreSubmit = () => {
        // Validación básica: comprobar si hay slots vacíos
        const isEmpty = seedWords.some(word => word === '');

        if (isEmpty) {
            triggerErrorShake();
            return;
        }

        // Aquí pasaríamos las 12 palabras al engine de criptografía para que valide si es una frase BIP-39 válida.
        // Pero eso lo implementaremos en el futuro, por ahora disparamos el success.
        onComplete(seedWords);
    };

    // Estilo especial dinámico para detectar cuántas palabras lleva escritas
    const getFilledWordsCount = () => seedWords.filter(word => word.length > 0).length;
    const isReadyToSubmit = getFilledWordsCount() === 12;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingHorizontal: 0, paddingTop: 60 }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={{ width: '100%', paddingHorizontal: 25, flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity onPress={onCancel} style={{ padding: 10, marginLeft: -10 }}>
                    <Feather name="arrow-left" size={24} color="#94a3b8" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', marginRight: 24 }}>
                    <Text style={[styles.title, { marginBottom: 0, fontSize: 20 }]}>RESTAURAR BÓVEDA</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 25, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.subtitle, { marginBottom: 30 }]}>
                    Introduce tu Frase Semilla de Seguridad de 12 palabras en el orden correcto para recuperar tu identidad maestra y chats cifrados.
                </Text>

                <Animated.View style={[styles.restoreGrid, { transform: [{ translateX: shakeAnimation }] }]}>
                    {seedWords.map((word, index) => (
                        <View key={index} style={[styles.restoreInputContainer, error && word === '' && styles.restoreInputError]}>
                            <Text style={styles.restoreWordIndex}>{(index + 1).toString().padStart(2, '0')}</Text>
                            <TextInput
                                style={styles.restoreInput}
                                value={word}
                                onChangeText={(text) => handleWordChange(text, index)}
                                placeholder="Palabra..."
                                placeholderTextColor="#475569"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="off"
                                returnKeyType={index === 11 ? 'done' : 'next'}
                            />
                        </View>
                    ))}
                </Animated.View>
            </ScrollView>

            {/* Action Bottom Bar Fija */}
            <View style={[styles.actionRow, { position: 'absolute', bottom: 0, backgroundColor: '#0d111b', paddingHorizontal: 25, paddingTop: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: '#1e293b', gap: 10, marginBottom: 0 }]}>
                <TouchableOpacity
                    style={[styles.mainBtn, !isReadyToSubmit && styles.mainBtnDisabled, { height: 56, width: '100%' }]}
                    onPress={handleRestoreSubmit}
                    activeOpacity={isReadyToSubmit ? 0.8 : 1}
                >
                    <Text style={[styles.mainBtnText, !isReadyToSubmit && styles.mainBtnTextDisabled]}>
                        {!isReadyToSubmit ? `Faltan ${12 - getFilledWordsCount()} palabras` : 'Restaurar Identidad Criptográfica'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
