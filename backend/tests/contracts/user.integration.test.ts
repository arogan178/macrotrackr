import { describe, it, expect, beforeAll, afterAll } from "bun:test";

// We mock requireAuth before we import any routes
import { mock } from "bun:test";
import { Elysia } from "elysia";

import * as originalClerkGuards from "../../src/middleware/clerk-guards";
import * as originalSubscriptionService from "../../src/modules/billing/subscription-service";

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

// Only getUserSubscription is stubbed. Bun's mock.module is process-global and
// never unwound, so replacing the whole module strips every other static from
// any test file that happens to run after this one.
mock.module("../../src/modules/billing/subscription-service", () => ({
  ...originalSubscriptionService,
  SubscriptionService: class extends originalSubscriptionService.SubscriptionService {
    static async getUserSubscription() {
      return { subscription_status: "free" };
    }
  },
}));

import { userRoutes } from "../../src/modules/user/routes";
import { requireAuth } from "../../src/middleware/clerk-guards";
import { Database } from "bun:sqlite";
import { initializeSchema } from "../../src/db/schema";
import { isValidUserProfileResponse } from "./schemas";

describe("User Module Integration", () => {
  let db: Database;
  let app: any;

  beforeAll(() => {
    db = new Database(":memory:");
    initializeSchema(db);
    
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk')
    `);

    app = new Elysia()
      .decorate("db", db)
      .use(requireAuth)
      .use(userRoutes);
  });

  afterAll(() => {
    db.close();
  });

  it("GET /api/user/me returns valid schema", async () => {
    const res = await app.handle(new Request("http://localhost/api/user/me"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(isValidUserProfileResponse(body)).toBe(true);
  });
});
