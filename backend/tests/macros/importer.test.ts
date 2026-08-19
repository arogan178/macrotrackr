import { describe, expect, it } from "vitest";
import {
  detectImportFormat,
  normalizeDate,
  normalizeMealType,
  normalizeTime,
  parseCsv,
  parseImportFile,
} from "@shared/importer";

describe("Importer CSV Tokenizer and Normalizers", () => {
  it("parses CSV with quoted strings containing commas and newlines", () => {
    const csv = `Date,Meal,"Food, Name",Calories\n2026-05-01,Breakfast,"Oatmeal, rolled",300`;
    const rows = parseCsv(csv);
    expect(rows.length).toBe(2);
    expect(rows[0]).toEqual(["Date", "Meal", "Food, Name", "Calories"]);
    expect(rows[1]).toEqual([
      "2026-05-01",
      "Breakfast",
      "Oatmeal, rolled",
      "300",
    ]);
  });

  it("normalizes various date formats to YYYY-MM-DD", () => {
    expect(normalizeDate("2026-05-01")).toBe("2026-05-01");
    expect(normalizeDate("2026/05/01")).toBe("2026-05-01");
    expect(normalizeDate("05/01/2026")).toBe("2026-05-01");
    expect(normalizeDate("5/1/2026")).toBe("2026-05-01");
    expect(normalizeDate("2026-05-01T14:30:00.000Z")).toBe("2026-05-01");
    expect(normalizeDate("invalid-date")).toBeNull();
  });

  it("normalizes meal types accurately", () => {
    expect(normalizeMealType("Breakfast")).toBe("breakfast");
    expect(normalizeMealType("Morning Snack")).toBe("breakfast");
    expect(normalizeMealType("Lunch")).toBe("lunch");
    expect(normalizeMealType("Dinner")).toBe("dinner");
    expect(normalizeMealType("Snacks")).toBe("snack");
    expect(normalizeMealType("Late Night")).toBe("snack");
  });

  it("normalizes 12-hour and 24-hour time strings", () => {
    expect(normalizeTime("1:30 PM")).toBe("13:30:00");
    expect(normalizeTime("8:15 AM")).toBe("08:15:00");
    expect(normalizeTime("14:45")).toBe("14:45:00");
    expect(normalizeTime(undefined, "breakfast")).toBe("08:00:00");
    expect(normalizeTime(undefined, "lunch")).toBe("12:30:00");
    expect(normalizeTime(undefined, "dinner")).toBe("18:30:00");
    expect(normalizeTime(undefined, "snack")).toBe("15:00:00");
  });
});

