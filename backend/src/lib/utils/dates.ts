export function getLocalDate(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  const parts = adjustedDate.toISOString().split("T");
  return parts[0] || adjustedDate.toISOString().substring(0, 10);
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export function isValidTime(timeString: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
  return timeRegex.test(timeString);
}

export function formatDate(date: Date): string {
  const parts = date.toISOString().split("T");
  return parts[0] || date.toISOString().substring(0, 10);
}

export function formatTime(date: Date): string {
  const parts = date.toTimeString().split(" ");
  return parts[0] || "00:00:00";
}

export function parseDate(dateString: string): Date {
  if (!isValidDate(dateString)) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  return new Date(dateString);
}

export function daysDifference(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function weeksDifference(startDate: string, endDate: string): number {
  const days = daysDifference(startDate, endDate);
  return Math.ceil(days / 7);
}
