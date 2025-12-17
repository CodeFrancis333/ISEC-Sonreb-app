import React, { useState } from "react";
import { Text, ScrollView, Alert, View, TouchableOpacity, Modal } from "react-native";
import { useRouter } from "expo-router";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import * as Location from "expo-location";
import { createProject } from "../../../services/projectService";
import { useAuthStore } from "../../../store/authStore";

export default function NewProjectScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [client, setClient] = useState("");
  const [designFc, setDesignFc] = useState("");
  const [structureAge, setStructureAge] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pendingLat, setPendingLat] = useState<number | null>(null);
  const [pendingLng, setPendingLng] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [searchError, setSearchError] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
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

      await createProject(payload, token || undefined);
      router.back();
    } catch (err: any) {
      Alert.alert("Create failed", err.message || "Unable to create project.");
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
          New Project
        </Text>
        <Text className="text-slate-300 mb-6">
          Define the project information and design strength.
        </Text>

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
          placeholder="City / Site"
        />

        <Input
          label="Client (optional)"
          value={client}
          onChangeText={setClient}
          placeholder="Client name"
        />

        <Input
          label="Structure Age (years)"
          keyboardType="numeric"
          value={structureAge}
          onChangeText={(v) => setStructureAge(v.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 12"
        />

        <Input
          label="Latitude"
          keyboardType="numeric"
          value={latitude}
          onChangeText={(v) => setLatitude(v.replace(/[^0-9.-]/g, ""))}
          placeholder="e.g. 14.5995"
        />

        <Input
          label="Longitude"
          keyboardType="numeric"
          value={longitude}
          onChangeText={(v) => setLongitude(v.replace(/[^0-9.-]/g, ""))}
          placeholder="e.g. 120.9842"
        />
        <View className="flex-row gap-2 mb-2">
          <TouchableOpacity
            onPress={() => {
              setPendingLat(latitude ? parseFloat(latitude) : null);
              setPendingLng(longitude ? parseFloat(longitude) : null);
              setShowMapPicker(true);
            }}
            className="px-3 py-2 rounded-lg bg-slate-700"
          >
            <Text className="text-emerald-300 text-xs">Pick on map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== "granted") {
                  Alert.alert("Permission denied", "Location permission is required to use this shortcut.");
                  return;
                }
                const current = await Location.getCurrentPositionAsync({});
                const lat = current.coords.latitude;
                const lon = current.coords.longitude;
                setLatitude(String(lat));
                setLongitude(String(lon));
                setPendingLat(lat);
                setPendingLng(lon);
                // optional reverse geocode
                try {
                  const resp = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
                  );
                  const data = await resp.json();
                  if (data?.display_name) {
                    setResolvedAddress(data.display_name);
                  }
                } catch {
                  setResolvedAddress("");
                }
              } catch (err: any) {
                Alert.alert("Location error", err?.message || "Unable to fetch current location.");
              }
            }}
            className="px-3 py-2 rounded-lg bg-slate-700"
          >
            <Text className="text-emerald-300 text-xs">Use my location</Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Design fc′ (MPa, optional)"
          keyboardType="numeric"
          value={designFc}
          onChangeText={setDesignFc}
          placeholder="e.g. 28"
        />

        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional details"
          multiline
        />

        <Button title="Save Project" onPress={handleSave} />
      </ScrollView>
      <Modal visible={showMapPicker} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-center">
          <View className="m-4 bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
            <Text className="text-white text-base font-semibold px-4 pt-3">
              Tap to set location
            </Text>
            <Text className="text-slate-400 text-xs px-4 pb-2">
              Uses react-native-maps if available; otherwise close and enter manually.
            </Text>
            <View className="px-4 pb-2">
              <Input
                label="Search address (OpenStreetMap)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="e.g. Quezon City Hall"
              />
              <View className="flex-row justify-end mt-1">
                <TouchableOpacity
                  onPress={async () => {
                    if (!searchQuery.trim()) return;
                    try {
                      setSearching(true);
                      setSearchError("");
                      const q = encodeURIComponent(searchQuery.trim());
                      const resp = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=5`
                      );
                      const data = await resp.json();
                      setSearchResults(data || []);
                    } catch (err) {
                      Alert.alert("Search failed", "Unable to fetch address suggestions.");
                      setSearchResults([]);
                      setSearchError("Offline or geocoder unavailable. Please enter coordinates manually.");
                    } finally {
                      setSearching(false);
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-700"
                >
                  <Text className="text-emerald-300 text-xs">{searching ? "Searching..." : "Search"}</Text>
                </TouchableOpacity>
              </View>
              {searchResults.length ? (
                <View className="mt-2 border border-slate-700 rounded-lg max-h-36">
                  <ScrollView>
                    {searchResults.map((r, idx) => (
                      <TouchableOpacity
                        key={`${r.place_id || idx}`}
                        className="px-3 py-2 border-b border-slate-800"
                        onPress={() => {
                          const lat = parseFloat(r.lat);
                          const lon = parseFloat(r.lon);
                          if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
                            setPendingLat(lat);
                            setPendingLng(lon);
                            setLatitude(String(lat));
                            setLongitude(String(lon));
                            setResolvedAddress(r.display_name || "");
                          }
                          setSearchQuery(r.display_name || "");
                        }}
                      >
                        <Text className="text-slate-100 text-xs" numberOfLines={2}>
                          {r.display_name || "Result"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
              {searchError ? (
                <Text className="text-rose-300 text-[11px] mt-1">{searchError}</Text>
              ) : null}
            </View>
            <View style={{ height: 260 }}>
              {(() => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const Maps = require("react-native-maps");
                  const MapView = Maps.default;
                  const Marker = Maps.Marker;
                  const lat = pendingLat ?? 14.5995;
                  const lng = pendingLng ?? 120.9842;
                  return (
                    <MapView
                      style={{ flex: 1 }}
                      initialRegion={{
                        latitude: lat,
                        longitude: lng,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                      }}
                      onPress={(e: any) => {
                        const tappedLat = e.nativeEvent.coordinate.latitude;
                        const tappedLng = e.nativeEvent.coordinate.longitude;
                        setPendingLat(tappedLat);
                        setPendingLng(tappedLng);
                        (async () => {
                          try {
                            const resp = await fetch(
                              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${tappedLat}&lon=${tappedLng}`
                            );
                            const data = await resp.json();
                            if (data?.display_name) {
                              setResolvedAddress(data.display_name);
                            }
                          } catch {
                            setResolvedAddress("");
                          }
                        })();
                      }}
                    >
                      {pendingLat !== null && pendingLng !== null ? (
                        <Marker coordinate={{ latitude: pendingLat, longitude: pendingLng }} />
                      ) : null}
                    </MapView>
                  );
                } catch (err) {
                  return (
                    <View className="flex-1 items-center justify-center bg-slate-800">
                      <Text className="text-slate-300 text-xs px-4 text-center">
                        Map component not available. Please install react-native-maps or enter coordinates manually.
                      </Text>
                    </View>
                  );
                }
              })()}
            </View>
            <View className="flex-row justify-end gap-3 px-4 py-3">
              <TouchableOpacity
                onPress={() => setShowMapPicker(false)}
                className="px-3 py-2 rounded-lg bg-slate-700"
              >
                <Text className="text-slate-200 text-xs">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (pendingLat !== null && pendingLng !== null) {
                    setLatitude(String(pendingLat));
                    setLongitude(String(pendingLng));
                  }
                  setShowMapPicker(false);
                }}
                className="px-3 py-2 rounded-lg bg-emerald-600"
              >
                <Text className="text-white text-xs">Use location</Text>
              </TouchableOpacity>
            </View>
            {resolvedAddress ? (
              <Text className="text-slate-400 text-[11px] px-4 pb-3">
                Selected: {resolvedAddress}
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
