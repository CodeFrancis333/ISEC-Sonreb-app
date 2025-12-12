import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useAuthStore } from "../../../store/authStore";
import Screen from "../../../components/layout/Screen";
import {
  getCalibrationDiagnostics,
  CalibrationDiagnostics,
} from "../../../services/calibrationService";
import { useLocalSearchParams } from "expo-router";
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

export default function ActiveModelSummaryScreen() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const { token } = useAuthStore();
  const [diagnostics, setDiagnostics] = useState<CalibrationDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const diag = await getCalibrationDiagnostics(projectId, token || undefined);
      setDiagnostics(diag);
    } catch (err: any) {
      setError(err.message || "Failed to load model diagnostics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [projectId, token]);

  const model = diagnostics?.model;
  const scatterPoints = useMemo(
    () =>
      diagnostics?.points.map((p) => ({
        x: p.predicted_fc,
        y: p.measured_fc,
      })) || [],
    [diagnostics]
  );

  const residualBins = useMemo(() => {
    if (!diagnostics?.points?.length) return [];
    const residuals = diagnostics.points.map((p) => p.predicted_fc - p.measured_fc);
    return buildResidualBins(residuals, 8);
  }, [diagnostics]);

  const equation =
    model && model.use_carbonation && model.a3
      ? `fc' = ${model.a0.toFixed(3)} * RH^${model.a1.toFixed(3)} * UPV^${model.a2.toFixed(
          3
        )} * cd^${model.a3.toFixed(3)}`
      : model
      ? `fc' = ${model.a0.toFixed(3)} * RH^${model.a1.toFixed(3)} * UPV^${model.a2.toFixed(3)}`
      : "";

  return (
    <Screen showNav>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        <Text className="text-xs text-emerald-400 uppercase">Calibration</Text>
        <Text className="text-xl font-bold text-white mb-1">Active Model</Text>
        <Text className="text-slate-400 text-xs mb-4">
          Scatter vs y=x shows bias/outliers. Power-law coefficients and residuals included.
        </Text>

        {loading && (
          <View className="items-center justify-center py-8">
            <ActivityIndicator color="#34d399" />
          </View>
        )}

        {error && (
          <View className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-3 mb-4">
            <Text className="text-rose-100 text-sm">{error}</Text>
            <TouchableOpacity onPress={load} className="mt-2">
              <Text className="text-emerald-300 text-xs">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && model && (
          <>
            <View className="rounded-xl bg-slate-800 p-4 mb-3">
              <Text className="text-slate-300 text-sm mb-1">Model (power-law)</Text>
              <Text className="text-white text-sm font-semibold">{equation}</Text>
              <Text className="text-slate-400 text-xs mt-1">
                r² {model.r2.toFixed(2)} • RMSE {model.rmse?.toFixed(2) ?? "--"} MPa • Points {model.points_used}
              </Text>
              <Text className="text-slate-500 text-[11px] mt-1">
                UPV {model.upv_min ?? "--"}–{model.upv_max ?? "--"} m/s • RH {model.rh_min ?? "--"}–{model.rh_max ?? "--"}
              </Text>
              <Text className="text-slate-500 text-[11px] mt-1">
                Carbonation: {model.use_carbonation ? "Yes" : "No"}
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
        )}
      </ScrollView>
    </Screen>
  );
}
