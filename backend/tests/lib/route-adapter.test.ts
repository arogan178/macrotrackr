import { describe, expect, it } from "vitest";

describe("route-adapter", () => {
  describe("resolveClerkIdentity", () => {
    it("resolves user with valid clerk user ID", async () => {
      const { resolveClerkIdentity } = await import("../../src/lib/auth/route-adapter");
      
      const context = {
        user: {
          authProvider: "clerk",
          providerUserId: "user_123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe"
        },
      };
      
      const result = resolveClerkIdentity(context as any);
      
      expect(result.clerkUserId).toBe("user_123");
      expect(result.email).toBe("test@example.com");
      expect(result.firstName).toBe("John");
    });

    it("throws AuthenticationError when clerkUserId is missing", async () => {
      const { resolveClerkIdentity } = await import("../../src/lib/auth/route-adapter");
      
      const context = {
        user: {},
      };
      
      expect(() => resolveClerkIdentity(context as any)).toThrow();
    });

    it("accepts missing internalUserId because identity is Clerk-based", async () => {
      const { resolveClerkIdentity } = await import("../../src/lib/auth/route-adapter");
      
      const context = {
        user: { authProvider: "clerk", providerUserId: "user_123" }
      };
      
      const result = resolveClerkIdentity(context as any);
      expect(result.clerkUserId).toBe("user_123");
    });
  });
});
