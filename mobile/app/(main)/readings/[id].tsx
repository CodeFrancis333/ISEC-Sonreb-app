import React from "react";
import { Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Screen from "../../../components/layout/Screen";

export default function ReadingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Dummy details
  const reading = {
    project: "Hospital Wing A",
    member: "C1",
    locationTag: "North Face, mid-height",
    upv: 4200,
    rh: 32,
    carbonation: 15,
    fc: 26.4,
    rating: "GOOD",
    recommendation: "Concrete strength is adequate for design fc′.",
    modelUsed: "Project Calibrated Model",
    timestamp: "2025-12-06 14:32",
  };

  return (
    <Screen>
      <ScrollView className="flex-1">
        <Text className="text-xs text-emerald-400 uppercase">
          Reading Detail
        </Text>
        <Text className="text-xl font-bold text-white mb-1">
          {reading.project} – {reading.member}
        </Text>
        <Text className="text-slate-400 text-xs mb-4">
          Reading ID: {id} • {reading.timestamp}
        </Text>

        <Text className="text-slate-300 text-sm mb-1">
          Estimated fc′
        </Text>
        <Text className="text-white text-2xl font-semibold mb-2">
          {reading.fc.toFixed(1)} MPa
        </Text>
        <Text className="text-emerald-300 text-xs font-semibold mb-4">
          Rating: {reading.rating}
        </Text>

        <Text className="text-slate-300 text-sm mb-2">
          Measurement Inputs
        </Text>
        <Text className="text-slate-200 text-xs">
          UPV: {reading.upv} m/s
        </Text>
        <Text className="text-slate-200 text-xs">
          RH Index: {reading.rh}
        </Text>
        <Text className="text-slate-200 text-xs">
          Carbonation depth: {reading.carbonation} mm
        </Text>
        <Text className="text-slate-400 text-xs mt-2 mb-4">
          Location: {reading.locationTag}
        </Text>

        <Text className="text-slate-300 text-sm mb-1">
          Model Used
        </Text>
        <Text className="text-slate-200 text-xs mb-4">
          {reading.modelUsed}
        </Text>

        <Text className="text-slate-300 text-sm mb-1">
          Recommendation
        </Text>
        <Text className="text-slate-200 text-xs">
          {reading.recommendation}
        </Text>
      </ScrollView>
    </Screen>
  );
}
