import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { databaseService } from '../services/DatabaseService';
import { authFlowService } from '../services/AuthFlowService';
import { configureUnauthorizedHandler } from '../services/ApiClient';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    databaseService.initDB().catch(() => {});

    configureUnauthorizedHandler(async () => {
      try {
        const result = await authFlowService.bootstrapLogin();
        await useAuthStore.getState().login(result.identity, result.jwtToken);
      } catch {
        await useAuthStore.getState().logout();
      }
    });
  }, []);

  return (
    <AccessibilityProvider>
      <Slot />
      <StatusBar style="light" />
    </AccessibilityProvider>
  );
}
