// mobile/hooks/useCalibration.ts
import { useState, useCallback } from "react";
import { API_BASE_URL } from "../constants";

export type CalibrationPoint = {
  id: string;
  projectId: string;
  memberId?: string;
  upv: number;
  rh: number;
  carbonationDepth?: number;
  coreFc: number;
  date: string; // ISO string
};

export type CalibrationModel = {
  projectId: string;
  a0: number;
  a1: number;
  a2: number;
  a3?: number;
  r2: number;
  pointsUsed: number;
  useCarbonation: boolean;
  createdAt: string;
};

type UseCalibrationState = {
  points: CalibrationPoint[];
  activeModel: CalibrationModel | null;
  loading: boolean;
  error: string | null;
};

export default function useCalibration() {
  const [state, setState] = useState<UseCalibrationState>({
    points: [],
    activeModel: null,
    loading: false,
    error: null,
  });

  const setLoading = (loading: boolean) =>
    setState((prev) => ({ ...prev, loading, error: null }));

  const setError = (error: string | null) =>
    setState((prev) => ({ ...prev, error, loading: false }));

  const loadPoints = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      // TODO: GET `${API_BASE_URL}/calibration/points/?project=${projectId}`

      const dummy: CalibrationPoint[] = [
        {
          id: "cp1",
          projectId,
          memberId: "C1",
          upv: 4200,
          rh: 32,
          carbonationDepth: 15,
          coreFc: 27.5,
          date: "2025-12-01T00:00:00Z",
        },
      ];

      setState((prev) => ({
        ...prev,
        points: dummy,
        loading: false,
        error: null,
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to load calibration points.");
    }
  }, []);

  const addPoint = useCallback(
    async (point: Omit<CalibrationPoint, "id">) => {
      setLoading(true);
      try {
        // TODO: POST `${API_BASE_URL}/calibration/points/`

        const newPoint: CalibrationPoint = {
          id: String(Date.now()),
          ...point,
        };

        setState((prev) => ({
          ...prev,
          points: [newPoint, ...prev.points],
          loading: false,
          error: null,
        }));
        return newPoint;
      } catch (err) {
        console.error(err);
        setError("Failed to save calibration point.");
        return null;
      }
    },
    []
  );

  const generateModel = useCallback(
    async (projectId: string, useCarbonation: boolean) => {
      setLoading(true);
      try {
        // TODO: POST `${API_BASE_URL}/calibration/generate/`

        // Dummy model:
        const model: CalibrationModel = {
          projectId,
          a0: 5.32,
          a1: 0.012,
          a2: 0.0041,
          a3: useCarbonation ? 0.09 : undefined,
          r2: 0.89,
          pointsUsed: state.points.length,
          useCarbonation,
          createdAt: new Date().toISOString(),
        };

        setState((prev) => ({
          ...prev,
          activeModel: model,
          loading: false,
          error: null,
        }));
        return model;
      } catch (err) {
        console.error(err);
        setError("Failed to generate model.");
        return null;
      }
    },
    [state.points.length]
  );

  return {
    points: state.points,
    activeModel: state.activeModel,
    loading: state.loading,
    error: state.error,
    loadPoints,
    addPoint,
    generateModel,
  };
}
