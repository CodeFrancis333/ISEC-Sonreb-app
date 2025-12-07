// mobile/hooks/useProjects.ts
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../constants";

export type Project = {
  id: string;
  name: string;
  location: string;
  designFc?: number;
  calibrated?: boolean;
};

type UseProjectsState = {
  projects: Project[];
  loading: boolean;
  error: string | null;
  selectedProjectId: string | null;
};

export default function useProjects() {
  const [state, setState] = useState<UseProjectsState>({
    projects: [],
    loading: false,
    error: null,
    selectedProjectId: null,
  });

  const setLoading = (loading: boolean) =>
    setState((prev) => ({ ...prev, loading, error: null }));

  const setError = (error: string | null) =>
    setState((prev) => ({ ...prev, error, loading: false }));

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: replace with real API call:
      // const res = await fetch(`${API_BASE_URL}/projects/`);
      // const data = await res.json();

      const dummy: Project[] = [
        {
          id: "1",
          name: "Hospital Wing A",
          location: "Quezon City",
          designFc: 28,
          calibrated: false,
        },
        {
          id: "2",
          name: "Flyover Pier P3",
          location: "Sariaya, Quezon",
          designFc: 30,
          calibrated: true,
        },
      ];

      setState((prev) => ({
        ...prev,
        projects: dummy,
        loading: false,
        error: null,
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to load projects.");
    }
  }, []);

  const createProject = useCallback(
    async (project: Omit<Project, "id">) => {
      setLoading(true);
      try {
        // TODO: POST to `${API_BASE_URL}/projects/`

        const newProject: Project = {
          id: String(Date.now()),
          ...project,
        };

        setState((prev) => ({
          ...prev,
          projects: [newProject, ...prev.projects],
          loading: false,
          error: null,
        }));
        return newProject;
      } catch (err) {
        console.error(err);
        setError("Failed to create project.");
        return null;
      }
    },
    []
  );

  const selectProject = useCallback((projectId: string | null) => {
    setState((prev) => ({ ...prev, selectedProjectId: projectId }));
  }, []);

  useEffect(() => {
    // Auto-load once for now
    loadProjects();
  }, [loadProjects]);

  const selectedProject = state.projects.find(
    (p) => p.id === state.selectedProjectId
  );

  return {
    projects: state.projects,
    loading: state.loading,
    error: state.error,
    selectedProjectId: state.selectedProjectId,
    selectedProject,
    loadProjects,
    createProject,
    selectProject,
  };
}
