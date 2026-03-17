import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, []);

  return <Slot />;
}
