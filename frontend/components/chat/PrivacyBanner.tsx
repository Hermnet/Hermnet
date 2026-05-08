import React, { useCallback, useRef } from 'react';
import { Text, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { Lock, X } from 'lucide-react-native';
import { ThemeColors } from '../../styles/theme';

interface Props {
    colors: ThemeColors;
    onDismiss: () => void;
}

export default function PrivacyBanner({ colors, onDismiss }: Props) {
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const animateOut = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: -60, duration: 220, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished) onDismiss(); });
    }, [translateY, opacity, onDismiss]);

    const pan = useRef(PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy < -8 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => { if (g.dy < 0) translateY.setValue(g.dy); },
        onPanResponderRelease: (_, g) => {
            if (g.dy < -40) {
                animateOut();
            } else {
                Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
            }
        },
    })).current;

    return (
        <Animated.View
            {...pan.panHandlers}
            style={{
                alignSelf: 'stretch',
                backgroundColor: colors.bgSurface,
                borderColor: colors.borderFaint,
                borderWidth: 1,
                borderRadius: 14,
                paddingLeft: 14,
                paddingRight: 10,
                paddingVertical: 11,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                transform: [{ translateY }],
                opacity,
            }}
            accessibilityLabel="Aviso de privacidad. Desliza arriba o pulsa la cruz para cerrarlo."
        >
            <Lock size={14} color={colors.accentLight} style={{ marginTop: 2 }} />
            <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 17, flex: 1 }}>
                Tus mensajes solo viven en este dispositivo y en el de tu contacto.
                Hermnet no los almacena. Si borras la conversación no podrá recuperarse.
            </Text>
            <TouchableOpacity onPress={animateOut} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Cerrar aviso">
                <X size={16} color={colors.textHint} />
            </TouchableOpacity>
        </Animated.View>
    );
}
