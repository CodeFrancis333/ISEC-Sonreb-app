// mobile/services/readingService.ts
import { apiRequest } from "./apiClient";

export type Rating = "GOOD" | "FAIR" | "POOR";

export type Reading = {
  id: string;
  project: string;  // project ID
  member: string;   // member ID
  location_tag: string;
  upv: number;
  rh_index: number;
  carbonation_depth?: number | null;
  estimated_fc: number;
  rating: Rating;
  model_used: string;
  timestamp: string; // ISO string
};

export type CreateReadingPayload = {
  project: string;
  member: string;
  location_tag: string;
  upv: number;
  rh_index: number;
  carbonation_depth?: number | null;
};

export async function listReadings(
  token?: string | null
): Promise<Reading[]> {
  // GET /api/readings/
  return apiRequest<Reading[]>("/readings/", {
    method: "GET",
    token: token || undefined,
  });
}

export async function listReadingsByProject(
  projectId: string,
  token?: string | null
): Promise<Reading[]> {
  // GET /api/readings/?project={id}
  return apiRequest<Reading[]>(`/readings/?project=${projectId}`, {
    method: "GET",
    token: token || undefined,
  });
}

export async function getReading(
  id: string,
  token?: string | null
): Promise<Reading> {
  // GET /api/readings/{id}/
  return apiRequest<Reading>(`/readings/${id}/`, {
    method: "GET",
    token: token || undefined,
  });
}

export async function createReading(
  payload: CreateReadingPayload,
  token?: string | null
): Promise<Reading> {
  // POST /api/readings/ (backend computes fc', rating, model_used)
  return apiRequest<Reading>("/readings/", {
    method: "POST",
    body: payload,
    token: token || undefined,
  });
}
