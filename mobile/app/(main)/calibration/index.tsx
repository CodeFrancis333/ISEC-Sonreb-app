import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Link, useRouter, useFocusEffect } from "expo-router";
import Screen from "../../../components/layout/Screen";
import { useAuthStore } from "../../../store/authStore";
import { listProjects, Project, listMembers, Member } from "../../../services/projectService";
import { listCalibrationPoints, CalibrationPoint, deleteCalibrationPoint, getActiveModel, CalibrationModel } from "../../../services/calibrationService";
import Select from "../../../components/ui/Select";
import { getThemeColors, useThemeStore } from "../../../store/themeStore";

export default function CalibrationPointsListScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showProjectList, setShowProjectList] = useState(false);
  const [points, setPoints] = useState<CalibrationPoint[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeModel, setActiveModel] = useState<CalibrationModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const init = useCallback(async () => {
    try {
      const projList = await listProjects(token || undefined);
      setProjects(projList);
      const firstId = projList[0]?.id || null;
      setSelectedProject(firstId);
      if (firstId) {
        await fetchMembers(firstId);
        await fetchPoints(firstId);
        await fetchModel(firstId);
      }
    } catch (err: any) {
      setError(err.message || "Unable to load projects.");
    }
  }, [token]);

  useEffect(() => {
    init();
  }, [init]);

  useFocusEffect(
    useCallback(() => {
      if (selectedProject) {
        fetchMembers(selectedProject);
        fetchPoints(selectedProject);
        fetchModel(selectedProject);
      }
    }, [selectedProject])
  );

  async function fetchPoints(projectId: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await listCalibrationPoints(projectId, token || undefined);
      setPoints(data);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        await useAuthStore.getState().clearAuth();
        router.replace("/(auth)/login");
        return;
      }
      setError(err.message || "Unable to load calibration points.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMembers(projectId: string) {
    try {
      const data = await listMembers(projectId, token || undefined);
      setMembers(data);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        await useAuthStore.getState().clearAuth();
        router.replace("/(auth)/login");
        return;
      }
    }
  }

  async function fetchModel(projectId: string) {
    try {
      const model = await getActiveModel(projectId, token || undefined);
      setActiveModel(model);
    } catch {
      setActiveModel(null);
    }
  }

  const getMemberLabel = (p: CalibrationPoint) => {
    const memberObj = members.find((m) => m.id === (p as any).member);
    if (memberObj?.member_id) {
      const parts = memberObj.member_id.split(" - ");
      return (parts.pop() || memberObj.member_id).trim();
    }
    const rawMember =
      (p as any).member_name ||
      (p as any).member_label ||
      (p as any).member_display ||
      (p as any).member;
    if (typeof rawMember === "string" && rawMember.length) {
      const parts = rawMember.split(" - ");
      return (parts.pop() || rawMember).trim();
    }
    return "Member";
  };

  const minRequired = 5;
  const minCarbonation = 8;

  return (
    <Screen showNav>
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-1">
          <Text className="text-xs uppercase" style={{ color: theme.accent }}>
            Calibration
          </Text>
          <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
            Calibration Points
          </Text>
          <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
            You have {points.length} calibration points.
          </Text>
        </View>
        <Link
          href={{
            pathname: "/calibration/new-point",
            params: { projectId: selectedProject || "" },
          }}
          asChild
        >
          <TouchableOpacity
            disabled={!selectedProject}
            className="rounded-xl px-3 py-2"
            style={{ backgroundColor: selectedProject ? theme.accent : theme.surfaceAlt }}
          >
            <Text className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
              + Add
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      {!projects.length && (
        <View
          className="rounded-lg p-3 mb-3 border"
          style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.warning }}
        >
          <Text className="text-xs" style={{ color: theme.warning }}>
            No projects yet. Create a project first in the Projects tab, then return here to add calibration points.
          </Text>
          <Link href="/projects" asChild>
            <TouchableOpacity
              className="mt-2 rounded-lg px-3 py-2"
              style={{ backgroundColor: theme.surfaceAlt }}
            >
              <Text className="text-xs" style={{ color: theme.warning }}>
                Go to Projects
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}

      <Select
        label="Select Project"
        value={selectedProject ? projects.find((p) => p.id === selectedProject)?.name : ""}
        placeholder={projects.length ? "Choose a project" : "No projects available"}
        onPress={() => setShowProjectList((prev) => !prev)}
      />
      {showProjectList && projects.length > 0 && (
        <View className="mb-3 rounded-xl border" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
          {projects.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => {
                setSelectedProject(p.id);
                fetchMembers(p.id);
                fetchPoints(p.id);
                setShowProjectList(false);
              }}
              className="px-3 py-2"
              style={{
                backgroundColor: selectedProject === p.id ? `${theme.accent}1A` : "transparent",
              }}
            >
              <Text className="text-sm" style={{ color: theme.textPrimary }}>
                {p.name}
              </Text>
              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                {p.location}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View className="rounded-xl p-3 mb-3" style={{ backgroundColor: theme.surface }}>
        <Text className="text-xs" style={{ color: theme.textPrimary }}>
          Requirements:
        </Text>
        <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
          Minimum {minRequired} points - basic model (UPV + RH)
        </Text>
        <Text className="text-xs" style={{ color: theme.textSecondary }}>
          Minimum {minCarbonation} points - model with carbonation
        </Text>
      </View>

      {activeModel ? (
        <View
          className="rounded-xl border p-3 mb-3"
          style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.accent }}
        >
          <Text className="text-xs mb-1" style={{ color: theme.accent }}>
            Active Model
          </Text>
          <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
            r2 {activeModel.r2.toFixed(2)} | RMSE {activeModel.rmse?.toFixed(2) ?? "--"} MPa
          </Text>
          <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
            Points used: {activeModel.points_used} | Carbonation: {activeModel.use_carbonation ? "Yes" : "No"}
          </Text>
          <Text className="text-[11px] mt-1" style={{ color: theme.textMuted }}>
            UPV {activeModel.upv_min ?? "--"}-{activeModel.upv_max ?? "--"} m/s | RH {activeModel.rh_min ?? "--"}-{activeModel.rh_max ?? "--"}
          </Text>
        </View>
      ) : null}
      {activeModel && selectedProject ? (
        <TouchableOpacity
          className="rounded-xl px-4 py-3 mb-3"
          style={{ backgroundColor: theme.surface }}
          onPress={() =>
            router.push({
              pathname: "/calibration/diagnostics",
              params: { projectId: selectedProject },
            })
          }
        >
          <Text className="font-semibold" style={{ color: theme.textPrimary }}>
            View Diagnostics
          </Text>
          <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
            See predicted vs measured, residuals, and model details.
          </Text>
        </TouchableOpacity>
      ) : null}

      {error ? (
        <View className="rounded-lg p-3 mb-3 border" style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.error }}>
          <Text className="text-xs" style={{ color: theme.error }}>
            {error}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View className="items-center justify-center py-6">
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
        >
          <View className="gap-3">
            {points.map((p, idx) => {
              const memberLabel = getMemberLabel(p);
              return (
                <View key={p.id} className="rounded-xl p-4" style={{ backgroundColor: theme.surface }}>
                  <View className="flex-row items-start justify-between">
                    <Text className="font-semibold" style={{ color: theme.textPrimary }}>
                      Core: {p.core_fc.toFixed(1)} MPa
                    </Text>
                    <Text className="text-xs font-semibold" style={{ color: theme.accent }}>
                      {memberLabel} - #{idx + 1}
                    </Text>
                  </View>
                  <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                    UPV {p.upv} m/s | RH {p.rh_index}
                    {p.carbonation_depth !== null && p.carbonation_depth !== undefined
                      ? ` | Carbonation ${p.carbonation_depth} mm`
                      : ""}
                  </Text>
                  <Text className="text-xs mt-1" style={{ color: theme.textMuted }}>
                    {new Date(p.created_at).toISOString().slice(0, 10)}
                  </Text>
                  <View className="flex-row gap-4 mt-2">
                    <Link
                      href={{
                        pathname: "/calibration/edit-point",
                        params: {
                          pointId: p.id,
                          projectId: selectedProject || "",
                          member: (p as any).member || "",
                          upv: String(p.upv),
                          rh: String(p.rh_index),
                          carbonation:
                            p.carbonation_depth !== null && p.carbonation_depth !== undefined
                              ? String(p.carbonation_depth)
                              : "",
                          core_fc: String(p.core_fc),
                          notes: (p as any).notes || "",
                        },
                      }}
                      asChild
                    >
                      <TouchableOpacity>
                        <Text className="text-xs" style={{ color: theme.accent }}>
                          Edit
                        </Text>
                      </TouchableOpacity>
                    </Link>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          "Delete calibration point?",
                          "Are you sure you want to delete this calibration point?",
                          [
                            {
                              text: "Yes",
                              style: "default",
                              onPress: async () => {
                                await deleteCalibrationPoint(p.id, token || undefined);
                                if (selectedProject) fetchPoints(selectedProject);
                              },
                            },
                            { text: "No", style: "cancel" },
                          ]
                        );
                      }}
                    >
                      <Text className="text-xs" style={{ color: theme.error }}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {!points.length && (
              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                No calibration points yet for this project.
              </Text>
            )}
          </View>
          <View className="mt-2">
            <TouchableOpacity
              disabled={!selectedProject}
              className="rounded-xl py-3 items-center"
              style={{ backgroundColor: selectedProject ? theme.accent : theme.surfaceAlt }}
              onPress={() => {
                if (!selectedProject) {
                  Alert.alert("Select a project first");
                  return;
                }
                router.push({
                  pathname: "/calibration/generate",
                  params: { projectId: selectedProject },
                });
              }}
            >
              <Text className="font-semibold text-sm" style={{ color: theme.textPrimary }}>
                Generate Model
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
