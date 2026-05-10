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
   * Promesa de bootstrap en curso. Si se llama a `bootstrapLogin` mientras otro
   * todavía corre, devolvemos esa misma promesa para que múltiples disparadores
   * (polling + flushQueue + unauthorizedHandler) compartan UN solo flujo de
   * autenticación. Antes ejecutábamos varios refresh/challenge en paralelo y el
   * primero blacklistaba el JWT del segundo en el backend → 403 perpetuo.
   */
  private inflightBootstrap: Promise<LoginFlowResult> | null = null;

  /**
   * Bootstraps auth for app startup:
   * 1) First use: register public identity
   * 2) If valid JWT exists, rotate it via refresh (avoids challenge round-trip)
   * 3) Otherwise: request challenge nonce, sign it, exchange for JWT
   */
  async bootstrapLogin(): Promise<LoginFlowResult> {
    if (this.inflightBootstrap) return this.inflightBootstrap;
    this.inflightBootstrap = this.runBootstrapLogin().finally(() => {
      this.inflightBootstrap = null;
    });
    return this.inflightBootstrap;
  }

  private async runBootstrapLogin(): Promise<LoginFlowResult> {
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
      } catch (err) {
        // Token expirado/revocado: continuar con challenge/login. Si el backend
        // perdió el usuario (BD reseteada), re-registramos la identidad local.
        if (isUserNotFound(err)) {
          await this.registerExistingIdentity(identity);
          registeredInThisSession = true;
        }
      }
    }

    let challengeResponse;
    try {
      challengeResponse = await authApiService.challenge({
        userId: identity.id,
      });
    } catch (err) {
      if (!isUserNotFound(err)) {
        throw err;
      }
      await this.registerExistingIdentity(identity);
      registeredInThisSession = true;
      challengeResponse = await authApiService.challenge({
        userId: identity.id,
      });
    }
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

  private async registerExistingIdentity(identity: Identity): Promise<void> {
    try {
      await authApiService.register({
        id: identity.id,
        publicKey: identity.publicKey,
      });
    } catch (err) {
      // Si otra request paralela la registró antes, podemos continuar con el
      // challenge. Cualquier otro fallo debe propagarse.
      if (!isDuplicateIdentity(err)) {
        throw err;
      }
    }
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

function errorMessage(err: unknown): string {
  return String((err as Error | undefined)?.message ?? err ?? '');
}

function isUserNotFound(err: unknown): boolean {
  return /usuario no encontrado/i.test(errorMessage(err));
}

function isDuplicateIdentity(err: unknown): boolean {
  return /id ya est[aá] en uso|already exists|duplicate/i.test(errorMessage(err));
}
