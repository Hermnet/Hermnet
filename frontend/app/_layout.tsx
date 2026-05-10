import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { databaseService } from '../services/DatabaseService';
import { authFlowService } from '../services/AuthFlowService';
import { apiClient, configureUnauthorizedHandler, TOR_NATIVE_AVAILABLE } from '../services/ApiClient';
import { prefsService } from '../services/PrefsService';
import { getHermnetTor } from '../modules/hermnet-tor/src';
import { messageFlowService } from '../services/MessageFlowService';
import NetInfo from '@react-native-community/netinfo';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { ChatPrefsProvider } from '../contexts/ChatPrefsContext';
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
      } catch (err: any) {
        // Un 401/403 durante el arranque no debe mandar al usuario de vuelta
        // al PIN si ya tiene identidad local. La app puede seguir funcionando
        // offline y reintentará el bootstrap en la siguiente request.
        if (__DEV__) {
          console.warn('[Auth] reauth fallida, se mantiene la sesión local:', err?.message ?? err);
        }
      }
    });

    // Worker offline → online: cuando NetInfo detecta que volvemos a tener red,
    // drenamos la cola de mensajes pendientes que se acumularon offline. Es el
    // único disparador que necesita el modo offline; el resto de la app funciona
    // contra la BD local sin tocar red.
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        messageFlowService.flushQueue().catch(() => {});
      }
    });
    // También intentamos al arrancar por si la app se abrió con la cola llena.
    messageFlowService.flushQueue().catch(() => {});

    // Worker periódico de mensajes temporales: cada 30s borra los expirados.
    const purgeTimer = setInterval(() => {
      databaseService.purgeExpiredMessages().catch(() => {});
    }, 30_000);

    // Bootstrap de Tor en background con timeout. Solo en Android — en iOS el
    // tráfico va directo al servidor por clearnet. Si Tor no consigue construir
    // circuitos en 90s (red restringida, lib defectuosa, etc.), caemos a
    // clearnet para que la app no quede colgada y el usuario pueda funcionar.
    // Es el compromiso entre privacidad (Tor activo por defecto) y disponibilidad.
    (async () => {
      try {
        // iOS → clearnet directo, sin Tor
        if (Platform.OS === 'ios') {
          apiClient.setTorEnabled(false);
          return;
        }
        const prefs = await prefsService.getSecurityPrefs();
        const userWants = prefs.torEnabled !== false;
        const tor = getHermnetTor();
        if (!TOR_NATIVE_AVAILABLE || !tor || !userWants) {
          apiClient.setTorEnabled(false);
          return;
        }
        // Empezamos en modo Tor para que las requests no salgan por clearnet
        // mientras Tor arranca. Si fallan, la cola de mensajes las recoge.
        apiClient.setTorEnabled(true);
        try { tor.start(); } catch { /* idempotente */ }

        // Polling: cada 3s pedimos progreso. El primer arranque desde cache
        // vacía puede tardar 1-3 min en redes domésticas (descarga consensus
        // de ~5MB y construye circuitos). Si tras 180s seguimos sin bootstrap,
        // fallback a clearnet para que la app funcione.
        const startedAt = Date.now();
        let bootstrapped = false;
        let lastProgress = -1;
        while (Date.now() - startedAt < 180_000) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const progress = await tor.bootstrapProgress();
            if (__DEV__ && progress !== lastProgress) {
              console.log(`[Tor] bootstrap ${progress}% (${Math.round((Date.now() - startedAt) / 1000)}s)`);
              lastProgress = progress;
            }
            if (progress >= 100) {
              bootstrapped = true;
              if (__DEV__) console.log('[Tor] bootstrap completo, routing por .onion');
              break;
            }
          } catch { /* swallow, vuelve a intentar */ }
        }
        if (!bootstrapped) {
          console.warn(`[Tor] bootstrap excedió 180s (último progreso: ${lastProgress}%), fallback a clearnet`);
          apiClient.setTorEnabled(false);
        }
      } catch (err) {
        console.warn('[Tor] bootstrap fallido:', err);
        apiClient.setTorEnabled(false);
      }
    })();

    return () => {
      unsubscribe();
      clearInterval(purgeTimer);
    };
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

  // Tor arranca SIN bloquear la app. Mientras los circuitos se construyen el
  // usuario puede entrar, leer sus chats locales y escribir mensajes (que
  // quedan en cola). Un banner discreto en lo alto de la pantalla muestra el
  // progreso. Cuando Tor está listo, las peticiones de red pasan por él.

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
      <ChatPrefsProvider>
        <AccessibilityProvider>
          <ThemedApp />
        </AccessibilityProvider>
      </ChatPrefsProvider>
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
