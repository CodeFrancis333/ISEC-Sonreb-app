// mobile/constants/index.ts

// -----------------------------
// App identity
// -----------------------------
export const APP_NAME = "SONREB App";
export const APP_TAGLINE =
  "Estimate in-place concrete strength using SonReb NDT.";
export const APP_VERSION = "1.0.0";

// -----------------------------
// API configuration (Expo .env)
// -----------------------------
//
// REQUIRED: In mobile/.env
// EXPO_PUBLIC_API_IP=192.168.x.x
//
// Find IP using: ipconfig (IPv4 Address)
//

const MACHINE_IP = process.env.EXPO_PUBLIC_API_IP; // from .env
const FALLBACK_IP = "127.0.0.1"; // only used for Expo Web

console.log("EXPO_PUBLIC_API_IP from env:", MACHINE_IP);

export const API_BASE_URL = `http://${MACHINE_IP || FALLBACK_IP}:8000/api`;


// -----------------------------
// Colors
// -----------------------------
export const COLORS = {
  background: "#020617",   // slate-950-ish
  surface: "#020617",
  card: "#0f172a",        // slate-800
  border: "#1f2937",      // slate-700
  primary: "#059669",     // emerald-600
  primarySoft: "#22c55e", // emerald-500
  text: "#e5e7eb",        // slate-200
  textMuted: "#9ca3af",   // slate-400
  danger: "#f97373",      // red-400
  warning: "#fbbf24",     // amber-400
  good: "#4ade80",        // green-400
};


// -----------------------------
// Default units
// -----------------------------
export const DEFAULT_UNITS = {
  strength: "MPa",
  velocity: "m/s",
} as const;


// -----------------------------
// Rating thresholds
// -----------------------------
export const RATING_THRESHOLDS = {
  GOOD: 0.85,
  FAIR: 0.7,
};


// -----------------------------
// AsyncStorage keys
// -----------------------------
export const STORAGE_KEYS = {
  AUTH_TOKEN: "sonreb_auth_token",
  CURRENT_USER: "sonreb_current_user",
  SETTINGS: "sonreb_settings",
};
