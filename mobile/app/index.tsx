// mobile/app/index.tsx
import React from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function Index() {
  const { token, initialized } = useAuthStore();

  if (!initialized) return null;

  return (
    <Redirect href={token ? "/(main)" : "/(auth)/welcome"} />
  );
}
