import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import Screen from "../../../components/layout/Screen";
import { listReadings, deleteReading, Reading } from "../../../services/readingService";
import { useAuthStore } from "../../../store/authStore";

export default function AllReadingsListScreen() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await listReadings(token || undefined);
        setReadings(data);
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          await useAuthStore.getState().clearAuth();
          router.replace("/(auth)/login");
          return;
        }
        setError(err.message || "Unable to load readings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  return (
    <Screen showNav>
      <View className="mb-4">
        <Text className="text-xs text-emerald-400 uppercase">
          Readings
        </Text>
        <Text className="text-xl font-bold text-white">
          All Readings
        </Text>
        <Text className="text-slate-400 text-xs mt-1">
          Browse all saved readings across projects.
        </Text>
      </View>

      {error ? (
        <View className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-3 mb-3">
          <Text className="text-rose-100 text-xs">{error}</Text>
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
          contentContainerStyle={{ paddingBottom: 150 }}
        >
          <View className="gap-3">
            {readings.map((reading) => (
              <View key={reading.id}>
                <Link
                  href={{
                    pathname: "/readings/[id]",
                    params: { id: reading.id },
                  }}
                  asChild
                >
                  <TouchableOpacity className="rounded-xl bg-slate-800 p-4 active:bg-slate-700">
                    <Text className="text-white font-semibold">
                      {(reading as any).project_name || reading.project} • {reading.member || "N/A"}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-1">
                      fc' est. {reading.estimated_fc.toFixed(1)} MPa • {reading.rating}
                    </Text>
                    <Text className="text-slate-500 text-xs mt-2">
                      Model: {reading.model_used}
                    </Text>
                  </TouchableOpacity>
                </Link>
                <TouchableOpacity
                  onPress={async () => {
                    await deleteReading(reading.id, token || undefined);
                    setReadings((prev) => prev.filter((r) => r.id !== reading.id));
                  }}
                  className="mt-1"
                >
                  <Text className="text-rose-300 text-xs">Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
            {!readings.length && (
              <Text className="text-slate-400 text-xs">No readings yet.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
