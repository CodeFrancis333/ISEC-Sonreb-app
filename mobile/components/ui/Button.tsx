// mobile/components/ui/Button.tsx
import React from "react";
import { Text, TouchableOpacity, ActivityIndicator } from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps {
  children?: React.ReactNode;                // for <Button>Label</Button>
  label?: string;                            // optional alternative: <Button label="Label" />
  onPress?: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  className?: string;                        // extra Tailwind classes (NativeWind)
}

const baseClasses =
  "w-full rounded-xl px-4 py-3 items-center justify-center flex-row";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-emerald-600 active:bg-emerald-500",
  secondary: "bg-slate-700 active:bg-slate-600",
  ghost: "bg-transparent border border-slate-600",
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  ghost: "text-slate-100",
};

export default function Button({
  children,
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  className = "",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const content = children ?? (
    <Text className={`text-sm font-semibold ${textVariantClasses[variant]}`}>
      {label}
    </Text>
  );

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${
        isDisabled ? "opacity-60" : ""
      } ${className}`}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading && (
        <ActivityIndicator size="small" className="mr-2" />
      )}
      {typeof content === "string" ? (
        <Text className={`text-sm font-semibold ${textVariantClasses[variant]}`}>
          {content}
        </Text>
      ) : (
        content
      )}
    </TouchableOpacity>
  );
}
