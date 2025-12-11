import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import Screen from "../../../components/layout/Screen";
import { listProjects, Project, deleteProject } from "../../../services/projectService";
import { useAuthStore } from "../../../store/authStore";

export default function ProjectsListScreen() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listProjects(token || undefined);
      setProjects(data);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        await useAuthStore.getState().clearAuth();
        router.replace("/(auth)/login");
        return;
      }
      setError(err.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, [router, token]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects])
  );

  return (
    <Screen showNav>
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-xs text-emerald-400 uppercase">
            Projects
          </Text>
          <Text className="text-xl font-bold text-white">
            All Projects
          </Text>
        </View>
        <Link href="/projects/new" asChild>
          <TouchableOpacity className="rounded-xl bg-emerald-600 px-3 py-2">
            <Text className="text-white text-sm font-semibold">+ New</Text>
          </TouchableOpacity>
        </Link>
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
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 150 }}
        >
          <View className="gap-3">
            {projects.map((project) => (
              <View key={project.id} className="rounded-xl bg-slate-800 p-4">
                <Link
                  href={{
                    pathname: "/projects/[id]",
                    params: { id: project.id },
                  }}
                  asChild
                >
                  <TouchableOpacity className="active:bg-slate-700 rounded-lg p-1">
                    <Text className="text-white font-semibold">
                      {project.name}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-1">
                      {project.location}
                    </Text>

                    <View className="flex-row mt-3 justify-between items-center">
                      <Text className="text-xs text-slate-400">
                        {(project as any).readings_count ?? 0} readings
                      </Text>
                      <View
                        className={`px-2 py-1 rounded-full ${
                          project.status === "calibrated"
                            ? "bg-emerald-500/20"
                            : "bg-amber-500/10"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            project.status === "calibrated"
                              ? "text-emerald-300"
                              : "text-amber-300"
                          }`}
                        >
                          {project.status === "calibrated" ? "Calibrated" : "No model"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Link>
                <TouchableOpacity
                  onPress={async () => {
                    await deleteProject(project.id, token || undefined);
                    loadProjects();
                  }}
                  className="mt-2"
                >
                  <Text className="text-rose-300 text-xs">Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
            {!projects.length && !loading && (
              <Text className="text-slate-400 text-xs">No projects yet. Tap + New to add one.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
