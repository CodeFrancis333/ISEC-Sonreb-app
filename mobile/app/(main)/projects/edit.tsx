import React, { useEffect, useState } from "react";
import { Text, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { getProject, updateProject } from "../../../services/projectService";
import { useAuthStore } from "../../../store/authStore";

export default function EditProjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const projectId = params.id as string | undefined;
  const { token } = useAuthStore();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [client, setClient] = useState("");
  const [designFc, setDesignFc] = useState("");
  const [structureAge, setStructureAge] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);

  useEffect(() => {
    async function load() {
      if (!projectId) {
        Alert.alert("Missing project", "No project id provided.");
        router.back();
        return;
      }
      try {
        const data = await getProject(projectId, token || undefined);
        setName(data.name || "");
        setLocation((data as any).location || "");
        setClient((data as any).client || "");
        setDesignFc(data.design_fc ? String(data.design_fc) : "");
        setStructureAge((data as any).structure_age ? String((data as any).structure_age) : "");
        setLatitude((data as any).latitude !== undefined ? String((data as any).latitude) : "");
        setLongitude((data as any).longitude !== undefined ? String((data as any).longitude) : "");
        setNotes((data as any).notes || "");
      } catch (err: any) {
        Alert.alert("Load failed", err.message || "Unable to load project.");
      } finally {
        setLoadingProject(false);
      }
    }
    load();
  }, [projectId, router, token]);

  const handleSave = async () => {
    if (!projectId) {
      Alert.alert("Missing project", "No project id provided.");
      return;
    }
    if (!name || !location || !structureAge || !latitude || !longitude) {
      Alert.alert(
        "Missing fields",
        "Project name, location, structure age, latitude, and longitude are required."
      );
      return;
    }
    const ageNum = parseInt(structureAge, 10);
    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    if (Number.isNaN(ageNum) || Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      Alert.alert("Invalid numbers", "Enter numeric values for age and coordinates.");
      return;
    }
    try {
      setLoading(true);
      const payload: any = {
        name,
        location,
        structure_age: ageNum,
        latitude: latNum,
        longitude: lonNum,
      };
      if (client) payload.client = client;
      if (designFc) payload.design_fc = parseFloat(designFc);
      if (notes) payload.notes = notes;

      await updateProject(projectId, payload, token || undefined);
      router.back();
    } catch (err: any) {
      Alert.alert("Update failed", err.message || "Unable to update project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <Text className="text-xl font-bold text-white mb-1">
          Edit Project
        </Text>
        <Text className="text-slate-300 mb-6">
          Update project information and design strength.
        </Text>

        {loadingProject ? (
          <Text className="text-slate-400 text-sm">Loading...</Text>
        ) : (
          <>
            <Input
              label="Project Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Hospital Wing A"
            />

            <Input
              label="Location"
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Quezon City"
            />

            <Input
              label="Client (optional)"
              value={client}
              onChangeText={setClient}
              placeholder="e.g. DPWH"
            />

            <Input
              label="Structure Age (years)"
              keyboardType="numeric"
              value={structureAge}
              onChangeText={setStructureAge}
              placeholder="e.g. 12"
            />

            <Input
              label="Latitude"
              keyboardType="numeric"
              value={latitude}
              onChangeText={setLatitude}
              placeholder="e.g. 14.5995"
            />

            <Input
              label="Longitude"
              keyboardType="numeric"
              value={longitude}
              onChangeText={setLongitude}
              placeholder="e.g. 120.9842"
            />

            <Input
              label="Design fc' (MPa, optional)"
              keyboardType="numeric"
              value={designFc}
              onChangeText={setDesignFc}
              placeholder="e.g. 28"
            />

            <Input
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Project notes"
              multiline
            />

            <Button
              title={loading ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={loading}
            />
          </>
        )}

        <TouchableOpacity onPress={() => router.back()} className="mt-3">
          <Text className="text-emerald-400 text-xs">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
