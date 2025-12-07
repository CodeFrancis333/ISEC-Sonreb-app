// mobile/types/calibration.ts

export type CalibrationPoint = {
  id: string;
  projectId: string;
  memberId?: string;
  upv: number;                       // m/s
  rhIndex: number;                   // rebound index
  carbonationDepth?: number | null;  // mm
  coreFc: number;                    // MPa
  notes?: string;
  date: string;                      // ISO
};

export type CalibrationModel = {
  projectId: string;
  a0: number;
  a1: number;
  a2: number;
  a3?: number;                       // only if using carbonation
  r2: number;
  pointsUsed: number;
  useCarbonation: boolean;
  createdAt: string;                 // ISO
};
