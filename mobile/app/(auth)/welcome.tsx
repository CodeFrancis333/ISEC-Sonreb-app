import React from "react";
import { View, Text, Image } from "react-native";
import { Link } from "expo-router";
import Screen from "../../components/layout/Screen";
import Button from "../../components/ui/Button";

export default function WelcomeScreen() {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        {/* Logo placeholder */}
        <View className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/40 items-center justify-center mb-6">
          <Text className="text-2xl font-bold text-emerald-300">SR</Text>
        </View>

        <Text className="text-2xl font-bold text-white mb-2">
          SONREB App
        </Text>
        <Text className="text-slate-300 text-center mb-8 px-6">
          Estimate in-place concrete strength using UPV and Rebound Hammer,
          with optional carbonation depth.
        </Text>

        <View className="w-full gap-3 mb-4">
          <Link href="/(auth)/login" asChild>
            <Button title="Login" />
          </Link>

          <Link href="/(auth)/register" asChild>
            <Button
              variant="secondary"
              title="Create Account"
            />
          </Link>
        </View>

        <Text className="text-xs text-slate-500 mt-4 text-center px-8">
          Field-friendly interface for structural engineers performing
          SonReb assessments on site.
        </Text>
      </View>
    </Screen>
  );
}
