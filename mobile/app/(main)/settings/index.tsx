import React, { useState } from "react";
import { View, Text, Switch, ScrollView } from "react-native";
import Screen from "../../../components/layout/Screen";

export default function SettingsScreen() {
  const [useMpa, setUseMpa] = useState(true);
  const [useMs, setUseMs] = useState(true);
  const [ratingByDesign, setRatingByDesign] = useState(true);
  const [useCalibratedModel, setUseCalibratedModel] = useState(true);
  const [showModelDetails, setShowModelDetails] = useState(true);

  return (
    <Screen>
      <ScrollView className="flex-1">
        <Text className="text-xs text-emerald-400 uppercase">
          Settings
        </Text>
        <Text className="text-xl font-bold text-white mb-1">
          App Preferences
        </Text>
        <Text className="text-slate-400 text-xs mb-4">
          Configure units, rating method, and model behavior.
        </Text>

        {/* Units */}
        <View className="rounded-xl bg-slate-800 p-4 mb-4">
          <Text className="text-slate-200 text-sm mb-3">
            Units
          </Text>

          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-slate-200 text-xs">
                Strength Units
              </Text>
              <Text className="text-slate-400 text-xs">
                MPa or psi
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-slate-400 text-xs">
                {useMpa ? "MPa" : "psi"}
              </Text>
              <Switch
                value={useMpa}
                onValueChange={setUseMpa}
              />
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-slate-200 text-xs">
                Velocity Units
              </Text>
              <Text className="text-slate-400 text-xs">
                m/s or km/s
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-slate-400 text-xs">
                {useMs ? "m/s" : "km/s"}
              </Text>
              <Switch
                value={useMs}
                onValueChange={setUseMs}
              />
            </View>
          </View>
        </View>

        {/* Rating method */}
        <View className="rounded-xl bg-slate-800 p-4 mb-4">
          <Text className="text-slate-200 text-sm mb-3">
            Rating Method
          </Text>

          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-slate-200 text-xs">
                Use % of design fc′
              </Text>
              <Text className="text-slate-400 text-xs">
                Ratings based on ratio of fc′ / design fc′.
              </Text>
            </View>
            <Switch
              value={ratingByDesign}
              onValueChange={setRatingByDesign}
            />
          </View>
        </View>

        {/* Model behavior */}
        <View className="rounded-xl bg-slate-800 p-4 mb-4">
          <Text className="text-slate-200 text-sm mb-3">
            Model Behavior
          </Text>

          <View className="flex-row justify-between items-center mb-3">
            <View>
              <Text className="text-slate-200 text-xs">
                Use calibrated model when available
              </Text>
              <Text className="text-slate-400 text-xs">
                Otherwise fallback to default SonReb model.
              </Text>
            </View>
            <Switch
              value={useCalibratedModel}
              onValueChange={setUseCalibratedModel}
            />
          </View>

          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-slate-200 text-xs">
                Always show model details
              </Text>
              <Text className="text-slate-400 text-xs">
                Display equation & coefficients on result screens.
              </Text>
            </View>
            <Switch
              value={showModelDetails}
              onValueChange={setShowModelDetails}
            />
          </View>
        </View>

        <View className="rounded-xl bg-slate-800 p-4">
          <Text className="text-slate-300 text-xs mb-1">
            Profile info (optional in future)
          </Text>
          <Text className="text-slate-500 text-xs">
            Later versions can show engineer name, company, license
            number, and export settings here.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
