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
    checkProStatus: async () => true,
    FREE_TIER_LIMITS: { DATA_RETENTION_DAYS: 60, MAX_GOALS: 3, MAX_HABITS: 5, MAX_MACRO_ENTRIES_PER_DAY: 20 }
  };
});

import { Database } from "bun:sqlite";
import { initializeSchema } from "../../src/db/schema";

describe("Reporting Module Integration", () => {
  let db: Database;
  let app: any;

  beforeAll(async () => {
    db = new Database(":memory:");
    initializeSchema(db);
    
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk')
    `);

    // Dynamically import reportingRoutes to ensure it runs AFTER mock.module is fully set up
    const { reportingRoutes } = await import("../../src/modules/reporting/routes");

    app = new Elysia()
      .decorate("db", db)
      .use(reportingRoutes);
  });

  afterAll(() => {
    db.close();
  });

  it("GET /api/reporting/nutrient-density-summary returns valid schema", async () => {
    const res = await app.handle(new Request("http://localhost/api/reporting/nutrient-density-summary?groupBy=day"));
    const text = await res.text();
    expect(res.status).toBe(200);
    const body = JSON.parse(text);
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      const item = body[0];
      expect(item).toHaveProperty("period");
      expect(item).toHaveProperty("protein");
      expect(item).toHaveProperty("carbs");
      expect(item).toHaveProperty("fats");
      expect(item).toHaveProperty("calories");
      expect(item).toHaveProperty("count");
    }
  });
});