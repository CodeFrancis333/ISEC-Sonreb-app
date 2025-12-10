import React, { useEffect, useState } from "react";
import { Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, View } from "react-native";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { useAuthStore } from "../../../store/authStore";
import { listProjects, listMembers, Project, Member } from "../../../services/projectService";
import { createReading } from "../../../services/readingService";
import { useRouter } from "expo-router";

export default function NewReadingScreen() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [locationTag, setLocationTag] = useState("");
  const [upv, setUpv] = useState("");
  const [rh, setRh] = useState("");
  const [carbonation, setCarbonation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await listProjects(token || undefined);
        setProjects(data);
        const first = data[0]?.id || null;
        setProjectId(first);
        if (first) {
          await loadMembers(first);
        }
      } catch (err: any) {
        setError(err.message || "Unable to load projects.");
      }
    }
    loadProjects();
  }, [token]);

  async function loadMembers(pid: string) {
    try {
      const data = await listMembers(pid, token || undefined);
      setMembers(data);
    } catch {
      setMembers([]);
    }
  }

  const handleSave = async () => {
    if (!projectId) {
      Alert.alert("Select project", "Please select a project.");
      return;
    }
    if (!upv || !rh) {
      Alert.alert("Missing fields", "UPV and RH are required.");
      return;
    }
    try {
      setLoading(true);
      const payload: any = {
        project: projectId,
        member: memberId || null,
        location_tag: locationTag,
        upv: parseFloat(upv),
        rh_index: parseFloat(rh),
      };
      if (carbonation) payload.carbonation_depth = parseFloat(carbonation);

      await createReading(payload, token || undefined);
      router.back();
    } catch (err: any) {
      Alert.alert("Save failed", err.message || "Could not save reading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-white mb-1">
          New Reading
        </Text>
        <Text className="text-slate-300 mb-6">
          Enter field measurements for UPV, RH, and optional carbonation.
        </Text>

        <Text className="text-slate-200 text-sm mb-2">Project</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            {projects.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  setProjectId(p.id);
                  setMemberId(null);
                  loadMembers(p.id);
                }}
                className={`px-3 py-2 rounded-full border ${
                  projectId === p.id ? "border-emerald-500 bg-emerald-500/10" : "border-slate-600"
                }`}
              >
                <Text className={projectId === p.id ? "text-white text-xs" : "text-slate-200 text-xs"}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text className="text-slate-200 text-sm mb-2">Member (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setMemberId(m.id)}
                className={`px-3 py-2 rounded-full border ${
                  memberId === m.id ? "border-emerald-500 bg-emerald-500/10" : "border-slate-600"
                }`}
              >
                <Text className={memberId === m.id ? "text-white text-xs" : "text-slate-200 text-xs"}>
                  {m.member_id}
                </Text>
              </TouchableOpacity>
            ))}
            {!members.length && (
              <Text className="text-slate-400 text-xs">No members; leave blank.</Text>
            )}
          </View>
        </ScrollView>

        <Input
          label="Location Tag"
          value={locationTag}
          onChangeText={setLocationTag}
          placeholder="e.g. North Face, mid-height"
        />

        <Input
          label="UPV (m/s)"
          keyboardType="numeric"
          value={upv}
          onChangeText={setUpv}
          placeholder="e.g. 4200"
        />

        <Input
          label="Rebound Index"
          keyboardType="numeric"
          value={rh}
          onChangeText={setRh}
          placeholder="e.g. 32"
        />

        <Input
          label="Carbonation Depth (mm, optional)"
          keyboardType="numeric"
          value={carbonation}
          onChangeText={setCarbonation}
          placeholder="e.g. 15"
        />

        {error ? (
          <View className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-3 mb-3">
            <Text className="text-rose-100 text-xs">{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color="#34d399" />
        ) : (
          <Button
            title="Save Reading"
            onPress={handleSave}
          />
        )}
      </ScrollView>
    </Screen>
  );
}
