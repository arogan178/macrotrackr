import { estimateExpenditure } from "@shared/expenditure";
import {
  calculateTrendWeights,
  dayKeyAtOffset,
  type TrendWeightPoint,
} from "@shared/trendWeight";
import { describe, expect, it } from "vitest";

// Today is 2026-03-22, so the window runs 2026-03-01 to 2026-03-21.
const TODAY = "2026-03-22";

function march(day: number): string {
  return `2026-03-${String(day).padStart(2, "0")}`;
}

/** A trend moving in a straight line, with real weigh-ins on `weighInDays`. */
function straightTrend(
  firstDay: number,
  lastDay: number,
  from: number,
  to: number,
  weighInDays: number[],
): TrendWeightPoint[] {
  const points: TrendWeightPoint[] = [];
  for (let day = firstDay; day <= lastDay; day++) {
    const trend = from + ((to - from) * (day - firstDay)) / (lastDay - firstDay);
    points.push({
      date: march(day),
      weight: weighInDays.includes(day) ? trend : null,
      trend,
    });
  }

  return points;
}

function intake(days: number[], kcal: number): Record<string, number> {
  return Object.fromEntries(days.map((day) => [march(day), kcal]));
}

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

describe("estimateExpenditure", () => {
  it("works a losing case by hand", () => {
    // 14 days at 2,100 and 4 at 2,400: 39,000 / 18 = 2,166.67 kcal a day.
    // Trend 80 to 79 kg over 20 days: -1 x 7,700 / 20 = -385 kcal a day.
    const result = estimateExpenditure({
      intakeByDate: {
        ...intake(range(1, 14), 2100),
        ...intake(range(15, 18), 2400),
      },
      partialDates: [],
      trend: straightTrend(1, 21, 80, 79, [1, 8, 15, 21]),
      today: TODAY,
    });

    expect(result.status).toBe("measured");
    if (result.status !== "measured") return;
    expect(result.estimate).toBe(2552);
    expect(result.avgIntake).toBeCloseTo(2166.667, 3);
    expect(result.usableDays).toBe(18);
    expect(result.windowDays).toBe(21);
    expect(result.trendStartKg).toBe(80);
    expect(result.trendEndKg).toBe(79);
    expect(result.spanDays).toBe(20);
    expect(result.dailyBalance).toBe(-385);
  });

  it("subtracts the surplus when the trend is rising", () => {
    // 0.5 kg x 7,700 / 20 = 192.5 kcal a day stored; 2,500 - 192.5 = 2,307.5.
    const result = estimateExpenditure({
      intakeByDate: intake(range(1, 14), 2500),
      partialDates: [],
      trend: straightTrend(1, 21, 70, 70.5, [1, 10, 21]),
      today: TODAY,
    });

    expect(result).toMatchObject({
      status: "measured",
      estimate: 2308,
      avgIntake: 2500,
      usableDays: 14,
      spanDays: 20,
      dailyBalance: 192.5,
    });
  });

  it("leaves partial days out of the average", () => {
    const result = estimateExpenditure({
      intakeByDate: { ...intake(range(1, 14), 2000), ...intake([15, 16], 900) },
      partialDates: new Set([march(15), march(16)]),
      trend: straightTrend(1, 21, 80, 80, [1, 10, 21]),
      today: TODAY,
    });

    expect(result).toMatchObject({
      status: "measured",
      estimate: 2000,
      avgIntake: 2000,
      usableDays: 14,
    });
  });

  it("ignores today's food and weigh-in", () => {
    const result = estimateExpenditure({
      intakeByDate: { ...intake(range(1, 14), 2000), [TODAY]: 400 },
      partialDates: [],
      trend: straightTrend(1, 22, 80, 79.9, [1, 10, 21, 22]),
      today: TODAY,
    });

    expect(result).toMatchObject({
      status: "measured",
      avgIntake: 2000,
      usableDays: 14,
      spanDays: 20,
      trendStartKg: 80,
    });
    if (result.status !== "measured") return;
    expect(result.trendEndKg).toBeCloseTo(79.9048, 4);
  });

  it("asks for more logged days", () => {
    expect(
      estimateExpenditure({
        intakeByDate: intake(range(1, 10), 2000),
        partialDates: [march(10)],
        trend: straightTrend(1, 21, 80, 79, [1, 10, 21]),
        today: TODAY,
      }),
    ).toEqual({
      status: "insufficient",
      usableDays: 9,
      weighInsInWindow: 3,
      needs: { loggedDays: 5, weighIns: 0 },
    });
  });

  it("asks for more weigh-ins", () => {
    // The trend starts before the window, so it covers it, but only 2 real
    // weigh-ins fall inside.
    const trend = [
      { date: "2026-02-28", weight: 80, trend: 80 },
      ...straightTrend(1, 20, 80, 79, [5, 20]),
    ];
    expect(
      estimateExpenditure({
        intakeByDate: intake(range(1, 21), 2000),
        partialDates: [],
        trend,
        today: TODAY,
      }),
    ).toEqual({
      status: "insufficient",
      usableDays: 21,
      weighInsInWindow: 2,
      needs: { loggedDays: 0, weighIns: 1 },
    });
  });

  it("waits for the trend to span two weeks", () => {
    expect(
      estimateExpenditure({
        intakeByDate: intake(range(1, 21), 2000),
        partialDates: [],
        trend: straightTrend(10, 21, 80, 79, [10, 12, 15, 21]),
        today: TODAY,
      }),
    ).toEqual({
      status: "insufficient",
      usableDays: 21,
      weighInsInWindow: 4,
      needs: { loggedDays: 0, weighIns: 0 },
    });
  });

  it("asks for everything with no data", () => {
    expect(
      estimateExpenditure({
        intakeByDate: {},
        partialDates: [],
        trend: [],
        today: TODAY,
      }),
    ).toEqual({
      status: "insufficient",
      usableDays: 0,
      weighInsInWindow: 0,
      needs: { loggedDays: 14, weighIns: 3 },
    });
  });
});

describe("dayKeyAtOffset", () => {
  it("puts a late UTC instant on the next day east of UTC", () => {
    // 22:30 UTC is 00:30 the next day at UTC+2 (getTimezoneOffset -120).
    expect(dayKeyAtOffset(-120)("2026-03-01T22:30:00.000Z")).toBe("2026-03-02");
    expect(dayKeyAtOffset(0)("2026-03-01T22:30:00.000Z")).toBe("2026-03-01");
  });

  it("puts an early UTC instant on the previous day west of UTC", () => {
    // 03:00 UTC is 22:00 the day before at UTC-5 (getTimezoneOffset 300).
    expect(dayKeyAtOffset(300)("2026-03-02T03:00:00.000Z")).toBe("2026-03-01");
  });

  it("leaves bare dates untouched when building a trend", () => {
    expect(
      calculateTrendWeights(
        [
          { timestamp: "2026-03-01", weight: 80 },
          { timestamp: "2026-03-02T03:00:00.000Z", weight: 81 },
        ],
        dayKeyAtOffset(300),
      ),
    ).toEqual([{ date: "2026-03-01", weight: 80.5, trend: 80.5 }]);
  });
});
