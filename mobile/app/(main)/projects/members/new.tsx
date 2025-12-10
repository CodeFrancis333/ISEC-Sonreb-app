// app/(main)/projects/members/new.tsx
import React, { useState } from "react";
import { Text, ScrollView, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Screen from "../../../../components/layout/Screen";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";
import { createMember } from "../../../../services/projectService";
import { useAuthStore } from "../../../../store/authStore";

export default function NewMemberScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = params.projectId as string | undefined;
  const { token } = useAuthStore();

  const [memberId, setMemberId] = useState("");
  const [type, setType] = useState("");
  const [level, setLevel] = useState("");
  const [gridline, setGridline] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    if (!projectId) {
      Alert.alert("Missing project", "Open this from a project to add a member.");
      return;
    }
    if (!memberId || !type) {
      Alert.alert("Missing fields", "Member ID and type are required.");
      return;
    }
    try {
      await createMember(
        {
          project: projectId,
          member_id: memberId,
          type,
          level,
          gridline,
          notes,
        },
        token || undefined
      );
      router.back();
    } catch (err: any) {
      Alert.alert("Save failed", err.message || "Could not save member.");
    }
  };

  return (
    <Screen>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-white mb-1">
          New Member
        </Text>
        <Text className="text-slate-300 mb-6">
          Define a structural member (column, beam, slab, or wall) to
          organize SonReb readings per element.
        </Text>

        <Input
          label="Member ID"
          value={memberId}
          onChangeText={setMemberId}
          placeholder="e.g. C1, B3, S2"
        />

        <Input
          label="Type (Beam / Column / Slab / Wall)"
          value={type}
          onChangeText={setType}
          placeholder="e.g. Column"
        />

        <Input
          label="Level"
          value={level}
          onChangeText={setLevel}
          placeholder="e.g. Roof, 2F, Basement 1"
        />

        <Input
          label="Gridline"
          value={gridline}
          onChangeText={setGridline}
          placeholder="e.g. A-3, 1-5"
        />

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Orientation, special conditions, etc."
          multiline
        />

        <Button title="Save Member" onPress={handleSave} />
      </ScrollView>
    </Screen>
  );
}
