import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getHermnetTor } from '../modules/hermnet-tor/src';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  path: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
}

export type RequestInterceptor = (
  config: RequestConfig
) => Promise<RequestConfig> | RequestConfig;

interface UnifiedResponse {
  status: number;
  headers: Record<string, string>;
  getText: () => Promise<string>;
}

/**
 * Lightweight HTTP client for backend communication.
 *
 * Soporta dos URLs base simultáneas:
 *  - `clearnetUrl`: backend tradicional (solo se usa si el modo Tor está OFF).
 *  - `onionUrl`: hidden service .onion (modo por defecto, ANÓNIMO).
 *
 * El switch lo controla `setTorEnabled(boolean)` que llaman tanto el bootstrap
 * como el toggle de Ajustes → Privacidad. Cuando el modo Tor está activo,
 * todas las requests salen contra el .onion. Para que esa request *realmente*
 * llegue por la red Tor (y no falle por DNS) hace falta que el dispositivo
 * tenga un cliente Tor escuchando en localhost — bien empotrado en la app vía
 * un módulo nativo (Tor.framework iOS / tor-android-binary), bien activado por
 * el usuario (Orbot en Android, proxy SOCKS5 en Wi-Fi en iOS).
 *
 * Soporta interceptores async para inyectar tokens JWT.
 */
export class ApiClient {
  private clearnetUrl: string;
  private onionUrl: string;
  private torEnabled: boolean;
  private readonly requestInterceptors: RequestInterceptor[] = [];
  /**
   * Guard para evitar recursión cuando una request hecha DENTRO del
   * `unauthorizedHandler` (refresh / challenge / login) recibe ella misma
   * 401/403 y volvería a disparar re-autenticación → bucle infinito.
   */
  private isReauthInProgress = false;

  constructor(clearnetUrl: string, onionUrl?: string) {
    this.clearnetUrl = clearnetUrl.replace(/\/$/, '');
    this.onionUrl = (onionUrl ?? '').replace(/\/$/, '');
    // Por defecto Tor activo si tenemos onion configurada. La preferencia del
    // usuario lo puede sobrescribir vía setTorEnabled.
    this.torEnabled = !!this.onionUrl;
  }

  setTorEnabled(enabled: boolean): void {
    this.torEnabled = enabled && !!this.onionUrl;
    if (__DEV__) {
      console.log(`[ApiClient] Tor mode ${this.torEnabled ? 'ON' : 'OFF'} → using ${this.currentBaseUrl()}`);
    }
  }

  isTorEnabled(): boolean {
    return this.torEnabled;
  }

  hasOnionConfigured(): boolean {
    return !!this.onionUrl;
  }

  private currentBaseUrl(): string {
    return this.torEnabled && this.onionUrl ? this.onionUrl : this.clearnetUrl;
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  async request<T>(config: RequestConfig): Promise<T> {
    const finalConfig = await this.applyInterceptors(config);
    const response = await this.dispatch(finalConfig);

    // Spring Security por defecto devuelve 403 (no 401) cuando llega una
    // request a un endpoint `authenticated()` sin SecurityContext válido —
    // por ejemplo cuando el JWT expiró y el filtro lo descartó silenciosamente.
    // Tratamos ambos códigos como "necesita re-autenticación", pero solo si
    // NO estamos ya dentro de una re-auth (evita bucles infinitos cuando la
    // propia request interna de refresh/login también devuelve 401/403).
    const needsReauth = (response.status === 401 || response.status === 403);
    if (needsReauth && unauthorizedHandler && !this.isReauthInProgress) {
      this.isReauthInProgress = true;
      try {
        await unauthorizedHandler();
        const retryConfig = await this.applyInterceptors(config);
        const retryResponse = await this.dispatch(retryConfig);
        return this.parseUnifiedResponse<T>(retryResponse);
      } finally {
        this.isReauthInProgress = false;
      }
    }

    return this.parseUnifiedResponse<T>(response);
  }

  /**
   * Disparador unificado: si Tor está activo y el módulo nativo disponible,
   * delega en `HermnetTor.request` (HTTP a través del proxy SOCKS5 local).
   * En cualquier otro caso, usa `fetch` estándar contra la URL clearnet.
   */
  private async dispatch(config: RequestConfig): Promise<UnifiedResponse> {
    if (this.torEnabled && this.onionUrl) {
      const tor = getHermnetTor();
      if (tor) {
        const finalHeaders = { 'Content-Type': 'application/json', ...(config.headers ?? {}) };
        const result = await tor.request({
          url: `${this.currentBaseUrl()}${config.path}`,
          method: config.method ?? 'GET',
          headers: finalHeaders,
          body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
        });
        // Solo logueamos respuestas no-OK para no spamear el polling.
        if (__DEV__ && (result.status < 200 || result.status >= 300) && result.status !== 304) {
          const authHeader = (finalHeaders as any).Authorization;
          console.log(`[ApiClient] ${config.method ?? 'GET'} ${config.path} → ${result.status} | auth=${authHeader ? 'Bearer …' : 'NONE'}`);
        }
        return {
          status: result.status,
          headers: result.headers,
          getText: async () => result.body,
        };
      }
    }
    const response = await this.fetchRaw(config);
    return {
      status: response.status,
      headers: {},
      getText: () => (response.status === 204 ? Promise.resolve('') : response.text()),
    };
  }

  private async parseUnifiedResponse<T>(response: UnifiedResponse): Promise<T> {
    const responseText = await response.getText();

    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    if (response.status < 200 || response.status >= 300) {
      throw new Error(responseText || `HTTP ${response.status}`);
    }
    if (!responseText) {
      return undefined as T;
    }
    return JSON.parse(responseText) as T;
  }

  private async applyInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let result = config;
    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  private fetchRaw(config: RequestConfig): Promise<Response> {
    return fetch(`${this.currentBaseUrl()}${config.path}`, {
      method: config.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers ?? {}),
      },
      body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
    });
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const responseText = response.status === 204 ? '' : await response.text();

