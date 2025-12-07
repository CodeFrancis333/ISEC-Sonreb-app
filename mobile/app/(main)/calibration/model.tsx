import React from "react";
import { View, Text, ScrollView } from "react-native";
import Screen from "../../../components/layout/Screen";

export default function ActiveModelSummaryScreen() {
  // Dummy active model data
  const model = {
    equation: "fc′ = 5.32 + 0.012·R + 0.0041·V + 0.09·d₍c₎",
    a0: 5.32,
    a1: 0.012,
    a2: 0.0041,
    a3: 0.09,
    r2: 0.89,
    pointsUsed: 8,
    dateCreated: "2025-12-05",
  };

  return (
    <Screen>
      <ScrollView className="flex-1">
        <Text className="text-xs text-emerald-400 uppercase">
          Active Model
        </Text>
        <Text className="text-xl font-bold text-white mb-1">
          Calibrated Model (v1)
        </Text>
        <Text className="text-slate-400 text-xs mb-4">
          Created on {model.dateCreated} • {model.pointsUsed} points used
        </Text>

        <View className="rounded-xl bg-slate-800 p-4 mb-3">
          <Text className="text-slate-300 text-sm mb-1">
            Equation
          </Text>
          <Text className="text-slate-100 text-xs font-mono">
            {model.equation}
          </Text>
        </View>

        <View className="rounded-xl bg-slate-800 p-4 mb-3">
          <Text className="text-slate-300 text-sm mb-2">
            Coefficients
          </Text>
          <Text className="text-slate-200 text-xs">a₀ = {model.a0}</Text>
          <Text className="text-slate-200 text-xs">a₁ (R) = {model.a1}</Text>
          <Text className="text-slate-200 text-xs">a₂ (V) = {model.a2}</Text>
          <Text className="text-slate-200 text-xs">a₃ (d₍c₎) = {model.a3}</Text>
        </View>

        <View className="rounded-xl bg-slate-800 p-4">
          <Text className="text-slate-300 text-sm mb-1">
            Goodness of Fit
          </Text>
          <Text className="text-slate-100 text-xs">R² = {model.r2}</Text>
          <Text className="text-slate-400 text-xs mt-2">
            Higher R² means the regression explains more variability in
            core strength. Use engineering judgment and code limits when
            deciding if the model is acceptable.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
