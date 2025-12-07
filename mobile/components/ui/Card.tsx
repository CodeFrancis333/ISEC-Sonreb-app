// mobile/components/ui/Card.tsx
import React from "react";
import { View, Text, ViewProps } from "react-native";

type CardProps = ViewProps & {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export default function Card({ title, subtitle, children, style, ...rest }: CardProps) {
  return (
    <View
      className="rounded-xl bg-slate-800 p-4"
      style={style}
      {...rest}
    >
      {title && (
        <Text className="text-white font-semibold mb-1">
          {title}
        </Text>
      )}
      {subtitle && (
        <Text className="text-slate-400 text-xs mb-2">
          {subtitle}
        </Text>
      )}
      {children}
    </View>
  );
}
