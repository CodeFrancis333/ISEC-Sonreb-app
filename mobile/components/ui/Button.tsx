// mobile/components/ui/Button.tsx
import React from "react";
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";

export interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  title?: string; // optional convenience prop
  loading?: boolean;
  children?: React.ReactNode; // allow <Button>Text</Button>
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> =
  {
    primary: {
      container:
        "bg-emerald-600 border border-emerald-500 active:bg-emerald-500",
      text: "text-white",
    },
    secondary: {
      container:
        "bg-slate-800 border border-slate-700 active:bg-slate-700",
      text: "text-slate-100",
    },
    ghost: {
      container:
        "bg-transparent border border-slate-700 active:bg-slate-800/60",
      text: "text-slate-200",
    },
    outline: {
      container:
        "bg-transparent border border-emerald-600 active:bg-emerald-500/10",
      text: "text-emerald-300",
    },
    danger: {
      container:
        "bg-red-600 border border-red-500 active:bg-red-500",
      text: "text-white",
    },
  };

export default function Button({
  variant = "primary",
  title,
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const styles = variantStyles[variant];

  // Prefer title if provided, otherwise allow string children.
  const label =
    title ??
    (typeof children === "string" || typeof children === "number"
      ? String(children)
      : undefined);

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={`rounded-xl px-4 py-3 items-center justify-center ${styles.container} ${
        disabled || loading ? "opacity-60" : ""
      } ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator />
      ) : label ? (
        <Text className={`text-sm font-semibold ${styles.text}`}>
          {label}
        </Text>
      ) : (
        // If children is not a string, render it directly
        children
      )}
    </TouchableOpacity>
  );
}
