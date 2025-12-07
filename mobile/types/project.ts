// mobile/types/project.ts

export type ProjectStatus = "calibrated" | "no_model";

export type Project = {
  id: string;
  name: string;
  location: string;
  client?: string;
  designFc?: number;           // MPa
  notes?: string;
  status?: ProjectStatus;
};

export type MemberType = "Beam" | "Column" | "Slab" | "Wall" | string;

export type Member = {
  id: string;
  projectId: string;           // project ID (frontend)
  memberId: string;            // e.g. "C1"
  type: MemberType;
  level?: string;
  gridline?: string;
  notes?: string;
};

export type ProjectSummary = {
  projectId: string;
  readingsCount: number;
  minFc: number | null;
  maxFc: number | null;
  avgFc: number | null;
  goodCount: number;
  fairCount: number;
  poorCount: number;
};
