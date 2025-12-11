import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Link, useRouter, useFocusEffect } from "expo-router";
import Screen from "../../../components/layout/Screen";
import { getProject, Project, listMembers, Member, deleteMember } from "../../../services/projectService";
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
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const loadMembers = useCallback(async (projectId: string) => {
    try {
      setMembersLoading(true);
      setMembersError(null);
      const data = await listMembers(projectId, token || undefined);
      setMembers(data);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        await useAuthStore.getState().clearAuth();
        router.replace("/(auth)/login");
        return;
      }
      setMembersError(err.message || "Unable to load members.");
    } finally {
      setMembersLoading(false);
    }
  }, [router, token]);

  const loadProject = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getProject(id as string, token || undefined);
      setProject(data);
      await loadMembers(data.id || (id as string));
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        await useAuthStore.getState().clearAuth();
        router.replace("/(auth)/login");
        return;
      }
      setError(err.message || "Unable to load project.");
    } finally {
      setLoading(false);
    }
  }, [id, loadMembers, router, token]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useFocusEffect(
    useCallback(() => {
      loadMembers((project as any)?.id || (id as string));
    }, [id, loadMembers, project])
  );

  return (
    <Screen showNav>
      <View className="mb-3 px-4">
        <Text className="text-xs text-emerald-400 uppercase">Project</Text>
        <Text className="text-xl font-bold text-white">
          {project?.name || "Project"}
        </Text>
        <Text className="text-slate-400 text-xs mt-1">
          {project?.location || ""} • ID: {id}
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 px-4">
        <View className="flex-row gap-2">
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`h-10 px-4 rounded-full border items-center justify-center ${
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
      ) : activeTab === "Members" ? (
        <View className="px-4 pb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-200 font-semibold">Members</Text>
            <Link
              href={{
                pathname: "/projects/members/new",
                params: { projectId: (project as any)?.id || id || "" },
              }}
              asChild
            >
              <TouchableOpacity className="rounded-xl bg-emerald-600 px-3 py-2">
                <Text className="text-white text-xs font-semibold">
                  + New Member
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
          <Text className="text-slate-400 text-xs mb-2">
            {membersError
              ? membersError
              : !members.length
              ? "No members yet. Add one to tag readings and calibration points."
              : ""}
          </Text>
          {membersLoading ? (
            <ActivityIndicator color="#34d399" />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 9, paddingBottom: 150 }}
            >
              {members.map((m) => (
                <View key={m.id} className="rounded-xl bg-slate-800 p-4">
                  <Text className="text-white font-semibold">{m.member_id}</Text>
                  <Text className="text-slate-400 text-xs mt-1">
                    {m.type}
                    {m.level ? ` • ${m.level}` : ""}
                    {m.gridline ? ` • Grid ${m.gridline}` : ""}
                  </Text>
                  {m.notes ? (
                    <Text className="text-slate-500 text-xs mt-1">{m.notes}</Text>
                  ) : null}
                  <TouchableOpacity
                    onPress={async () => {
                      await deleteMember((project as any)?.id || (id as string), m.id, token || undefined);
                      loadMembers((project as any)?.id || (id as string));
                    }}
                    className="mt-2"
                  >
                    <Text className="text-rose-300 text-xs">Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 24,
            paddingTop: 0,
            gap: 12,
          }}
        >
          {activeTab === "Overview" && (
            <View style={{ gap: 12 }}>
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

          {activeTab === "Calibration" && (
            <View style={{ gap: 12 }}>
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
