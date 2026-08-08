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
});
