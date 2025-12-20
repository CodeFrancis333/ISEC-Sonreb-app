import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Link, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/layout/Screen";
import { useThemeStore, getThemeColors } from "../../store/themeStore";

type Tile = {
  title: string;
  description: string;
  href: Href;
};

const tiles: Tile[] = [
  {
    title: "New SonReb Reading",
    description: "Start a new UPV + RH measurement.",
    href: "/readings/new",
  },
  {
    title: "Projects",
    description: "Manage projects, members, and calibration.",
    href: "/projects",
  },
  {
    title: "All Readings",
    description: "Browse all saved readings across projects.",
    href: "/readings",
  },
  {
    title: "Calibration",
    description: "Add calibration cores & generate models.",
    href: "/calibration",
  },
  {
    title: "Settings",
    description: "Units, rating method, and profile.",
    href: "/settings",
  },
];

const LinkAny = Link as unknown as React.ComponentType<any>;

export default function MainHomeScreen() {
  const { mode, toggleMode } = useThemeStore();
  const theme = getThemeColors(mode);

  return (
    <Screen showNav>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150, gap: 0 }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-sm" style={{ color: theme.accent }}>
              SONREB Dashboard
            </Text>
            <Text className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
              Hi Engineer,
            </Text>
          </View>

          <TouchableOpacity
            onPress={toggleMode}
            className="rounded-full px-3 py-2"
            style={{ borderColor: theme.border, borderWidth: 1 }}
            accessibilityLabel="Toggle theme"
          >
            <Ionicons
              name={mode === "dark" ? "moon" : "sunny"}
              size={18}
              color={mode === "dark" ? theme.accent : theme.accentBlue}
            />
          </TouchableOpacity>
        </View>

        <Text className="mb-6" style={{ color: theme.textSecondary }}>
          What would you like to do today?
        </Text>

        <View className="gap-3 mb-8">
          {tiles.map((tile) => (
            <LinkAny key={tile.title} href={tile.href} asChild>
              <TouchableOpacity
                className="rounded-xl p-4"
                style={{ backgroundColor: theme.surface }}
              >
                <Text className="font-semibold mb-1" style={{ color: theme.textPrimary }}>
                  {tile.title}
                </Text>
                <Text className="text-sm" style={{ color: theme.textMuted }}>
                  {tile.description}
                </Text>
              </TouchableOpacity>
            </LinkAny>
          ))}
        </View>

        <View
          className="rounded-xl p-4"
          style={{ borderColor: theme.accent, borderWidth: 1, backgroundColor: theme.surfaceAlt }}
        >
          <Text className="font-semibold mb-1" style={{ color: theme.accent }}>
            Quick Tip
          </Text>
          <Text className="text-sm" style={{ color: theme.textSecondary }}>
            For reliable calibration, aim for at least 5 core strengths
            per structural element type and loading condition.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
