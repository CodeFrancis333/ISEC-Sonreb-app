import React from "react";
import { View, Text } from "react-native";
import { HistogramBin } from "../../services/projectService";
import { getThemeColors, useThemeStore } from "../../store/themeStore";

interface HistogramChartProps {
  bins: HistogramBin[];
  maxHeight?: number;
  barColor?: string;
  countColor?: string;
  labelColor?: string;
  titleColor?: string;
}

export function HistogramChart({
  bins,
  maxHeight = 140,
  barColor,
  countColor,
  labelColor,
  titleColor,
}: HistogramChartProps) {
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);
  const barFill = barColor || theme.accent;
  const countText = countColor || theme.textSecondary;
  const labelText = labelColor || theme.textMuted;
  const titleText = titleColor || theme.textSecondary;
  const maxCount = Math.max(...bins.map((b) => b.count), 1);

  return (
    <View>
      <View className="flex-row items-end justify-between h-40 gap-2">
        {bins.map((bin) => {
          const height = (bin.count / maxCount) * maxHeight;
          return (
            <View key={`${bin.lower}-${bin.upper}`} className="items-center flex-1">
              <View
                className="w-full rounded-t"
                style={{ height, backgroundColor: barFill }}
              />
              <Text className="text-xs mt-1" style={{ color: countText }}>
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
            className="text-[11px]"
            style={{ color: labelText }}
          >
            {bin.lower.toFixed(0)}-{bin.upper.toFixed(0)}
          </Text>
        ))}
      </View>
      <Text className="text-xs mt-2" style={{ color: titleText }}>
        Estimated fc' histogram (MPa)
      </Text>
    </View>
  );
}
