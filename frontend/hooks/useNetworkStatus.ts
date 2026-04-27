import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkStatus = 'online' | 'offline' | 'checking';

/**
 * Sólo nos importa si hay interfaz de red activa. `isInternetReachable` se ignora porque
 * depende de una sonda contra servidores de Google que falla en emuladores sin GMS o en
 * redes que bloquean dichos hosts, dando falsos negativos aunque el backend sea alcanzable.
 */
function deriveStatus(state: NetInfoState | null): NetworkStatus {
    if (!state) return 'checking';
    return state.isConnected ? 'online' : 'offline';
}

export function useNetworkStatus(): NetworkStatus {
    const [status, setStatus] = useState<NetworkStatus>('checking');

    useEffect(() => {
        let cancelled = false;

        NetInfo.fetch().then(state => {
            if (!cancelled) setStatus(deriveStatus(state));
        });

        const unsubscribe = NetInfo.addEventListener(state => {
            if (!cancelled) setStatus(deriveStatus(state));
        });

        // Salvavidas: si NetInfo no responde en 4s, asumimos online para no bloquear la UI.
        const timeoutId = setTimeout(() => {
            if (!cancelled) setStatus(prev => (prev === 'checking' ? 'online' : prev));
        }, 4000);

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
            unsubscribe();
        };
    }, []);

    return status;
}
