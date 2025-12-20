import React, { useMemo } from "react";
import { View, Text } from "react-native";
import Svg, { G, Line, Circle } from "react-native-svg";
import { getThemeColors, useThemeStore } from "../../store/themeStore";

type Point = { x: number; y: number };

interface ScatterChartProps {
  points: Point[];
  width?: number;
  height?: number;
  color?: string;
  axisColor?: string;
  gridColor?: string;
  labelColor?: string;
  pointStroke?: string;
}

export function ScatterChart({
  points,
  width = 260,
  height = 200,
  color,
  axisColor,
  gridColor,
  labelColor,
  pointStroke,
}: ScatterChartProps) {
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);
  const axisStroke = axisColor || theme.border;
  const gridStroke = gridColor || theme.textMuted;
  const labelText = labelColor || theme.textSecondary;
  const strokeColor = pointStroke || theme.appBg;
  const padding = 24;

  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs, 0);
    const maxX = Math.max(...xs, 1);
    const minY = Math.min(...ys, 0);
    const maxY = Math.max(...ys, 1);
    const padX = (maxX - minX) * 0.05 || 1;
    const padY = (maxY - minY) * 0.05 || 1;
    return {
      xMin: minX - padX,
      xMax: maxX + padX,
      yMin: minY - padY,
      yMax: maxY + padY,
    };
  }, [points]);

  const projectPoint = (p: Point) => {
    const x = padding + ((p.x - xMin) / (xMax - xMin)) * (width - 2 * padding);
    const y = height - padding - ((p.y - yMin) / (yMax - yMin)) * (height - 2 * padding);
    return { x, y };
  };

  const diagStart = projectPoint({ x: xMin, y: xMin });
  const diagEnd = projectPoint({ x: xMax, y: xMax });

  return (
    <View className="items-center">
      <Svg width={width} height={height}>
        <G>
          <Line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke={axisStroke}
            strokeWidth={1}
          />
          <Line
            x1={padding}
            y1={height - padding}
            x2={padding}
            y2={padding}
            stroke={axisStroke}
            strokeWidth={1}
          />
          <Line
            x1={diagStart.x}
            y1={diagStart.y}
            x2={diagEnd.x}
            y2={diagEnd.y}
            stroke={gridStroke}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          {points.map((p, idx) => {
            const { x, y } = projectPoint(p);
            return (
              <Circle
                key={idx}
                cx={x}
                cy={y}
                r={4}
                fill={color || theme.accent}
                stroke={strokeColor}
                strokeWidth={1}
              />
            );
          })}
        </G>
      </Svg>
      <View className="flex-row justify-between w-full px-3 mt-1">
        <Text className="text-xs" style={{ color: labelText }}>Predicted fc'</Text>
        <Text className="text-xs" style={{ color: labelText }}>Measured fc'</Text>
      </View>
    </View>
  );
}
