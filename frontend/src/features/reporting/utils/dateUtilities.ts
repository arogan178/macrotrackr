import {
  getDateRangeData as getSharedDateRangeData,
  mapDateRangeToDays,
  todayISO,
} from "@/utils/dateUtilities";

import { REPORTING_PERIODS } from "../constants";
import type { DateRangeData, ReportingPeriod } from "../types";

export const getTodayDate = (): string => {
  return todayISO();
};

export const getDateRangeData = (range: string): DateRangeData => {
  return getSharedDateRangeData(range);
};

// Period utility functions
export const getReportingPeriod = (value: string): ReportingPeriod => {
  return (
    REPORTING_PERIODS.find((period) => period.value === value) ||
    REPORTING_PERIODS[0]
  );
};

export const mapDateRangeToNumeric = (range: string): 7 | 30 | 90 => {
  return mapDateRangeToDays(range);
};

export function getDayString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

export function getWeekString(date: Date) {
  const year = date.getFullYear();
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDay.getTime()) / 86_400_000;
  const week = Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

export function getMonthString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
}

export {
  formatDateShort as formatDate,
  formatDateFull,
  getDatesBetween,
  getDaysInRange,
  isValidDateString,
  isWithinDateRange,
} from "@/utils/dateUtilities";