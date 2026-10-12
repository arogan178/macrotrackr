import type { TrendWeightPoint } from "./trendWeight";

/** Days looked back, ending yesterday: today is never complete. */
export const EXPENDITURE_WINDOW_DAYS = 21;
/** Fully logged days needed inside the window. */
export const MIN_LOGGED_DAYS = 14;
/** Days with a real weigh-in needed inside the window. */
export const MIN_WEIGH_INS = 3;
/** Days the trend must span inside the window. */
export const MIN_TREND_SPAN_DAYS = 14;
/** Energy in one kilogram of body weight change. */
export const KCAL_PER_KG = 7700;

export type ExpenditureResult =
  | {
      status: "measured";
      estimate: number;
      avgIntake: number;
      usableDays: number;
      windowDays: typeof EXPENDITURE_WINDOW_DAYS;
      trendStartKg: number;
      trendEndKg: number;
      spanDays: number;
      /** kcal stored (positive) or drawn from the body (negative) per day. */
      dailyBalance: number;
    }
  | {
      status: "insufficient";
      usableDays: number;
      weighInsInWindow: number;
      needs: { loggedDays: number; weighIns: number };
    };

export interface ExpenditureInput {
  /** Total kcal logged per YYYY-MM-DD. */
  intakeByDate: Record<string, number>;
  /** Days the user marked as partly logged. */
  partialDates: ReadonlySet<string> | readonly string[];
  /** From calculateTrendWeights, keyed by the user's own calendar days. */
  trend: readonly TrendWeightPoint[];
  /** The user's current calendar day, YYYY-MM-DD. */
  today: string;
}

const DAY_MS = 86_400_000;

function dayKeyToUtcMs(key: string): number {
  return Date.UTC(
    Number(key.slice(0, 4)),
    Number(key.slice(5, 7)) - 1,
    Number(key.slice(8, 10)),
  );
}

function addDays(key: string, days: number): string {
  return new Date(dayKeyToUtcMs(key) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** First and last day of the window, inclusive. */
export function expenditureWindow(today: string): { start: string; end: string } {
  return {
    start: addDays(today, -EXPENDITURE_WINDOW_DAYS),
    end: addDays(today, -1),
  };
}

/**
 * Expenditure from energy balance: what the user ate, less what the trend
 * says went into or out of their body.
 */
export function estimateExpenditure({
  intakeByDate,
  partialDates,
  trend,
  today,
}: ExpenditureInput): ExpenditureResult {
  const { start, end } = expenditureWindow(today);
  const partial = new Set(partialDates);

  const usableIntakes: number[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    const intake = intakeByDate[day] ?? 0;
    if (intake > 0 && !partial.has(day)) usableIntakes.push(intake);
  }
  const usableDays = usableIntakes.length;

  const inWindow = trend.filter(
    (point) => point.date >= start && point.date <= end,
  );
  const weighInsInWindow = inWindow.filter(
    (point) => point.weight !== null,
  ).length;
  const first = inWindow[0];
  const last = inWindow.at(-1);
  const spanDays =
    first && last
      ? Math.round((dayKeyToUtcMs(last.date) - dayKeyToUtcMs(first.date)) / DAY_MS)
      : 0;

  if (
    !first ||
    !last ||
    usableDays < MIN_LOGGED_DAYS ||
    weighInsInWindow < MIN_WEIGH_INS ||
    spanDays < MIN_TREND_SPAN_DAYS
  ) {
    return {
      status: "insufficient",
      usableDays,
      weighInsInWindow,
      needs: {
        loggedDays: Math.max(0, MIN_LOGGED_DAYS - usableDays),
        weighIns: Math.max(0, MIN_WEIGH_INS - weighInsInWindow),
      },
    };
  }

  const avgIntake =
    usableIntakes.reduce((sum, intake) => sum + intake, 0) / usableDays;
  const dailyBalance = ((last.trend - first.trend) * KCAL_PER_KG) / spanDays;

  return {
    status: "measured",
    estimate: Math.round(avgIntake - dailyBalance),
    avgIntake,
    usableDays,
    windowDays: EXPENDITURE_WINDOW_DAYS,
    trendStartKg: first.trend,
    trendEndKg: last.trend,
    spanDays,
    dailyBalance,
  };
}
