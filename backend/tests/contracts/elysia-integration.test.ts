import { describe, it, expect, mock } from "bun:test";

// Mock clerk guards to bypass auth completely for the route integration tests
mock.module("../../src/middleware/clerk-guards", () => {
  const { Elysia } = require("elysia");
  // We need to construct the middleware chain such that `authenticatedUser` is merged into the context properly
  const requireAuth = new Elysia({ name: "requireAuth" }).derive({ as: "scoped" }, () => {
    return {
      authenticatedUser: {
        userId: 1,
        clerkUserId: "test_clerk",
        email: "test@example.com"
      }
    };
  });

  return {
    requireAuth,
    requirePro: new Elysia({ name: "requirePro" }).derive({ as: "scoped" }, () => ({ isProUser: true })),
    checkProStatus: async () => true,
    FREE_TIER_LIMITS: { DATA_RETENTION_DAYS: 60 },
    featureLimitGuard: () => new Elysia({ name: "featureLimitGuard_mock" }).derive({ as: "scoped" }, () => ({
      checkLimit: async () => ({ allowed: true }),
      isProUser: true
    }))
  };
});

import { Elysia } from "elysia";
import { isValidMacroTargetResponse } from "./schemas";
import { macroRoutes } from "../../src/modules/macros/routes";
import { Database } from "bun:sqlite";

describe("Route Integration Test Patterns", () => {
  it("Validates schema with actual route handler (mocking auth & db)", async () => {
    const mockDb = new Database(":memory:");
    mockDb.exec(`
      CREATE TABLE users (id INTEGER PRIMARY KEY);
      INSERT INTO users (id) VALUES (1);
      CREATE TABLE macro_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        protein_percentage INTEGER DEFAULT 30,
        carbs_percentage INTEGER DEFAULT 40,
        fats_percentage INTEGER DEFAULT 30,
        locked_macros TEXT DEFAULT '[]'
      );
      INSERT INTO macro_targets (user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros) 
      VALUES (1, 35, 45, 20, '["protein"]');
    `);

    // The handler has `use(requireAuth)` directly in it, so mocking the module above bypasses it
    const testApp = new Elysia()
      .decorate("db", mockDb)
      .onError(({ error }) => {
        console.error("APP ERROR", error);
      })
      .use(macroRoutes);
      
    const res = await testApp.handle(new Request("http://localhost/api/macros/target"));

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(isValidMacroTargetResponse(body)).toBe(true);
    expect(body).toHaveProperty("macroTarget");
    expect(body.macroTarget).toMatchObject({
      proteinPercentage: 35,
      carbsPercentage: 45,
      fatsPercentage: 20,
      lockedMacros: ["protein"],
    });
    expect(body.macroTarget).not.toHaveProperty("protein_percentage");
    
    mockDb.close();
  });
});
