import React, { useEffect, useState } from "react";
import { ScrollView, Text, Alert, TouchableOpacity, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { updateCalibrationPoint } from "../../../services/calibrationService";
import { useAuthStore } from "../../../store/authStore";
import { listMembers, Member } from "../../../services/projectService";
import Select from "../../../components/ui/Select";
import { getThemeColors, useThemeStore } from "../../../store/themeStore";

export default function EditCalibrationPointScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    pointId?: string;
    projectId?: string;
    member?: string;
    upv?: string;
    rh?: string;
    carbonation?: string;
    core_fc?: string;
    notes?: string;
  }>();
  const pointId = params.pointId as string | undefined;
  const projectId = params.projectId as string | undefined;
  const { token } = useAuthStore();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);

  const [memberId, setMemberId] = useState<string | null>(params.member ? String(params.member) : null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [showMemberList, setShowMemberList] = useState(false);
  const [upv, setUpv] = useState(params.upv ? String(params.upv) : "");
  const [rh, setRh] = useState(params.rh ? String(params.rh) : "");
  const [carbonation, setCarbonation] = useState(params.carbonation ? String(params.carbonation) : "");
  const [coreFc, setCoreFc] = useState(params.core_fc ? String(params.core_fc) : "");
  const [notes, setNotes] = useState(params.notes ? String(params.notes) : "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pointId) {
      Alert.alert("Missing calibration point", "No calibration point id provided.");
      router.back();
    }
  }, [pointId, router]);

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
    if (!pointId) {
      Alert.alert("Missing calibration point", "No calibration point id provided.");
      return;
    }
    if (!projectId) {
      Alert.alert("Missing project", "No project id provided.");
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

      await updateCalibrationPoint(pointId, payload, token || undefined);
      router.back();
    } catch (err: any) {
      Alert.alert("Update failed", err.message || "Could not save point.");
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
          Edit Calibration Point
        </Text>
        <Text className="mb-6" style={{ color: theme.textSecondary }}>
          Update field NDT readings and corresponding core strength.
        </Text>

        <Select
          label="Member (optional)"
          value={memberId ? members.find((m) => m.id === memberId)?.member_id || "" : ""}
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
          title={loading ? "Saving..." : "Save Changes"}
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
