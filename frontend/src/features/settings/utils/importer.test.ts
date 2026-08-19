import {
  detectImportFormat,
  normalizeDate,
  normalizeMealType,
  normalizeTime,
  parseCsv,
  parseImportFile,
} from "@shared/importer";
import { describe, expect, it } from "vitest";

describe("Frontend Importer CSV Tokenizer and Normalizers", () => {
  it("parses CSV with quoted strings correctly", () => {
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

  it("normalizes date formats to YYYY-MM-DD", () => {
    expect(normalizeDate("2026-05-01")).toBe("2026-05-01");
    expect(normalizeDate("05/01/2026")).toBe("2026-05-01");
    expect(normalizeDate("5/1/2026")).toBe("2026-05-01");
    expect(normalizeDate("2026/05/01")).toBe("2026-05-01");
    expect(normalizeDate("invalid-date")).toBeNull();
  });

  it("normalizes meal types", () => {
    expect(normalizeMealType("Breakfast")).toBe("breakfast");
    expect(normalizeMealType("Morning Snack")).toBe("breakfast");
    expect(normalizeMealType("Lunch")).toBe("lunch");
    expect(normalizeMealType("Dinner")).toBe("dinner");
    expect(normalizeMealType("Snacks")).toBe("snack");
  });

  it("normalizes times", () => {
    expect(normalizeTime("1:30 PM")).toBe("13:30:00");
    expect(normalizeTime("8:15 AM")).toBe("08:15:00");
    expect(normalizeTime("14:45")).toBe("14:45:00");
    expect(normalizeTime(undefined, "breakfast")).toBe("08:00:00");
  });
});

describe("Frontend Importer Format Parser Support", () => {
  it("parses MyFitnessPal CSV export", () => {
    const mfpCsv = `Date,Meal,Calories,Fat (g),Carbohydrates (g),Protein (g),Note
2026-06-01,Breakfast,450,15,45,30,Egg and toast
2026-06-01,Lunch,600,20,50,40,Chicken salad`;

    expect(detectImportFormat(mfpCsv)).toBe("myfitnesspal");
    const result = parseImportFile(mfpCsv);
    expect(result.format).toBe("myfitnesspal");
    expect(result.entries.length).toBe(2);
    expect(result.summary.totalMeals).toBe(2);
    expect(result.entries[0].protein).toBe(30);
    expect(result.entries[0].carbs).toBe(45);
    expect(result.entries[0].fats).toBe(15);
  });

  it("parses Cronometer CSV export", () => {
    const cronometerCsv = `Date,Time,Group,Food Name,Amount,Unit,Energy (kcal),Protein (g),Net Carbs (g),Fat (g)
2026-06-02,08:30:00,Breakfast,Oatmeal with whey,1,serving,400,32,45,8`;

    expect(detectImportFormat(cronometerCsv)).toBe("cronometer");
    const result = parseImportFile(cronometerCsv);
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].protein).toBe(32);
    expect(result.entries[0].entryTime).toBe("08:30:00");
  });

  it("parses MacroFactor CSV and JSON export", () => {
    const mfCsv = `Date,Time,Food Name,Calories (kcal),Protein (g),Fat (g),Carbs (g),Meal,Weight (lbs)
2026-06-03,09:00:00,Scrambled Eggs,350,24,18,6,Breakfast,180.5`;

    expect(detectImportFormat(mfCsv)).toBe("macrofactor");
    const result = parseImportFile(mfCsv);
    expect(result.entries.length).toBe(1);
    expect(result.weightLogs.length).toBe(1);
    expect(result.weightLogs[0].weight).toBe(180.5);

    const mfJson = JSON.stringify({
      source: "macrofactor",
      foods: [
        {
          date: "2026-06-03",
          name: "Scrambled Eggs",
          protein: 24,
          carbs: 6,
          fat: 18,
          meal: "Breakfast",
        },
      ],
      weights: [{ date: "2026-06-03", weight: 180.5 }],
    });

    const jsonResult = parseImportFile(mfJson);
    expect(jsonResult.entries.length).toBe(1);
    expect(jsonResult.weightLogs.length).toBe(1);
  });

  it("parses Lose It CSV export", () => {
    const loseItCsv = `Date,Name,Type,Quantity,Units,Calories,Fat (g),Protein (g),Carbohydrates (g)
06/04/2026,Protein Shake,Breakfast,1,scoop,150,2,30,3`;

    expect(detectImportFormat(loseItCsv)).toBe("loseit");
    const result = parseImportFile(loseItCsv);
    expect(result.entries.length).toBe(1);
    expect(result.entries[0].mealName).toBe("Protein Shake");
    expect(result.entries[0].protein).toBe(30);
  });

  it("parses MacroTrackr JSON export", () => {
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
  });
});
