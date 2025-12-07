import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Link, type Href } from "expo-router";
import Screen from "../../components/layout/Screen";

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

export default function MainHomeScreen() {
  return (
    <Screen>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className="text-sm text-emerald-400 mb-1">
          SONREB Dashboard
        </Text>
        <Text className="text-2xl font-bold text-white mb-1">
          Hi Engineer,
        </Text>
        <Text className="text-slate-300 mb-6">
          What would you like to do today?
        </Text>

        <View className="gap-3 mb-8">
          {tiles.map((tile) => (
            <Link key={tile.title} href={tile.href} asChild>
              <TouchableOpacity className="rounded-xl bg-slate-800 p-4 active:bg-slate-700">
                <Text className="text-white font-semibold mb-1">
                  {tile.title}
                </Text>
                <Text className="text-slate-400 text-sm">
                  {tile.description}
                </Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>

        <View className="rounded-xl border border-emerald-600/50 bg-emerald-500/10 p-4">
          <Text className="text-emerald-300 font-semibold mb-1">
            Quick Tip
          </Text>
          <Text className="text-slate-200 text-sm">
            For reliable calibration, aim for at least 5 core strengths
            per structural element type and loading condition.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
