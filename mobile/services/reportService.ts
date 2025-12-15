// mobile/services/reportService.ts
import { apiRequest } from "./apiClient";

export type Report = {
  id: string;
  project: string;
  title: string;
  date_range?: string | null;
  company?: string | null;
  client_name?: string | null;
  engineer_name?: string | null;
  engineer_title?: string | null;
  engineer_license?: string | null;
  active_model_id?: string | null;
  folder?: string | null;
  notes?: string | null;
  logo_url?: string | null;
  signature_url?: string | null;
  status?: "draft" | "processing" | "ready" | string;
  pdf_url?: string | null;
  csv_url?: string | null;
  created_at: string;
};

export type CreateReportPayload = {
  project: string;
  title: string;
  folder?: string | null;
  date_range?: string | null;
  company?: string | null;
  client_name?: string | null;
  engineer_name?: string | null;
  engineer_title?: string | null;
  engineer_license?: string | null;
  notes?: string | null;
  logo_url?: string | null;
  signature_url?: string | null;
};

export type ExportReportPayload = {
  report_id: string;
  format: "pdf" | "csv";
  folder?: string | null;
  filter_element?: string | null;
  filter_location?: string | null;
  filter_fc_min?: string | number | null;
  filter_fc_max?: string | number | null;
};

export type ReportPhotoPayload = {
  report: string;
  image_url: string;
  caption?: string | null;
  location_tag?: string | null;
};

export type UpdateReportPhotoPayload = {
  caption?: string | null;
  location_tag?: string | null;
};

export async function listReportFolders(token?: string | null): Promise<string[]> {
  const res = await apiRequest<{ folders: string[] }>("/reports/folders/", {
    method: "GET",
    token: token || undefined,
  });
  return res.folders || [];
}

export type ReadingFolder = {
  id: number | string;
  project: string;
  name: string;
  date_range?: string | null;
  notes?: string | null;
  derived?: boolean;
};

export async function listReadingFolders(projectId?: string, token?: string | null): Promise<ReadingFolder[]> {
  const qs = projectId ? `?project=${projectId}` : "";
  return apiRequest<ReadingFolder[]>(`/folders/${qs}`, {
    method: "GET",
    token: token || undefined,
  });
}

export type DerivedFolder = {
  name: string;
  count: number;
  project?: string;
};

export async function listDerivedReadingFolders(projectId: string, token?: string | null): Promise<DerivedFolder[]> {
  const qs = projectId ? `?project=${projectId}` : "";
  const res = await apiRequest<{ derived: DerivedFolder[] }>(`/readings/folders/derived/${qs}`, {
    method: "GET",
    token: token || undefined,
  });
  return res.derived || [];
}

export async function createReadingFolder(payload: { project: string; name: string; date_range?: string; notes?: string }, token?: string | null) {
  return apiRequest(`/folders/`, {
    method: "POST",
    body: payload,
    token: token || undefined,
  });
}

export async function deleteReadingFolder(id: number, token?: string | null) {
  return apiRequest(`/folders/${id}/`, {
    method: "DELETE",
    token: token || undefined,
  });
}

export async function listReports(projectId?: string, token?: string | null): Promise<Report[]> {
  const qs = projectId ? `?project=${projectId}` : "";
  return apiRequest<Report[]>(`/reports/${qs}`, {
    method: "GET",
    token: token || undefined,
  });
}

function buildQuery(params: Record<string, any>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

export async function getReportSummary(
  projectId: string,
  token?: string | null,
  filters?: {
    folder?: string | null;
    filter_element?: string | null;
    filter_location?: string | null;
    filter_fc_min?: string | number | null;
    filter_fc_max?: string | number | null;
  }
): Promise<any> {
  const qs = buildQuery({ project: projectId, ...(filters || {}) });
  return apiRequest(`/reports/summary/${qs}`, {
    method: "GET",
    token: token || undefined,
  });
}

export async function createReport(payload: CreateReportPayload, token?: string | null): Promise<Report> {
  return apiRequest<Report>("/reports/", {
    method: "POST",
    body: payload,
    token: token || undefined,
  });
}

export async function updateReport(
  id: string,
  payload: Partial<CreateReportPayload>,
  token?: string | null
): Promise<Report> {
  return apiRequest<Report>(`/reports/${id}/`, {
    method: "PATCH",
    body: payload,
    token: token || undefined,
  });
}

export async function deleteReport(id: string, token?: string | null): Promise<void> {
  return apiRequest<void>(`/reports/${id}/`, {
    method: "DELETE",
    token: token || undefined,
  });
}

export async function exportReport(payload: ExportReportPayload, token?: string | null): Promise<Blob | any> {
  return apiRequest(`/reports/export/`, {
    method: "POST",
    body: payload,
    token: token || undefined,
  });
}

export async function uploadReportPhoto(payload: ReportPhotoPayload, token?: string | null): Promise<any> {
  return apiRequest(`/reports/photos/`, {
    method: "POST",
    body: payload,
    token: token || undefined,
  });
}

export async function deleteReportPhoto(photoId: string, token?: string | null): Promise<void> {
  return apiRequest<void>(`/reports/photos/${photoId}/`, {
    method: "DELETE",
    token: token || undefined,
  });
}

export async function updateReportPhoto(
  photoId: string,
  payload: UpdateReportPhotoPayload,
  token?: string | null
): Promise<any> {
  return apiRequest(`/reports/photos/${photoId}/`, {
    method: "PATCH",
    body: payload,
    token: token || undefined,
  });
}

export async function uploadReportFile(
  type: "logo" | "signature" | "photo",
  file: any,
  reportId?: string,
  caption?: string,
  location_tag?: string,
  token?: string | null
): Promise<any> {
  const formData = new FormData();
  formData.append("type", type);
  if (reportId) formData.append("report", reportId);
  if (caption) formData.append("caption", caption);
  if (location_tag) formData.append("location_tag", location_tag);
  // file should be a blob with name/type set by caller
  formData.append("file", file as any);

  return apiRequest(`/reports/upload/`, {
    method: "POST",
    body: formData,
    token: token || undefined,
  });
}
