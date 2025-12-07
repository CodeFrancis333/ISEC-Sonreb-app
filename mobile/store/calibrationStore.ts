// mobile/store/calibrationStore.ts
import { create } from "zustand";

export type CalibrationPoint = {
  id: string;
  projectId: string;
  memberId?: string;
  upv: number;
  rh: number;
  carbonationDepth?: number | null;
  coreFc: number;
  notes?: string;
  date: string; // ISO
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

type CalibrationState = {
  points: CalibrationPoint[];
  activeModel: CalibrationModel | null;
  loading: boolean;
  error: string | null;

  // actions
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
  setPoints: (points: CalibrationPoint[]) => void;
  addPoint: (point: CalibrationPoint) => void;
  setActiveModel: (model: CalibrationModel | null) => void;
};

export const useCalibrationStore = create<CalibrationState>((set) => ({
  points: [],
  activeModel: null,
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

  setPoints: (points) =>
    set(() => ({
      points,
      loading: false,
      error: null,
    })),

  addPoint: (point) =>
    set((state) => ({
      points: [point, ...state.points],
    })),

  setActiveModel: (model) =>
    set(() => ({
      activeModel: model,
    })),
}));
