import { format, parseISO, addDays, eachDayOfInterval, differenceInCalendarDays, isValid } from "date-fns";

/**
 * Returns today's date as YYYY-MM-DD (local time)
 */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Format a YYYY-MM-DD string as "MMM d" (e.g., "Jan 5")
 */
export function formatDateShort(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "Invalid Date";
    return format(date, "MMM d");
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format a YYYY-MM-DD or full ISO string as "MMMM d, yyyy" (e.g., "January 5, 2025")
 */
export function formatDateFull(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return "Invalid Date";
    return format(date, "MMMM d, yyyy");
  } catch {
    return "Invalid Date";
  }
}

/**
 * Number of calendar days between inclusive dates (YYYY-MM-DD)
 */
export function getDaysInRange(startDate: string, endDate: string): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (!isValid(start) || !isValid(end)) return 0;
  return differenceInCalendarDays(end, start) + 1;
}

/**
 * Get all dates between two YYYY-MM-DD strings (inclusive) as YYYY-MM-DD array
 */
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (!isValid(start) || !isValid(end)) return [];
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

/**
 * Validate YYYY-MM-DD strings
 */
export function isValidDateString(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const date = parseISO(dateString);
  return isValid(date);
}

/**
 * Check if target date (YYYY-MM-DD) is within [start, end] inclusive
 */
export function isWithinDateRange(
  targetDate: string,
  startDate: string,
  endDate: string,
): boolean {
  if (
    !isValidDateString(targetDate) ||
    !isValidDateString(startDate) ||
    !isValidDateString(endDate)
  ) {
    return false;
  }
  const target = parseISO(targetDate);
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return target >= start && target <= end;
}

/**
 * Add N days to a YYYY-MM-DD and return YYYY-MM-DD
 */
export function addDaysISO(dateString: string, days: number): string {
  const date = parseISO(dateString);
  if (!isValid(date)) return dateString;
  return format(addDays(date, days), "yyyy-MM-dd");
}

/**
 * Generate all dates for the next N days starting at given start date (inclusive)
 */
export function eachDayISO(startDate: string, days: number): string[] {
  const start = parseISO(startDate);
  if (!isValid(start) || days <= 0) return [];
  const end = addDays(start, days - 1);
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}