import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const BIOMETRIC_KEY = 'biometric_enabled';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  is2faEnabled: boolean;
  createdAt: string;
}

interface AuthStore {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  setAuth: (token: string, user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  biometricEnabled: false,

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadToken: async () => {
    try {
      const [token, biometric] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(BIOMETRIC_KEY),
      ]);
      set({
        token: token ?? null,
        isAuthenticated: !!token,
        biometricEnabled: biometric === 'true',
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setBiometricEnabled: async (enabled) => {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, String(enabled));
    set({ biometricEnabled: enabled });
  },
}));
