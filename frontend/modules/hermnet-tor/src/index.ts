import { requireNativeModule } from 'expo-modules-core';

/**
 * API JS que envuelve el módulo nativo HermnetTor (Tor empotrado).
 *
 * El módulo nativo arranca un cliente Tor dentro del propio proceso de la app
 * (Tor.framework en iOS, tor-android-binary en Android), expone un puerto SOCKS5
 * local y un método `request` que enruta peticiones HTTP a través de Tor.
 *
 * Estados de bootstrap:
 *  - 0..99   → conectando a la red Tor (descargando consensus, construyendo circuitos).
 *  - 100     → listo para enrutar tráfico.
 *
 * Las requests se hacen contra URLs `.onion` o clearnet; en ambos casos pasan
 * por la red Tor.
 */
export interface TorHttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface TorHttpRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

interface HermnetTorModule {
  /** Arranca Tor en background. Idempotente. */
  start(): void;
  /** Para Tor (libera el thread). */
  stop(): void;
  /** ¿Está Tor con bootstrap al 100%? */
  isReady(): Promise<boolean>;
  /** Progreso 0-100 del bootstrap. */
  bootstrapProgress(): Promise<number>;
  /** Puerto SOCKS5 local que expone Tor. */
  getSocksPort(): number;
  /** Envía una request HTTP a través de Tor y devuelve la respuesta. */
  request(req: TorHttpRequest): Promise<TorHttpResponse>;
}

let cached: HermnetTorModule | null = null;

/**
 * Devuelve el módulo nativo si está disponible (build con Tor compilado), o `null`
 * si la app se está ejecutando sin él (por ejemplo en Expo Go o en builds antiguos).
 * Los callers deben comprobar nullability antes de usarlo.
 */
export function getHermnetTor(): HermnetTorModule | null {
  if (cached) return cached;
  try {
    cached = requireNativeModule<HermnetTorModule>('HermnetTor');
    return cached;
  } catch {
    return null;
  }
}
