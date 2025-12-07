import React, { useState } from "react";
import { ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export default function AddCalibrationPointScreen() {
  const router = useRouter();

  const [member, setMember] = useState("");
  const [upv, setUpv] = useState("");
  const [rh, setRh] = useState("");
  const [carbonation, setCarbonation] = useState("");
  const [coreFc, setCoreFc] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    // TODO: save calibration point via backend
    router.back();
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
          label="Core fc′ (MPa)"
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

        <Button title="Save Calibration Point" onPress={handleSave} />
      </ScrollView>
    </Screen>
  );
}
