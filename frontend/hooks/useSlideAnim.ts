import { useRef, useCallback, useMemo } from 'react';
import { Animated, Easing } from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';

/**
 * Transición "vault reveal": la pantalla emerge con escala + ligero levantamiento +
 * fade, pensada para 120 Hz. El nombre se mantiene por compatibilidad con los
 * callsites históricos (`useSlideAnim`), aunque ya no es un slide horizontal.
 *
 * Devuelve `style` compuesto (transform + opacity) para spreadear en un
 * Animated.View, y `progress` (0→1) por si quieres sincronizar otra animación.
 */
export function useSlideAnim(durationOpen = 240) {
    const progress = useRef(new Animated.Value(0)).current;
    const { prefs } = useAccessibility();

    const open = useCallback(() => {
        if (prefs.reduceMotion) {
            progress.setValue(1);
            return;
        }
        Animated.timing(progress, {
            toValue: 1,
            duration: durationOpen,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
            useNativeDriver: true,
        }).start();
    }, [progress, durationOpen, prefs.reduceMotion]);

    const close = useCallback((onDone?: () => void) => {
        if (prefs.reduceMotion) {
            progress.setValue(0);
            onDone?.();
            return;
        }
        Animated.timing(progress, {
            toValue: 0,
            duration: Math.round(durationOpen * 0.85),
            easing: Easing.bezier(0.55, 0, 0.6, 1),
            useNativeDriver: true,
        }).start(onDone ? ({ finished }) => { if (finished) onDone(); } : undefined);
    }, [progress, durationOpen, prefs.reduceMotion]);

    const style = useMemo(() => ({
        opacity: progress,
        transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
        ],
    }), [progress]);

    return { progress, style, open, close };
}
