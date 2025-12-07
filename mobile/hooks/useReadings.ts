// mobile/hooks/useReadings.ts
import { useState, useCallback } from "react";
import { API_BASE_URL } from "../constants";

export type Reading = {
  id: string;
  projectId: string;
  memberId: string;
  fc: number; // estimated fc'
  rating: "GOOD" | "FAIR" | "POOR";
  modelUsed: string;
  timestamp: string;
};

type UseReadingsState = {
  readings: Reading[];
  loading: boolean;
  error: string | null;
};

export default function useReadings() {
  const [state, setState] = useState<UseReadingsState>({
    readings: [],
    loading: false,
    error: null,
  });

  const setLoading = (loading: boolean) =>
    setState((prev) => ({ ...prev, loading, error: null }));

  const setError = (error: string | null) =>
    setState((prev) => ({ ...prev, error, loading: false }));

  const loadReadings = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: fetch(`${API_BASE_URL}/readings/`)

      const dummy: Reading[] = [
        {
          id: "r1",
          projectId: "1",
          memberId: "C1",
          fc: 26.4,
          rating: "GOOD",
          modelUsed: "Calibrated",
          timestamp: "2025-12-06T14:32:00Z",
        },
        {
          id: "r2",
          projectId: "2",
          memberId: "P3-1",
          fc: 18.2,
          rating: "POOR",
          modelUsed: "Default",
          timestamp: "2025-12-05T10:15:00Z",
        },
      ];

      setState({ readings: dummy, loading: false, error: null });
    } catch (err) {
      console.error(err);
      setError("Failed to load readings.");
    }
  }, []);

  const addReading = useCallback(
    async (reading: Omit<Reading, "id">) => {
      setLoading(true);
      try {
        // TODO: POST to `${API_BASE_URL}/readings/`

        const newReading: Reading = {
          id: String(Date.now()),
          ...reading,
        };

        setState((prev) => ({
          ...prev,
          readings: [newReading, ...prev.readings],
          loading: false,
          error: null,
        }));
        return newReading;
      } catch (err) {
        console.error(err);
        setError("Failed to save reading.");
        return null;
      }
    },
    []
  );

  const getReadingById = useCallback(
    (id: string) => state.readings.find((r) => r.id === id) || null,
    [state.readings]
  );

  const filterByProject = useCallback(
    (projectId: string) =>
      state.readings.filter((r) => r.projectId === projectId),
    [state.readings]
  );

  const filterByMember = useCallback(
    (memberId: string) =>
      state.readings.filter((r) => r.memberId === memberId),
    [state.readings]
  );

  return {
    readings: state.readings,
    loading: state.loading,
    error: state.error,
    loadReadings,
    addReading,
    getReadingById,
    filterByProject,
    filterByMember,
  };
}
