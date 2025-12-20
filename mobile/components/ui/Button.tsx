// mobile/components/ui/Button.tsx
import React from "react";
import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
} from "react-native";
import { useThemeStore, getThemeColors } from "../../store/themeStore";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";

export interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  title?: string; // optional convenience prop
  loading?: boolean;
  children?: React.ReactNode; // allow <Button>Text</Button>
}

const baseContainer = "rounded-xl px-4 py-3 items-center justify-center";

export default function Button({
  variant = "primary",
  title,
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);

  const variantStyle = (() => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          textColor: theme.textPrimary,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          borderColor: theme.border,
          textColor: theme.textSecondary,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderColor: theme.accent,
          textColor: theme.accent,
        };
      case "danger":
        return {
          backgroundColor: theme.error,
          borderColor: theme.error,
          textColor: "#FFFFFF",
        };
      case "primary":
      default:
        return {
          backgroundColor: theme.accent,
          borderColor: theme.accentHover,
          textColor: "#FFFFFF",
        };
    }
  })();

  // Prefer title if provided, otherwise allow string children.
  const label =
    title ??
    (typeof children === "string" || typeof children === "number"
      ? String(children)
      : undefined);

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={`${baseContainer} ${disabled || loading ? "opacity-60" : ""} ${className}`}
      style={{
        backgroundColor: variantStyle.backgroundColor,
        borderColor: variantStyle.borderColor,
        borderWidth: 1,
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator />
      ) : label ? (
        <Text className="text-sm font-semibold" style={{ color: variantStyle.textColor }}>
          {label}
        </Text>
      ) : (
        // If children is not a string, render it directly
        children
      )}
    </TouchableOpacity>
  );
}
