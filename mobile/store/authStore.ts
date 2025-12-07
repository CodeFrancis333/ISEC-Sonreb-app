// mobile/store/authStore.ts
import { create } from "zustand";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  // actions
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
  loginSuccess: (payload: { user: AuthUser; token: string }) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  setLoading: (value) =>
    set(() => ({
      loading: value,
      error: null,
    })),

  setError: (message) =>
    set(() => ({
      error: message,
      loading: false,
    })),

  loginSuccess: ({ user, token }) =>
    set(() => ({
      user,
      token,
      loading: false,
      error: null,
    })),

  logout: () =>
    set(() => ({
      user: null,
      token: null,
      loading: false,
      error: null,
    })),
}));
