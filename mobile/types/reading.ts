// mobile/types/reading.ts

export type Rating = "GOOD" | "FAIR" | "POOR";

export type Reading = {
  id: string;
  projectId: string;
  memberId: string;
  locationTag: string;         // e.g. "North face, mid-height"
  upv: number;                 // m/s
  rhIndex: number;             // rebound index
  carbonationDepth?: number | null; // mm
  estimatedFc: number;         // MPa
  rating: Rating;
  modelUsed: string;           // "Calibrated" / "Default" / etc.
  timestamp: string;           // ISO string
};
