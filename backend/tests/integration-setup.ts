import { mock } from "bun:test";
import * as originalClerkGuards from "../src/middleware/clerk-guards";

// We mock requireAuth so integration tests don't need actual JWTs or to hit Clerk APIs.
mock.module("../src/middleware/clerk-guards", () => {
  const { Elysia } = require("elysia");
  
  const requireAuth = new Elysia({ name: "requireAuth" }).derive({ as: "global" }, () => {
    const authenticatedUser = {
      userId: 1, // matches our setup test db
      providerUserId: "test_clerk",
      authProvider: "clerk" as const,
      email: "test@example.com"
    };
    return {
      user: authenticatedUser,
      authenticatedUser
    };
  });

  return {
    ...originalClerkGuards,
    requireAuth,
  };
});
