// mobile/store/authStore.ts
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants";
import { User } from "../types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  setUserAndToken: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;

  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,
  initialized: false,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  async setUserAndToken(user, token) {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await AsyncStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      JSON.stringify(user),
    );

    set({ user, token, initialized: true });
  },

  async clearAuth() {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

    set({ user: null, token: null, initialized: true });
  },

  async loadFromStorage() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({ user, token, initialized: true });
        return;
      }

      set({ initialized: true });
    } catch {
      set({ initialized: true });
    }
  },
}));
