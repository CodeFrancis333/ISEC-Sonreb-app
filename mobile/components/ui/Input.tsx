// mobile/components/ui/Input.tsx
import React from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";
import { useThemeStore, getThemeColors } from "../../store/themeStore";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export default function Input({ label, error, ...rest }: InputProps) {
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);

  return (
    <View className="mb-4 w-full">
      {label && (
        <Text className="mb-1 text-sm" style={{ color: theme.textSecondary }}>
          {label}
        </Text>
      )}
      <TextInput
        className="w-full rounded-xl border px-3 py-2 text-base"
        style={{
          backgroundColor: theme.surface,
          borderColor: error ? theme.error : theme.border,
          color: theme.textPrimary,
        }}
        placeholderTextColor={theme.textMuted}
        {...rest}
      />
      {error && (
        <Text className="mt-1 text-xs" style={{ color: theme.error }}>
          {error}
        </Text>
      )}
    </View>
  );
}
