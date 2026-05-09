import { useRef, useCallback, useMemo } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * Transición horizontal estilo iOS/WhatsApp: la pantalla entra deslizándose
 * desde la derecha. Más fluida y profesional que el vault reveal para
 * navegación entre pantallas.
 *
 * Devuelve `style` con translateX + sutil opacity, y `progress` (0→1).
 */
export function useHorizontalSlide(durationOpen = 280) {
    const progress = useRef(new Animated.Value(0)).current;
    const { prefs } = useAccessibility();

    const open = useCallback(() => {
        if (prefs.reduceMotion) {
            progress.setValue(1);
            return;
        }
        Animated.spring(progress, {
            toValue: 1,
            useNativeDriver: true,
            damping: 22,
            stiffness: 200,
            mass: 0.8,
        }).start();
    }, [progress, prefs.reduceMotion]);

    const close = useCallback((onDone?: () => void) => {
        if (prefs.reduceMotion) {
            progress.setValue(0);
            onDone?.();
            return;
        }
        Animated.timing(progress, {
            toValue: 0,
            duration: Math.round(durationOpen * 0.85),
            easing: Easing.bezier(0.32, 0.72, 0, 1),
            useNativeDriver: true,
        }).start(onDone ? ({ finished }) => { if (finished) onDone(); } : undefined);
    }, [progress, durationOpen, prefs.reduceMotion]);

    const style = useMemo(() => ({
        transform: [
            {
                translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCREEN_WIDTH, 0],
                }),
            },
        ],
        // Subtle shadow via slight opacity on enter
        opacity: progress.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0.6, 1, 1],
        }),
    }), [progress]);

    // Dimming style for the content underneath (0→0.45 darkness)
    const dimmingStyle = useMemo(() => ({
        opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.45],
        }),
    }), [progress]);

    return { progress, style, dimmingStyle, open, close };
}