    if (response.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    if (!response.ok) {
      throw new Error(responseText || `HTTP ${response.status}`);
    }

    if (!responseText) {
      return undefined as T;
    }

    return JSON.parse(responseText) as T;
  }
}

const BACKEND_PORT = 8080;

function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicit) {
    return explicit;
  }

  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | null)?.debuggerHost ??
    ((Constants.manifest2 as { extra?: { expoGo?: { debuggerHost?: string } } } | null)?.extra?.expoGo
      ?.debuggerHost);

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:${BACKEND_PORT}`;
    }
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  // En iOS simulador localhost funciona, pero en dispositivo físico necesitamos
  // la IP real de la máquina de desarrollo.
  const devMachineIp = process.env.EXPO_PUBLIC_DEV_MACHINE_IP;
  if (devMachineIp) {
    return `http://${devMachineIp}:${BACKEND_PORT}`;
  }

  return `http://localhost:${BACKEND_PORT}`;
}

const apiBaseUrl = resolveApiBaseUrl();
const onionApiUrl = process.env.EXPO_PUBLIC_TOR_API_URL ?? '';

/**
 * Indica si la app tiene un cliente Tor empotrado capaz de enrutar requests
 * al hidden service. Se determina en runtime detectando si el módulo nativo
 * `HermnetTor` está disponible (existe el binario y se autolinkó al build).
 *
 * En iOS el routing va directo al servidor (clearnet) — Tor solo se usa en
 * Android. Si la app se ejecuta en Expo Go o un build viejo sin el módulo,
 * vale `false` y la app cae a clearnet automáticamente para no romperse.
 */
export const TOR_NATIVE_AVAILABLE = Platform.OS !== 'ios' && getHermnetTor() !== null;

if (__DEV__) {
  console.log(`[ApiClient] clearnet URL: ${apiBaseUrl}`);
  console.log(`[ApiClient] onion URL: ${onionApiUrl || '(not configured)'}`);
  console.log(`[ApiClient] Tor native module available: ${TOR_NATIVE_AVAILABLE}`);
}

export const apiClient = new ApiClient(apiBaseUrl, onionApiUrl);
// Estado inicial: si no hay módulo Tor empotrado, fuerzo OFF aunque la pref
// diga lo contrario. Cuando arranque el bootstrap (auth/_layout) leerá la
// pref y la combinará con TOR_NATIVE_AVAILABLE para decidir.
apiClient.setTorEnabled(false);

let hasConfiguredJwtInterceptor = false;

export const configureJwtInterceptor = (
  tokenProvider: () => Promise<string | null>
): void => {
  if (hasConfiguredJwtInterceptor) {
    return;
  }

  apiClient.addRequestInterceptor(async (config) => {
    const jwt = await tokenProvider();
    if (!jwt) {
      return config;
    }

    return {
      ...config,
      headers: {
        ...(config.headers ?? {}),
        Authorization: `Bearer ${jwt}`,
      },
    };
  });

  hasConfiguredJwtInterceptor = true;
};

type UnauthorizedHandler = () => Promise<void>;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const configureUnauthorizedHandler = (handler: UnauthorizedHandler): void => {
  unauthorizedHandler = handler;
};
