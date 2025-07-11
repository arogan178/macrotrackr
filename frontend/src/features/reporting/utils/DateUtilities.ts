import { DATE_RANGE_MAPPING, REPORTING_PERIODS } from "../constants";
import type { DateRangeData, ReportingPeriod } from "../types";

// Date utility functions
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

export const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

export const getDateRangeData = (range: string): DateRangeData => {
  const today = new Date();
  const endDate = today.toISOString().split("T")[0];
  const days =
    DATE_RANGE_MAPPING[range as keyof typeof DATE_RANGE_MAPPING] || 7;

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days + 1);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate,
    days,
  };
};

export const getDaysInRange = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

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

// Period utility functions
export const getReportingPeriod = (value: string): ReportingPeriod => {
  return (
    REPORTING_PERIODS.find((period) => period.value === value) ||
    REPORTING_PERIODS[0]
  );
};

export const mapDateRangeToNumeric = (range: string): 7 | 30 | 90 => {
  switch (range) {
    case "week": {
      return 7;
    }
    case "month": {
      return 30;
    }
    case "3months": {
      return 90;
    }
    default: {
      return 7;
    }
  }
};

// Data validation utilities
export const isValidDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return (
    !Number.isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString)
  );
};

export const isWithinDateRange = (
  targetDate: string,
  startDate: string,
  endDate: string,
): boolean => {
  if (
    !isValidDateString(targetDate) ||
    !isValidDateString(startDate) ||
    !isValidDateString(endDate)
  ) {
    return false;
  }

  const target = new Date(targetDate);
  const start = new Date(startDate);
  const end = new Date(endDate);

  return target >= start && target <= end;
};
