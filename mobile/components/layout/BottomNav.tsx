import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Link, usePathname, Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeStore, getThemeColors } from "../../store/themeStore";

type NavItem = {
  href: Href;
  label: string;
  icon: string;
  activeIcon: string;
};

const items: NavItem[] = [
  { href: "/" as Href, label: "Home", icon: "home-outline", activeIcon: "home" },
  { href: "/projects" as Href, label: "Projects", icon: "albums-outline", activeIcon: "albums" },
  { href: "/calibration" as Href, label: "Calibration", icon: "speedometer-outline", activeIcon: "speedometer" },
  { href: "/readings" as Href, label: "Readings", icon: "list-outline", activeIcon: "list" },
  // Use a distinct document-text icon for the Reports tab so it stands out from Readings.
  { href: "/reports" as Href, label: "Reports", icon: "document-text-outline", activeIcon: "document-text" },
  { href: "/settings" as Href, label: "Settings", icon: "settings-outline", activeIcon: "settings" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);

  return (
    <SafeAreaView edges={["bottom"]} className="bg-transparent">
      <View
        className="px-2 py-2 flex-row justify-between items-center"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.navBg,
          borderTopColor: theme.border,
          borderTopWidth: 1,
        }}
      >
        {items.map((item) => {
          const hrefStr =
            typeof item.href === "string"
              ? item.href
              : (item.href as any)?.pathname
              ? String((item.href as any).pathname)
              : "";
          const isActive =
            hrefStr === "/"
              ? pathname === "/" || pathname === "/(main)" // handle grouped root
              : pathname?.startsWith(hrefStr);
          return (
            <Link key={String(item.href)} href={item.href} asChild>
              <TouchableOpacity className="flex-1 items-center py-1 pointer-events-auto">
                <Ionicons
                  name={(isActive ? item.activeIcon : item.icon) as any}
                  size={22}
                  color={isActive ? theme.navActive : theme.navInactive}
                />
                {isActive ? (
                  <Text
                    className="text-[11px] mt-1"
                    style={{ color: theme.navActive }}
                  >
                    {item.label}
                  </Text>
                ) : null}
              </TouchableOpacity>
            </Link>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
