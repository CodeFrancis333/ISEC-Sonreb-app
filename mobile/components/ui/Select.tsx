// mobile/components/ui/Select.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

type SelectProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  error?: string;
  onPress?: () => void; // you can open a modal or action sheet from parent
};

export default function Select({
  label,
  value,
  placeholder = "Select...",
  error,
  onPress,
}: SelectProps) {
  const displayText = value && value.length > 0 ? value : placeholder;
  const isPlaceholder = !value;

  return (
    <View className="mb-4 w-full">
      {label && (
        <Text className="mb-1 text-sm text-slate-200">
          {label}
        </Text>
      )}
      <TouchableOpacity
        onPress={onPress}
        className={`w-full rounded-xl border px-3 py-2 bg-slate-800 border-slate-600 flex-row justify-between items-center ${
          error ? "border-red-500" : ""
        }`}
      >
        <Text
          className={`text-base ${
            isPlaceholder ? "text-slate-500" : "text-white"
          }`}
        >
          {displayText}
        </Text>
        <Text className="text-slate-400 text-xs">
          ▼
        </Text>
      </TouchableOpacity>
      {error && (
        <Text className="mt-1 text-xs text-red-400">
          {error}
        </Text>
      )}
    </View>
  );
}
