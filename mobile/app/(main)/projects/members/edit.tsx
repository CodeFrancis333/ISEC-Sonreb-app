import React, { useEffect, useState } from "react";
import { Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Screen from "../../../../components/layout/Screen";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";
import { updateMember, listMembers } from "../../../../services/projectService";
import { useAuthStore } from "../../../../store/authStore";

export default function EditMemberScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    projectId?: string;
    memberId?: string;
    member_id?: string;
    type?: string;
    level?: string;
    gridline?: string;
    notes?: string;
  }>();
  const projectId = params.projectId as string | undefined;
  const memberId = params.memberId as string | undefined;
  const { token } = useAuthStore();

  const [memberCode, setMemberCode] = useState("");
  const [type, setType] = useState("");
  const [level, setLevel] = useState("");
  const [gridline, setGridline] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMember, setLoadingMember] = useState(true);

  useEffect(() => {
    async function init() {
      if (!projectId || !memberId) {
        Alert.alert("Missing data", "Project or member id is missing.");
        router.back();
        return;
      }
      if (params.member_id || params.type) {
        setMemberCode(params.member_id || "");
        setType(params.type || "");
        setLevel(params.level || "");
        setGridline(params.gridline || "");
        setNotes(params.notes || "");
        setLoadingMember(false);
        return;
      }
      try {
        const data = await listMembers(projectId, token || undefined);
        const m = data.find((x) => x.id === memberId);
        if (!m) throw new Error("Member not found");
        setMemberCode(m.member_id);
        setType(m.type);
        setLevel(m.level || "");
        setGridline(m.gridline || "");
        setNotes(m.notes || "");
      } catch (err: any) {
        Alert.alert("Load failed", err.message || "Unable to load member.");
        router.back();
      } finally {
        setLoadingMember(false);
      }
    }
    init();
  }, [memberId, params, projectId, router, token]);

  const handleSave = async () => {
    if (!projectId || !memberId) {
      Alert.alert("Missing data", "Project or member id is missing.");
      return;
    }
    if (!memberCode || !type) {
      Alert.alert("Missing fields", "Member ID and type are required.");
      return;
    }
    try {
      setLoading(true);
      await updateMember(
        projectId,
        memberId,
        {
          member_id: memberCode,
          type,
          level,
          gridline,
          notes,
        },
        token || undefined
      );
      router.back();
    } catch (err: any) {
      Alert.alert("Update failed", err.message || "Could not save member.");
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
          Edit Member
        </Text>
        <Text className="text-slate-300 mb-6">
          Update structural member details.
        </Text>

        {loadingMember ? (
          <Text className="text-slate-400 text-sm">Loading...</Text>
        ) : (
          <>
            <Input
              label="Member ID"
              value={memberCode}
              onChangeText={setMemberCode}
              placeholder="e.g. C1"
            />
            <Input
              label="Type (Beam / Column / Slab / Wall)"
              value={type}
              onChangeText={setType}
              placeholder="Column"
            />
            <Input
              label="Level"
              value={level}
              onChangeText={setLevel}
              placeholder="GF"
            />
            <Input
              label="Gridline"
              value={gridline}
              onChangeText={setGridline}
              placeholder="A-1"
            />
            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Orientation, special conditions, etc."
              multiline
            />

            <Button
              title={loading ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={loading}
            />
          </>
        )}

        <TouchableOpacity onPress={() => router.back()} className="mt-3">
          <Text className="text-emerald-400 text-xs">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
