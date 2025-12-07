// mobile/store/projectStore.ts
import { create } from "zustand";

export type ProjectStatus = "calibrated" | "no_model";

export type Project = {
  id: string;
  name: string;
  location: string;
  designFc?: number;
  status?: ProjectStatus;
};

type ProjectState = {
  projects: Project[];
  selectedProjectId: string | null;
  loading: boolean;
  error: string | null;

  // actions
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  selectProject: (id: string | null) => void;
};

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProjectId: null,
  loading: false,
  error: null,

  setLoading: (value) =>
    set(() => ({
      loading: value,
      error: null,
    })),

  setError: (message) =>
    set(() => ({
      error: message,
      loading: false,
    })),

  setProjects: (projects) =>
    set(() => ({
      projects,
      loading: false,
      error: null,
    })),

  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),

  selectProject: (id) =>
    set(() => ({
      selectedProjectId: id,
    })),
}));
