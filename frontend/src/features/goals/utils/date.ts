import { format, isValid, parse, parseISO } from "date-fns";

/**
 * Safely parse an ISO timestamp string into a Date.
 * Returns undefined if invalid.
 */
export function safeParseISO(value: string | undefined): Date | undefined {
  if (!value || typeof value !== "string") return undefined;
  const d = parseISO(value);
  return isValid(d) ? d : undefined;
}

/**
 * Parse a local date and time string into a Date assuming local timezone.
 * dateStr: yyyy-MM-dd
 * timeStr: HH:mm
 * Returns undefined if invalid.
 */
export function safeParseLocalDateTime(
  dateStr: string | undefined,
  timeStr: string | undefined,
): Date | undefined {
  if (!dateStr || !timeStr) return undefined;
  const dt = parse(`${dateStr} ${timeStr}`, "yyyy-MM-dd HH:mm", new Date());
  return isValid(dt) ? dt : undefined;
}

/**
 * Return a stable yyyy-MM-dd key for a Date.
 */
export function getDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}