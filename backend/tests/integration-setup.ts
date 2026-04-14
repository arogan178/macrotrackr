import { mock } from "bun:test";

// We mock the clerk guards so we don't need actual JWTs or to hit Clerk APIs during integration tests.
// The real file imports Elysia, so we need to mock it properly
mock.module("../src/middleware/clerk-guards", () => {
  const { Elysia } = require("elysia");
  
  const requireAuth = new Elysia({ name: "requireAuth" }).derive({ as: "scoped" }, () => {
    return {
      authenticatedUser: {
        userId: 1, // matches our setup test db
        clerkUserId: "test_clerk",
        email: "test@example.com"
      }
    };
  });

  return {
    requireAuth,
    checkProStatus: async () => true,
    FREE_TIER_LIMITS: { DATA_RETENTION_DAYS: 60, MAX_GOALS: 3, MAX_HABITS: 5, MAX_MACRO_ENTRIES_PER_DAY: 20 }
  };
});
