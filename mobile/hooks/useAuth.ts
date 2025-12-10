// mobile/hooks/useAuth.ts
import { useCallback } from "react";
import { router } from "expo-router";
import { useAuthStore } from "../store/authStore";
import * as authService from "../services/authService";

export function useAuth() {
  const {
    user,
    token,
    loading,
    error,
    setUserAndToken,
    clearAuth,
    setLoading,
    setError,
  } = useAuthStore();

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);

        const res = await authService.login(email.trim(), password);

        // Handle unverified accounts
        if ((res as any)?.require_verification) {
          router.replace({
            pathname: "/(auth)/verify",
            params: { email: email.trim(), uid: (res as any).uid },
          });
          return;
        }

        await setUserAndToken((res as any).user, (res as any).token);

        router.replace("/(main)");
      } catch (err: any) {
        if (err?.data?.require_verification) {
          router.replace({
            pathname: "/(auth)/verify",
            params: {
              email: email.trim(),
              uid: err.data.uid,
            },
          });
          return;
        }
        setError(err.message || "Login failed.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUserAndToken, setLoading, setError],
  );

  const handleRegister = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);

        const res = await authService.register(name.trim(), email.trim(), password);

        router.replace({
          pathname: "/(auth)/verify",
          params: {
            email: email.trim(),
            uid: (res as any).uid,
            code: (res as any).code,
          },
        });
      } catch (err: any) {
        setError(err.message || "Registration failed.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setUserAndToken, setLoading, setError],
  );

  const logout = useCallback(async () => {
    await clearAuth();
    router.replace("/(auth)/welcome");
  }, [clearAuth]);

  return {
    user,
    token,
    loading,
    error,
    login: handleLogin,
    register: handleRegister,
    logout,
  };
}

export default useAuth;
