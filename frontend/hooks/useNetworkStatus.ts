import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export type NetworkStatus = 'online' | 'offline' | 'checking';

export function useNetworkStatus(): NetworkStatus {
    const [status, setStatus] = useState<NetworkStatus>('checking');

    useEffect(() => {
        NetInfo.fetch().then(state => {
            setStatus(state.isConnected === false ? 'offline' : 'online');
        });

        const unsubscribe = NetInfo.addEventListener(state => {
            setStatus(state.isConnected === false ? 'offline' : 'online');
        });

        return unsubscribe;
    }, []);

    return status;
}
