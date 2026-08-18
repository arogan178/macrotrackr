import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// We mock requireAuth before we import any routes
import { Elysia } from "elysia";

import { Elysia } from "elysia";
import { requireAuth } from "../../src/middleware/clerk-guards";
import * as originalClerkGuards from "../../src/middleware/clerk-guards";

vi.mock("../../src/middleware/clerk-guards", () => {
  return {
    ...originalClerkGuards,
    requireAuth: new Elysia({ name: "requireAuth" }).derive({ as: "global" }, () => {
      const user = {
        userId: 1,
        providerUserId: "test_clerk",
        authProvider: "clerk" as const,
        email: "test@example.com"
      };
      return { user, authenticatedUser: user };
    }),
  };
});

import { Database } from "bun:sqlite";
import { initializeSchema } from "../../src/db/schema";
import { isValidMacroTargetResponse } from "./schemas";

describe("Macros Module Integration", () => {
  let db: Database;
  let app: any;

  beforeAll(async () => {
    db = new Database(":memory:");
    initializeSchema(db);
    
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk')
    `);

    const { macroRoutes } = await import("../../src/modules/macros/routes");

    app = new Elysia()
      .decorate("db", db)
      .use(requireAuth)
      .use(macroRoutes);
  });

  afterAll(() => {
    db.close();
    if (typeof vi.unstubAllEnvs === "function") {
      vi.unstubAllEnvs();
    }
  });

  it("GET /api/macros/target returns valid schema", async () => {
    const res = await app.handle(new Request("http://localhost/api/macros/target"));
    const text = await res.text();
    expect(res.status).toBe(200);
    const body = JSON.parse(text);
    expect(isValidMacroTargetResponse(body)).toBe(true);

    expect(body).toHaveProperty("macroTarget");
    expect(body.macroTarget).toMatchObject({
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatsPercentage: 30,
      lockedMacros: [],
    });
    expect(body.macroTarget).not.toHaveProperty("protein_percentage");
  });

  it("POST /api/macros/import imports structured entries and weight logs", async () => {
    const payload = {
      source: "macrotrackr",
      entries: [
        {
          protein: 30,
          carbs: 40,
          fats: 10,
          mealType: "breakfast",
          mealName: "Oatmeal and Shake",
          entryDate: "2026-07-01",
          entryTime: "08:00:00",
        },
        {
          protein: 45,
          carbs: 60,
          fats: 15,
          mealType: "lunch",
          mealName: "Chicken and Rice",
          entryDate: "2026-07-01",
          entryTime: "12:30:00",
        },
      ],
      weightLogs: [
        {
          timestamp: "2026-07-01",
          weight: 78.5,
        },
      ],
    };

    const res = await app.handle(
      new Request("http://localhost/api/macros/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.importedCount.macros).toBe(2);
    expect(body.importedCount.weightLogs).toBe(1);
    expect(body.dateRange).toEqual({
      start: "2026-07-01",
      end: "2026-07-01",
    });

    const entriesCount = db
      .prepare("SELECT COUNT(*) as count FROM macro_entries WHERE user_id = 1")
      .get() as { count: number };
    expect(entriesCount.count).toBe(2);

    const weightCount = db
      .prepare("SELECT COUNT(*) as count FROM weight_log WHERE user_id = 1")
      .get() as { count: number };
    expect(weightCount.count).toBe(1);
  });

  it("POST /api/macros/import parses raw CSV data automatically", async () => {
    const rawCsv = `Date,Meal,Calories,Fat (g),Carbohydrates (g),Protein (g),Note
2026-07-02,Breakfast,400,10,50,25,Pancakes
2026-07-02,Dinner,600,20,40,40,Salmon`;

    const res = await app.handle(
      new Request("http://localhost/api/macros/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawData: rawCsv }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.importedCount.macros).toBe(2);
  });
});
