import { describe, expect, it } from "vitest";

import { normalizeMacroEntryRow } from "../../src/modules/macros/service";

describe("normalizeMacroEntryRow", () => {
  it("converts null ingredients to an empty array []", () => {
    const row = {
      id: 649,
      user_id: 1,
      protein: 25,
      carbs: 11.3,
      fats: 9,
      meal_type: "lunch" as const,
      meal_name: "Tuna salad",
      entry_date: "2026-07-27",
      entry_time: "12:25",
      ingredients: null,
      created_at: "2026-07-27 10:28:10",
    };

    const result = normalizeMacroEntryRow(row);
    expect(result.ingredients).toEqual([]);
    expect(result.mealName).toBe("Tuna salad");
    expect(result.entryDate).toBe("2026-07-27");
  });

  it("parses valid string JSON ingredients", () => {
    const row = {
      id: 650,
      user_id: 1,
      protein: 20,
      carbs: 10,
      fats: 5,
      meal_type: "lunch" as const,
      meal_name: "Salad",
      entry_date: "2026-07-27",
      entry_time: "12:30",
      ingredients: JSON.stringify([{ name: "Tuna", protein: 20, carbs: 0, fats: 5 }]),
      created_at: "2026-07-27 10:30:00",
    };

    const result = normalizeMacroEntryRow(row);
    expect(result.ingredients).toEqual([{ name: "Tuna", protein: 20, carbs: 0, fats: 5 }]);
  });
});
