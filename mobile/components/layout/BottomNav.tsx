import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Link, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type NavItem = {
  href: "/(main)" | "/projects" | "/calibration" | "/readings" | "/settings";
  label: string;
  icon: string;
  activeIcon: string;
};

const items: NavItem[] = [
  { href: "/(main)", label: "Home", icon: "home-outline", activeIcon: "home" },
  { href: "/projects", label: "Projects", icon: "albums-outline", activeIcon: "albums" },
  { href: "/calibration", label: "Calibration", icon: "speedometer-outline", activeIcon: "speedometer" },
  { href: "/readings", label: "Readings", icon: "list-outline", activeIcon: "list" },
  { href: "/settings", label: "Settings", icon: "settings-outline", activeIcon: "settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <View className="border-t border-slate-800 bg-slate-900 px-2 py-2 flex-row justify-between items-center">
      {items.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} asChild>
            <TouchableOpacity className="flex-1 items-center py-1">
              <Ionicons
                name={(isActive ? item.activeIcon : item.icon) as any}
                size={22}
                color={isActive ? "#34d399" : "#94a3b8"}
              />
              {isActive ? (
                <Text className="text-emerald-300 text-[11px] mt-1">{item.label}</Text>
              ) : null}
            </TouchableOpacity>
          </Link>
        );
      })}
    </View>
  );
}
