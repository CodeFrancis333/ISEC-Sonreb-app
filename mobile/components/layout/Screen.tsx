import React from "react";
import { View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "./BottomNav";
import { useThemeStore, getThemeColors } from "../../store/themeStore";

type ScreenProps = ViewProps & {
  children?: React.ReactNode;  
  padded?: boolean;
  showNav?: boolean;
};

export default function Screen({
  children,
  padded = true,
  showNav = false,
  style,
  ...rest
}: ScreenProps) {
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);
  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.appBg }}
      {...rest}
    >
      <View
        className={`${padded ? "flex-1 px-5 pt-4 pb-2" : "flex-1"}`}
        style={[{ backgroundColor: theme.appBg }, style]}
      >
        {children}
      </View>
      {showNav && <BottomNav />}
    </SafeAreaView>
  );
}
