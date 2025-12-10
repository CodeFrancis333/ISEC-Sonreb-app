// mobile/services/calibrationService.ts
import { apiRequest } from "./apiClient";

export type CalibrationPoint = {
  id: string;
  project: string;       // project ID
  member?: string;       // member ID (optional)
  upv: number;
  rh_index: number;
  carbonation_depth?: number | null;
  core_fc: number;
  notes?: string;
  created_at: string;    // ISO string
};

export type CalibrationModel = {
  id: string;
  project: string;       // project ID
  a0: number;
  a1: number;
  a2: number;
  a3?: number | null;
  r2: number;
  rmse?: number | null;
  points_used: number;
  use_carbonation: boolean;
  upv_min?: number | null;
  upv_max?: number | null;
  rh_min?: number | null;
  rh_max?: number | null;
  carbonation_min?: number | null;
  carbonation_max?: number | null;
  created_at: string;
};

export type CreateCalibrationPointPayload = {
  project: string;
  member?: string;
  upv: number;
  rh_index: number;
  carbonation_depth?: number | null;
  core_fc: number;
  notes?: string;
};

export type GenerateModelPayload = {
  project: string;
  use_carbonation: boolean;
};

export async function listCalibrationPoints(
  projectId: string,
  token?: string | null
): Promise<CalibrationPoint[]> {
  // GET /api/calibration/points/?project={id}
  return apiRequest<CalibrationPoint[]>(
    `/calibration/points/?project=${projectId}`,
    {
      method: "GET",
      token: token || undefined,
    }
  );
}

export async function createCalibrationPoint(
  payload: CreateCalibrationPointPayload,
  token?: string | null
): Promise<CalibrationPoint> {
  // POST /api/calibration/points/
  return apiRequest<CalibrationPoint>("/calibration/points/", {
    method: "POST",
    body: payload,
    token: token || undefined,
  });
}

export async function generateCalibrationModel(
  payload: GenerateModelPayload,
  token?: string | null
): Promise<CalibrationModel> {
  // POST /api/calibration/generate/
  return apiRequest<CalibrationModel>("/calibration/generate/", {
    method: "POST",
    body: payload,
    token: token || undefined,
  });
}

export async function getActiveModel(
  projectId: string,
  token?: string | null
): Promise<CalibrationModel> {
  // GET /api/calibration/model/?project={id}
  return apiRequest<CalibrationModel>(
    `/calibration/model/?project=${projectId}`,
    {
      method: "GET",
      token: token || undefined,
    }
  );
}

export type CalibrationDiagnosticPoint = {
  id: string;
  measured_fc: number;
  predicted_fc: number;
  upv: number;
  rh_index: number;
  carbonation_depth?: number | null;
  created_at: string;
};

export type CalibrationDiagnostics = {
  model: CalibrationModel;
  points: CalibrationDiagnosticPoint[];
};

export async function getCalibrationDiagnostics(
  projectId: string,
  token?: string | null
): Promise<CalibrationDiagnostics> {
  // GET /api/calibration/diagnostics/?project={id}
  return apiRequest<CalibrationDiagnostics>(
    `/calibration/diagnostics/?project=${projectId}`,
    {
      method: "GET",
      token: token || undefined,
    }
  );
}
