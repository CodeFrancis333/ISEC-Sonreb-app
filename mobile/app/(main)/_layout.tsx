// mobile/app/(main)/_layout.tsx
import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import useAuth from "../../hooks/useAuth";

export default function MainLayout() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/(auth)/welcome");
    }
  }, [isAuthenticated, loading, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#020617",
        },
      }}
    />
  );
}
