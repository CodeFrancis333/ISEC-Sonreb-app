// mobile/hooks/useAuth.ts
import { useCallback } from "react";
import { useAuthStore, AuthUser } from "../store/authStore";

export default function useAuth() {
  const {
    user,
    token,
    loading,
    error,
    setLoading,
    setError,
    loginSuccess,
    logout,
  } = useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        // TODO: replace with real backend call later
        const fakeUser: AuthUser = {
          id: "1",
          name: "Engineer",
          email,
        };

        loginSuccess({ user: fakeUser, token: "dummy-token" });
        return true;
      } catch (err) {
        console.error(err);
        setError("Unable to login. Please try again.");
        return false;
      }
    },
    [loginSuccess, setError, setLoading]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setLoading(true);
      try {
        // TODO: replace with real backend call later
        const fakeUser: AuthUser = {
          id: "1",
          name,
          email,
        };

        loginSuccess({ user: fakeUser, token: "dummy-token" });
        return true;
      } catch (err) {
        console.error(err);
        setError("Unable to create account. Please try again.");
        return false;
      }
    },
    [loginSuccess, setError, setLoading]
  );

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout: handleLogout,
    isAuthenticated: !!user,
  };
}
