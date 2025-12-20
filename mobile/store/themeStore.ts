import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants";
import { THEME_COLORS, ThemeMode } from "../constants/theme";

interface ThemeState {
  mode: ThemeMode;
  initialized: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "light",
  initialized: false,

  async setMode(mode) {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    set({ mode, initialized: true });
  },

  async toggleMode() {
    const next = get().mode === "light" ? "dark" : "light";
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, next);
    set({ mode: next, initialized: true });
  },

  async loadFromStorage() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
      if (stored === "light" || stored === "dark") {
        set({ mode: stored, initialized: true });
        return;
      }
      set({ initialized: true });
    } catch {
      set({ initialized: true });
    }
  },
}));

export const getThemeColors = (mode: ThemeMode) => THEME_COLORS[mode];
