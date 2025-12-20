import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Text, ScrollView, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Screen from "../../../components/layout/Screen";
import { getReading, Reading } from "../../../services/readingService";
import { getProject, listMembers, Member } from "../../../services/projectService";
import { getActiveModel, CalibrationModel } from "../../../services/calibrationService";
import { useAuthStore } from "../../../store/authStore";
import { getThemeColors, useThemeStore } from "../../../store/themeStore";

type R2Bucket = { label: string; desc: string; color: string };

type ThemeColors = ReturnType<typeof getThemeColors>;

function r2Bucket(r2: number | null | undefined, theme: ThemeColors): R2Bucket {
  if (r2 === undefined || r2 === null) {
    return { label: "N/A", desc: "No correlation info", color: theme.textSecondary };
  }
  if (r2 >= 0.9) {
    return { label: "Excellent (0.90-1.00)", desc: "High confidence; best", color: theme.success };
  }
  if (r2 >= 0.8) {
    return { label: "Very Good (0.80-0.89)", desc: "Acceptable; typical goal", color: theme.success };
  }
  if (r2 >= 0.7) {
    return { label: "Fair (0.70-0.79)", desc: "Marginal; use with caution", color: theme.warning };
  }
  return { label: "Poor (<0.70)", desc: "Unreliable; collect more data", color: theme.error };
}

function ratingColor(rating: string | undefined, theme: ThemeColors) {
  if (rating === "GOOD") return theme.success;
  if (rating === "FAIR") return theme.warning;
  if (rating === "POOR") return theme.error;
  return theme.textSecondary;
}

export default function ReadingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuthStore();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);

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
    ? `${projectName} - ${memberLabel}${reading?.location_tag ? ` - ${reading.location_tag}` : ""}`
    : `${memberLabel}${reading?.location_tag ? ` - ${reading.location_tag}` : ""}`;

  const computedFromModel = useMemo(() => {
    if (!model || !reading) return null;
    let est = model.a0 * Math.pow(reading.upv, model.a1) * Math.pow(reading.rh_index, model.a2);
    if (model.use_carbonation && model.a3 && reading.carbonation_depth) {
      est *= Math.pow(reading.carbonation_depth, model.a3);
    }
    return est;
  }, [model, reading]);

  const eqString = model
    ? `fc = ${model.a0.toFixed(4)} * UPV^${model.a1.toFixed(3)} * RH^${model.a2.toFixed(3)}${
        model.use_carbonation && model.a3 ? ` * Carb^${model.a3.toFixed(3)}` : ""
      }`
    : "fc = 0.005*UPV + 0.25*RH (default)";

  const r2 = model?.r2 ?? null;
  const r2Info = r2Bucket(r2, theme);

  return (
    <Screen showNav>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }}>
        <Text className="text-xs uppercase mb-1" style={{ color: theme.accent }}>
          Reading Detail
        </Text>
        <Text className="text-xl font-bold mb-1" style={{ color: theme.textPrimary }}>
          {title}
        </Text>
        <Text className="text-xs mb-4" style={{ color: theme.textSecondary }}>
          Reading ID: {id}
        </Text>

        {loading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : error ? (
          <Text className="text-sm" style={{ color: theme.error }}>
            {error}
          </Text>
        ) : reading ? (
          <>
            <View className="rounded-xl p-4 mb-3" style={{ backgroundColor: theme.surface }}>
              <Text className="text-sm mb-1" style={{ color: theme.textSecondary }}>
                Estimated fc'
              </Text>
              <Text className="text-2xl font-semibold mb-1" style={{ color: ratingColor(reading.rating, theme) }}>
                {(reading.estimated_fc ?? 0).toFixed(2)} MPa
              </Text>
              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                Rating: <Text style={{ color: ratingColor(reading.rating, theme) }}>{reading.rating}</Text> | Model: {reading.model_used}
              </Text>
            </View>

            <View className="rounded-xl p-4 mb-3" style={{ backgroundColor: theme.surface }}>
              <Text className="text-sm mb-2" style={{ color: theme.textSecondary }}>
                Equation & Computation
              </Text>
              <Text className="text-xs mb-1" style={{ color: theme.textPrimary }}>
                Equation: {eqString}
              </Text>
              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                Inputs - UPV {reading.upv} m/s, RH {reading.rh_index}
                {reading.carbonation_depth ? `, Carb ${reading.carbonation_depth} mm` : ""}
              </Text>
              <Text className="text-xs mt-1" style={{ color: theme.textPrimary }}>
                Computation - fc_est = {model ? computedFromModel?.toFixed(2) ?? "N/A" : (reading.estimated_fc ?? 0).toFixed(2)} MPa
              </Text>
              {model ? (
                <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                  r2 {r2?.toFixed(2) ?? "N/A"} | RMSE {model.rmse?.toFixed(2) ?? "N/A"} MPa | Points {model.points_used} | Carbonation: {model.use_carbonation ? "Yes" : "No"}
                </Text>
              ) : null}
            </View>

            <View className="rounded-xl p-4 mb-3" style={{ backgroundColor: theme.surface }}>
              <Text className="text-sm mb-2" style={{ color: theme.textSecondary }}>
                Inputs
              </Text>
              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                UPV: {reading.upv} m/s | RH: {reading.rh_index}
              </Text>
              {reading.carbonation_depth !== null && reading.carbonation_depth !== undefined ? (
                <Text className="text-xs mt-1" style={{ color: theme.textSecondary }}>
                  Carbonation: {reading.carbonation_depth} mm
                </Text>
              ) : null}
              {reading.location_tag ? (
                <Text className="text-xs mt-2" style={{ color: theme.textMuted }}>
                  Location: {reading.location_tag}
                </Text>
              ) : null}
            </View>

            <View className="rounded-xl p-4 mb-3" style={{ backgroundColor: theme.surface }}>
              <Text className="text-sm mb-2" style={{ color: theme.textSecondary }}>
                Rating Brackets
              </Text>
              <Text className="text-xs" style={{ color: theme.success }}>
                GOOD: ratio greater or equal 0.85 (or 21 MPa if no design fc)
              </Text>
              <Text className="text-xs" style={{ color: theme.warning }}>
                FAIR: ratio greater or equal 0.70 (or 17 MPa if no design fc)
              </Text>
              <Text className="text-xs" style={{ color: theme.error }}>
                POOR: below those thresholds
              </Text>
            </View>

            <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: theme.surface }}>
              <Text className="text-sm mb-1" style={{ color: theme.textSecondary }}>
                Model Reliability
              </Text>
              <Text className="text-xs" style={{ color: r2Info.color }}>
                {r2Info.label}
              </Text>
              <Text className="text-xs" style={{ color: theme.textSecondary }}>
                {r2Info.desc}
              </Text>
            </View>
          </>
        ) : (
          <Text className="text-sm" style={{ color: theme.textSecondary }}>
            No data.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
