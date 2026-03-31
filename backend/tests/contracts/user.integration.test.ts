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

mock.module("../../src/modules/billing/subscription-service", () => ({
  SubscriptionService: {
    getUserSubscription: async () => ({
      status: "free",
      hasStripeCustomer: false,
      currentPeriodEnd: null
    })
  }
}));

import { userRoutes } from "../../src/modules/user/routes";
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