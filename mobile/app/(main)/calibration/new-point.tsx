import React, { useState } from "react";
import { ScrollView, Text, Alert, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { createCalibrationPoint } from "../../../services/calibrationService";
import { useAuthStore } from "../../../store/authStore";

export default function AddCalibrationPointScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = params.projectId as string | undefined;
  const { token } = useAuthStore();

  const [member, setMember] = useState("");
  const [upv, setUpv] = useState("");
  const [rh, setRh] = useState("");
  const [carbonation, setCarbonation] = useState("");
  const [coreFc, setCoreFc] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!projectId) {
      Alert.alert("Missing project", "Select a project before adding points.");
      return;
    }
    if (!upv || !rh || !coreFc) {
      Alert.alert("Missing data", "UPV, RH, and core fc' are required.");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        project: projectId,
        upv: parseFloat(upv),
        rh_index: parseFloat(rh),
        core_fc: parseFloat(coreFc),
        notes: notes,
      };
      if (member) payload.member = member;
      if (carbonation) payload.carbonation_depth = parseFloat(carbonation);

      await createCalibrationPoint(payload, token || undefined);
      router.back();
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        await useAuthStore.getState().clearAuth();
        router.replace("/(auth)/login");
        return;
      }
      Alert.alert("Save failed", err.message || "Could not save point.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView className="flex-1">
        <Text className="text-xl font-bold text-white mb-1">
          Add Calibration Point
        </Text>
        <Text className="text-slate-300 mb-6">
          Enter field NDT readings and corresponding core strength.
        </Text>

        <Input
          label="Member (optional)"
          value={member}
          onChangeText={setMember}
          placeholder="e.g. C1"
        />

        <Input
          label="UPV (m/s)"
          keyboardType="numeric"
          value={upv}
          onChangeText={setUpv}
          placeholder="e.g. 4200"
        />

        <Input
          label="Rebound Index"
          keyboardType="numeric"
          value={rh}
          onChangeText={setRh}
          placeholder="e.g. 32"
        />

        <Input
          label="Carbonation Depth (mm, optional)"
          keyboardType="numeric"
          value={carbonation}
          onChangeText={setCarbonation}
          placeholder="e.g. 15"
        />

        <Input
          label="Core fc' (MPa)"
          keyboardType="numeric"
          value={coreFc}
          onChangeText={setCoreFc}
          placeholder="e.g. 27.5"
        />

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional remarks"
          multiline
        />

        <Button
          title={loading ? "Saving..." : "Save Calibration Point"}
          onPress={handleSave}
          disabled={loading}
        />

        <TouchableOpacity onPress={() => router.back()} className="mt-3">
          <Text className="text-emerald-400 text-xs">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
