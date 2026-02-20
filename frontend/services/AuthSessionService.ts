import * as SecureStore from 'expo-secure-store';
import { Identity } from './IdentityService';

const IDENTITY_KEY = 'hermnet.identity';
const JWT_KEY = 'hermnet.jwt';

/**
 * Stores identity and JWT state in secure local storage.
 */
export class AuthSessionService {
  async getIdentity(): Promise<Identity | null> {
    const rawIdentity = await SecureStore.getItemAsync(IDENTITY_KEY);
    if (!rawIdentity) {
      return null;
    }

    return JSON.parse(rawIdentity) as Identity;
  }

  async setIdentity(identity: Identity): Promise<void> {
    await SecureStore.setItemAsync(IDENTITY_KEY, JSON.stringify(identity));
  }

  async getJwtToken(): Promise<string | null> {
    return SecureStore.getItemAsync(JWT_KEY);
  }

  async setJwtToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(JWT_KEY, token);
  }

  async clearJwtToken(): Promise<void> {
    await SecureStore.deleteItemAsync(JWT_KEY);
  }
}

export const authSessionService = new AuthSessionService();
