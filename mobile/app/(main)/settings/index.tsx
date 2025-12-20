import React, { useState } from "react";
import { View, Text, Switch, ScrollView, Alert } from "react-native";
import Screen from "../../../components/layout/Screen";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../store/authStore";
import { APP_VERSION } from "../../../constants";
import Button from "../../../components/ui/Button";
import { useThemeStore, getThemeColors } from "../../../store/themeStore";

export default function SettingsScreen() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);
  const [useMpa, setUseMpa] = useState(true);
  const [useMs, setUseMs] = useState(true);
  const [ratingByDesign, setRatingByDesign] = useState(true);
  const [useCalibratedModel, setUseCalibratedModel] = useState(true);
  const [showModelDetails, setShowModelDetails] = useState(true);

  const handleSignOut = async () => {
    Alert.alert("Log out?", "Are you sure you want to log out?", [
      {
        text: "Yes",
        style: "default",
        onPress: async () => {
          await clearAuth();
          router.replace("/(auth)/welcome");
        },
      },
      { text: "No", style: "cancel" },
    ]);
  };

  return (
    <Screen showNav>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <Text className="text-xs uppercase" style={{ color: theme.accent }}>
          Settings
        </Text>
        <Text className="text-xl font-bold mb-1" style={{ color: theme.textPrimary }}>
          App Preferences
        </Text>
        <Text className="text-xs mb-4" style={{ color: theme.textMuted }}>
          Configure units, rating method, and model behavior.
        </Text>

        {/* Units */}
        <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: theme.surface }}>
          <Text className="text-sm mb-3" style={{ color: theme.textPrimary }}>
            Units
          </Text>

          {/* Strength units */}
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-xs" style={{ color: theme.textPrimary }}>Strength Units</Text>
              <Text className="text-xs" style={{ color: theme.textMuted }}>MPa or psi</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs" style={{ color: theme.textMuted }}>
                {useMpa ? "MPa" : "psi"}
              </Text>
              <Switch value={useMpa} onValueChange={setUseMpa} />
            </View>
          </View>

          {/* Velocity units */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xs" style={{ color: theme.textPrimary }}>Velocity Units</Text>
              <Text className="text-xs" style={{ color: theme.textMuted }}>m/s or km/s</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs" style={{ color: theme.textMuted }}>
                {useMs ? "m/s" : "km/s"}
              </Text>
              <Switch value={useMs} onValueChange={setUseMs} />
            </View>
          </View>
        </View>

        {/* Rating method */}
        <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: theme.surface }}>
          <Text className="text-sm mb-3" style={{ color: theme.textPrimary }}>
            Rating Method
          </Text>

          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xs" style={{ color: theme.textPrimary }}>
                Use % of design fc'
              </Text>
              <Text className="text-xs" style={{ color: theme.textMuted }}>
                Ratings based on ratio of fc' / design fc'.
              </Text>
            </View>
            <Switch value={ratingByDesign} onValueChange={setRatingByDesign} />
          </View>
        </View>

        {/* Model behavior */}
        <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: theme.surface }}>
          <Text className="text-sm mb-3" style={{ color: theme.textPrimary }}>
            Model Behavior
          </Text>

          {/* Use calibrated model */}
          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-xs" style={{ color: theme.textPrimary }}>
                Use calibrated model when available
              </Text>
              <Text className="text-xs" style={{ color: theme.textMuted }}>
                Otherwise fallback to default SonReb model.
              </Text>
            </View>
            <Switch
              value={useCalibratedModel}
              onValueChange={setUseCalibratedModel}
            />
          </View>

          {/* Show model details */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xs" style={{ color: theme.textPrimary }}>
                Always show model details
              </Text>
              <Text className="text-xs" style={{ color: theme.textMuted }}>
                Display equation & coefficients on result screens.
              </Text>
            </View>
            <Switch
              value={showModelDetails}
              onValueChange={setShowModelDetails}
            />
          </View>
        </View>

        {/* Account */}
        <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: theme.surface }}>
          <Text className="text-sm mb-3" style={{ color: theme.textPrimary }}>
            Account
          </Text>
          <Button title="Sign out" variant="danger" onPress={handleSignOut} />
        </View>

        {/* Version */}
        <View className="items-center mt-6 mb-8">
          <Text className="text-xs" style={{ color: theme.textMuted }}>
            Version {APP_VERSION}
          </Text>
        </View>

      </ScrollView>
    </Screen>
  );
}
