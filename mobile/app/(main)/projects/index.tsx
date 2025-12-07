import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import Screen from "../../../components/layout/Screen";

const projects = [
  {
    id: "1",
    name: "Hospital Wing A",
    location: "Quezon City",
    readings: 24,
    calibrated: true,
  },
  {
    id: "2",
    name: "Flyover Pier P3",
    location: "Sariaya, Quezon",
    readings: 12,
    calibrated: false,
  },
];

export default function ProjectsListScreen() {
  return (
    <Screen>
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-xs text-emerald-400 uppercase">
            Projects
          </Text>
          <Text className="text-xl font-bold text-white">
            All Projects
          </Text>
        </View>
        <Link href="/projects/new" asChild>
          <TouchableOpacity className="rounded-xl bg-emerald-600 px-3 py-2">
            <Text className="text-white text-sm font-semibold">+ New</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={{
                pathname: "/projects/[id]",
                params: { id: project.id },
              }}
              asChild
            >
              <TouchableOpacity className="rounded-xl bg-slate-800 p-4 active:bg-slate-700">
                <Text className="text-white font-semibold">
                  {project.name}
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  {project.location}
                </Text>

                <View className="flex-row mt-3 justify-between items-center">
                  <Text className="text-xs text-slate-400">
                    {project.readings} readings
                  </Text>
                  <View
                    className={`px-2 py-1 rounded-full ${
                      project.calibrated
                        ? "bg-emerald-500/20"
                        : "bg-amber-500/10"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        project.calibrated
                          ? "text-emerald-300"
                          : "text-amber-300"
                      }`}
                    >
                      {project.calibrated ? "Calibrated" : "No model"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
