import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// We mock requireAuth before we import any routes
import { Elysia } from "elysia";

vi.mock("../../src/middleware/clerk-guards", () => {
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

import { Database } from "bun:sqlite";
import { initializeSchema } from "../../src/db/schema";
import { isValidMacroTargetResponse, isValidMacroEntryResponse, isValidMacroHistoryResponse, isValidMacroTotalsResponse } from "./schemas";

describe("Macros Module Integration", () => {
  let db: Database;
  let app: any;

  beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", "test-secret-that-is-at-least-32-chars");
    
    db = new Database(":memory:");
    initializeSchema(db);
    
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk')
    `);

    const { macroRoutes } = await import("../../src/modules/macros/routes");

    app = new Elysia()
      .decorate("db", db)
      .use(macroRoutes);
  });

  afterAll(() => {
    db.close();
    vi.unstubAllEnvs();
  });

  it("GET /api/macros/target returns valid schema", async () => {
    const res = await app.handle(new Request("http://localhost/api/macros/target"));
    const text = await res.text();
    expect(res.status).toBe(200);
    const body = JSON.parse(text);
    expect(isValidMacroTargetResponse(body)).toBe(true);
  });
});
