import { describe, it, expect, beforeAll, afterAll } from "bun:test";

// We mock requireAuth before we import any routes
import { mock } from "bun:test";
import { Elysia } from "elysia";
import * as originalClerkGuards from "../../src/middleware/clerk-guards";

mock.module("../../src/middleware/clerk-guards", () => {
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

import { requireAuth } from "../../src/middleware/clerk-guards";

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
      .use(requireAuth)
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
