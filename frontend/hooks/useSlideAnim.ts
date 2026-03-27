import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { SCREEN_WIDTH } from '../constants/layout';

/**
 * Manages a horizontal slide-in/out animation starting offscreen to the right.
 * Returns stable open/close callbacks and the Animated.Value for the overlay.
 */
export function useSlideAnim(duration = 350) {
    const anim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

    const open = useCallback(() => {
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }).start();
    }, [anim, duration]);

    const close = useCallback((onDone?: () => void) => {
        Animated.timing(anim, { toValue: SCREEN_WIDTH, duration, useNativeDriver: true }).start(
            onDone ? ({ finished }) => { if (finished) onDone(); } : undefined
        );
    }, [anim, duration]);

    return { anim, open, close };
}
