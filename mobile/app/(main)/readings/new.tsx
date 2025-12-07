import React, { useState } from "react";
import { Text, ScrollView } from "react-native";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export default function NewReadingScreen() {
  const [project, setProject] = useState("");
  const [member, setMember] = useState("");
  const [locationTag, setLocationTag] = useState("");
  const [upv, setUpv] = useState("");
  const [rh, setRh] = useState("");
  const [carbonation, setCarbonation] = useState("");

  const handleCompute = () => {
    // TODO: call backend to compute fc′ (using active/default model)
  };

  return (
    <Screen>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-white mb-1">
          New Reading
        </Text>
        <Text className="text-slate-300 mb-6">
          Enter field measurements for UPV, Rebound Hammer, and optional
          carbonation depth.
        </Text>

        <Input
          label="Project"
          value={project}
          onChangeText={setProject}
          placeholder="Select project (temporary text input)"
        />

        <Input
          label="Member"
          value={member}
          onChangeText={setMember}
          placeholder="Select member (temporary text input)"
        />

        <Input
          label="Location Tag"
          value={locationTag}
          onChangeText={setLocationTag}
          placeholder="e.g. North Face, mid-height"
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

        <Button
          title="Compute fc′"
          onPress={handleCompute}
        />
      </ScrollView>
    </Screen>
  );
}
