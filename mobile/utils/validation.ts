// mobile/utils/validation.ts

export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function isPositiveNumber(value: string): boolean {
  const num = Number(value);
  return !Number.isNaN(num) && num > 0;
}

export function isNonNegativeNumber(value: string): boolean {
  const num = Number(value);
  return !Number.isNaN(num) && num >= 0;
}

export function isEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  // Simple email regex (good enough for client-side)
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(trimmed);
}

/**
 * Generic helper: returns error message or undefined.
 */
export function validateRequired(
  label: string,
  value: string
): string | undefined {
  return isRequired(value) ? undefined : `${label} is required.`;
}

export function validatePositiveNumber(
  label: string,
  value: string
): string | undefined {
  if (!isRequired(value)) return `${label} is required.`;
  if (!isPositiveNumber(value)) return `${label} must be a positive number.`;
  return undefined;
}
