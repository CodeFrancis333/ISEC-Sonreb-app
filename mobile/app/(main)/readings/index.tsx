import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import Screen from "../../../components/layout/Screen";

const readings = [
  {
    id: "r1",
    project: "Hospital Wing A",
    member: "C1",
    fc: 26.4,
    rating: "GOOD",
    modelUsed: "Calibrated",
  },
  {
    id: "r2",
    project: "Flyover Pier P3",
    member: "P3-1",
    fc: 18.2,
    rating: "POOR",
    modelUsed: "Default",
  },
];

export default function AllReadingsListScreen() {
  return (
    <Screen>
      <View className="mb-4">
        <Text className="text-xs text-emerald-400 uppercase">
          Readings
        </Text>
        <Text className="text-xl font-bold text-white">
          All Readings
        </Text>
        <Text className="text-slate-400 text-xs mt-1">
          Filter & search coming in future versions.
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {readings.map((reading) => (
            <Link
              key={reading.id}
              href={{
                pathname: "/readings/[id]",
                params: { id: reading.id },
              }}
              asChild
            >
              <TouchableOpacity className="rounded-xl bg-slate-800 p-4 active:bg-slate-700">
                <Text className="text-white font-semibold">
                  {reading.project} – {reading.member}
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  fc′ est. {reading.fc.toFixed(1)} MPa • {reading.rating}
                </Text>
                <Text className="text-slate-500 text-xs mt-2">
                  Model: {reading.modelUsed}
                </Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
