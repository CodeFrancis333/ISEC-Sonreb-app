// mobile/services/projectService.ts
import { apiRequest } from "./apiClient";

export type ProjectStatus = "calibrated" | "no_model";

export type Project = {
  id: string;
  name: string;
  location: string;
  structure_age: number;
  latitude: number;
  longitude: number;
  design_fc?: number;
  status?: ProjectStatus;
};

export type Member = {
  id: string;
  project: string; // project ID
  member_id: string; // e.g. "C1"
  type: "Beam" | "Column" | "Slab" | "Wall" | string;
  level?: string;
  gridline?: string;
  notes?: string;
};

export type ProjectSummary = {
  project_id: string;
  readings_count: number;
  min_fc: number | null;
  max_fc: number | null;
  avg_fc: number | null;
  good_count: number;
  fair_count: number;
  poor_count: number;
};

export type RatingsDistribution = {
  project_id: string;
  good: number;
  fair: number;
  poor: number;
  total: number;
};

export type HistogramBin = {
  lower: number;
  upper: number;
  count: number;
};

export type HistogramResponse = {
  project_id: string;
  bin_size: number;
  bins: HistogramBin[];
  min_fc: number | null;
  max_fc: number | null;
  avg_fc: number | null;
};

export type CreateProjectPayload = {
  name: string;
  location: string;
  client?: string;
  structure_age: number;
  latitude: number;
  longitude: number;
  design_fc?: number;
  notes?: string;
};

export type CreateMemberPayload = {
  project: string; // project ID
  member_id: string;
  type: string;
  level?: string;
  gridline?: string;
  notes?: string;
};

export async function listProjects(token?: string | null): Promise<Project[]> {
  // GET /api/projects/
  return apiRequest<Project[]>("/projects/", {
    method: "GET",
    token: token || undefined,
  });
}

export async function createProject(
  payload: CreateProjectPayload,
  token?: string | null
): Promise<Project> {
  // POST /api/projects/
  return apiRequest<Project>("/projects/", {
    method: "POST",
    body: payload,
    token: token || undefined,
  });
}

export async function getProject(
  projectId: string,
  token?: string | null
): Promise<Project> {
  // GET /api/projects/{id}/
  return apiRequest<Project>(`/projects/${projectId}/`, {
    method: "GET",
    token: token || undefined,
  });
}

export async function updateProject(
  projectId: string,
  payload: Partial<CreateProjectPayload>,
  token?: string | null
): Promise<Project> {
  // PATCH /api/projects/{id}/
  return apiRequest<Project>(`/projects/${projectId}/`, {
    method: "PATCH",
    body: payload,
    token: token || undefined,
  });
}

export async function deleteProject(
  projectId: string,
  token?: string | null
): Promise<void> {
  // DELETE /api/projects/{id}/
  return apiRequest<void>(`/projects/${projectId}/`, {
    method: "DELETE",
    token: token || undefined,
  });
}

export async function createMember(
  payload: CreateMemberPayload,
  token?: string | null
): Promise<Member> {
  // POST /api/projects/{project}/members/
  return apiRequest<Member>(`/projects/${payload.project}/members/`, {
    method: "POST",
    body: payload,
    token: token || undefined,
  });
}

export async function listMembers(
  projectId: string,
  token?: string | null
): Promise<Member[]> {
  // GET /api/projects/{id}/members/
  return apiRequest<Member[]>(`/projects/${projectId}/members/`, {
    method: "GET",
    token: token || undefined,
  });
}

export async function updateMember(
  projectId: string,
  memberId: string,
  payload: Partial<CreateMemberPayload>,
  token?: string | null
): Promise<Member> {
  // PATCH /api/projects/{project}/members/{memberId}/
  return apiRequest<Member>(
    `/projects/${projectId}/members/${memberId}/`,
    {
      method: "PATCH",
      body: payload,
      token: token || undefined,
    }
  );
}

export async function deleteMember(
  projectId: string,
  memberId: string,
  token?: string | null
): Promise<void> {
  // DELETE /api/projects/{project}/members/{memberId}/
  return apiRequest<void>(`/projects/${projectId}/members/${memberId}/`, {
    method: "DELETE",
    token: token || undefined,
  });
}

export async function getProjectSummary(
  projectId: string,
  token?: string | null
): Promise<ProjectSummary> {
  // GET /api/projects/{id}/summary/
  return apiRequest<ProjectSummary>(`/projects/${projectId}/summary/`, {
    method: "GET",
    token: token || undefined,
  });
}

export async function getProjectRatings(
  projectId: string,
  token?: string | null
): Promise<RatingsDistribution> {
  // GET /api/projects/{id}/stats/ratings/
  return apiRequest<RatingsDistribution>(
    `/projects/${projectId}/stats/ratings/`,
    {
      method: "GET",
      token: token || undefined,
    }
  );
}

export async function getProjectHistogram(
  projectId: string,
  binSize: number = 2,
  token?: string | null
): Promise<HistogramResponse> {
  // GET /api/projects/{id}/stats/fc-histogram/?bin_size=
  return apiRequest<HistogramResponse>(
    `/projects/${projectId}/stats/fc-histogram/`,
    {
      method: "GET",
      token: token || undefined,
      params: { bin_size: binSize },
    }
  );
}
