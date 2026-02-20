import { authApiService } from './AuthApiService';
import { configureJwtInterceptor } from './ApiClient';
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
  }

  /**
   * Bootstraps auth for app startup:
   * 1) First use: register public identity
   * 2) Request challenge nonce
   * 3) Sign nonce with local private key
   * 4) Exchange signed nonce for JWT token
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
}

export const authFlowService = new AuthFlowService();
