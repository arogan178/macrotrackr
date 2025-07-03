// src/lib/dates.ts

/**
 * Gets the current date in YYYY-MM-DD format based on the server's local timezone
 */
export function getLocalDate(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  const parts = adjustedDate.toISOString().split("T");
  return parts[0] || adjustedDate.toISOString().substring(0, 10);
}

/**
 * Gets the current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validates if a string is a valid date in YYYY-MM-DD format
 */
export function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validates if a string is a valid time in HH:MM or HH:MM:SS format
 */
export function isValidTime(timeString: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
  return timeRegex.test(timeString);
}

/**
 * Formats a date object to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const parts = date.toISOString().split("T");
  return parts[0] || date.toISOString().substring(0, 10);
}

/**
 * Formats a date object to HH:MM:SS string
 */
export function formatTime(date: Date): string {
  const parts = date.toTimeString().split(" ");
  return parts[0] || "00:00:00";
}

/**
 * Parses a date string and returns a Date object
 */
export function parseDate(dateString: string): Date {
  if (!isValidDate(dateString)) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  return new Date(dateString);
}

/**
 * Calculates the difference in days between two dates
 */
export function daysDifference(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the difference in weeks between two dates
 */
export function weeksDifference(startDate: string, endDate: string): number {
  const days = daysDifference(startDate, endDate);
  return Math.ceil(days / 7);
}
