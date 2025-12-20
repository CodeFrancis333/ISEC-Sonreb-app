import React, { useState, useEffect } from "react";
import { ScrollView, Text, Alert, TouchableOpacity, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { createCalibrationPoint } from "../../../services/calibrationService";
import { useAuthStore } from "../../../store/authStore";
import { listMembers, Member } from "../../../services/projectService";
import Select from "../../../components/ui/Select";
import { getThemeColors, useThemeStore } from "../../../store/themeStore";

export default function AddCalibrationPointScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const projectId = params.projectId as string | undefined;
  const { token } = useAuthStore();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);

  const [memberId, setMemberId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [upv, setUpv] = useState("");
  const [rh, setRh] = useState("");
  const [carbonation, setCarbonation] = useState("");
  const [coreFc, setCoreFc] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [showMemberList, setShowMemberList] = useState(false);

  useEffect(() => {
    async function loadMembers() {
      if (!projectId) return;
      try {
        const data = await listMembers(projectId, token || undefined);
        setMembers(data);
      } catch (err: any) {
        setMembersError(err.message || "Unable to load members.");
      }
    }
    loadMembers();
  }, [projectId, token]);

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
      if (memberId) payload.member = memberId;
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-xl font-bold mb-1" style={{ color: theme.textPrimary }}>
          Add Calibration Point
        </Text>
        <Text className="mb-6" style={{ color: theme.textSecondary }}>
          Enter field NDT readings and corresponding core strength.
        </Text>
        <Select
          label="Member (optional)"
          value={memberId ? members.find((m) => m.id === memberId)?.member_id : ""}
          placeholder={members.length ? "Select member" : "No members; leave blank"}
          onPress={() => {
            if (members.length) setShowMemberList((prev) => !prev);
          }}
        />
        {showMemberList && members.length > 0 && (
          <View className="mb-3 rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => {
                  setMemberId(m.id);
                  setShowMemberList(false);
                }}
                className="px-3 py-2"
                style={{ backgroundColor: memberId === m.id ? `${theme.accent}1A` : "transparent" }}
              >
                <Text className="text-sm" style={{ color: theme.textPrimary }}>
                  {m.member_id}
                </Text>
                <Text className="text-xs" style={{ color: theme.textSecondary }}>
                  {m.type}
                  {m.level ? ` | ${m.level}` : ""}
                  {m.gridline ? ` | Grid ${m.gridline}` : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {membersError ? (
          <Text className="text-xs mb-2" style={{ color: theme.error }}>
            {membersError}
          </Text>
        ) : null}

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
          <Text className="text-xs" style={{ color: theme.accent }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
