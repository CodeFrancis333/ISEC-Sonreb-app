import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
} from "react-native";
import Screen from "../../../components/layout/Screen";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import { HistogramChart } from "../../../components/charts/HistogramChart";
import { ScatterChart } from "../../../components/charts/ScatterChart";
import { useAuthStore } from "../../../store/authStore";
import { listProjects, Project } from "../../../services/projectService";
import { getActiveModel, CalibrationModel } from "../../../services/calibrationService";
import {
  listReports,
  createReport,
  updateReport,
  deleteReport,
  exportReport,
  Report,
  getReportSummary,
  uploadReportFile,
  listReadingFolders,
  listDerivedReadingFolders,
  createReadingFolder,
  deleteReadingFolder,
  deleteReportPhoto,
  updateReportPhoto,
} from "../../../services/reportService";
import * as Linking from "expo-linking";
import * as DocumentPicker from "expo-document-picker";

export default function ReportsScreen() {
  const { token } = useAuthStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<CalibrationModel | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [company, setCompany] = useState("");
  const [clientName, setClientName] = useState("");
  const [engineerName, setEngineerName] = useState("");
  const [engineerTitle, setEngineerTitle] = useState("");
  const [engineerLicense, setEngineerLicense] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [exclusionNotes, setExclusionNotes] = useState("");
  const [filterElement, setFilterElement] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterFcMin, setFilterFcMin] = useState("");
  const [filterFcMax, setFilterFcMax] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folderSearch, setFolderSearch] = useState("");
  const [folderOptions, setFolderOptions] = useState<any[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDate, setNewFolderDate] = useState("");
  const [newFolderNotes, setNewFolderNotes] = useState("");
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingPhotoCaption, setEditingPhotoCaption] = useState("");
  const [editingPhotoLocation, setEditingPhotoLocation] = useState("");
  const [editingPhotoUrl, setEditingPhotoUrl] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [qualityBreakdown, setQualityBreakdown] = useState<{ pass?: number; fail?: number }>({});
  const [warningBreakdown, setWarningBreakdown] = useState<{ count?: number; details?: string[] }>({});

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const proj = await listProjects(token || undefined);
        setProjects(proj);
        const first = proj[0]?.id || null;
        setSelectedProjectId((prev) => prev || first);
      } catch (err: any) {
        setError(err.message || "Unable to load projects.");
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [token]);

  useEffect(() => {
    async function loadFolders() {
      try {
        setLoadingFolders(true);
        if (!selectedProjectId) {
          setFolderOptions([]);
          return;
        }
        const [readingFolders, derived] = await Promise.all([
          listReadingFolders(selectedProjectId, token || undefined),
          listDerivedReadingFolders(selectedProjectId, token || undefined),
        ]);
        const merged = [...(readingFolders || [])];
        const existingNames = new Set(merged.map((f) => f.name));
        derived.forEach((d) => {
          if (!existingNames.has(d.name)) {
            merged.push({ id: `auto-${d.name}`, project: selectedProjectId!, name: d.name, notes: `Auto from location tags (${d.count})`, derived: true });
          }
        });
        setFolderOptions(merged);
      } catch {
        setFolderOptions([]);
      } finally {
        setLoadingFolders(false);
      }
    }
    loadFolders();
  }, [token, selectedProjectId]);

  const refreshFoldersAndSummary = async () => {
    if (!selectedProjectId) return;
    try {
      setLoading(true);
      setLoadingFolders(true);
      const readingFolders = await listReadingFolders(selectedProjectId, token || undefined);
      setFolderOptions(readingFolders || []);
      const refreshed = await listReports(selectedProjectId, token || undefined);
      setReports(refreshed);
      const sum = await getReportSummary(selectedProjectId, token || undefined, {
        folder: folder || null,
        filter_element: filterElement || null,
        filter_location: filterLocation || null,
        filter_fc_min: filterFcMin || null,
        filter_fc_max: filterFcMax || null,
      });
      setSummary(sum);
      if (sum?.summary?.pass_fail) {
        setQualityBreakdown({
          pass: sum.summary.pass_fail.pass ?? 0,
          fail: sum.summary.pass_fail.fail ?? 0,
        });
      }
      setWarningBreakdown({
        count: sum?.summary?.warnings ?? 0,
        details: (sum as any)?.warnings_breakdown || [],
      });
    } catch (err: any) {
      Alert.alert("Refresh failed", err?.message || "Unable to refresh data.");
    } finally {
      setLoading(false);
      setLoadingFolders(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!selectedProjectId || !newFolderName.trim()) {
      Alert.alert("Folder name required", "Enter a folder name first.");
      return;
    }
    try {
      setLoadingFolders(true);
      await createReadingFolder(
        {
          project: selectedProjectId,
          name: newFolderName.trim(),
          date_range: newFolderDate || undefined,
          notes: newFolderNotes || undefined,
        },
        token || undefined
      );
      setNewFolderName("");
      setNewFolderDate("");
      setNewFolderNotes("");
      await refreshFoldersAndSummary();
    } catch (err: any) {
      Alert.alert("Create folder failed", err?.message || "Unable to create folder.");
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    Alert.alert("Delete folder?", "This will remove the folder reference. Readings are not deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoadingFolders(true);
            await deleteReadingFolder(id, token || undefined);
            if (folderOptions.find((f) => f.id === id)?.name === folder) {
              setFolder("");
            }
            await refreshFoldersAndSummary();
          } catch (err: any) {
            Alert.alert("Delete failed", err?.message || "Unable to delete folder.");
          } finally {
            setLoadingFolders(false);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    async function loadModel() {
      if (!selectedProjectId) {
        setActiveModel(null);
        return;
      }
      try {
        const model = await getActiveModel(selectedProjectId, token || undefined);
        setActiveModel(model);
      } catch {
        setActiveModel(null);
      }
    }
    loadModel();
  }, [selectedProjectId, token]);

  useEffect(() => {
    async function loadReports() {
      if (!selectedProjectId) {
        setReports([]);
        setSummary(null);
        return;
      }
      try {
        setLoading(true);
        const data = await listReports(selectedProjectId, token || undefined);
        setReports(data);
        try {
          setLoadingSummary(true);
          const sum = await getReportSummary(selectedProjectId, token || undefined, {
            folder: folder || null,
            filter_element: filterElement || null,
            filter_location: filterLocation || null,
            filter_fc_min: filterFcMin || null,
            filter_fc_max: filterFcMax || null,
          });
          setSummary(sum);
          if (sum?.summary?.pass_fail) {
            setQualityBreakdown({
              pass: sum.summary.pass_fail.pass ?? 0,
              fail: sum.summary.pass_fail.fail ?? 0,
            });
          }
          setWarningBreakdown({
            count: sum?.summary?.warnings ?? 0,
            details: (sum as any)?.warnings_breakdown || [],
          });
        } catch {
          setSummary(null);
          setQualityBreakdown({});
          setWarningBreakdown({});
        } finally {
          setLoadingSummary(false);
        }
      } catch (err: any) {
        setError(err.message || "Unable to load reports.");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, token]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setFolder("");
    setDateRange("");
    setCompany("");
    setClientName("");
    setEngineerName("");
    setEngineerTitle("");
    setEngineerLicense("");
    setLogoUrl("");
    setSignatureUrl("");
    setNotes("");
    setExclusionNotes("");
    setFilterElement("");
    setFilterLocation("");
    setFilterFcMin("");
    setFilterFcMax("");
  };

  const handleSave = async () => {
    if (!selectedProjectId) {
      Alert.alert("Select project", "Please select a project/folder first.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a report title.");
      return;
    }
    const anyFilter = !!(filterElement || filterLocation || filterFcMin || filterFcMax);
    if (anyFilter && !exclusionNotes.trim()) {
      Alert.alert("Exclusion notes required", "Please add notes for filtered/excluded data.");
      return;
    }

    const payload = {
      project: selectedProjectId,
      title: title.trim(),
      folder: folder || null,
      date_range: dateRange || null,
      company: company || null,
      client_name: clientName || null,
      engineer_name: engineerName || null,
      engineer_title: engineerTitle || null,
      engineer_license: engineerLicense || null,
      logo_url: logoUrl || null,
      signature_url: signatureUrl || null,
      notes: notes || null,
    };

    try {
      setLoading(true);
      if (editingId) {
        await updateReport(editingId, payload, token || undefined);
      } else {
        await createReport(payload, token || undefined);
      }
      resetForm();
      const refreshed = await listReports(selectedProjectId, token || undefined);
      setReports(refreshed);
      Alert.alert("Saved", "Report saved.");
    } catch (err: any) {
      Alert.alert("Save failed", err?.message || "Could not save report.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete report?", "This will remove the saved report entry.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await deleteReport(id, token || undefined);
            setReports((prev) => prev.filter((r) => r.id !== id));
          } catch (err: any) {
            Alert.alert("Delete failed", err?.message || "Unable to delete report.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleExport = async (format: "pdf" | "csv", reportId?: string) => {
    const targetId = reportId || editingId;
    if (!targetId) {
      Alert.alert("Select report", "Save or pick a report to export.");
      return;
    }
    try {
      setLoading(true);
      await exportReport(
        {
          report_id: targetId,
          format,
          folder: folder || null,
          filter_element: filterElement || null,
          filter_location: filterLocation || null,
          filter_fc_min: filterFcMin || null,
          filter_fc_max: filterFcMax || null,
        },
        token || undefined
      );
      if (selectedProjectId) {
        const refreshed = await listReports(selectedProjectId, token || undefined);
        setReports(refreshed);
      }
      Alert.alert("Export started", `Exporting report as ${format.toUpperCase()}.`);
    } catch (err: any) {
      Alert.alert("Export failed", err?.message || "Could not export.");
    } finally {
      setLoading(false);
    }
  };

  const pickAndUpload = async (type: "logo" | "signature" | "photo") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const file: any = {
        uri: asset.uri,
        name: asset.name || `upload.${asset.mimeType?.split("/")[1] || "bin"}`,
        type: asset.mimeType || "application/octet-stream",
      };

      setLoading(true);
      const resp = await uploadReportFile(type, file, editingId || undefined, undefined, undefined, token || undefined);

      if (type === "logo" && resp?.url) setLogoUrl(resp.url);
      if (type === "signature" && resp?.url) setSignatureUrl(resp.url);
      if (type === "photo" && resp?.image_url) setUploadedPhotos((prev) => [resp, ...prev]);

      Alert.alert("Uploaded", `${type === "photo" ? "Photo" : "File"} uploaded.`);
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message || "Could not upload file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    Alert.alert("Delete photo?", "This will remove the uploaded photo.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await deleteReportPhoto(photoId, token || undefined);
            setUploadedPhotos((prev) => prev.filter((p) => p.id !== photoId));
          } catch (err: any) {
            Alert.alert("Delete failed", err?.message || "Could not delete photo.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const startEditPhoto = (photo: any) => {
    setEditingPhotoId(photo.id);
    setEditingPhotoCaption(photo.caption || "");
    setEditingPhotoLocation(photo.location_tag || "");
    setEditingPhotoUrl(photo.image_url || "");
    setShowPhotoModal(true);
  };

  const saveEditPhoto = async () => {
    if (!editingPhotoId) return;
    try {
      setLoading(true);
      const updated = await updateReportPhoto(
        editingPhotoId,
        { caption: editingPhotoCaption, location_tag: editingPhotoLocation },
        token || undefined
      );
      setUploadedPhotos((prev) => prev.map((p) => (p.id === editingPhotoId ? { ...p, ...updated } : p)));
      setEditingPhotoId(null);
      setEditingPhotoCaption("");
      setEditingPhotoLocation("");
      setEditingPhotoUrl("");
      setShowPhotoModal(false);
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Could not update photo.");
    } finally {
      setLoading(false);
    }
  };

  const sameLocationPhotos = useMemo(() => {
    if (!editingPhotoLocation) return [];
    return uploadedPhotos.filter(
      (p) => p.location_tag === editingPhotoLocation && (p.id ? p.id !== editingPhotoId : true)
    );
  }, [uploadedPhotos, editingPhotoLocation, editingPhotoId]);

  const photosByLocation = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    uploadedPhotos.forEach((p) => {
      const key = p.location_tag || "No location";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });
    return Object.entries(grouped);
  }, [uploadedPhotos]);

  return (
    <Screen showNav>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        <Text className="text-xs text-emerald-400 uppercase">Reports</Text>
        <Text className="text-xl font-bold text-white mb-1">Export Report</Text>
        <Text className="text-slate-400 text-xs mb-4">
          Select a readings folder, customize metadata, and save/export your report.
        </Text>

        {error ? (
          <View className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-3 mb-3">
            <Text className="text-rose-100 text-xs">{error}</Text>
          </View>
        ) : null}

        {/* Project selector */}
        <View className="mb-3">
          <Text className="text-slate-200 text-sm mb-1">Select Project Folder</Text>
          <TouchableOpacity
            onPress={() => setShowProjectPicker((prev) => !prev)}
            className="border border-slate-600 rounded-lg px-3 py-3 bg-slate-800"
          >
            <Text className="text-slate-100 text-xs">
              {projects.find((p) => p.id === selectedProjectId)?.name || "Choose project"}
            </Text>
          </TouchableOpacity>

          {showProjectPicker && (
            <View className="mt-2 border border-slate-600 rounded-lg bg-slate-800">
              <TextInput
                placeholder="Search project"
                placeholderTextColor="#94a3b8"
                value={projectSearch}
                onChangeText={setProjectSearch}
                className="px-3 py-2 text-slate-100 text-xs border-b border-slate-700"
              />
              <ScrollView style={{ maxHeight: 220 }}>
                {projects
                  .filter((p) => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                  .map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => {
                        setSelectedProjectId(p.id);
                        setShowProjectPicker(false);
                      }}
                      className="px-3 py-2"
                    >
                      <Text className="text-slate-100 text-xs">{p.name}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-slate-200 text-sm">Folders & Summary</Text>
          <TouchableOpacity
            onPress={refreshFoldersAndSummary}
            className="px-3 py-2 rounded-lg bg-slate-700"
            disabled={loadingFolders || loading}
          >
            <Text className="text-emerald-300 text-xs">{loadingFolders ? "Refreshing..." : "Refresh"}</Text>
          </TouchableOpacity>
        </View>

        <View className="rounded-xl bg-slate-800 p-4 mb-3">
          <Text className="text-slate-200 text-sm mb-2">Project / Folder Details</Text>
          <Text className="text-slate-400 text-xs">Project: {projects.find((p) => p.id === selectedProjectId)?.name || "N/A"}</Text>
          <Text className="text-slate-400 text-xs">
            Age: {projects.find((p) => p.id === selectedProjectId)?.structure_age ?? "N/A"} years
          </Text>
          <Text className="text-slate-400 text-xs">
            Lat/Long: {projects.find((p) => p.id === selectedProjectId)?.latitude ?? "N/A"},{" "}
            {projects.find((p) => p.id === selectedProjectId)?.longitude ?? "N/A"}
          </Text>
          <Text className="text-slate-400 text-xs">
            Folder: {folder || "None selected"} {dateRange ? `| Date range: ${dateRange}` : ""}
          </Text>
          <Text className="text-slate-400 text-xs">Active model ID: {activeModel?.id ?? "N/A"}</Text>
        </View>

        {/* Active model card */}
        <View className="rounded-xl bg-slate-800 p-4 mb-3">
          <Text className="text-slate-200 text-sm mb-1">Active Correlation Model</Text>
          {activeModel ? (
            <>
              <Text className="text-slate-100 text-xs">
                Equation: fc = {activeModel.a0.toFixed(4)} * UPV^{activeModel.a2.toFixed(3)} * RH^{activeModel.a1.toFixed(3)}
                {activeModel.use_carbonation && activeModel.a3 ? ` * Carb^{${activeModel.a3.toFixed(3)}}` : ""}
              </Text>
              <Text className="text-slate-400 text-[11px] mt-1">Model ID: {activeModel.id}</Text>
              <Text className="text-slate-400 text-xs mt-1">
                r2 {activeModel.r2?.toFixed(2) ?? "N/A"} | RMSE {activeModel.rmse?.toFixed(2) ?? "N/A"} MPa | Points{" "}
                {activeModel.points_used}
              </Text>
              <Text className="text-slate-400 text-xs mt-1">
                UPV range: {activeModel.upv_min ?? "?"}-{activeModel.upv_max ?? "?"} | RH range: {activeModel.rh_min ?? "?"}-
                {activeModel.rh_max ?? "?"}
              </Text>
              {activeModel.use_carbonation ? (
                <Text className="text-slate-400 text-xs mt-1">
                  Carbonation range: {activeModel.carbonation_min ?? "?"}-{activeModel.carbonation_max ?? "?"}
                </Text>
              ) : null}
            </>
          ) : (
            <Text className="text-slate-400 text-xs">No active model for this project.</Text>
          )}
        </View>

        {/* Report form */}
        <View className="rounded-xl bg-slate-800 p-4 mb-3">
          <Text className="text-slate-200 text-sm mb-2">Report Details</Text>

          <Input label="Report Title" value={title} onChangeText={setTitle} placeholder="e.g. SonReb Assessment Report" />

          <Text className="text-slate-200 text-sm mb-1">Readings Folder</Text>
          <TouchableOpacity
            onPress={() => setShowFolderPicker((prev) => !prev)}
            className="border border-slate-600 rounded-lg px-3 py-3 bg-slate-800"
          >
            <Text className="text-slate-100 text-xs">{folder || "Select or type folder name"}</Text>
          </TouchableOpacity>

          {showFolderPicker ? (
            <View className="mt-2 border border-slate-600 rounded-lg bg-slate-800">
              <TextInput
                placeholder="Search folders"
                placeholderTextColor="#94a3b8"
                value={folderSearch}
                onChangeText={setFolderSearch}
                className="px-3 py-2 text-slate-100 text-xs border-b border-slate-700"
              />
              <ScrollView style={{ maxHeight: 160 }}>
                {folderOptions
                  .filter((f) => (f?.name || "").toLowerCase().includes(folderSearch.toLowerCase()))
                  .map((f) => (
                    <TouchableOpacity
                      key={String(f.id)}
                      className="px-3 py-2"
                      onPress={() => {
                        setFolder(f.name || "");
                        setShowFolderPicker(false);
                      }}
                    >
                      <Text className="text-slate-100 text-xs">{f.name}</Text>
                      {f.date_range ? <Text className="text-slate-500 text-[10px]">Dates: {f.date_range}</Text> : null}
                      {f.notes ? (
                        <Text className="text-slate-500 text-[10px]" numberOfLines={1}>
                          {f.notes}
                        </Text>
                      ) : null}

                      <TouchableOpacity onPress={() => handleDeleteFolder(f.id)} className="mt-1">
                        <Text className="text-rose-300 text-[10px]">Delete</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
              </ScrollView>

              <TouchableOpacity
                className="px-3 py-2 border-t border-slate-700"
                onPress={() => {
                  setFolder(folderSearch);
                  setShowFolderPicker(false);
                }}
              >
                <Text className="text-emerald-300 text-xs">Use "{folderSearch || "typed name"}"</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View className="mt-3">
            <Text className="text-slate-200 text-sm mb-1">Create Folder</Text>
            <Input label="Name" value={newFolderName} onChangeText={setNewFolderName} placeholder="e.g. Grid A North" />
            <Input label="Date Range" value={newFolderDate} onChangeText={setNewFolderDate} placeholder="e.g. Dec 1–10, 2025" />
            <Input label="Notes" value={newFolderNotes} onChangeText={setNewFolderNotes} placeholder="Folder notes" />
            <Button title={loadingFolders ? "Saving..." : "Save Folder"} onPress={handleCreateFolder} disabled={loadingFolders} />
          </View>

          <Input label="Date Range" value={dateRange} onChangeText={setDateRange} placeholder="e.g. Dec 1–10, 2025" />
          <Input label="Company / Project By" value={company} onChangeText={setCompany} placeholder="e.g. ACME Testing" />
          <Input label="Client Name" value={clientName} onChangeText={setClientName} placeholder="Client name" />
          <Input label="Company Logo URL" value={logoUrl} onChangeText={setLogoUrl} placeholder="https://example.com/logo.png" />
          <Input
            label="Signature Image URL"
            value={signatureUrl}
            onChangeText={setSignatureUrl}
            placeholder="https://example.com/signature.png"
          />
          <Input label="Report Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Notes" />

          <Text className="text-slate-200 text-sm mt-3 mb-2">Engineer Sign-off</Text>
          <Input label="Name" value={engineerName} onChangeText={setEngineerName} placeholder="Engineer name" />
          <Input label="Title" value={engineerTitle} onChangeText={setEngineerTitle} placeholder="Engineer title" />
          <Input label="License / PE #" value={engineerLicense} onChangeText={setEngineerLicense} placeholder="License number" />

          <View className="flex-row gap-2 mt-2">
            <TouchableOpacity onPress={() => pickAndUpload("logo")} className="px-3 py-2 rounded-lg bg-slate-700">
              <Text className="text-emerald-300 text-xs">{logoUrl ? "Re-upload Logo" : "Upload Logo"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickAndUpload("signature")} className="px-3 py-2 rounded-lg bg-slate-700">
              <Text className="text-emerald-300 text-xs">{signatureUrl ? "Re-upload Signature" : "Upload Signature"}</Text>
            </TouchableOpacity>
          </View>

          {logoUrl ? (
            <View className="mt-2 flex-row items-center gap-2">
              <Image source={{ uri: logoUrl }} style={{ width: 48, height: 24, resizeMode: "contain" }} />
              <Text className="text-slate-500 text-[11px] flex-1" numberOfLines={1}>
                {logoUrl}
              </Text>
            </View>
          ) : null}

          {signatureUrl ? (
            <View className="mt-1 flex-row items-center gap-2">
              <Image source={{ uri: signatureUrl }} style={{ width: 64, height: 32, resizeMode: "contain" }} />
              <Text className="text-slate-500 text-[11px] flex-1" numberOfLines={1}>
                {signatureUrl}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Transparency card */}
        <View className="rounded-xl bg-slate-800 p-4 mb-3">
          <Text className="text-slate-200 text-sm mb-2">Data Transparency</Text>
          <Text className="text-slate-400 text-xs mb-2">
            Filters: element, location, estimated fc range; exclusion notes are required when filters are applied.
          </Text>
          <Input label="Filter by Element" value={filterElement} onChangeText={setFilterElement} placeholder="e.g. Column" />
          <Input label="Filter by Location" value={filterLocation} onChangeText={setFilterLocation} placeholder="e.g. Grid A-1" />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Input label="fc min (MPa)" value={filterFcMin} onChangeText={setFilterFcMin} placeholder="e.g. 15" />
            </View>
            <View className="flex-1">
              <Input label="fc max (MPa)" value={filterFcMax} onChangeText={setFilterFcMax} placeholder="e.g. 40" />
            </View>
          </View>
          <Input
            label="Exclusion notes (required when filters used)"
            value={exclusionNotes}
            onChangeText={setExclusionNotes}
            placeholder="Notes for excluded/filtered data"
          />
        </View>

        {/* Summary */}
        <View className="rounded-xl bg-slate-800 p-4 mb-3">
          <Text className="text-slate-200 text-sm mb-2">Summary & Statistics</Text>

          {loadingSummary ? (
            <ActivityIndicator color="#34d399" />
          ) : summary ? (
            <View>
              <Text className="text-slate-100 text-xs">
                Total readings: {summary.summary?.total_readings ?? "N/A"} | Total cores: {summary.summary?.total_cores ?? "N/A"}
              </Text>

              <Text className="text-slate-100 text-xs">
                Mean fc: {summary.summary?.mean_estimated_fc ? summary.summary.mean_estimated_fc.toFixed(2) : "N/A"} MPa
              </Text>

              <Text className="text-slate-100 text-xs">
                Quality: GOOD {summary.summary?.quality?.good ?? 0} | FAIR {summary.summary?.quality?.fair ?? 0} | POOR{" "}
                {summary.summary?.quality?.poor ?? 0}
              </Text>

              <View className="flex-row items-center mt-1">
                <View
                  className={`px-2 py-1 rounded-full ${
                    (summary.summary?.warnings ?? 0) > 0 ? "bg-rose-900/60" : "bg-emerald-900/60"
                  }`}
                >
                  <Text
                    className={`text-[11px] ${
                      (summary.summary?.warnings ?? 0) > 0 ? "text-rose-200" : "text-emerald-200"
                    }`}
                  >
                    Warnings: {summary.summary?.warnings ?? 0}
                  </Text>
                </View>
              </View>

              <View className="mt-2">
                <Text className="text-slate-100 text-xs mb-1">
                  Pass/Fail (design fc {summary.summary?.design_fc ?? "N/A"} MPa):
                </Text>

                <View className="bg-slate-700 h-2 rounded-full overflow-hidden">
                  {(() => {
                    const pass = summary.summary?.pass_fail?.pass ?? 0;
                    const fail = summary.summary?.pass_fail?.fail ?? 0;
                    const total = pass + fail || 1;
                    const passPct = (pass / total) * 100;

                    return (
                      <View className="h-full flex-row">
                        <View style={{ width: `${passPct}%` }} className="bg-emerald-400" />
                        <View style={{ flex: 1 }} className="bg-rose-400" />
                      </View>
                    );
                  })()}
                </View>

                <Text className="text-slate-400 text-[11px] mt-1">
                  PASS {summary.summary?.pass_fail?.pass ?? 0} | FAIL {summary.summary?.pass_fail?.fail ?? 0}
                </Text>

                {summary.summary?.pass_pct !== undefined && summary.summary?.fail_pct !== undefined ? (
                  <Text className="text-slate-400 text-[11px]">
                    Pass {(summary.summary.pass_pct * 100).toFixed(1)}% - Fail {(summary.summary.fail_pct * 100).toFixed(1)}%
                  </Text>
                ) : null}
              </View>

              <View className="mt-2">
                <Text className="text-slate-100 text-xs mb-1">Quality distribution vs design fc</Text>
                <View className="border border-slate-700 rounded-lg p-2">
                  <View className="flex-row justify-between">
                    <Text className="text-slate-300 text-[11px]">Pass</Text>
                    <Text className="text-slate-300 text-[11px]">
                      {summary.summary?.pass_fail?.pass ?? 0} (
                      {summary.summary?.pass_pct !== undefined ? (summary.summary.pass_pct * 100).toFixed(1) : "N/A"}%)
                    </Text>
                  </View>
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-slate-300 text-[11px]">Fail</Text>
                    <Text className="text-slate-300 text-[11px]">
                      {summary.summary?.pass_fail?.fail ?? 0} (
                      {summary.summary?.fail_pct !== undefined ? (summary.summary.fail_pct * 100).toFixed(1) : "N/A"}%)
                    </Text>
                  </View>
                </View>
              </View>

              {summary.summary?.warnings_breakdown ? (
                <View className="mt-2">
                  <Text className="text-slate-200 text-[11px] mb-1">Warnings breakdown</Text>

                  <View className="bg-slate-700 h-2 rounded-full overflow-hidden">
                    {(() => {
                      const rhLow = summary.summary.warnings_breakdown.rh_low ?? 0;
                      const rhHigh = summary.summary.warnings_breakdown.rh_high ?? 0;
                      const upvLow = summary.summary.warnings_breakdown.upv_low ?? 0;
                      const upvHigh = summary.summary.warnings_breakdown.upv_high ?? 0;
                      const total = rhLow + rhHigh + upvLow + upvHigh || 1;

                      return (
                        <View className="h-full flex-row">
                          <View style={{ flex: rhLow / total }} className="bg-amber-400" />
                          <View style={{ flex: rhHigh / total }} className="bg-amber-600" />
                          <View style={{ flex: upvLow / total }} className="bg-cyan-400" />
                          <View style={{ flex: upvHigh / total }} className="bg-cyan-600" />
                        </View>
                      );
                    })()}
                  </View>

                  <Text className="text-slate-400 text-[10px] mt-1">
                    RH&lt;min {summary.summary.warnings_breakdown.rh_low ?? 0} | RH&gt;max {summary.summary.warnings_breakdown.rh_high ?? 0}
                  </Text>
                  <Text className="text-slate-400 text-[10px]">
                    UPV&lt;min {summary.summary.warnings_breakdown.upv_low ?? 0} | UPV&gt;max{" "}
                    {summary.summary.warnings_breakdown.upv_high ?? 0}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text className="text-slate-400 text-xs">
              Total readings in folder, total cores used in active model, mean estimated fc, quality distribution, and warnings will appear here.
            </Text>
          )}
        </View>

        {/* Quality distribution mini-chart */}
        <View className="rounded-xl bg-slate-800 p-4 mb-3">
          <Text className="text-slate-200 text-sm mb-2">Quality Distribution</Text>
          <View className="bg-slate-700 h-3 rounded-full overflow-hidden mb-1">
            {(() => {
              const pass = qualityBreakdown.pass ?? 0;
              const fail = qualityBreakdown.fail ?? 0;
              const total = pass + fail || 1;
              const passPct = (pass / total) * 100;
              return (
                <View className="h-full flex-row">
                  <View style={{ width: `${passPct}%` }} className="bg-emerald-400" />
                  <View style={{ flex: 1 }} className="bg-rose-400" />
                </View>
              );
            })()}
          </View>
          <Text className="text-slate-400 text-[11px]">
            PASS {qualityBreakdown.pass ?? 0} | FAIL {qualityBreakdown.fail ?? 0}
          </Text>

          {warningBreakdown.count !== undefined ? (
            <Text className="text-slate-400 text-[11px] mt-1">Warnings: {warningBreakdown.count}</Text>
          ) : null}

          {warningBreakdown.details?.length ? (
            <View className="mt-1">
              {warningBreakdown.details.slice(0, 3).map((w, idx) => (
                <Text key={idx} className="text-slate-500 text-[10px]">
                  - {w}
                </Text>
              ))}
              {warningBreakdown.details.length > 3 ? (
                <Text className="text-slate-500 text-[10px]">... {warningBreakdown.details.length - 3} more</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Charts */}
        <View className="rounded-xl bg-slate-800 p-4 mb-3">
          <Text className="text-slate-200 text-sm mb-2">Charts</Text>
          {summary?.scatter?.length ? (
            <View className="mb-2">
              <Text className="text-slate-400 text-xs mb-1">Scatter (Measured vs Estimated):</Text>
              <ScatterChart
                points={summary.scatter.map((s: any) => ({
                  x: s.measured ?? 0,
                  y: s.predicted ?? 0,
                }))}
                height={180}
              />
            </View>
          ) : (
            <Text className="text-slate-500 text-[11px] mb-1">Scatter data will appear here.</Text>
          )}

          {summary?.histogram?.length ? (
            <HistogramChart bins={summary.histogram} maxHeight={120} />
          ) : (
            <Text className="text-slate-500 text-[11px]">Histogram will appear here.</Text>
          )}
        </View>

        {/* Data tables */}
        <View className="rounded-xl bg-slate-800 p-4 mb-3">
          <Text className="text-slate-200 text-sm mb-2">Data Tables</Text>

          <Text className="text-slate-300 text-xs mb-1">Core verification (first few):</Text>
          {summary?.core_verification?.length ? (
            summary.core_verification.slice(0, 5).map((c: any) => (
              <Text key={c.id} className="text-slate-500 text-[11px]">
                Lab {c.measured_fc} | Est {c.predicted_fc?.toFixed?.(2) ?? "N/A"} | Err{" "}
                {c.error_pct ? c.error_pct.toFixed(1) : "N/A"}%
              </Text>
            ))
          ) : (
            <Text className="text-slate-500 text-[11px]">No core data.</Text>
          )}

          <Text className="text-slate-300 text-xs mt-2 mb-1">Field grid (first few):</Text>
          {summary?.field_grid?.length ? (
            summary.field_grid.slice(0, 5).map((r: any) => (
              <Text key={r.id} className="text-slate-500 text-[11px]">
                {r.location || "N/A"} | R {r.rh_index} | UPV {r.upv} | fc {r.estimated_fc?.toFixed?.(2) ?? "N/A"}
              </Text>
            ))
          ) : (
            <Text className="text-slate-500 text-[11px]">No readings data.</Text>
          )}
        </View>

        {/* Photo Documentation */}
        <View className="rounded-xl bg-slate-800 p-4 mb-4">
          <Text className="text-slate-200 text-sm mb-2">Photo Documentation</Text>

          <View className="flex-row gap-2 mb-2 flex-wrap">
            <TouchableOpacity onPress={() => pickAndUpload("photo")} className="px-3 py-2 rounded-lg bg-slate-700">
              <Text className="text-emerald-300 text-xs">Upload Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickAndUpload("logo")} className="px-3 py-2 rounded-lg bg-slate-700">
              <Text className="text-emerald-300 text-xs">{logoUrl ? "Re-upload Logo" : "Upload Logo"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickAndUpload("signature")} className="px-3 py-2 rounded-lg bg-slate-700">
              <Text className="text-emerald-300 text-xs">{signatureUrl ? "Re-upload Signature" : "Upload Signature"}</Text>
            </TouchableOpacity>
          </View>

          {uploadedPhotos.length ? (
            <View className="gap-3">
              {photosByLocation.map(([loc, items]) => (
                <View key={loc}>
                  <Text className="text-slate-300 text-xs mb-1">{loc}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {items.map((p) => (
                      <TouchableOpacity
                        key={p.id || p.image_url}
                        className={`border rounded-lg p-2 w-[48%] ${editingPhotoId === p.id ? "border-emerald-400" : "border-slate-700"}`}
                        onPress={() => Linking.openURL(p.image_url)}
                      >
                        <View className="items-center mb-1">
                          <Image source={{ uri: p.image_url }} style={{ width: "100%", height: 90, borderRadius: 6 }} resizeMode="cover" />
                        </View>
                        <Text className="text-slate-300 text-[11px]" numberOfLines={1}>
                          {p.caption || p.location_tag || "Photo"}
                        </Text>
                        {p.location_tag ? (
                          <Text className="text-slate-500 text-[10px]" numberOfLines={1}>
                            {p.location_tag}
                          </Text>
                        ) : null}
                        <Text className="text-emerald-300 text-[11px] mt-1">Open</Text>

                        {p.id ? (
                          <View className="flex-row justify-between mt-1">
                            <TouchableOpacity onPress={() => startEditPhoto(p)}>
                              <Text className="text-emerald-300 text-[11px]">Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeletePhoto(p.id!)}>
                              <Text className="text-rose-300 text-[11px]">Delete</Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-slate-400 text-xs">Uploaded photo URLs will appear here.</Text>
          )}

          {editingPhotoId ? (
            <View className="mt-3 border border-slate-700 rounded-lg p-3">
              <Text className="text-slate-200 text-sm mb-2">Edit Photo</Text>
              <Input label="Caption" value={editingPhotoCaption} onChangeText={setEditingPhotoCaption} placeholder="Caption" />
              <Input
                label="Location"
                value={editingPhotoLocation}
                onChangeText={setEditingPhotoLocation}
                placeholder="Location tag"
              />
              <View className="flex-row gap-2 mt-2">
                <Button title="Save" onPress={saveEditPhoto} disabled={loading} />
                <Button title="Cancel" onPress={() => setEditingPhotoId(null)} disabled={loading} />
              </View>
            </View>
          ) : null}

          {logoUrl ? <Text className="text-slate-500 text-[11px] mt-2">Logo URL: {logoUrl}</Text> : null}
          {signatureUrl ? <Text className="text-slate-500 text-[11px] mt-1">Signature URL: {signatureUrl}</Text> : null}
        </View>

        {/* Photo edit modal */}
        <Modal visible={showPhotoModal} transparent animationType="fade">
          <View className="flex-1 bg-black/60 justify-center px-6">
            <View className="bg-slate-800 rounded-xl p-4">
              <Text className="text-slate-100 text-sm mb-3">Edit Photo</Text>

              {editingPhotoUrl ? (
                <Image
                  source={{ uri: editingPhotoUrl }}
                  style={{ width: "100%", height: 160, resizeMode: "contain", borderRadius: 10, marginBottom: 8 }}
                />
              ) : null}
              {sameLocationPhotos.length ? (
                <View className="mb-2">
                  <Text className="text-slate-400 text-[11px] mb-1">
                    Other photos at this location ({sameLocationPhotos.length}):
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {sameLocationPhotos.map((p) => (
                      <View key={p.id || p.image_url} className="mr-2">
                        <Image
                          source={{ uri: p.image_url }}
                          style={{ width: 72, height: 48, borderRadius: 6 }}
                          resizeMode="cover"
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              <Input label="Caption" value={editingPhotoCaption} onChangeText={setEditingPhotoCaption} placeholder="Caption" />
              <Input
                label="Location"
                value={editingPhotoLocation}
                onChangeText={setEditingPhotoLocation}
                placeholder="Location tag"
              />

              <View className="flex-row gap-2 mt-2">
                <Button title="Save" onPress={saveEditPhoto} disabled={loading} />
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowPhotoModal(false);
                    setEditingPhotoId(null);
                    setEditingPhotoUrl("");
                  }}
                  disabled={loading}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Actions */}
        <View className="flex-row gap-2 mb-4">
          <Button title={editingId ? "Update Report" : "Save Report"} onPress={handleSave} disabled={loading} />
          <Button title="Export PDF" onPress={() => handleExport("pdf")} disabled={loading} />
          <Button title="Export CSV" onPress={() => handleExport("csv")} disabled={loading} />
        </View>

        {/* Saved reports */}
        <View className="rounded-xl bg-slate-800 p-4 mb-4">
          <Text className="text-slate-200 text-sm mb-2">Saved Reports</Text>

          <View className="flex-row justify-end mb-2">
            <TouchableOpacity
              className="px-3 py-2 rounded-lg bg-slate-700"
              onPress={async () => {
                if (!selectedProjectId) return;
                try {
                  setLoading(true);
                  const refreshed = await listReports(selectedProjectId, token || undefined);
                  setReports(refreshed);
                } catch (err: any) {
                  Alert.alert("Refresh failed", err?.message || "Unable to refresh reports.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text className="text-emerald-300 text-xs">Refresh</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#34d399" />
          ) : reports.length ? (
            <View className="gap-3">
              {reports.map((r) => (
                <View key={r.id} className="border border-slate-700 rounded-lg p-3">
                  <Text className="text-white text-sm font-semibold">{r.title}</Text>
                  <Text className="text-slate-400 text-xs mt-1">
                    Project: {projects.find((p) => p.id === r.project)?.name || r.project}
                  </Text>
                  <Text className="text-slate-400 text-xs">
                    Folder: {r.folder || "N/A"} | Date: {r.date_range || "N/A"}
                  </Text>
                  <Text className="text-slate-500 text-[11px] mt-1">ID: {r.id}</Text>

                  <View className="flex-row items-center gap-2 mt-1">
                    <View
                      className={`px-2 py-1 rounded-full ${
                        r.status === "ready" ? "bg-emerald-900/60" : r.status === "processing" ? "bg-amber-900/60" : "bg-slate-700/60"
                      }`}
                    >
                      <Text
                        className={`text-[10px] ${
                          r.status === "ready" ? "text-emerald-300" : r.status === "processing" ? "text-amber-300" : "text-slate-300"
                        }`}
                      >
                        {r.status || "draft"}
                      </Text>
                    </View>
                  </View>

                  {r.active_model_id ? (
                    <Text className="text-slate-500 text-[11px]">Active model ID: {r.active_model_id}</Text>
                  ) : null}

                  <View className="flex-row gap-4 mt-2">
                    <TouchableOpacity
                      onPress={() => {
                        setEditingId(r.id);
                        setTitle(r.title);
                        setFolder(r.folder || "");
                        setDateRange(r.date_range || "");
                        setCompany(r.company || "");
                        setClientName(r.client_name || "");
                        setEngineerName(r.engineer_name || "");
                        setEngineerTitle(r.engineer_title || "");
                        setEngineerLicense(r.engineer_license || "");
                        setLogoUrl(r.logo_url || "");
                        setSignatureUrl(r.signature_url || "");
                        setNotes(r.notes || "");
                      }}
                    >
                      <Text className="text-emerald-300 text-xs">Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDelete(r.id)}>
                      <Text className="text-rose-300 text-xs">Delete</Text>
                    </TouchableOpacity>

                    {r.pdf_url ? (
                      <TouchableOpacity onPress={() => Linking.openURL(r.pdf_url!)}>
                        <Text className="text-slate-200 text-xs">Open PDF</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => handleExport("pdf", r.id)}>
                        <Text className="text-slate-200 text-xs">Export PDF</Text>
                      </TouchableOpacity>
                    )}

                    {r.csv_url ? (
                      <TouchableOpacity onPress={() => Linking.openURL(r.csv_url!)}>
                        <Text className="text-slate-200 text-xs">Open CSV</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => handleExport("csv", r.id)}>
                        <Text className="text-slate-200 text-xs">Export CSV</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-slate-400 text-xs">No saved reports yet.</Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
