// mobile/components/ui/Input.tsx
import React from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export default function Input({ label, error, ...rest }: InputProps) {
  return (
    <View className="mb-4 w-full">
      {label && (
        <Text className="mb-1 text-sm text-slate-200">
          {label}
        </Text>
      )}
      <TextInput
        className={`w-full rounded-xl border px-3 py-2 text-base text-white bg-slate-800 border-slate-600 ${
          error ? "border-red-500" : ""
        }`}
        placeholderTextColor="#9CA3AF"
        {...rest}
      />
      {error && (
        <Text className="mt-1 text-xs text-red-400">
          {error}
        </Text>
      )}
    </View>
  );
}
