import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { SCREEN_WIDTH } from '../constants/layout';
import { useAccessibility } from '../contexts/AccessibilityContext';

export function useSlideAnim(duration = 350) {
    const anim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
    const { prefs } = useAccessibility();

    const open = useCallback(() => {
        if (prefs.reduceMotion) {
            anim.setValue(0);
        } else {
            Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }).start();
        }
    }, [anim, duration, prefs.reduceMotion]);

    const close = useCallback((onDone?: () => void) => {
        if (prefs.reduceMotion) {
            anim.setValue(SCREEN_WIDTH);
            onDone?.();
        } else {
            Animated.timing(anim, { toValue: SCREEN_WIDTH, duration, useNativeDriver: true }).start(
                onDone ? ({ finished }) => { if (finished) onDone(); } : undefined
            );
        }
    }, [anim, duration, prefs.reduceMotion]);

    return { anim, open, close };
}
