import React, { useState } from "react";
import { View, Text, ScrollView, Switch, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Screen from "../../../components/layout/Screen";
import Button from "../../../components/ui/Button";
import { generateCalibrationModel, setActiveCalibrationModel } from "../../../services/calibrationService";
import { useAuthStore } from "../../../store/authStore";
import { getThemeColors, useThemeStore } from "../../../store/themeStore";

export default function GenerateModelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = params.projectId as string | undefined;
  const { token } = useAuthStore();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);
  const [useCarbonation, setUseCarbonation] = useState(true);
  const [loading, setLoading] = useState(false);

  const pointsAvailable = 8;
  const baseModelReady = pointsAvailable >= 5;
  const carbonationModelReady = pointsAvailable >= 8;

  const handleGenerate = () => {
    if (!projectId) {
      Alert.alert("Missing project", "Open this from a project to generate a model.");
      return;
    }
    setLoading(true);
    generateCalibrationModel(
      { project: projectId, use_carbonation: useCarbonation },
      token || undefined
    )
      .then(() => {
        Alert.alert("Model generated", "Calibration model generated successfully.");
      })
      .catch((err: any) => {
        Alert.alert("Generation failed", err?.message || "Unable to generate model.");
      })
      .finally(() => setLoading(false));
  };

  const handleSetActive = () => {
    if (!projectId) {
      Alert.alert("Missing project", "Open this from a project to set the active model.");
      return;
    }
    setLoading(true);
    setActiveCalibrationModel(projectId, token || undefined)
      .then(() => {
        Alert.alert("Model activated", "Active model set for this project.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      })
      .catch((err: any) => {
        Alert.alert("Activation failed", err?.message || "Unable to set active model.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 150 }}>
        <Text className="text-xl font-bold mb-1" style={{ color: theme.textPrimary }}>
          Generate Model
        </Text>
        <Text className="mb-6" style={{ color: theme.textSecondary }}>
          Use your calibration cores to generate a project-specific SonReb model.
        </Text>

        <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: theme.surface }}>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-sm mb-1" style={{ color: theme.textPrimary }}>
                Use carbonation depth in model?
              </Text>
              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                Requires at least 8 points with carbonation data.
              </Text>
            </View>
            <Switch
              value={useCarbonation}
              onValueChange={setUseCarbonation}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor={theme.surfaceAlt}
            />
          </View>
        </View>

        <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: theme.surface }}>
          <Text className="text-sm mb-2" style={{ color: theme.textPrimary }}>
            Calibration Points
          </Text>
          <Text className="text-xs" style={{ color: theme.textSecondary }}>
            Available points: {pointsAvailable}
          </Text>
          <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
            Basic model (UPV + RH):{" "}
            <Text style={{ color: baseModelReady ? theme.success : theme.warning }}>
              {baseModelReady ? "Ready" : "Not enough points"}
            </Text>
          </Text>
          <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
            Model with carbonation:{" "}
            <Text style={{ color: carbonationModelReady ? theme.success : theme.warning }}>
              {carbonationModelReady ? "Ready" : "Not enough points"}
            </Text>
          </Text>
        </View>

        <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: theme.surface }}>
          <Text className="text-sm mb-2" style={{ color: theme.textPrimary }}>
            Model Preview (Dummy)
          </Text>
          <Text className="text-xs font-mono" style={{ color: theme.textPrimary }}>
            fc = 5.32 + 0.012*R + 0.0041*V{useCarbonation ? " + 0.09*cd" : ""}
          </Text>
          <Text className="text-xs mt-2" style={{ color: theme.textSecondary }}>
            r2 = 0.89 | Points used: {pointsAvailable}
          </Text>
          <Text className="text-xs mt-2" style={{ color: theme.textMuted }}>
            (Later, this will be replaced by real regression from the backend.)
          </Text>
        </View>

        <Button title={loading ? "Generating..." : "Generate Model"} onPress={handleGenerate} disabled={loading} />

        <View className="h-3" />

        <Button title="Set as Active Model" onPress={handleSetActive} variant="secondary" />
      </ScrollView>
    </Screen>
  );
}
