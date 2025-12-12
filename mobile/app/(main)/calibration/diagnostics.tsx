import React, { useEffect, useState, useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Screen from "../../../components/layout/Screen";
import { useAuthStore } from "../../../store/authStore";
import { getCalibrationDiagnostics, CalibrationDiagnostics } from "../../../services/calibrationService";
import { ScatterChart } from "../../../components/charts/ScatterChart";
import { HistogramChart } from "../../../components/charts/HistogramChart";
import { HistogramBin } from "../../../services/projectService";

function buildResidualBins(residuals: number[], binCount = 8): HistogramBin[] {
  if (!residuals.length) return [];
  const minVal = Math.min(...residuals);
  const maxVal = Math.max(...residuals);
  const span = maxVal - minVal || 1;
  const step = span / binCount;
  const bins: HistogramBin[] = [];
  for (let i = 0; i < binCount; i++) {
    const lower = minVal + i * step;
    const upper = i === binCount - 1 ? maxVal : minVal + (i + 1) * step;
    bins.push({ lower, upper, count: 0 });
  }
  residuals.forEach((r) => {
    let idx = Math.floor(((r - minVal) / span) * binCount);
    if (idx >= binCount) idx = binCount - 1;
    if (idx < 0) idx = 0;
    bins[idx].count += 1;
  });
  return bins;
}

export default function CalibrationDiagnosticsScreen() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const { token } = useAuthStore();
  const [diag, setDiag] = useState<CalibrationDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!projectId) return;
      try {
        setLoading(true);
        const data = await getCalibrationDiagnostics(projectId, token || undefined);
        setDiag(data);
      } catch (err: any) {
        setError(err?.message || "Unable to load diagnostics.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId, token]);

  const scatterPoints = useMemo(
    () =>
      diag?.points.map((p) => ({
        x: p.predicted_fc,
        y: p.measured_fc,
      })) || [],
    [diag]
  );

  const residualBins = useMemo(() => {
    if (!diag?.points?.length) return [];
    const residuals = diag.points.map((p) => p.predicted_fc - p.measured_fc);
    return buildResidualBins(residuals, 8);
  }, [diag]);

  return (
    <Screen showNav>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <Text className="text-xs text-emerald-400 uppercase">Calibration</Text>
        <Text className="text-xl font-bold text-white mb-1">Diagnostics</Text>
        <Text className="text-slate-400 text-xs mb-4">
          Predicted vs measured strengths and residuals for the active model.
        </Text>

        {loading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator color="#34d399" />
          </View>
        ) : error ? (
          <Text className="text-rose-300 text-sm">{error}</Text>
        ) : diag ? (
          <>
            <View className="rounded-xl bg-slate-800 p-4 mb-4">
              <Text className="text-slate-300 text-sm mb-1">Active Model</Text>
              <Text className="text-white text-base font-semibold">
                r² {diag.model.r2.toFixed(2)} • RMSE {diag.model.rmse?.toFixed(2) ?? "--"} MPa
              </Text>
              <Text className="text-slate-400 text-xs mt-1">
                Points used: {diag.model.points_used} • Carbonation: {diag.model.use_carbonation ? "Yes" : "No"}
              </Text>
              <Text className="text-slate-500 text-[11px] mt-1">
                UPV {diag.model.upv_min ?? "--"}–{diag.model.upv_max ?? "--"} m/s • RH {diag.model.rh_min ?? "--"}–{diag.model.rh_max ?? "--"}
              </Text>
            </View>

            <View className="rounded-xl bg-slate-800 p-4 mb-4">
              <Text className="text-slate-300 text-sm mb-2">Predicted vs Measured</Text>
              {scatterPoints.length ? (
                <ScatterChart points={scatterPoints} />
              ) : (
                <Text className="text-slate-400 text-xs">No points available.</Text>
              )}
            </View>

            <View className="rounded-xl bg-slate-800 p-4">
              <Text className="text-slate-300 text-sm mb-2">Residuals (Predicted - Measured)</Text>
              {residualBins.length ? (
                <HistogramChart bins={residualBins} />
              ) : (
                <Text className="text-slate-400 text-xs">No residuals available.</Text>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
