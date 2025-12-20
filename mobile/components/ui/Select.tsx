// mobile/components/ui/Select.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useThemeStore, getThemeColors } from "../../store/themeStore";

type SelectProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  error?: string;
  onPress?: () => void;
};

export default function Select({
  label,
  value,
  placeholder = "Select...",
  error,
  onPress,
}: SelectProps) {
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);
  const displayText = value && value.length > 0 ? value : placeholder;
  const isPlaceholder = !value;

  return (
    <View className="mb-4 w-full">
      {label ? (
        <Text className="mb-1 text-sm" style={{ color: theme.textSecondary }}>
          {label}
        </Text>
      ) : null}
      <TouchableOpacity
        onPress={onPress}
        className="w-full rounded-xl border px-3 py-2 flex-row justify-between items-center"
        style={{
          backgroundColor: theme.surface,
          borderColor: error ? theme.error : theme.border,
        }}
      >
        <Text
          className="text-base"
          style={{ color: isPlaceholder ? theme.textMuted : theme.textPrimary }}
        >
          {displayText}
        </Text>
        <Text className="text-xs" style={{ color: theme.textMuted }}>
          v
        </Text>
      </TouchableOpacity>
      {error ? (
        <Text className="mt-1 text-xs" style={{ color: theme.error }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
