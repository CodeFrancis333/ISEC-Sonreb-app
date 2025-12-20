// mobile/app/_layout.tsx
import "../global.css";

import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function RootLayout() {
  const { loadFromStorage, initialized } = useAuthStore();
  const { mode, loadFromStorage: loadTheme } = useThemeStore();

  useEffect(() => {
    loadFromStorage();
    loadTheme();
  }, [loadFromStorage, loadTheme]);

  return (
    <SafeAreaProvider>
      <StatusBar style={mode === "dark" ? "dark" : "light"} />
      <View style={{ flex: 1 }} className={mode === "dark" ? "dark" : ""}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </SafeAreaProvider>
  );
}
