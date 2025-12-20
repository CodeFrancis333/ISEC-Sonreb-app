// mobile/components/ui/Badge.tsx
import React from "react";
import { View, Text } from "react-native";
import { useThemeStore, getThemeColors } from "../../store/themeStore";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

const styles: Record<BadgeVariant, { container: string; text: string }> = {
  success: {
    container: "bg-emerald-500/20",
    text: "text-emerald-300",
  },
  warning: {
    container: "bg-amber-500/20",
    text: "text-amber-200",
  },
  danger: {
    container: "bg-red-500/20",
    text: "text-red-300",
  },
  info: {
    container: "bg-sky-500/20",
    text: "text-sky-300",
  },
  neutral: {
    container: "bg-slate-600/40",
    text: "text-slate-100",
  },
};

export default function Badge({ label, variant = "neutral" }: BadgeProps) {
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);

  const styleSet = styles[variant];
  const colorMap = {
    success: theme.success,
    warning: theme.warning,
    danger: theme.error,
    info: theme.accentBlue,
    neutral: theme.textSecondary,
  } as const;

  return (
    <View
      className="px-2 py-1 rounded-full"
      style={{ backgroundColor: `${colorMap[variant]}33` }}
    >
      <Text
        className="text-xs font-semibold"
        style={{ color: colorMap[variant] }}
      >
        {label}
      </Text>
    </View>
  );
}
