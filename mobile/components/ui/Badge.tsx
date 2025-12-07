// mobile/components/ui/Badge.tsx
import React from "react";
import { View, Text } from "react-native";

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
  const styleSet = styles[variant];

  return (
    <View
      className={`px-2 py-1 rounded-full ${styleSet.container}`}
    >
      <Text
        className={`text-xs font-semibold ${styleSet.text}`}
      >
        {label}
      </Text>
    </View>
  );
}
