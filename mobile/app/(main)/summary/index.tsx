import React from "react";
import { View, Text, ScrollView } from "react-native";
import Screen from "../../../components/layout/Screen";

export default function ProjectSummaryScreen() {
  // Dummy summary values
  const readingsCount = 24;
  const minFc = 18.2;
  const maxFc = 29.7;
  const avgFc = 25.1;

  const ratingCounts = {
    GOOD: 16,
    FAIR: 6,
    POOR: 2,
  };

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
          Simple analytics for estimated in-place concrete strength.
        </Text>

        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 rounded-xl bg-slate-800 p-3">
            <Text className="text-slate-300 text-xs">Min fc′</Text>
            <Text className="text-white text-xl font-semibold">
              {minFc.toFixed(1)} MPa
            </Text>
          </View>

          <View className="flex-1 rounded-xl bg-slate-800 p-3">
            <Text className="text-slate-300 text-xs">Max fc′</Text>
            <Text className="text-white text-xl font-semibold">
              {maxFc.toFixed(1)} MPa
            </Text>
          </View>
        </View>

        <View className="rounded-xl bg-slate-800 p-3 mb-4">
          <Text className="text-slate-300 text-xs mb-1">Average fc′</Text>
          <Text className="text-white text-2xl font-semibold">
            {avgFc.toFixed(1)} MPa
          </Text>
          <Text className="text-slate-400 text-xs mt-2">
            Compare average fc′ with design strength to assess reserve
            or deficit.
          </Text>
        </View>

        <View className="rounded-xl bg-slate-800 p-4 mb-4">
          <Text className="text-slate-300 text-sm mb-2">
            Rating Counts (Dummy)
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-emerald-300 text-lg font-semibold">
                {ratingCounts.GOOD}
              </Text>
              <Text className="text-slate-400 text-xs">GOOD</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-amber-300 text-lg font-semibold">
                {ratingCounts.FAIR}
              </Text>
              <Text className="text-slate-400 text-xs">FAIR</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-red-300 text-lg font-semibold">
                {ratingCounts.POOR}
              </Text>
              <Text className="text-slate-400 text-xs">POOR</Text>
            </View>
          </View>
        </View>

        <View className="rounded-xl bg-slate-800 p-4">
          <Text className="text-slate-300 text-sm mb-1">
            Notes
          </Text>
          <Text className="text-slate-200 text-xs">
            In future versions, this page can show histograms of fc′,
            distribution per member, and exportable PDF reports per
            project.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
