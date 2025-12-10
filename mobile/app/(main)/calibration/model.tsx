import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAuthStore } from "../../../store/authStore";
import Screen from "../../../components/layout/Screen";
import {
  getCalibrationDiagnostics,
  CalibrationDiagnostics,
} from "../../../services/calibrationService";
import { useLocalSearchParams } from "expo-router";
import { ScatterChart } from "../../../components/charts/ScatterChart";
import { API_BASE_URL } from "../../../constants";

export default function ActiveModelSummaryScreen() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const { token } = useAuthStore();
  const [diagnostics, setDiagnostics] = useState<CalibrationDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

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

  const equation = model
    ? `fc' = ${model.a0.toFixed(3)} + ${model.a1.toFixed(4)}*RH + ${model.a2.toFixed(
        4
      )}*UPV${model.use_carbonation && model.a3 ? ` + ${model.a3.toFixed(4)}*cd` : ""}`
    : "";

  async function exportPdf() {
    if (!projectId) return;
    setExporting(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/projects/${projectId}/reports/summary/`;
      const localUri = `${FileSystem.cacheDirectory}sonreb-report-${projectId}.pdf`;
      await FileSystem.downloadAsync(url, localUri, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await Sharing.shareAsync(localUri, {
        mimeType: "application/pdf",
        dialogTitle: "Share SONREB report",
      });
    } catch (err: any) {
      setError(err.message || "Failed to export PDF.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen>
      <ScrollView className="flex-1">
        <Text className="text-xs text-emerald-400 uppercase">Active Model</Text>
        <Text className="text-xl font-bold text-white mb-1">
          Calibration Regression
        </Text>
        <Text className="text-slate-400 text-xs mb-4">
          Scatter vs y=x line shows bias/outliers. R²/RMSE from latest fit.
        </Text>

        <View className="flex-row mb-4">
          <TouchableOpacity
            onPress={exportPdf}
            disabled={exporting || !projectId}
            className={`px-3 py-2 rounded-lg ${
              exporting ? "bg-slate-700" : "bg-emerald-600"
            }`}
          >
            <Text className="text-white text-sm font-semibold">
              {exporting ? "Exporting..." : "Export PDF report"}
            </Text>
          </TouchableOpacity>
        </View>

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
              <Text className="text-slate-300 text-sm mb-1">Equation</Text>
              <Text className="text-slate-100 text-xs font-mono">{equation}</Text>
              <Text className="text-slate-400 text-xs mt-2">
                Points used: {model.points_used} · R² {model.r2.toFixed(3)} · RMSE{" "}
                {model.rmse ? model.rmse.toFixed(2) : "--"} MPa
              </Text>
            </View>

            <View className="rounded-xl bg-slate-800 p-4 mb-3">
              <Text className="text-slate-300 text-sm mb-3">
                Calibration fit (measured vs predicted)
              </Text>
              {scatterPoints.length > 0 ? (
                <ScatterChart points={scatterPoints} />
              ) : (
                <Text className="text-slate-400 text-xs">
                  Add calibration points and generate a model to see the fit.
                </Text>
              )}
            </View>

            <View className="rounded-xl bg-slate-800 p-4">
              <Text className="text-slate-300 text-sm mb-2">Calibrated ranges</Text>
              <Text className="text-slate-200 text-xs">
                UPV: {model.upv_min ?? "--"} – {model.upv_max ?? "--"}
              </Text>
              <Text className="text-slate-200 text-xs">
                RH index: {model.rh_min ?? "--"} – {model.rh_max ?? "--"}
              </Text>
              {model.use_carbonation && (
                <Text className="text-slate-200 text-xs">
                  Carbonation depth: {model.carbonation_min ?? "--"} –{" "}
                  {model.carbonation_max ?? "--"}
                </Text>
              )}
              <Text className="text-slate-400 text-xs mt-2">
                Inputs outside these ranges will be rejected per ACI guardrails.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
