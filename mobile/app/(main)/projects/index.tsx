import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import Screen from "../../../components/layout/Screen";
import { listProjects, Project, deleteProject } from "../../../services/projectService";
import { useAuthStore } from "../../../store/authStore";
import { Alert } from "react-native";
import { useThemeStore, getThemeColors } from "../../../store/themeStore";

export default function ProjectsListScreen() {
  const { token } = useAuthStore();
  const router = useRouter();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);
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
          <Text className="text-xs uppercase" style={{ color: theme.accent }}>
            Projects
          </Text>
          <Text className="text-xl font-bold" style={{ color: theme.textPrimary }}>
            All Projects
          </Text>
        </View>
        <Link href="/projects/new" asChild>
          <TouchableOpacity className="rounded-xl px-3 py-2" style={{ backgroundColor: theme.accent }}>
            <Text className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
              + New
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      {error ? (
        <View
          className="rounded-lg p-3 mb-3"
          style={{ backgroundColor: `${theme.error}22`, borderColor: theme.error, borderWidth: 1 }}
        >
          <Text className="text-xs" style={{ color: theme.error }}>
            {error}
          </Text>
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
              <View key={project.id} className="rounded-xl p-4" style={{ backgroundColor: theme.surface }}>
                <Link
                  href={{
                    pathname: "/projects/[id]",
                    params: { id: project.id },
                  }}
                  asChild
                >
                  <TouchableOpacity className="rounded-lg p-1">
                    <Text className="font-semibold" style={{ color: theme.textPrimary }}>
                      {project.name}
                    </Text>
                    <Text className="text-xs mt-1" style={{ color: theme.textMuted }}>
                      {project.location}
                    </Text>
                    <Text className="text-[11px] mt-1" style={{ color: theme.textDisabled }}>
                      Age: {(project as any).structure_age ?? "--"} yrs · Lat/Long: {(project as any).latitude ?? "--"}, {(project as any).longitude ?? "--"}
                    </Text>

                    <View className="flex-row mt-3 justify-between items-center">
                      <Text className="text-xs" style={{ color: theme.textMuted }}>
                        {(project as any).readings_count ?? 0} readings
                      </Text>
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{
                          backgroundColor:
                            project.status === "calibrated"
                              ? `${theme.success}22`
                              : `${theme.warning}22`,
                        }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{
                            color:
                              project.status === "calibrated"
                                ? theme.success
                                : theme.warning,
                          }}
                        >
                          {project.status === "calibrated" ? "Calibrated" : "No model"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Link>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      "Delete project?",
                      "Are you sure you want to delete this project?",
                      [
                        {
                          text: "Yes",
                          style: "default",
                          onPress: async () => {
                            await deleteProject(project.id, token || undefined);
                            loadProjects();
                          },
                        },
                        { text: "No", style: "cancel" },
                      ]
                    );
                  }}
                  className="mt-2"
                >
                  <Text className="text-xs" style={{ color: theme.error }}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
            {!projects.length && !loading && (
              <Text className="text-xs" style={{ color: theme.textMuted }}>
                No projects yet. Tap + New to add one.
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
