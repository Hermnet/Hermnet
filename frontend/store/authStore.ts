import { create } from 'zustand';
import { authSessionService } from '../services/AuthSessionService';
import { Identity } from '../services/IdentityService';

interface AuthState {
  identity: Identity | null;
  jwt: string | null;
  isLoaded: boolean;

  hydrate: () => Promise<void>;
  login: (identity: Identity, jwt: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  identity: null,
  jwt: null,
  isLoaded: false,

  hydrate: async () => {
    const identity = await authSessionService.getIdentity();
    const jwt = await authSessionService.getJwtToken();
    set({ identity, jwt, isLoaded: true });
  },

  login: async (identity: Identity, jwt: string) => {
    await authSessionService.setIdentity(identity);
    await authSessionService.setJwtToken(jwt);
    set({ identity, jwt });
  },

  logout: async () => {
    await authSessionService.clearJwtToken();
    set({ identity: null, jwt: null });
  },
}));
