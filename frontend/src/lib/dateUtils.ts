/**
 * Shared date utility functions
 * Use these for common date formatting across the application
 */

/**
 * Format a date string (YYYY-MM-DD) to short format (e.g., "Jan 15")
 */
export const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return "Invalid Date";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Format a date string to full format (e.g., "January 15, 2024")
 */
export const formatDateFull = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

/**
 * Get today's date as YYYY-MM-DD string
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Validate if a string is a valid YYYY-MM-DD date
 */
export const isValidDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return (
    !Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString)
  );
};

/**
 * Calculate days between two dates (inclusive)
 */
export const getDaysInRange = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Get array of date strings between two dates (inclusive)
 */
export const getDatesBetween = (
  startDate: string,
  endDate: string,
): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
};
