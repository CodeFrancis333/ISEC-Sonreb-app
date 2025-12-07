// mobile/constants/index.ts

// -----------------------------
// App identity
// -----------------------------
export const APP_NAME = "SONREB App";
export const APP_TAGLINE =
  "Estimate in-place concrete strength using SonReb NDT.";

// -----------------------------
// API configuration
// -----------------------------
//
// For Expo Go on a real phone, change this to your
// laptop's LAN IP, e.g. "http://192.168.1.10:8000/api"
//
export const API_BASE_URL = "http://localhost:8000/api";

// Optional: you can later switch between dev / prod
// by reading env variables (EXPO_PUBLIC_*) if you want.

// -----------------------------
// Colors (match your Tailwind theme / design)
// -----------------------------
export const COLORS = {
  background: "#020617", // slate-950-ish
  surface: "#020617",
  card: "#0f172a", // slate-800
  border: "#1f2937", // slate-700
  primary: "#059669", // emerald-600
  primarySoft: "#22c55e", // emerald-500
  text: "#e5e7eb", // slate-200
  textMuted: "#9ca3af", // slate-400
  danger: "#f97373", // red-400
  warning: "#fbbf24", // amber-400
  good: "#4ade80", // green-400
};

// -----------------------------
// Default units & options
// -----------------------------
export const DEFAULT_UNITS = {
  strength: "MPa", // or "psi"
  velocity: "m/s", // or "km/s"
} as const;

// -----------------------------
// Rating thresholds
// (used later by utils/rating.ts)
// -----------------------------
//
// If rating is based on fc' / design fc':
//   GOOD  >= 0.85
//   FAIR  >= 0.70
//   POOR  <  0.70
//
export const RATING_THRESHOLDS = {
  GOOD: 0.85,
  FAIR: 0.7,
};

// -----------------------------
// AsyncStorage keys (for later)
// -----------------------------
export const STORAGE_KEYS = {
  AUTH_TOKEN: "sonreb_auth_token",
  CURRENT_USER: "sonreb_current_user",
  SETTINGS: "sonreb_settings",
};
