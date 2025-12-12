import React, { useState } from "react";
import { View, Text, ScrollView, Switch, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Screen from "../../../components/layout/Screen";
import Button from "../../../components/ui/Button";
import { generateCalibrationModel, setActiveCalibrationModel } from "../../../services/calibrationService";
import { useAuthStore } from "../../../store/authStore";

export default function GenerateModelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = params.projectId as string | undefined;
  const { token } = useAuthStore();
  const [useCarbonation, setUseCarbonation] = useState(true);
  const [loading, setLoading] = useState(false);

  // Dummy numbers for now
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
      <ScrollView className="flex-1">
        <Text className="text-xl font-bold text-white mb-1">
          Generate Model
        </Text>
        <Text className="text-slate-300 mb-6">
          Use your calibration cores to generate a project-specific SonReb model.
        </Text>

        <View className="rounded-xl bg-slate-800 p-4 mb-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-slate-200 text-sm mb-1">
                Use carbonation depth in model?
              </Text>
              <Text className="text-slate-400 text-xs">
                Requires at least 8 points with carbonation data.
              </Text>
            </View>
            <Switch
              value={useCarbonation}
              onValueChange={setUseCarbonation}
            />
          </View>
        </View>

        <View className="rounded-xl bg-slate-800 p-4 mb-4">
          <Text className="text-slate-200 text-sm mb-2">
            Calibration Points
          </Text>
          <Text className="text-slate-300 text-xs">
            Available points: {pointsAvailable}
          </Text>
          <Text className="text-slate-300 text-xs mt-1">
            Basic model (UPV + RH):{" "}
            <Text className={baseModelReady ? "text-emerald-300" : "text-amber-300"}>
              {baseModelReady ? "Ready ✔" : "Not enough points"}
            </Text>
          </Text>
          <Text className="text-slate-300 text-xs mt-1">
            Model with carbonation:{" "}
            <Text
              className={
                carbonationModelReady ? "text-emerald-300" : "text-amber-300"
              }
            >
              {carbonationModelReady ? "Ready ✔" : "Not enough points"}
            </Text>
          </Text>
        </View>

        {/* Dummy model preview */}
        <View className="rounded-xl bg-slate-800 p-4 mb-4">
          <Text className="text-slate-200 text-sm mb-2">
            Model Preview (Dummy)
          </Text>
          <Text className="text-slate-100 text-xs font-mono">
            fc′ = 5.32 + 0.012·R + 0.0041·V{" "}
            {useCarbonation && "+ 0.09·d₍c₎"}
          </Text>
          <Text className="text-slate-400 text-xs mt-2">
            R² = 0.89 • Points used: {pointsAvailable}
          </Text>
          <Text className="text-slate-500 text-xs mt-2">
            (Later, this will be replaced by real regression from the backend.)
          </Text>
        </View>

        <Button title={loading ? "Generating..." : "Generate Model"} onPress={handleGenerate} disabled={loading} />

        <View className="h-3" />

        <Button
          title="Set as Active Model"
          onPress={handleSetActive}
          variant="secondary"
        />
      </ScrollView>
    </Screen>
  );
}
