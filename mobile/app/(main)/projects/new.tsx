import React, { useState } from "react";
import { Text, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { createProject } from "../../../services/projectService";
import { useAuthStore } from "../../../store/authStore";

export default function NewProjectScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [client, setClient] = useState("");
  const [designFc, setDesignFc] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !location) {
      Alert.alert("Missing fields", "Project name and location are required.");
      return;
    }
    try {
      setLoading(true);
      const payload: any = {
        name,
        location,
      };
      if (client) payload.client = client;
      if (designFc) payload.design_fc = parseFloat(designFc);
      if (notes) payload.notes = notes;

      await createProject(payload, token || undefined);
      router.back();
    } catch (err: any) {
      Alert.alert("Create failed", err.message || "Unable to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <Text className="text-xl font-bold text-white mb-1">
          New Project
        </Text>
        <Text className="text-slate-300 mb-6">
          Define the project information and design strength.
        </Text>

        <Input
          label="Project Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Hospital Wing A"
        />

        <Input
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="City / Site"
        />

        <Input
          label="Client (optional)"
          value={client}
          onChangeText={setClient}
          placeholder="Client name"
        />

        <Input
          label="Design fc′ (MPa, optional)"
          keyboardType="numeric"
          value={designFc}
          onChangeText={setDesignFc}
          placeholder="e.g. 28"
        />

        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional details"
          multiline
        />

        <Button title="Save Project" onPress={handleSave} />
      </ScrollView>
    </Screen>
  );
}
