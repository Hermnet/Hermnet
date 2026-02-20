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

  /**
   * Registers a request interceptor.
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Executes an HTTP request and parses JSON response when available.
   */
  async request<T>(config: RequestConfig): Promise<T> {
    let finalConfig = config;

    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    const response = await fetch(`${this.baseUrl}${finalConfig.path}`, {
      method: finalConfig.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(finalConfig.headers ?? {}),
      },
      body: finalConfig.body !== undefined ? JSON.stringify(finalConfig.body) : undefined,
    });

    const responseText = response.status === 204 ? '' : await response.text();

    if (!response.ok) {
      throw new Error(responseText || `HTTP ${response.status}`);
    }

    if (!responseText) {
      return undefined as T;
    }

    return JSON.parse(responseText) as T;
  }
}

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export const apiClient = new ApiClient(apiBaseUrl);

let hasConfiguredJwtInterceptor = false;

/**
 * Configures a singleton interceptor that injects Authorization headers.
 */
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
