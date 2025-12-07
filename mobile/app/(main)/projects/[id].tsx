import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import Screen from "../../../components/layout/Screen";

const TABS = ["Overview", "Members", "Readings", "Calibration", "Summary"];

export default function ProjectOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("Overview");

  // Dummy project data
  const projectName = "Hospital Wing A";
  const location = "Quezon City";
  const designFc = 28;

  return (
    <Screen>
      <View className="mb-4">
        <Text className="text-xs text-emerald-400 uppercase">
          Project
        </Text>
        <Text className="text-xl font-bold text-white">
          {projectName}
        </Text>
        <Text className="text-slate-400 text-xs mt-1">
          {location} • ID: {id}
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        <View className="flex-row gap-2">
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-full border ${
                  isActive
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-slate-700 bg-slate-800/80"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isActive ? "text-emerald-300" : "text-slate-300"
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ---------------- Overview TAB ---------------- */}
        {activeTab === "Overview" && (
          <View className="gap-3">
            <View className="rounded-xl bg-slate-800 p-4">
              <Text className="text-slate-300 text-sm mb-1">
                Design fc′
              </Text>
              <Text className="text-white text-xl font-semibold">
                {designFc} MPa
              </Text>
            </View>

            <View className="rounded-xl bg-slate-800 p-4">
              <Text className="text-slate-300 text-sm mb-1">
                Active Model
              </Text>
              <Text className="text-white text-base font-semibold">
                No model yet
              </Text>
              <Text className="text-slate-400 text-xs mt-2">
                Add calibration points and generate a model to activate
                project-specific SonReb coefficients.
              </Text>
            </View>
          </View>
        )}

        {/* ---------------- Members TAB ---------------- */}
        {activeTab === "Members" && (
          <View className="gap-3">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-slate-200 font-semibold">
                Members
              </Text>

              {/* This is the ONLY navigation you need for members in v1 */}
              <Link href="/projects/members/new" asChild>
                <TouchableOpacity className="rounded-xl bg-emerald-600 px-3 py-2">
                  <Text className="text-white text-xs font-semibold">
                    + New Member
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Example static member card (no navigation needed for now) */}
            <View className="rounded-xl bg-slate-800 p-4">
              <Text className="text-white font-semibold">C1</Text>
              <Text className="text-slate-400 text-xs mt-1">
                Column • Level 1 • Grid A-3
              </Text>
            </View>
          </View>
        )}

        {/* ---------------- Readings TAB ---------------- */}
        {activeTab === "Readings" && (
          <View className="gap-3">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-slate-200 font-semibold">
                Readings
              </Text>
              <Link href="/readings/new" asChild>
                <TouchableOpacity className="rounded-xl bg-emerald-600 px-3 py-2">
                  <Text className="text-white text-xs font-semibold">
                    + New Reading
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            <Link
              href={{
                pathname: "/readings/[id]",
                params: { id: "r1" },
              }}
              asChild
            >
              <TouchableOpacity className="rounded-xl bg-slate-800 p-4 active:bg-slate-700">
                <Text className="text-white font-semibold">
                  C1 – North Face Mid-height
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  fc′ est. 26.4 MPa • Rating: GOOD
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}

        {/* ---------------- Calibration TAB ---------------- */}
        {activeTab === "Calibration" && (
          <View className="gap-3">
            <Link href="/calibration" asChild>
              <TouchableOpacity className="rounded-xl bg-slate-800 p-4 active:bg-slate-700">
                <Text className="text-white font-semibold mb-1">
                  Calibration Points
                </Text>
                <Text className="text-slate-400 text-xs">
                  View all core strengths and regression status.
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}

        {/* ---------------- Summary TAB ---------------- */}
        {activeTab === "Summary" && (
          <View className="gap-3">
            <Link href="/summary" asChild>
              <TouchableOpacity className="rounded-xl bg-slate-800 p-4 active:bg-slate-700">
                <Text className="text-white font-semibold mb-1">
                  Project Summary
                </Text>
                <Text className="text-slate-400 text-xs">
                  View min/avg/max fc′, rating counts, and simple charts.
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
