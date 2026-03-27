import { create } from 'zustand';
import { authSessionService } from '../services/AuthSessionService';
import { Identity } from '../services/IdentityService';

interface AuthState {
  identity: Identity | null;
  jwt: string | null;
  isLoaded: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  login: (identity: Identity, jwt: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  identity: null,
  jwt: null,
  isLoaded: false,
  error: null,

  hydrate: async () => {
    try {
      const identity = await authSessionService.getIdentity();
      const jwt = await authSessionService.getJwtToken();
      set({ identity, jwt, isLoaded: true, error: null });
    } catch (e) {
      set({ isLoaded: true, error: (e as Error).message });
    }
  },

  login: async (identity: Identity, jwt: string) => {
    try {
      await authSessionService.setIdentity(identity);
      await authSessionService.setJwtToken(jwt);
      set({ identity, jwt, error: null });
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  logout: async () => {
    try {
      await authSessionService.clearJwtToken();
      set({ identity: null, jwt: null, error: null });
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },
}));
