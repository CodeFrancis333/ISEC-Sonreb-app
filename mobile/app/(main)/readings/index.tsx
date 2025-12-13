import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import { Link, useRouter } from "expo-router";
import Screen from "../../../components/layout/Screen";
import { listReadings, listReadingsByProject, deleteReading, Reading } from "../../../services/readingService";
import { listProjects, Project } from "../../../services/projectService";
import { useAuthStore } from "../../../store/authStore";

export default function AllReadingsListScreen() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const proj = await listProjects(token || undefined);
        setProjects(proj);
        const first = proj[0]?.id || null;
        setSelectedProjectId((prev) => prev || first);
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          await useAuthStore.getState().clearAuth();
          router.replace("/(auth)/login");
          return;
        }
        setError(err.message || "Unable to load readings.");
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [token]);

  useEffect(() => {
    async function loadReadings() {
      if (!selectedProjectId) {
        setReadings([]);
        return;
      }
      try {
        setLoading(true);
        const data = await listReadingsByProject(selectedProjectId, token || undefined);
        setReadings(data);
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          await useAuthStore.getState().clearAuth();
          router.replace("/(auth)/login");
          return;
        }
        setError(err.message || "Unable to load readings.");
      } finally {
        setLoading(false);
      }
    }
    loadReadings();
  }, [selectedProjectId, token, router]);

  return (
    <Screen showNav>
      <View className="mb-4">
        <Text className="text-xs text-emerald-400 uppercase">Readings</Text>
        <Text className="text-xl font-bold text-white">All Readings</Text>
        <Text className="text-slate-400 text-xs mt-1">Browse all saved readings across projects.</Text>
      </View>

      <View className="mb-3">
        <Text className="text-slate-200 text-sm mb-1">Select Project Folder</Text>
        <TouchableOpacity
          onPress={() => setShowProjectPicker((prev) => !prev)}
          className="border border-slate-600 rounded-lg px-3 py-3 bg-slate-800"
        >
          <Text className="text-slate-100 text-xs">
            {projects.find((p) => p.id === selectedProjectId)?.name || "Choose project"}
          </Text>
        </TouchableOpacity>
        {showProjectPicker && (
          <View className="mt-2 border border-slate-600 rounded-lg bg-slate-800">
            <TextInput
              placeholder="Search project"
              placeholderTextColor="#94a3b8"
              value={projectSearch}
              onChangeText={setProjectSearch}
              className="px-3 py-2 text-slate-100 text-xs border-b border-slate-700"
            />
            <ScrollView style={{ maxHeight: 220 }}>
              {projects
                .filter((p) => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                .map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setSelectedProjectId(p.id);
                      setShowProjectPicker(false);
                    }}
                    className="px-3 py-2"
                  >
                    <Text className="text-slate-100 text-xs">{p.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}
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
            {readings.map((reading) => (
              <View key={reading.id}>
                <Link
                  href={{
                    pathname: "/readings/[id]",
                    params: { id: reading.id },
                  }}
                  asChild
                >
                  <TouchableOpacity className="rounded-xl bg-slate-800 p-4 active:bg-slate-700">
                    <Text className="text-white font-semibold">
                      {(() => {
                        const projectName = ((reading as any).project_name as string) || reading.project;
                        const memberDisplay =
                          ((reading as any).member_label as string) ||
                          (reading as any).member_text ||
                          (reading as any).member ||
                          undefined;
                        const location = (reading as any).location_tag as string | undefined;
                        const parts = [projectName];
                        if (memberDisplay) parts.push(memberDisplay);
                        if (location && location !== memberDisplay) parts.push(location);
                        return parts.join(" - ");
                      })()}
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        reading.rating === "GOOD"
                          ? "text-emerald-300"
                          : reading.rating === "FAIR"
                          ? "text-amber-300"
                          : "text-rose-300"
                      }`}
                    >
                      fc' est. {reading.estimated_fc.toFixed(1)} MPa • {reading.rating}
                    </Text>
                    <Text className="text-slate-500 text-xs mt-2">Model: {reading.model_used}</Text>
                  </TouchableOpacity>
                </Link>
                <View className="flex-row gap-4 mt-1">
                  <Link
                    href={{
                      pathname: "/readings/edit",
                      params: {
                        id: reading.id,
                        projectId: (reading as any).project || "",
                        memberId: (reading as any).member || "",
                        upv: String(reading.upv),
                        rh: String(reading.rh_index),
                        carbonation:
                          (reading as any).carbonation_depth !== null &&
                          (reading as any).carbonation_depth !== undefined
                            ? String((reading as any).carbonation_depth)
                            : "",
                        location_tag: (reading as any).location_tag || "",
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
                        "Delete reading?",
                        "Are you sure you want to delete this reading?",
                        [
                          {
                            text: "Yes",
                            style: "default",
                            onPress: async () => {
                              try {
                                await deleteReading(reading.id, token || undefined);
                                setReadings((prev) => prev.filter((r) => r.id !== reading.id));
                              } catch (err: any) {
                                Alert.alert("Delete failed", err?.message || "Unable to delete reading.");
                              }
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
            ))}
            {!readings.length && <Text className="text-slate-400 text-xs">No readings yet.</Text>}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
