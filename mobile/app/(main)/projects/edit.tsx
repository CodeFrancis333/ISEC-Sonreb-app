import React, { useEffect, useRef, useState } from "react";
import { Text, ScrollView, Alert, TouchableOpacity, View, Modal } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import * as Location from "expo-location";
import { getProject, updateProject } from "../../../services/projectService";
import { useAuthStore } from "../../../store/authStore";
import { getThemeColors, useThemeStore } from "../../../store/themeStore";

export default function EditProjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const projectId = params.id as string | undefined;
  const { token } = useAuthStore();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);
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
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [searchError, setSearchError] = useState("");
  const [mapRegion, setMapRegion] = useState({
    latitude: 14.5995,
    longitude: 120.9842,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const mapRef = useRef<any>(null);
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

  const animateMapTo = (lat: number, lon: number) => {
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lon,
        latitudeDelta: mapRegion.latitudeDelta,
        longitudeDelta: mapRegion.longitudeDelta,
      },
      450
    );
  };

  useEffect(() => {
    if (!showMapPicker) return;
    if (pendingLat !== null && pendingLng !== null) {
      animateMapTo(pendingLat, pendingLng);
    } else if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        animateMapTo(lat, lon);
      }
    }
  }, [showMapPicker, pendingLat, pendingLng, latitude, longitude]);

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
        <Text className="text-xl font-bold mb-1" style={{ color: theme.textPrimary }}>
          Edit Project
        </Text>
        <Text className="mb-6" style={{ color: theme.textSecondary }}>
          Update project information and design strength.
        </Text>

        {loadingProject ? (
          <Text className="text-sm" style={{ color: theme.textSecondary }}>
            Loading...
          </Text>
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
                  const lat = latitude ? parseFloat(latitude) : null;
                  const lon = longitude ? parseFloat(longitude) : null;
                  setPendingLat(lat);
                  setPendingLng(lon);
                  setShowMapPicker(true);
                }}
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: theme.surfaceAlt }}
              >
                <Text className="text-xs" style={{ color: theme.accent }}>
                  Pick on map
                </Text>
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
                    animateMapTo(lat, lon);
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
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: theme.surfaceAlt }}
              >
                <Text className="text-xs" style={{ color: theme.accent }}>
                  Use my location
                </Text>
              </TouchableOpacity>
            </View>

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
          <Text className="text-xs" style={{ color: theme.accent }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <Modal visible={showMapPicker} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-center">
          <View
            className="m-4 rounded-2xl overflow-hidden border"
            style={{ backgroundColor: theme.appBg, borderColor: theme.border }}
          >
            <Text className="text-base font-semibold px-4 pt-3" style={{ color: theme.textPrimary }}>
              Tap to set location
            </Text>
            <Text className="text-xs px-4 pb-2" style={{ color: theme.textSecondary }}>
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
                      setSearchResults([]);
                      const resp = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=${encodeURIComponent(
                          searchQuery.trim()
                        )}&email=sonreb.app@example.com`,
                        {
                          headers: {
                            Accept: "application/json",
                            "Accept-Language": "en",
                            "User-Agent": "sonreb-app/1.0 (contact: sonreb.app@example.com)",
                          },
                        }
                      );
                      if (!resp.ok) {
                        const bodyText = await resp.text();
                        throw new Error(
                          `Geocode failed (${resp.status}): ${bodyText.slice(0, 200)}`
                        );
                      }
                      const results = await resp.json();
                      if (results.length) {
                        setSearchResults(results);
                        const first = results[0];
                        const lat = parseFloat(first.lat);
                        const lon = parseFloat(first.lon);
                        setPendingLat(lat);
                        setPendingLng(lon);
                        setLatitude(String(lat));
                        setLongitude(String(lon));
                        animateMapTo(lat, lon);
                        setResolvedAddress(first.display_name || "");
                      } else {
                        setSearchError("No results found. Try a different address.");
                      }
                    } catch (err: any) {
                      setSearchError(err?.message || "Offline or geocoder unavailable. Please enter coordinates manually.");
                    } finally {
                      setSearching(false);
                    }
                  }}
                  className="px-3 py-2 rounded-lg"
                  style={{ backgroundColor: theme.surfaceAlt }}
                >
                  <Text className="text-xs" style={{ color: theme.accent }}>
                    {searching ? "Searching..." : "Search"}
                  </Text>
                </TouchableOpacity>
              </View>
              {searchError ? (
                <Text className="text-[11px] mt-1" style={{ color: theme.error }}>
                  {searchError}
                </Text>
              ) : null}
              {searchResults.length ? (
                <View className="mt-2 border rounded-lg overflow-hidden" style={{ borderColor: theme.border }}>
                  {searchResults.map((result) => (
                    <TouchableOpacity
                      key={result.place_id}
                      className="px-3 py-2 border-b"
                      style={{ borderBottomColor: theme.border }}
                      onPress={() => {
                        const lat = parseFloat(result.lat);
                        const lon = parseFloat(result.lon);
                        setPendingLat(lat);
                        setPendingLng(lon);
                        setLatitude(String(lat));
                        setLongitude(String(lon));
                        setResolvedAddress(result.display_name || "");
                        animateMapTo(lat, lon);
                        setSearchResults([]);
                      }}
                    >
                      <Text className="text-[11px]" style={{ color: theme.textPrimary }}>
                        {result.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
            <View style={{ height: 260 }}>
              {(() => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-var-requires
                  const Maps = require("react-native-maps");
                  const MapView = Maps.default;
                  return (
                    <View style={{ flex: 1 }}>
                      <MapView
                        style={{ flex: 1 }}
                        ref={mapRef}
                        initialRegion={mapRegion}
                        showsUserLocation={false}
                        followsUserLocation={false}
                        showsMyLocationButton={false}
                        onRegionChangeComplete={(region: any) => {
                          setMapRegion(region);
                          setPendingLat(region.latitude);
                          setPendingLng(region.longitude);
                        }}
                      />
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          marginLeft: -8,
                          marginTop: -8,
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: "#34d399",
                          backgroundColor: "rgba(52, 211, 153, 0.2)",
                        }}
                      />
                    </View>
                  );
                } catch (err) {
                  return (
                    <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.surface }}>
                      <Text className="text-xs px-4 text-center" style={{ color: theme.textSecondary }}>
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
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: theme.surfaceAlt }}
              >
                <Text className="text-xs" style={{ color: theme.textSecondary }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (pendingLat !== null && pendingLng !== null) {
                    setLatitude(String(pendingLat));
                    setLongitude(String(pendingLng));
                    (async () => {
                      try {
                        const reverse = await Location.reverseGeocodeAsync({
                          latitude: pendingLat,
                          longitude: pendingLng,
                        });
                        if (reverse.length) {
                          const r = reverse[0];
                          const label = [r.name, r.street, r.city, r.region, r.country].filter(Boolean).join(", ");
                          setResolvedAddress(label);
                        }
                      } catch {
                        setResolvedAddress("");
                      }
                    })();
                  }
                  setShowMapPicker(false);
                }}
                className="px-3 py-2 rounded-lg"
                style={{ backgroundColor: theme.accent }}
              >
                <Text className="text-xs" style={{ color: theme.textPrimary }}>
                  Use location
                </Text>
              </TouchableOpacity>
            </View>
            {resolvedAddress ? (
              <Text className="text-[11px] px-4 pb-3" style={{ color: theme.textSecondary }}>
                Selected: {resolvedAddress}
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
