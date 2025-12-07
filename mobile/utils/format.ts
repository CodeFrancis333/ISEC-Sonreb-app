// mobile/utils/format.ts

/**
 * Safer number formatting.
 */
export function formatNumber(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return value.toFixed(decimals);
}

/**
 * Format ISO string -> "YYYY-MM-DD"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Format ISO string -> "YYYY-MM-DD HH:MM"
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";

  const date = formatDate(dateString);
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${date} ${h}:${min}`;
}
