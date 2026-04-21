import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export type NetworkStatus = 'online' | 'offline' | 'checking';

export function useNetworkStatus(): NetworkStatus {
    const [status, setStatus] = useState<NetworkStatus>('checking');

    useEffect(() => {
        NetInfo.fetch().then(state => {
            setStatus(state.isConnected && state.isInternetReachable !== false ? 'online' : 'offline');
        });

        const unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected && state.isInternetReachable !== false) {
                setStatus('online');
            } else {
                setStatus('offline');
            }
        });

        return unsubscribe;
    }, []);

    return status;
}
