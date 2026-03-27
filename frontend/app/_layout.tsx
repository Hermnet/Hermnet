import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { databaseService } from '../services/DatabaseService';

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    databaseService.initDB().catch(() => {});
  }, []);

  return (
    <>
      <Slot />
      <StatusBar style="light" />
    </>
  );
}
