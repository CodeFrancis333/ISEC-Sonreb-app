// mobile/store/readingStore.ts
import { create } from "zustand";

export type Rating = "GOOD" | "FAIR" | "POOR";

export type Reading = {
  id: string;
  projectId: string;
  memberId: string;
  locationTag: string;
  upv: number;
  rhIndex: number;
  carbonationDepth?: number | null;
  estimatedFc: number;
  rating: Rating;
  modelUsed: string;
  timestamp: string;
};

type ReadingState = {
  readings: Reading[];
  loading: boolean;
  error: string | null;

  // actions
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
  setReadings: (readings: Reading[]) => void;
  addReading: (reading: Reading) => void;
};

export const useReadingStore = create<ReadingState>((set) => ({
  readings: [],
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

  setReadings: (readings) =>
    set(() => ({
      readings,
      loading: false,
      error: null,
    })),

  addReading: (reading) =>
    set((state) => ({
      readings: [reading, ...state.readings],
    })),
}));
