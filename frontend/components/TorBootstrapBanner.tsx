import React, { useEffect, useRef } from 'react';
import { Animated, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Banner inline (no overlay) que aparece arriba de la app mientras Tor
 * construye los circuitos. El padre decide cuándo montarlo. La animación de
 * fade-in es pura cosmética; el banner empuja el contenido hacia abajo.
 *
 * No mostramos porcentaje porque la API nativa no expone progreso granular
 * de forma fiable en todas las plataformas.
 */
export function TorBootstrapBanner() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [anim]);

    return (
        <Animated.View
            style={{
                paddingTop: insets.top + 6,
                paddingBottom: 6,
                paddingHorizontal: 14,
                backgroundColor: colors.accentButton,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                opacity: anim,
            }}
        >
            <ActivityIndicator size="small" color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                Conectando a la red Tor…
            </Text>
        </Animated.View>
    );
}
