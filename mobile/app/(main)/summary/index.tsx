import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Screen from "../../../components/layout/Screen";
import { useAuthStore } from "../../../store/authStore";
import {
  getProjectHistogram,
  getProjectRatings,
  getProjectSummary,
  listProjects,
  HistogramResponse,
  Project,
  RatingsDistribution,
  ProjectSummary,
} from "../../../services/projectService";
import { PieChart } from "../../../components/charts/PieChart";
import { HistogramChart } from "../../../components/charts/HistogramChart";

export default function ProjectSummaryScreen() {
  const { projectId: projectIdParam } = useLocalSearchParams<{ projectId?: string }>();
  const { token } = useAuthStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [ratings, setRatings] = useState<RatingsDistribution | null>(null);
  const [histogram, setHistogram] = useState<HistogramResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const projectList = await listProjects(token || undefined);
        setProjects(projectList);

        const initialId =
          (projectIdParam as string | undefined) ||
          projectList[0]?.id ||
          null;
        setSelectedProject(initialId);

        if (initialId) {
          await fetchStats(initialId);
        }
      } catch (err: any) {
        setError(err.message || "Unable to load projects.");
      }
    }
    init();
  }, [projectIdParam, token]);

  const pieSegments = useMemo(() => {
    if (!ratings) return [];
    return [
      { label: "Good", value: ratings.good, color: "#34d399" },
      { label: "Fair", value: ratings.fair, color: "#fbbf24" },
      { label: "Poor", value: ratings.poor, color: "#f87171" },
    ];
  }, [ratings]);

  async function fetchStats(projectId: string) {
    setLoading(true);
    setError(null);
    try {
      const [summaryResp, ratingsResp, histogramResp] = await Promise.all([
        getProjectSummary(projectId, token || undefined),
        getProjectRatings(projectId, token || undefined),
        getProjectHistogram(projectId, 2, token || undefined),
      ]);
      setSummary(summaryResp);
      setRatings(ratingsResp);
      setHistogram(histogramResp);
    } catch (err: any) {
      setError(err.message || "Failed to load stats.");
    } finally {
      setLoading(false);
    }
  }

  const selectedProjectName =
    projects.find((p) => p.id === selectedProject)?.name || "Select a project";

  return (
    <Screen>
      <ScrollView className="flex-1">
        <Text className="text-xs text-emerald-400 uppercase">
          Project Summary
        </Text>
        <Text className="text-xl font-bold text-white mb-1">
          Strength Overview
        </Text>
        <Text className="text-slate-400 text-xs mb-4">
          ACI-aligned SonReb analytics: ratings + strength distribution.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {projects.map((project) => (
              <TouchableOpacity
                key={project.id}
                className={`px-3 py-2 rounded-full border ${
                  selectedProject === project.id
                    ? "bg-emerald-600 border-emerald-500"
                    : "border-slate-600"
                }`}
                onPress={() => {
                  setSelectedProject(project.id);
                  fetchStats(project.id);
                }}
              >
                <Text
                  className={`text-sm ${
                    selectedProject === project.id ? "text-white" : "text-slate-200"
                  }`}
                >
                  {project.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {loading && (
          <View className="items-center justify-center py-8">
            <ActivityIndicator color="#34d399" />
          </View>
        )}

        {error && (
          <View className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-3 mb-4">
            <Text className="text-rose-100 text-sm">{error}</Text>
          </View>
        )}

        {!loading && !error && summary && (
          <>
            <View className="rounded-xl bg-slate-800 p-4 mb-3">
              <Text className="text-slate-400 text-xs mb-1">
                {selectedProjectName}
              </Text>
              <Text className="text-white text-3xl font-semibold mb-1">
                {summary.avg_fc ? summary.avg_fc.toFixed(1) : "--"} MPa
              </Text>
              <Text className="text-slate-400 text-xs">
                {summary.readings_count} readings · min{" "}
                {summary.min_fc !== null ? summary.min_fc.toFixed(1) : "--"} · max{" "}
                {summary.max_fc !== null ? summary.max_fc.toFixed(1) : "--"}
              </Text>
            </View>

            <View className="rounded-xl bg-slate-800 p-4 mb-3">
              <Text className="text-slate-300 text-sm mb-3">Rating mix</Text>
              <PieChart segments={pieSegments} size={180} />
              <View className="flex-row justify-around mt-3">
                <Text className="text-emerald-300 text-sm">
                  GOOD {ratings?.good ?? 0}
                </Text>
                <Text className="text-amber-300 text-sm">
                  FAIR {ratings?.fair ?? 0}
                </Text>
                <Text className="text-red-300 text-sm">
                  POOR {ratings?.poor ?? 0}
                </Text>
              </View>
            </View>

            <View className="rounded-xl bg-slate-800 p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-slate-300 text-sm">
                  fc' histogram (2 MPa bins)
                </Text>
                <Text className="text-slate-400 text-xs">
                  {histogram?.bins.length ?? 0} bins
                </Text>
              </View>
              {histogram && histogram.bins.length > 0 ? (
                <HistogramChart bins={histogram.bins} />
              ) : (
                <Text className="text-slate-400 text-xs">
                  No readings yet for this project.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
