import { describe, it, expect, beforeAll, afterAll } from "bun:test";

// We mock requireAuth before we import any routes
import { mock } from "bun:test";
import { Elysia } from "elysia";

mock.module("../../src/middleware/clerk-guards", () => {
  return {
    requireAuth: new Elysia({ name: "requireAuth" }).derive({ as: "scoped" }, () => ({
      authenticatedUser: {
        userId: 1,
        clerkUserId: "test_clerk",
        email: "test@example.com"
      }
    })),
    requirePro: new Elysia({ name: "requirePro" }).derive({ as: "scoped" }, () => ({ isProUser: true })),
    checkProStatus: async () => true,
    FREE_TIER_LIMITS: { DATA_RETENTION_DAYS: 60, MAX_GOALS: 3, MAX_HABITS: 5, MAX_MACRO_ENTRIES_PER_DAY: 20 },
    featureLimitGuard: () => new Elysia({ name: "featureLimitGuard_mock" }).derive({ as: "scoped" }, () => ({
      checkLimit: async () => ({ allowed: true }),
      isProUser: true
    }))
  };
});

import { goalRoutes } from "../../src/modules/goals/routes";
import { Database } from "bun:sqlite";
import { initializeSchema } from "../../src/db/schema";
import { isValidWeightGoalResponse, isValidWeightLogResponse } from "./schemas";

describe("Goals Module Integration", () => {
  let db: Database;
  let app: any;

  beforeAll(() => {
    db = new Database(":memory:");
    initializeSchema(db);
    
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk');
      
      INSERT INTO weight_goals (
        user_id, starting_weight, target_weight, weight_goal, start_date, target_date,
        calorie_target, calculated_weeks, weekly_change, daily_change, created_at, updated_at
      ) VALUES (
        1, 80.0, 75.0, 'lose', '2023-01-01', '2023-06-01',
        2000, 20, 0.25, 0.03, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      );
    `);

    app = new Elysia()
      .decorate("db", db)
      .use(goalRoutes);
  });

  afterAll(() => {
    db.close();
  });

  it("GET /api/goals/weight returns valid schema", async () => {
    const res = await app.handle(new Request("http://localhost/api/goals/weight"));
    const text = await res.text();
    console.log("Status:", res.status, "Text:", text);
    expect(res.status).toBe(200);
    const body = JSON.parse(text);
    expect(isValidWeightGoalResponse(body)).toBe(true);
  });

  it("GET /api/goals/weight-log returns valid schema", async () => {
    const res = await app.handle(new Request("http://localhost/api/goals/weight-log"));
    const text = await res.text();
    expect(res.status).toBe(200);
    const body = JSON.parse(text);
    expect(isValidWeightLogResponse(body)).toBe(true);
  });
});