// mobile/components/ui/Card.tsx
import React from "react";
import { View, Text, ViewProps } from "react-native";
import { useThemeStore, getThemeColors } from "../../store/themeStore";

type CardProps = ViewProps & {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export default function Card({ title, subtitle, children, style, ...rest }: CardProps) {
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);

  return (
    <View
      className="rounded-xl p-4"
      style={[{ backgroundColor: theme.surface }, style]}
      {...rest}
    >
      {title && (
        <Text className="font-semibold mb-1" style={{ color: theme.textPrimary }}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text className="text-xs mb-2" style={{ color: theme.textMuted }}>
          {subtitle}
        </Text>
      )}
      {children}
    </View>
  );
}
