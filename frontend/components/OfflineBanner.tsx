import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloudOff } from 'lucide-react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Banner fino que aparece arriba del chat cuando el dispositivo está offline.
 * Anima un fade+translateY al entrar/salir para no ser invasivo.
 *
 * Cuando se muestra:
 *  - El usuario sabe que está sin conexión, lo cual explica por qué los mensajes
 *    salen con icono de reloj en lugar de check.
 *  - Los mensajes se siguen pudiendo escribir; la cola los entrega al recuperar red.
 */
export function OfflineBanner() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const status = useNetworkStatus();
    const offline = status === 'offline';

    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(anim, {
            toValue: offline ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [offline, anim]);

    if (!offline && (anim as any)._value === 0) return null;

    return (
        <Animated.View
            style={{
                paddingTop: insets.top + 6,
                paddingBottom: 6,
                paddingHorizontal: 14,
                backgroundColor: colors.warningMain,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                zIndex: 200,
                opacity: anim,
            }}
        >
            <CloudOff size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                Sin conexión · los mensajes se enviarán al recuperarse
            </Text>
        </Animated.View>
    );
}
