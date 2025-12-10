import React from "react";
import { View, Text } from "react-native";
import { HistogramBin } from "../../services/projectService";

interface HistogramChartProps {
  bins: HistogramBin[];
  maxHeight?: number;
}

export function HistogramChart({ bins, maxHeight = 140 }: HistogramChartProps) {
  const maxCount = Math.max(...bins.map((b) => b.count), 1);

  return (
    <View>
      <View className="flex-row items-end justify-between h-40 gap-2">
        {bins.map((bin) => {
          const height = (bin.count / maxCount) * maxHeight;
          return (
            <View key={`${bin.lower}-${bin.upper}`} className="items-center flex-1">
              <View
                className="w-full rounded-t bg-emerald-500/70"
                style={{ height }}
              />
              <Text className="text-slate-300 text-xs mt-1">
                {bin.count}
              </Text>
            </View>
          );
        })}
      </View>
      <View className="flex-row justify-between mt-2">
        {bins.map((bin) => (
          <Text
            key={`label-${bin.lower}-${bin.upper}`}
            className="text-slate-400 text-[11px]"
          >
            {bin.lower.toFixed(0)}-{bin.upper.toFixed(0)}
          </Text>
        ))}
      </View>
      <Text className="text-slate-300 text-xs mt-2">
        Estimated fc' histogram (MPa)
      </Text>
    </View>
  );
}
