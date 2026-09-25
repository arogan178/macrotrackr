import { parseImportFile } from "@shared/importer";
import { describe, expect, it } from "vitest";

import { buildHabitsCsv, buildWeightLogCsv } from "./dataExport";

describe("buildWeightLogCsv", () => {
  it("writes one row per weigh-in with the unit in the header", () => {
    const csv = buildWeightLogCsv([
      { id: "a", timestamp: "2026-09-20T08:00:00", weight: 80.4 },
      { id: "b", timestamp: "2026-09-21T08:00:00", weight: 80.1 },
    ]);

    expect(csv).toBe("Date,Weight (kg)\n2026-09-20,80.4\n2026-09-21,80.1");
  });

  it("reads back through the importer", () => {
    const csv = buildWeightLogCsv([
      { id: "a", timestamp: "2026-09-20T08:00:00", weight: 80.4 },
    ]);

    const result = parseImportFile(csv, "auto", "weight.csv");

    expect(result.weightLogs).toEqual([
      { timestamp: "2026-09-20", weight: 80.4 },
    ]);
  });
});

describe("buildHabitsCsv", () => {
  it("writes each habit and escapes names containing commas", () => {
    const csv = buildHabitsCsv([
      {
        id: "h1",
        title: "Water, 2L",
        iconName: "water",
        current: 3,
        target: 7,
        progress: 43,
        isComplete: false,
        createdAt: "2026-09-01T00:00:00Z",
      },
      {
        id: "h2",
        title: "Walk",
        iconName: "walk",
        current: 7,
        target: 7,
        progress: 100,
        isComplete: true,
        createdAt: "2026-09-01T00:00:00Z",
        completedAt: "2026-09-08T00:00:00Z",
      },
    ]);

    expect(csv.split("\n")).toEqual([
      "Name,Current,Target,Complete,Created At,Completed At",
      '"Water, 2L",3,7,no,2026-09-01T00:00:00Z,',
      "Walk,7,7,yes,2026-09-01T00:00:00Z,2026-09-08T00:00:00Z",
    ]);
  });
});
