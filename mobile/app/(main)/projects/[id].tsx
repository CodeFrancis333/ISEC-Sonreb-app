import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Link, useRouter } from "expo-router";
import Screen from "../../../components/layout/Screen";
import { getProject, Project } from "../../../services/projectService";
import { useAuthStore } from "../../../store/authStore";

const TABS = ["Overview", "Members", "Calibration"];

export default function ProjectOverviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getProject(id as string, token || undefined);
        setProject(data);
      } catch (err: any) {
        setError(err.message || "Unable to load project.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, token]);

  return (
    <Screen>
      <View className="mb-4">
        <Text className="text-xs text-emerald-400 uppercase">Project</Text>
        <Text className="text-xl font-bold text-white">
          {project?.name || "Project"}
        </Text>
        <Text className="text-slate-400 text-xs mt-1">
          {project?.location || ""} • ID: {id}
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        <View className="flex-row gap-2">
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-full border ${
                  isActive
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-700 bg-slate-800/80"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isActive ? "text-emerald-300" : "text-slate-300"
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {error ? (
        <View className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-3 mb-3">
          <Text className="text-rose-100 text-xs">{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View className="items-center justify-center py-8">
          <ActivityIndicator color="#34d399" />
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {activeTab === "Overview" && (
            <View className="gap-3">
              <View className="rounded-xl bg-slate-800 p-4">
                <Text className="text-slate-300 text-sm mb-1">Design fc'</Text>
                <Text className="text-white text-xl font-semibold">
                  {project?.design_fc ? `${project.design_fc} MPa` : "--"}
                </Text>
              </View>
              <View className="rounded-xl bg-slate-800 p-4">
                <Text className="text-slate-300 text-sm mb-1">
                  Active Model
                </Text>
                <Text className="text-white text-base font-semibold">
                  {project?.status === "calibrated" ? "Calibrated" : "No model yet"}
                </Text>
                <Text className="text-slate-400 text-xs mt-2">
                  Add calibration points and generate a model to activate project-specific SonReb coefficients.
                </Text>
              </View>
            </View>
          )}

          {activeTab === "Members" && (
            <View className="gap-3">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-slate-200 font-semibold">Members</Text>
                <Link href="/projects/members/new" asChild>
                  <TouchableOpacity className="rounded-xl bg-emerald-600 px-3 py-2">
                    <Text className="text-white text-xs font-semibold">
                      + New Member
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <Text className="text-slate-400 text-xs">
                Members list not implemented yet.
              </Text>
            </View>
          )}

          {activeTab === "Calibration" && (
            <View className="gap-3">
              <Link href="/calibration" asChild>
                <TouchableOpacity className="rounded-xl bg-slate-800 p-4 active:bg-slate-700">
                  <Text className="text-white font-semibold mb-1">
                    Calibration Points
                  </Text>
                  <Text className="text-slate-400 text-xs">
                    View all core strengths and regression status.
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
