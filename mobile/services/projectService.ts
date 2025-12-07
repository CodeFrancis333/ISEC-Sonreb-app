// mobile/services/projectService.ts
import { apiRequest } from "./apiClient";

export type ProjectStatus = "calibrated" | "no_model";

export type Project = {
  id: string;
  name: string;
  location: string;
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

export type CreateProjectPayload = {
  name: string;
  location: string;
  client?: string;
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
