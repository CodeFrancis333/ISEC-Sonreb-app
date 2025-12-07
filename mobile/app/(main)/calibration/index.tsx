import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import Screen from "../../../components/layout/Screen";

const calibrationPoints = [
  {
    id: "c1",
    member: "C1",
    upv: 4200,
    rh: 32,
    carbonation: 15,
    coreFc: 27.5,
    date: "2025-12-01",
  },
  {
    id: "c2",
    member: "C2",
    upv: 4100,
    rh: 30,
    carbonation: 20,
    coreFc: 25.8,
    date: "2025-12-02",
  },
];

export default function CalibrationPointsListScreen() {
  return (
    <Screen>
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-xs text-emerald-400 uppercase">
            Calibration
          </Text>
          <Text className="text-xl font-bold text-white">
            Calibration Points
          </Text>
          <Text className="text-slate-400 text-xs mt-1">
            You have {calibrationPoints.length} calibration points.
          </Text>
        </View>
        <Link href="/calibration/new-point" asChild>
          <TouchableOpacity className="rounded-xl bg-emerald-600 px-3 py-2">
            <Text className="text-white text-xs font-semibold">
              + Add
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View className="rounded-xl bg-slate-800 p-3 mb-3">
        <Text className="text-slate-200 text-xs">
          Requirements:
        </Text>
        <Text className="text-slate-300 text-xs mt-1">
          • Min 5 points → basic model (UPV + RH)
        </Text>
        <Text className="text-slate-300 text-xs">
          • Min 8 points → model with carbonation
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {calibrationPoints.map((p) => (
            <View
              key={p.id}
              className="rounded-xl bg-slate-800 p-4"
            >
              <Text className="text-white font-semibold">
                {p.member} • Core: {p.coreFc.toFixed(1)} MPa
              </Text>
              <Text className="text-slate-400 text-xs mt-1">
                UPV {p.upv} m/s • RH {p.rh} • Carbonation {p.carbonation} mm
              </Text>
              <Text className="text-slate-500 text-xs mt-1">
                {p.date}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="mt-4">
        <Link href="/calibration/generate" asChild>
          <TouchableOpacity className="rounded-xl bg-emerald-600 py-3 items-center">
            <Text className="text-white font-semibold text-sm">
              Generate Model
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </Screen>
  );
}
