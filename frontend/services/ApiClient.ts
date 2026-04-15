import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

/**
 * Lightweight HTTP client for backend communication.
 * Supports async request interceptors to inject JWT tokens.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly requestInterceptors: RequestInterceptor[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  async request<T>(config: RequestConfig): Promise<T> {
    const finalConfig = await this.applyInterceptors(config);
    const response = await this.fetchRaw(finalConfig);

    if (response.status === 401 && unauthorizedHandler) {
      await unauthorizedHandler();
      const retryConfig = await this.applyInterceptors(config);
      const retryResponse = await this.fetchRaw(retryConfig);
      return this.parseResponse<T>(retryResponse);
    }

    return this.parseResponse<T>(response);
  }

  private async applyInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let result = config;
    for (const interceptor of this.requestInterceptors) {
      result = await interceptor(result);
    }
    return result;
  }

  private fetchRaw(config: RequestConfig): Promise<Response> {
    return fetch(`${this.baseUrl}${config.path}`, {
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

  return `http://localhost:${BACKEND_PORT}`;
}

const apiBaseUrl = resolveApiBaseUrl();

if (__DEV__) {
  console.log(`[ApiClient] Using backend URL: ${apiBaseUrl}`);
}

export const apiClient = new ApiClient(apiBaseUrl);

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
