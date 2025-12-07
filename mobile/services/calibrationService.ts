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
  date: string;          // ISO string
};

export type CalibrationModel = {
  id: string;
  project: string;       // project ID
  a0: number;
  a1: number;
  a2: number;
  a3?: number | null;
  r2: number;
  points_used: number;
  use_carbonation: boolean;
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
