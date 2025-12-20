import React, { useEffect, useState } from "react";
import { Text, ScrollView, Alert, TouchableOpacity, ActivityIndicator, View } from "react-native";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { useAuthStore } from "../../../store/authStore";
import { listProjects, Project } from "../../../services/projectService";
import { updateReading } from "../../../services/readingService";
import { getActiveModel, CalibrationModel } from "../../../services/calibrationService";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getThemeColors, useThemeStore } from "../../../store/themeStore";

export default function EditReadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    projectId?: string;
    memberId?: string;
    memberText?: string;
    upv?: string;
    rh?: string;
    carbonation?: string;
    location_tag?: string;
  }>();
  const readingId = params.id as string | undefined;
  const { token } = useAuthStore();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<string | null>(params.projectId ? String(params.projectId) : null);
  const initialMemberText =
    params.memberText ||
    (params.memberId && isNaN(Number(params.memberId)) ? String(params.memberId) : "") ||
    "";
  const [memberText, setMemberText] = useState<string>(initialMemberText);
  const [locationTag, setLocationTag] = useState(params.location_tag ? String(params.location_tag) : "");
  const [upv, setUpv] = useState(params.upv ? String(params.upv) : "");
  const [rh, setRh] = useState(params.rh ? String(params.rh) : "");
  const [carbonation, setCarbonation] = useState(params.carbonation ? String(params.carbonation) : "");
  const [modelInfo, setModelInfo] = useState<CalibrationModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await listProjects(token || undefined);
        setProjects(data);
        const first = projectId || data[0]?.id || null;
        setProjectId(first);
        if (first) {
          try {
            const model = await getActiveModel(first, token || undefined);
            setModelInfo(model);
          } catch {
            setModelInfo(null);
          }
        }
      } catch (err: any) {
        setError(err.message || "Unable to load projects.");
      } finally {
        setLoadingMeta(false);
      }
    }
    loadProjects();
  }, [projectId, token]);

  useEffect(() => {
    if (!memberText && params.memberText) {
      setMemberText(String(params.memberText));
    }
  }, [memberText, params.memberText]);

  const handleSave = async () => {
    if (!readingId) {
      Alert.alert("Missing reading", "No reading id provided.");
      return;
    }
    if (!projectId) {
      Alert.alert("Select project", "Please select a project.");
      return;
    }
    if (!upv || !rh) {
      Alert.alert("Missing fields", "UPV and RH are required.");
      return;
    }
    try {
      setLoading(true);
      const payload: any = {
        project: projectId,
        member: null,
        member_text: memberText || null,
        location_tag: locationTag || memberText || "Reading",
        upv: parseFloat(upv),
        rh_index: parseFloat(rh),
      };
      if (carbonation) payload.carbonation_depth = parseFloat(carbonation);

      await updateReading(readingId, payload, token || undefined);
      router.back();
    } catch (err: any) {
      Alert.alert("Update failed", err.message || "Could not save reading.");
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
        <Text className="text-xl font-bold mb-1" style={{ color: theme.textPrimary }}>
          Edit Reading
        </Text>
        <Text className="mb-6" style={{ color: theme.textSecondary }}>
          Update field measurements for UPV, RH, and optional carbonation.
        </Text>

        {loadingMeta ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color={theme.accent} />
            <Text className="text-sm" style={{ color: theme.textSecondary }}>
              Loading projects...
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-sm mb-2" style={{ color: theme.textPrimary }}>
              Project
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-2">
                {projects.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setProjectId(p.id);
                      getActiveModel(p.id, token || undefined)
                        .then(setModelInfo)
                        .catch(() => setModelInfo(null));
                    }}
                    className="px-3 py-2 rounded-full border"
                    style={{
                      borderColor: projectId === p.id ? theme.accent : theme.border,
                      backgroundColor: projectId === p.id ? `${theme.accent}1A` : "transparent",
                    }}
                  >
                    <Text
                      className="text-xs"
                      style={{ color: projectId === p.id ? theme.textPrimary : theme.textSecondary }}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Input
              label="Member (optional, free text)"
              value={memberText}
              onChangeText={setMemberText}
              placeholder="e.g. C1 or North Wall"
            />

            <Input
              label="Location Tag (optional)"
              value={locationTag}
              onChangeText={setLocationTag}
              placeholder="e.g. Grid A-1"
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
        {(() => {
          const rhVal = parseFloat(rh);
          const tooLow = modelInfo?.rh_min !== null && modelInfo?.rh_min !== undefined && !Number.isNaN(rhVal) && rhVal < (modelInfo?.rh_min as number);
          const tooHigh = modelInfo?.rh_max !== null && modelInfo?.rh_max !== undefined && !Number.isNaN(rhVal) && rhVal > (modelInfo?.rh_max as number);
          const warning = tooLow
            ? `Below calibrated RH min (${modelInfo?.rh_min})`
            : tooHigh
            ? `Above calibrated RH max (${modelInfo?.rh_max})`
            : "";
          return warning ? (
            <Text className="text-[11px] text-right -mt-2 mb-2" style={{ color: theme.error }}>
              {warning}
            </Text>
          ) : null;
        })()}

            <Input
              label="Carbonation Depth (mm, optional)"
              keyboardType="numeric"
              value={carbonation}
              onChangeText={setCarbonation}
              placeholder="e.g. 15"
            />

            <Button
              title={loading ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={loading}
            />
          </>
        )}

        <TouchableOpacity onPress={() => router.back()} className="mt-3">
          <Text className="text-xs" style={{ color: theme.accent }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
