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

  setUserAndToken: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setLoading: (value: boolean) => void;
  setError: (msg: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  async setUserAndToken(user, token) {
    // Persist to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    await AsyncStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      JSON.stringify(user),
    );

    set({ user, token });
  },

  async clearAuth() {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    set({ user: null, token: null });
  },

  setLoading(value) {
    set({ loading: value });
  },

  setError(msg) {
    set({ error: msg });
  },
}));
