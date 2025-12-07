// mobile/components/ui/Button.tsx
import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const baseClasses =
  "flex-row items-center justify-center rounded-xl py-3";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-emerald-600",
  secondary: "bg-slate-700",
  ghost: "bg-transparent border border-slate-600",
};

export default function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = "primary",
  fullWidth = true,
}: ButtonProps) {
  const opacity = disabled || loading ? "opacity-60" : "opacity-100";
  const width = fullWidth ? "w-full" : "";

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      className={`${baseClasses} ${variants[variant]} ${opacity} ${width}`}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-white font-semibold text-base">
          {title}
        </Text>
      )}
    </Pressable>
  );
}
