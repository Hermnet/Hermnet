import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Devuelve true cuando la app está en primer plano. Permite suspender polling y
 * timers cuando el usuario manda la app a background, ahorrando batería y red.
 */
export function useIsAppActive(): boolean {
    const [isActive, setIsActive] = useState<boolean>(AppState.currentState === 'active');

    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            setIsActive(nextState === 'active');
        });
        return () => sub.remove();
    }, []);

    return isActive;
}
