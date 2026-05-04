import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { databaseService } from '../services/DatabaseService';
import { authFlowService } from '../services/AuthFlowService';
import { configureUnauthorizedHandler } from '../services/ApiClient';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { BG_PRIMARY, ACCENT_PRIMARY, DANGER_TEXT, TEXT_PRIMARY, TEXT_SECONDARY } from '../styles/theme';

type DbStatus = 'loading' | 'ready' | 'error';

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [dbStatus, setDbStatus] = useState<DbStatus>('loading');
  const [dbError, setDbError] = useState<string>('');
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    hydrate();

    configureUnauthorizedHandler(async () => {
      try {
        const result = await authFlowService.bootstrapLogin();
        await useAuthStore.getState().login(result.identity, result.jwtToken);
      } catch {
        await useAuthStore.getState().logout();
      }
    });
  }, []);

  // initDB en su propio efecto para poder reintentar manualmente desde el UI de error.
  useEffect(() => {
    let cancelled = false;
    setDbStatus('loading');
    setDbError('');
    databaseService.initDB()
      .then(() => { if (!cancelled) setDbStatus('ready'); })
      .catch((err) => {
        if (cancelled) return;
        setDbError(err?.message ?? 'Error desconocido al abrir la base de datos');
        setDbStatus('error');
      });
    return () => { cancelled = true; };
  }, [retryNonce]);

  if (dbStatus === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: BG_PRIMARY, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={ACCENT_PRIMARY} />
        <StatusBar style="light" />
      </View>
    );
  }

  if (dbStatus === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: BG_PRIMARY, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <Text style={{ color: DANGER_TEXT, fontSize: 18, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>
          No se pudo iniciar el almacenamiento local
        </Text>
        <Text style={{ color: TEXT_SECONDARY, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
          La base de datos cifrada del dispositivo no se ha podido abrir. Sin ella la app no puede guardar mensajes ni contactos.
        </Text>
        <Text style={{ color: TEXT_PRIMARY, fontSize: 11, fontFamily: 'monospace', opacity: 0.6, marginBottom: 24, textAlign: 'center' }}>
          {dbError}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setRetryNonce(n => n + 1)}
          style={{ backgroundColor: ACCENT_PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>Reintentar</Text>
        </TouchableOpacity>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <ThemedApp />
      </AccessibilityProvider>
    </ThemeProvider>
  );
}

function ThemedApp() {
  const { colors } = useTheme();
  return (
    <>
      <Slot />
      <StatusBar style={colors.statusBarStyle === 'light' ? 'light' : 'dark'} />
    </>
  );
}