describe("Format Auto-detection & Parsing", () => {
  it("detects and parses MyFitnessPal CSV export", () => {
    const mfpCsv = `Date,Meal,Calories,Fat (g),Carbohydrates (g),Protein (g),Note
2026-06-01,Breakfast,450,15,45,30,Egg and toast
2026-06-01,Lunch,600,20,50,40,Chicken salad
2026-06-01,Dinner,700,25,60,45,Salmon and rice
2026-06-01,Snacks,200,5,25,10,Greek yogurt`;

    const format = detectImportFormat(mfpCsv);
    expect(format).toBe("myfitnesspal");

    const result = parseImportFile(mfpCsv);
    expect(result.format).toBe("myfitnesspal");
    expect(result.entries.length).toBe(4);
    expect(result.entries[0]).toEqual({
      protein: 30,
      carbs: 45,
      fats: 15,
      mealType: "breakfast",
      mealName: "Egg and toast",
      entryDate: "2026-06-01",
      entryTime: "08:00:00",
    });
    expect(result.summary.totalMeals).toBe(4);
    expect(result.summary.dateRange).toEqual({
      start: "2026-06-01",
      end: "2026-06-01",
    });
  });

  it("detects and parses Cronometer CSV export", () => {
    const cronometerCsv = `Date,Time,Group,Food Name,Amount,Unit,Energy (kcal),Protein (g),Net Carbs (g),Fat (g)
2026-06-02,08:30:00,Breakfast,Oatmeal with whey,1,serving,400,32,45,8
2026-06-02,12:45:00,Lunch,Turkey wrap,1,wrap,550,42,50,15`;

    const format = detectImportFormat(cronometerCsv);
    expect(format).toBe("cronometer");

    const result = parseImportFile(cronometerCsv);
    expect(result.entries.length).toBe(2);
    expect(result.entries[0].protein).toBe(32);
    expect(result.entries[0].carbs).toBe(45);
    expect(result.entries[0].fats).toBe(8);
    expect(result.entries[0].entryTime).toBe("08:30:00");
  });

  it("detects and parses MacroFactor CSV and JSON export", () => {
    const mfCsv = `Date,Time,Food Name,Calories (kcal),Protein (g),Fat (g),Carbs (g),Meal,Weight (lbs)
2026-06-03,09:00:00,Scrambled Eggs,350,24,18,6,Breakfast,180.5
2026-06-03,13:00:00,Steak Bowl,650,50,22,55,Lunch,`;

    expect(detectImportFormat(mfCsv)).toBe("macrofactor");
    const csvResult = parseImportFile(mfCsv);
    expect(csvResult.entries.length).toBe(2);
    expect(csvResult.weightLogs.length).toBe(1);
    expect(csvResult.weightLogs[0]).toEqual({
      timestamp: "2026-06-03",
      weight: 180.5,
    });

    const mfJson = JSON.stringify({
      source: "macrofactor",
      foods: [
        {
          date: "2026-06-03",
          time: "09:00:00",
          name: "Scrambled Eggs",
          protein: 24,
          carbs: 6,
          fat: 18,
          meal: "Breakfast",
        },
      ],
      weights: [{ date: "2026-06-03", weight: 180.5 }],
    });

    expect(detectImportFormat(mfJson)).toBe("macrofactor");
    const jsonResult = parseImportFile(mfJson);
    expect(jsonResult.entries.length).toBe(1);
    expect(jsonResult.weightLogs.length).toBe(1);
  });

  it("detects and parses Lose It CSV export", () => {
    const loseItCsv = `Date,Name,Type,Quantity,Units,Calories,Fat (g),Protein (g),Carbohydrates (g)
06/04/2026,Protein Shake,Breakfast,1,scoop,150,2,30,3
06/04/2026,Chicken Rice,Lunch,1,bowl,500,10,45,55`;

    expect(detectImportFormat(loseItCsv)).toBe("loseit");
    const result = parseImportFile(loseItCsv);
    expect(result.entries.length).toBe(2);
    expect(result.entries[0].mealName).toBe("Protein Shake");
    expect(result.entries[0].mealType).toBe("breakfast");
    expect(result.entries[0].protein).toBe(30);
    expect(result.entries[0].carbs).toBe(3);
    expect(result.entries[0].fats).toBe(2);
    expect(result.entries[0].entryDate).toBe("2026-06-04");
  });

  it("detects and parses MacroTrackr native JSON export", () => {
    const nativeJson = JSON.stringify({
      version: "1.0",
      source: "macrotrackr",
      entries: [
        {
          protein: 35,
          carbs: 50,
          fats: 12,
          mealType: "dinner",
          mealName: "Salmon Bowl",
          entryDate: "2026-06-05",
          entryTime: "19:00:00",
        },
      ],
      weightLogs: [
        {
          timestamp: "2026-06-05",
          weight: 77.2,
        },
      ],
    });

    expect(detectImportFormat(nativeJson)).toBe("macrotrackr");
    const result = parseImportFile(nativeJson);
    expect(result.entries.length).toBe(1);
    expect(result.weightLogs.length).toBe(1);
    expect(result.entries[0].mealName).toBe("Salmon Bowl");
  });

  it("skips malformed JSON records instead of trusting external data", () => {
    const result = parseImportFile(
      JSON.stringify({
        entries: [null, "invalid", { date: "2026-06-06", protein: 20 }],
        weightLogs: [false, { date: "2026-06-06", weight: 75 }],
      }),
    );

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.entryTime).toBe("15:00:00");
    expect(result.weightLogs).toEqual([
      { timestamp: "2026-06-06", weight: 75 },
    ]);
  });
});
