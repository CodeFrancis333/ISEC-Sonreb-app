import React, { useEffect, useState } from "react";
import { Text, ScrollView, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Screen from "../../../components/layout/Screen";
import { getReading, Reading } from "../../../services/readingService";
import { useAuthStore } from "../../../store/authStore";

export default function ReadingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuthStore();
  const [reading, setReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getReading(id, token || undefined);
        setReading(data);
      } catch (err: any) {
        setError(err?.message || "Unable to load reading.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, token]);

  const memberLabel = (reading as any)?.member_name || (reading as any)?.member || "N/A";

  return (
    <Screen showNav>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 48 }}>
        <Text className="text-xs text-emerald-400 uppercase">Reading Detail</Text>
        <Text className="text-xl font-bold text-white mb-1">
          {reading?.project || "Reading"} • {memberLabel}
        </Text>
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
              <Text className="text-white text-2xl font-semibold mb-1">
                {reading.estimated_fc.toFixed(2)} MPa
              </Text>
              <Text className="text-slate-400 text-xs">
                Rating: {reading.rating} • Model: {reading.model_used}
              </Text>
            </View>

            <View className="rounded-xl bg-slate-800 p-4 mb-3">
              <Text className="text-slate-300 text-sm mb-2">Inputs</Text>
              <Text className="text-slate-400 text-xs">
                UPV: {reading.upv} m/s • RH: {reading.rh_index}
              </Text>
              {reading.carbonation_depth !== null && reading.carbonation_depth !== undefined ? (
                <Text className="text-slate-400 text-xs mt-1">
                  Carbonation: {reading.carbonation_depth} mm
                </Text>
              ) : null}
              {reading.location_tag ? (
                <Text className="text-slate-500 text-xs mt-2">Location: {reading.location_tag}</Text>
              ) : null}
            </View>
          </>
        ) : (
          <Text className="text-slate-400 text-sm">No data.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}
