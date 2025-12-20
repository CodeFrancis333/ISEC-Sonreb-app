import React from "react";
import { View, Text } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { getThemeColors, useThemeStore } from "../../store/themeStore";

type Segment = {
  label: string;
  value: number;
  color: string;
};

interface PieChartProps {
  segments: Segment[];
  size?: number;
  innerRadius?: number;
  labelColor?: string;
  centerFill?: string;
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "L", x, y, "Z"].join(" ");
}

export function PieChart({
  segments,
  size = 180,
  innerRadius = 0,
  labelColor,
  centerFill,
}: PieChartProps) {
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);
  const labelText = labelColor || theme.textSecondary;
  const centerColor = centerFill || theme.appBg;
  const radius = size / 2;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let startAngle = 0;

  const arcs = segments.map((segment) => {
    const angle = total > 0 ? (segment.value / total) * 360 : 0;
    const endAngle = startAngle + angle;
    const path = describeArc(radius, radius, radius, startAngle, endAngle);
    startAngle = endAngle;
    return { ...segment, path };
  });

  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size}>
        <G>
          {arcs.map((arc) => (
            <Path key={arc.label} d={arc.path} fill={arc.color} />
          ))}
        </G>
        {innerRadius > 0 && (
          <G>
            <Path
              d={describeArc(radius, radius, innerRadius, 0, 360)}
              fill={centerColor}
            />
          </G>
        )}
      </Svg>
      <View className="mt-3">
        <Text className="text-xs text-center" style={{ color: labelText }}>
          Rating distribution
        </Text>
      </View>
    </View>
  );
}
