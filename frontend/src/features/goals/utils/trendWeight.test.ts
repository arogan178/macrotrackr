import { calculateTrendWeights } from "@shared/trendWeight";
import { afterEach, describe, expect, it } from "vitest";

const originalTz = process.env.TZ;

// Weigh-ins are stored the way LogWeightModal sends them: a local time as a UTC instant.
function at(year: number, month: number, day: number, hour = 8) {
  return new Date(year, month - 1, day, hour).toISOString();
}

describe("calculateTrendWeights", () => {
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it("returns nothing without weigh-ins", () => {
    expect(calculateTrendWeights([])).toEqual([]);
  });

  it("starts the trend at the first weigh-in", () => {
    expect(
      calculateTrendWeights([{ timestamp: at(2026, 3, 2), weight: 80 }]),
    ).toEqual([{ date: "2026-03-02", weight: 80, trend: 80 }]);
  });

  it("fills missed days in a straight line and feeds them to the trend", () => {
    const points = calculateTrendWeights([
      { timestamp: at(2026, 3, 4), weight: 83 },
      { timestamp: at(2026, 3, 1), weight: 80 },
    ]);

    expect(points.map((point) => [point.date, point.weight])).toEqual([
      ["2026-03-01", 80],
      ["2026-03-02", null],
      ["2026-03-03", null],
      ["2026-03-04", 83],
    ]);
    // 80, then 10% of the way toward 81, 82 and 83.
    const trends = points.map((point) => point.trend);
    expect(trends[0]).toBe(80);
    expect(trends[1]).toBeCloseTo(80.1, 10);
    expect(trends[2]).toBeCloseTo(80.29, 10);
    expect(trends[3]).toBeCloseTo(80.561, 10);
  });

  it("averages weigh-ins on the same day", () => {
    const points = calculateTrendWeights([
      { timestamp: at(2026, 3, 1, 7), weight: 80 },
      { timestamp: at(2026, 3, 1, 21), weight: 81 },
      { timestamp: at(2026, 3, 2), weight: 79 },
    ]);

    expect(points).toHaveLength(2);
    expect(points[0]).toEqual({ date: "2026-03-01", weight: 80.5, trend: 80.5 });
    expect(points[1].weight).toBe(79);
    expect(points[1].trend).toBeCloseTo(80.35, 10);
  });

  it("uses the local day east of UTC", () => {
    process.env.TZ = "Pacific/Auckland";
    // 09:00 on 2 March in Auckland is still 1 March in UTC.
    const [point] = calculateTrendWeights([
      { timestamp: "2026-03-01T20:00:00.000Z", weight: 80 },
    ]);

    expect(point.date).toBe("2026-03-02");
  });

  it("uses the local day west of UTC", () => {
    process.env.TZ = "America/Los_Angeles";
    // 21:00 on 1 March in Los Angeles is already 2 March in UTC.
    const [point] = calculateTrendWeights([
      { timestamp: "2026-03-02T05:00:00.000Z", weight: 80 },
    ]);

    expect(point.date).toBe("2026-03-01");
  });

  it("keeps an imported date-only weigh-in on its own day west of UTC", () => {
    process.env.TZ = "America/Los_Angeles";
    const [point] = calculateTrendWeights([
      { timestamp: "2026-03-02", weight: 80 },
    ]);

    expect(point.date).toBe("2026-03-02");
  });

  it("keeps one point per day across a daylight saving change", () => {
    process.env.TZ = "America/Los_Angeles";
    // Clocks go forward on 8 March 2026.
    const points = calculateTrendWeights([
      { timestamp: at(2026, 3, 7), weight: 80 },
      { timestamp: at(2026, 3, 10), weight: 80 },
    ]);

    expect(points.map((point) => point.date)).toEqual([
      "2026-03-07",
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
    ]);
  });
});
