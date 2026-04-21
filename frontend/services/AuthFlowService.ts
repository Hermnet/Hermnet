import { authApiService } from './AuthApiService';
import { configureJwtInterceptor, configureUnauthorizedHandler } from './ApiClient';
import { authSessionService } from './AuthSessionService';
import { Identity, identityService } from './IdentityService';

export interface LoginFlowResult {
  identity: Identity;
  jwtToken: string;
  registeredInThisSession: boolean;
}

/**
 * Executes the frontend zero-knowledge login flow.
 */
export class AuthFlowService {
  constructor() {
    configureJwtInterceptor(() => authSessionService.getJwtToken());
    configureUnauthorizedHandler(async () => {
      try {
        await this.bootstrapLogin();
      } catch {
        // Re-auth fallida — el reintento del ApiClient fallará y propagará el error al caller
      }
    });
  }

  /**
   * Bootstraps auth for app startup:
   * 1) First use: register public identity
   * 2) If valid JWT exists, rotate it via refresh (avoids challenge round-trip)
   * 3) Otherwise: request challenge nonce, sign it, exchange for JWT
   */
  async bootstrapLogin(): Promise<LoginFlowResult> {
    let identity = await authSessionService.getIdentity();
    let registeredInThisSession = false;

    if (!identity) {
      identity = identityService.generateIdentity();
      await authApiService.register({
        id: identity.id,
        publicKey: identity.publicKey,
      });
      await authSessionService.setIdentity(identity);
      registeredInThisSession = true;
    }

    // Intentar rotar el JWT existente antes de recurrir al flujo challenge/sign/login
    const existingJwt = await authSessionService.getJwtToken();
    if (existingJwt && !registeredInThisSession) {
      try {
        const refreshed = await authApiService.refresh();
        await authSessionService.setJwtToken(refreshed.token);
        return { identity, jwtToken: refreshed.token, registeredInThisSession };
      } catch {
        // Token expirado o revocado — continuar con el flujo completo
      }
    }

    const challengeResponse = await authApiService.challenge({
      userId: identity.id,
    });

    const signedNonce = identityService.signNonce(identity.privateKey, challengeResponse.nonce);

    const loginResponse = await authApiService.login({
      nonce: challengeResponse.nonce,
      signedNonce,
    });

    await authSessionService.setJwtToken(loginResponse.token);

    return {
      identity,
      jwtToken: loginResponse.token,
      registeredInThisSession,
    };
  }

  /**
   * Revoca el JWT en el servidor y borra el token local.
   * El error del backend se ignora para garantizar que el logout local siempre ocurra.
   */
  async logout(): Promise<void> {
    try {
      await authApiService.logout();
    } catch {
      // El backend puede rechazarlo si ya expiró — el logout local sigue adelante
    }
    await authSessionService.clearJwtToken();
  }
}

export const authFlowService = new AuthFlowService();
