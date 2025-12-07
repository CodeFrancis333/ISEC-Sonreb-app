import React, { useState } from "react";
import { Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";

export default function NewProjectScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [client, setClient] = useState("");
  const [designFc, setDesignFc] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    // TODO: call backend to create project
    router.back();
  };

  return (
    <Screen>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
