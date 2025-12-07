// mobile/utils/rating.ts
import { RATING_THRESHOLDS } from "../constants";

export type Rating = "GOOD" | "FAIR" | "POOR";

/**
 * Rating based on ratio fc_est / design_fc.
 * If design_fc is missing or <= 0, we return null.
 */
export function getRatingFromDesignRatio(
  fcEstimated: number,
  designFc?: number
): Rating | null {
  if (!designFc || designFc <= 0) return null;

  const ratio = fcEstimated / designFc;

  if (ratio >= RATING_THRESHOLDS.GOOD) return "GOOD";
  if (ratio >= RATING_THRESHOLDS.FAIR) return "FAIR";
  return "POOR";
}

/**
 * Rating based on absolute fc' thresholds.
 * You can tune the numbers per project / code basis.
 */
export function getRatingFromAbsoluteFc(
  fcEstimated: number,
  goodMin: number,
  fairMin: number
): Rating {
  if (fcEstimated >= goodMin) return "GOOD";
  if (fcEstimated >= fairMin) return "FAIR";
  return "POOR";
}

/**
 * Helper that chooses which method to use.
 * If designFc is provided and > 0, use design-ratio logic;
 * otherwise use absolute thresholds.
 */
export function getRating(
  fcEstimated: number,
  options: {
    designFc?: number;
    goodMinAbs?: number;
    fairMinAbs?: number;
  } = {}
): Rating {
  const { designFc, goodMinAbs = 21, fairMinAbs = 17 } = options;

  const byDesign = getRatingFromDesignRatio(fcEstimated, designFc);
  if (byDesign) return byDesign;

  return getRatingFromAbsoluteFc(fcEstimated, goodMinAbs, fairMinAbs);
}

/**
 * Small helper to choose Tailwind color class from rating.
 */
export function getRatingColorClass(rating: Rating): string {
  switch (rating) {
    case "GOOD":
      return "text-emerald-300";
    case "FAIR":
      return "text-amber-300";
    case "POOR":
    default:
      return "text-red-300";
  }
}
