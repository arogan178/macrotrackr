export const TREND_SMOOTHING = 0.1;

export interface TrendWeightPoint {
  /** Calendar day, YYYY-MM-DD, in the runtime's local time zone unless a
   *  day key mapper says otherwise. */
  date: string;
  /** Average of that day's weigh-ins, or null when the day was filled in. */
  weight: number | null;
  trend: number;
}

const DAY_MS = 86_400_000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Maps a stored timestamp (a UTC instant) to the user's calendar day. */
export type DayKeyMapper = (timestamp: string) => string | undefined;

// Imported weigh-ins are bare dates, which Date would read as UTC midnight.
const BARE_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Timestamps are stored as UTC instants; the user's day is the local one.
const localDayKey: DayKeyMapper = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return undefined;

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * Day keys for a user whose clock is `offsetMinutes` behind UTC, in the sign
 * convention of `Date.prototype.getTimezoneOffset` (UTC+2 is -120).
 */
export function dayKeyAtOffset(offsetMinutes: number): DayKeyMapper {
  return (timestamp) => {
    const ms = new Date(timestamp).getTime();
    if (Number.isNaN(ms)) return undefined;

    return utcMsToDayKey(ms - offsetMinutes * 60_000);
  };
}

// Day keys are stepped in UTC so a DST change never skips or repeats a day.
function dayKeyToUtcMs(key: string): number {
  return Date.UTC(
    Number(key.slice(0, 4)),
    Number(key.slice(5, 7)) - 1,
    Number(key.slice(8, 10)),
  );
}

function utcMsToDayKey(ms: number): string {
  const date = new Date(ms);

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function calculateTrendWeights(
  logs: ReadonlyArray<{ timestamp: string; weight: number }>,
  dayKeyOf: DayKeyMapper = localDayKey,
): TrendWeightPoint[] {
  const byDay = new Map<string, { sum: number; count: number }>();
  for (const log of logs) {
    const key = BARE_DATE.test(log.timestamp)
      ? log.timestamp
      : dayKeyOf(log.timestamp);
    if (!key || !Number.isFinite(log.weight)) continue;
    const day = byDay.get(key) ?? { sum: 0, count: 0 };
    day.sum += log.weight;
    day.count += 1;
    byDay.set(key, day);
  }

  const logged = [...byDay.entries()]
    .map(([date, { sum, count }]) => ({
      ms: dayKeyToUtcMs(date),
      weight: sum / count,
    }))
    .sort((a, b) => a.ms - b.ms);

  const first = logged[0];
  if (!first) return [];

  const points: TrendWeightPoint[] = [];
  let trend = first.weight;

  for (const [index, current] of logged.entries()) {
    const next = logged[index + 1];
    const span = next ? Math.round((next.ms - current.ms) / DAY_MS) : 1;

    for (let offset = 0; offset < span; offset++) {
      const value = next
        ? current.weight + ((next.weight - current.weight) * offset) / span
        : current.weight;
      if (points.length > 0) trend += TREND_SMOOTHING * (value - trend);
      points.push({
        date: utcMsToDayKey(current.ms + offset * DAY_MS),
        weight: offset === 0 ? current.weight : null,
        trend,
      });
    }
  }

  return points;
}
