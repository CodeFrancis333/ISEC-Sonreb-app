import React from "react";
import { View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = ViewProps & {
  children?: React.ReactNode;  
  padded?: boolean;
};

export default function Screen({
  children,
  padded = true,
  style,
  ...rest
}: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-slate-900" {...rest}>
      <View
        className={padded ? "flex-1 px-5 pt-4 pb-2" : "flex-1"}
        style={style}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
