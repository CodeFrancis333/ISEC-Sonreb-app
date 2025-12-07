// mobile/utils/units.ts
import { DEFAULT_UNITS } from "../constants";

// Strength conversions
const MPa_TO_PSI = 145.0377377;

export type StrengthUnit = "MPa" | "psi";
export type VelocityUnit = "m/s" | "km/s";

export function mpaToPsi(mpa: number): number {
  return mpa * MPa_TO_PSI;
}

export function psiToMpa(psi: number): number {
  return psi / MPa_TO_PSI;
}

// Velocity conversions
export function msToKms(ms: number): number {
  return ms / 1000;
}

export function kmsToMs(kms: number): number {
  return kms * 1000;
}

// Format helpers using chosen units
export function formatStrength(
  value: number,
  unit: StrengthUnit = DEFAULT_UNITS.strength
): string {
  if (unit === "psi") {
    const psi = mpaToPsi(value);
    return `${psi.toFixed(0)} psi`;
  }
  return `${value.toFixed(1)} MPa`;
}

export function formatVelocity(
  value: number,
  unit: VelocityUnit = DEFAULT_UNITS.velocity
): string {
  if (unit === "km/s") {
    const kms = msToKms(value);
    return `${kms.toFixed(2)} km/s`;
  }
  return `${value.toFixed(0)} m/s`;
}
