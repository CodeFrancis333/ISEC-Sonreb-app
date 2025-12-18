import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Text, ScrollView, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Screen from "../../../components/layout/Screen";
import { getReading, Reading } from "../../../services/readingService";
import { getProject, listMembers, Member } from "../../../services/projectService";
import { getActiveModel, CalibrationModel } from "../../../services/calibrationService";
import { useAuthStore } from "../../../store/authStore";

type R2Bucket = { label: string; desc: string; color: string };

function r2Bucket(r2?: number | null): R2Bucket {
  if (r2 === undefined || r2 === null) return { label: "N/A", desc: "No correlation info", color: "text-slate-400" };
  if (r2 >= 0.9) return { label: "Excellent (0.90–1.00)", desc: "High confidence; best", color: "text-emerald-300" };
  if (r2 >= 0.8) return { label: "Very Good (0.80–0.89)", desc: "Acceptable; typical goal", color: "text-emerald-200" };
  if (r2 >= 0.7) return { label: "Fair (0.70–0.79)", desc: "Marginal; use with caution", color: "text-amber-300" };
  return { label: "Poor (<0.70)", desc: "Unreliable; collect more data", color: "text-rose-300" };
}

function ratingColor(rating?: string) {
  if (rating === "GOOD") return "text-emerald-300";
  if (rating === "FAIR") return "text-amber-300";
  if (rating === "POOR") return "text-rose-300";
  return "text-slate-300";
}

export default function ReadingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuthStore();

  const [reading, setReading] = useState<Reading | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [memberName, setMemberName] = useState<string>("");
  const [model, setModel] = useState<CalibrationModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getReading(id, token || undefined);
      setReading(data);

      getProject(data.project, token || undefined)
        .then((p) => setProjectName(p.name))
        .catch(() => {});

      if (data.member) {
        listMembers(data.project, token || undefined)
          .then((members) => {
            const m = members.find((x: Member) => String(x.id) === String(data.member));
            if (m) setMemberName(m.member_id);
          })
          .catch(() => {});
      } else {
        setMemberName("");
      }

      getActiveModel(data.project, token || undefined)
        .then((m) => setModel(m))
        .catch(() => {});
    } catch (err: any) {
      setError(err?.message || "Unable to load reading.");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const memberLabel =
    memberName ||
    (reading as any)?.member_label ||
    (reading as any)?.member_text ||
    (reading as any)?.member ||
    "Reading";
  const title = projectName
    ? `${projectName} • ${memberLabel}${reading?.location_tag ? ` • ${reading.location_tag}` : ""}`
    : `${memberLabel}${reading?.location_tag ? ` • ${reading.location_tag}` : ""}`;

  const computedFromModel = useMemo(() => {
    if (!model || !reading) return null;
    let est = model.a0 * Math.pow(reading.upv, model.a1) * Math.pow(reading.rh_index, model.a2);
    if (model.use_carbonation && model.a3 && reading.carbonation_depth) {
      est *= Math.pow(reading.carbonation_depth, model.a3);
    }
    return est;
  }, [model, reading]);

  const eqString = model
    ? `fc = ${model.a0.toFixed(4)} · UPV^${model.a1.toFixed(3)} · RH^${model.a2.toFixed(3)}${
        model.use_carbonation && model.a3 ? ` · Carb^${model.a3.toFixed(3)}` : ""
      }`
    : "fc = 0.005·UPV + 0.25·RH (default)";

  const r2 = model?.r2 ?? null;
  const r2Info = r2Bucket(r2);

  return (
    <Screen showNav>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }}>
        <Text className="text-xs text-emerald-400 uppercase mb-1">Reading Detail</Text>
        <Text className="text-xl font-bold text-white mb-1">{title}</Text>
        <Text className="text-slate-400 text-xs mb-4">Reading ID: {id}</Text>

        {loading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator color="#34d399" />
          </View>
        ) : error ? (
          <Text className="text-rose-300 text-sm">{error}</Text>
        ) : reading ? (
          <>
            <View className="rounded-xl bg-slate-800 p-4 mb-3">
              <Text className="text-slate-300 text-sm mb-1">Estimated fc'</Text>
              <Text className={`text-white text-2xl font-semibold mb-1 ${ratingColor(reading.rating)}`}>
                {(reading.estimated_fc ?? 0).toFixed(2)} MPa
              </Text>
              <Text className="text-slate-400 text-xs">
                Rating: <Text className={ratingColor(reading.rating)}>{reading.rating}</Text> • Model: {reading.model_used}
              </Text>
            </View>

            <View className="rounded-xl bg-slate-800 p-4 mb-3">
              <Text className="text-slate-300 text-sm mb-2">Equation & Computation</Text>
              <Text className="text-slate-200 text-xs mb-1">Equation: {eqString}</Text>
              <Text className="text-slate-400 text-xs">
                Inputs → UPV {reading.upv} m/s, RH {reading.rh_index}
                {reading.carbonation_depth ? `, Carb ${reading.carbonation_depth} mm` : ""}
              </Text>
              <Text className="text-slate-200 text-xs mt-1">
                Computation → fc_est = {model ? computedFromModel?.toFixed(2) ?? "N/A" : (reading.estimated_fc ?? 0).toFixed(2)} MPa
              </Text>
              {model ? (
                <Text className="text-slate-400 text-xs mt-1">
                  r² {r2?.toFixed(2) ?? "N/A"} • RMSE {model.rmse?.toFixed(2) ?? "N/A"} MPa • Points {model.points_used} • Carbonation:{" "}
                  {model.use_carbonation ? "Yes" : "No"}
                </Text>
              ) : null}
            </View>

            <View className="rounded-xl bg-slate-800 p-4 mb-3">
              <Text className="text-slate-300 text-sm mb-2">Inputs</Text>
              <Text className="text-slate-400 text-xs">UPV: {reading.upv} m/s • RH: {reading.rh_index}</Text>
              {reading.carbonation_depth !== null && reading.carbonation_depth !== undefined ? (
                <Text className="text-slate-400 text-xs mt-1">Carbonation: {reading.carbonation_depth} mm</Text>
              ) : null}
              {reading.location_tag ? (
                <Text className="text-slate-500 text-xs mt-2">Location: {reading.location_tag}</Text>
              ) : null}
            </View>

            <View className="rounded-xl bg-slate-800 p-4 mb-3">
              <Text className="text-slate-300 text-sm mb-2">Rating Brackets</Text>
              <Text className="text-emerald-300 text-xs">GOOD: ratio ≥ 0.85 (or ≥21 MPa if no design fc)</Text>
              <Text className="text-amber-300 text-xs">FAIR: ratio ≥ 0.70 (or ≥17 MPa if no design fc)</Text>
              <Text className="text-rose-300 text-xs">POOR: below those thresholds</Text>
            </View>

            <View className="rounded-xl bg-slate-800 p-4 mb-4">
              <Text className="text-slate-300 text-sm mb-1">Model Reliability</Text>
              <Text className={`${r2Info.color} text-xs`}>{r2Info.label}</Text>
              <Text className="text-slate-400 text-xs">{r2Info.desc}</Text>
            </View>
          </>
        ) : (
          <Text className="text-slate-400 text-sm">No data.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}
