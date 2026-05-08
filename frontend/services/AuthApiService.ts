import { apiClient } from './ApiClient';

export interface RegisterRequestDto {
  id: string;
  publicKey: string;
  /**
   * OPCIONAL Y OPT-IN. El push token es PII (Google/Apple lo asocian al
   * dispositivo), así que solo debe enviarse si el usuario activó push
   * notifications explícitamente en `prefsService.notifications.pushEnabled`.
   * Por defecto se omite para que el backend no almacene nada que ate la
   * identidad a un dispositivo concreto.
   */
  pushToken?: string | null;
}

export interface RegisterResponseDto {
  id: string;
  publicKey: string;
  createdAt: string;
}

export interface ChallengeRequestDto {
  userId: string;
}

export interface ChallengeResponseDto {
  nonce: string;
}

export interface LoginRequestDto {
  nonce: string;
  signedNonce: string;
}

export interface LoginResponseDto {
  token: string;
}

/**
 * Backend authentication API adapter.
 */
export class AuthApiService {
  async register(payload: RegisterRequestDto): Promise<RegisterResponseDto> {
    return apiClient.request<RegisterResponseDto>({
      path: '/api/auth/register',
      method: 'POST',
      body: payload,
    });
  }

  async challenge(payload: ChallengeRequestDto): Promise<ChallengeResponseDto> {
    return apiClient.request<ChallengeResponseDto>({
      path: '/api/auth/challenge',
      method: 'POST',
      body: payload,
    });
  }

  async login(payload: LoginRequestDto): Promise<LoginResponseDto> {
    return apiClient.request<LoginResponseDto>({
      path: '/api/auth/login',
      method: 'POST',
      body: payload,
    });
  }

  async refresh(): Promise<LoginResponseDto> {
    return apiClient.request<LoginResponseDto>({
      path: '/api/auth/refresh',
      method: 'POST',
    });
  }

  async logout(): Promise<void> {
    await apiClient.request<void>({
      path: '/api/auth/logout',
      method: 'POST',
    });
  }
}

export const authApiService = new AuthApiService();
