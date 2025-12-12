import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Link, useRouter, useFocusEffect } from "expo-router";
import Screen from "../../../components/layout/Screen";
import { useAuthStore } from "../../../store/authStore";
import { listProjects, Project, listMembers, Member } from "../../../services/projectService";
import { listCalibrationPoints, CalibrationPoint, deleteCalibrationPoint } from "../../../services/calibrationService";
import Select from "../../../components/ui/Select";

export default function CalibrationPointsListScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showProjectList, setShowProjectList] = useState(false);
  const [points, setPoints] = useState<CalibrationPoint[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
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
          <Text className="text-xs text-emerald-400 uppercase">Calibration</Text>
          <Text className="text-xl font-bold text-white">Calibration Points</Text>
          <Text className="text-slate-400 text-xs mt-1">
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
            className={`rounded-xl px-3 py-2 ${selectedProject ? "bg-emerald-600" : "bg-slate-700"}`}
          >
            <Text className="text-white text-xs font-semibold">+ Add</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {!projects.length && (
        <View className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-3 mb-3">
          <Text className="text-amber-200 text-xs">
            No projects yet. Create a project first in the Projects tab, then return here to add calibration points.
          </Text>
          <Link href="/projects" asChild>
            <TouchableOpacity className="mt-2 rounded-lg bg-amber-500/20 px-3 py-2">
              <Text className="text-amber-100 text-xs">Go to Projects</Text>
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
        <View className="mb-3 rounded-xl border border-slate-700 bg-slate-800/90">
          {projects.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => {
                setSelectedProject(p.id);
                fetchMembers(p.id);
                fetchPoints(p.id);
                setShowProjectList(false);
              }}
              className={`px-3 py-2 ${selectedProject === p.id ? "bg-emerald-500/10" : ""}`}
            >
              <Text className="text-white text-sm">{p.name}</Text>
              <Text className="text-slate-400 text-xs">{p.location}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View className="rounded-xl bg-slate-800 p-3 mb-3">
        <Text className="text-slate-200 text-xs">Requirements:</Text>
        <Text className="text-slate-300 text-xs mt-1">
          • Min {minRequired} points → basic model (UPV + RH)
        </Text>
        <Text className="text-slate-300 text-xs">
          • Min {minCarbonation} points → model with carbonation
        </Text>
      </View>

      {error ? (
        <View className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-3 mb-3">
          <Text className="text-rose-100 text-xs">{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View className="items-center justify-center py-6">
          <ActivityIndicator color="#34d399" />
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
                <View key={p.id} className="rounded-xl bg-slate-800 p-4">
                  <View className="flex-row items-start justify-between">
                    <Text className="text-white font-semibold">
                      Core: {p.core_fc.toFixed(1)} MPa
                    </Text>
                    <Text className="text-emerald-200 text-xs font-semibold">
                      {memberLabel} • #{idx + 1}
                    </Text>
                  </View>
                  <Text className="text-slate-400 text-xs mt-1">
                    UPV {p.upv} m/s → RH {p.rh_index}{" "}
                    {p.carbonation_depth !== null && p.carbonation_depth !== undefined
                      ? `→ Carbonation ${p.carbonation_depth} mm`
                      : ""}
                  </Text>
                  <Text className="text-slate-500 text-xs mt-1">
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
                        <Text className="text-emerald-300 text-xs">Edit</Text>
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
                      <Text className="text-rose-300 text-xs">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {!points.length && (
              <Text className="text-slate-400 text-xs">No calibration points yet for this project.</Text>
            )}
          </View>
          <View className="mt-2">
            <Link
              href={{
                pathname: "/calibration/generate",
                params: { projectId: selectedProject || "" },
              }}
              asChild
            >
              <TouchableOpacity
                disabled={!selectedProject}
                className={`rounded-xl py-3 items-center ${
                  selectedProject ? "bg-emerald-600" : "bg-slate-700"
                }`}
                onPress={() => {
                  if (!selectedProject) {
                    Alert.alert("Select a project first");
                  }
                }}
              >
                <Text className="text-white font-semibold text-sm">Generate Model</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
