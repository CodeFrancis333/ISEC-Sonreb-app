// mobile/app/(auth)/welcome.tsx
import React from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import Screen from "../../components/layout/Screen";
import Button from "../../components/ui/Button";
import { getThemeColors, useThemeStore } from "../../store/themeStore";

export default function WelcomeScreen() {
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);
  const router = useRouter();

  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        {/* Logo placeholder */}
        <View
          className="w-24 h-24 rounded-3xl items-center justify-center mb-6 border"
          style={{ backgroundColor: `${theme.accent}1A`, borderColor: theme.accent }}
        >
          <Text className="text-2xl font-bold" style={{ color: theme.accent }}>
            SR
          </Text>
        </View>

        <Text className="text-2xl font-bold mb-2" style={{ color: theme.textPrimary }}>
          SONREB App
        </Text>
        <Text className="text-center mb-8 px-6" style={{ color: theme.textSecondary }}>
          Estimate in-place concrete strength using UPV and Rebound Hammer,
          with optional carbonation depth.
        </Text>

        <View className="w-full gap-3 mb-4">
          <Button onPress={() => router.push("/(auth)/login")} className="w-full">
            Login
          </Button>

          <Button onPress={() => router.push("/(auth)/register")} variant="outline" className="w-full">
            Create Account
          </Button>
        </View>

        <Text className="text-xs mt-4 text-center px-8" style={{ color: theme.textMuted }}>
          Field-friendly interface for structural engineers performing
          SonReb assessments on site.
        </Text>
      </View>
    </Screen>
  );
}
