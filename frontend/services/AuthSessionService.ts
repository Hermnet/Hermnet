import * as SecureStore from 'expo-secure-store';
import { Identity } from './IdentityService';

const IDENTITY_ID_KEY = 'hermnet.identity.id';
const IDENTITY_PUBLIC_KEY = 'hermnet.identity.publicKey';
const IDENTITY_PRIVATE_KEY = 'hermnet.identity.privateKey';
const JWT_KEY = 'hermnet.jwt';
const PIN_HASH_KEY = 'hermnet.pin_hash';

/**
 * Stores identity and JWT state in secure local storage.
 */
export class AuthSessionService {
  async getIdentity(): Promise<Identity | null> {
    const [id, publicKey, privateKey] = await Promise.all([
      SecureStore.getItemAsync(IDENTITY_ID_KEY),
      SecureStore.getItemAsync(IDENTITY_PUBLIC_KEY),
      SecureStore.getItemAsync(IDENTITY_PRIVATE_KEY),
    ]);
    if (!id || !publicKey || !privateKey) {
      return null;
    }
    return { id, publicKey, privateKey };
  }

  async setIdentity(identity: Identity): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(IDENTITY_ID_KEY, identity.id),
      SecureStore.setItemAsync(IDENTITY_PUBLIC_KEY, identity.publicKey),
      SecureStore.setItemAsync(IDENTITY_PRIVATE_KEY, identity.privateKey),
    ]);
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

  async getPinHash(): Promise<string | null> {
    return SecureStore.getItemAsync(PIN_HASH_KEY);
  }

  async setPinHash(hash: string): Promise<void> {
    await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
  }

  async clearPinHash(): Promise<void> {
    await SecureStore.deleteItemAsync(PIN_HASH_KEY);
  }

  /** Borra toda la identidad local (para eliminar cuenta). */
  async clearAllIdentityData(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(IDENTITY_ID_KEY),
      SecureStore.deleteItemAsync(IDENTITY_PUBLIC_KEY),
      SecureStore.deleteItemAsync(IDENTITY_PRIVATE_KEY),
      SecureStore.deleteItemAsync(JWT_KEY),
      SecureStore.deleteItemAsync(PIN_HASH_KEY),
    ]);
  }
}

export const authSessionService = new AuthSessionService();
