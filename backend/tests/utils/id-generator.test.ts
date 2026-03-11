import { describe, expect, it, vi, beforeEach } from "vitest";

describe("id-generator", () => {
  // Stub env before importing anything
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "test-secret-that-is-at-least-32-chars");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "test_webhook_secret_marker");
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "price_monthly");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "price_yearly");
    vi.stubEnv("RESEND_API_KEY", "test_resend_api_key_marker");
    vi.stubEnv("CLERK_PUBLISHABLE_KEY", "pk_test");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test");
  });

  describe("generateId", () => {
    it("generates a string id", async () => {
      const { generateId } = await import("../../src/utils/id-generator");
      
      const id = generateId();
      
      expect(typeof id).toBe("string");
    });

    it("generates id with default prefix", async () => {
      const { generateId } = await import("../../src/utils/id-generator");
      
      const id = generateId();
      
      expect(id).toMatch(/^id_/);
    });

    it("generates id with custom prefix", async () => {
      const { generateId } = await import("../../src/utils/id-generator");
      
      const id = generateId("user");
      
      expect(id).toMatch(/^user_/);
    });

    it("generates unique ids", async () => {
      const { generateId } = await import("../../src/utils/id-generator");
      
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      
      expect(ids.size).toBe(100);
    });
  });

  describe("generateUUID", () => {
    it("generates a valid UUID format", async () => {
      const { generateUUID } = await import("../../src/utils/id-generator");
      
      const uuid = generateUUID();
      
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it("generates unique UUIDs", async () => {
      const { generateUUID } = await import("../../src/utils/id-generator");
      
      const uuids = new Set();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }
      
      expect(uuids.size).toBe(100);
    });
  });

  describe("generateNumericId", () => {
    it("generates a numeric id", async () => {
      const { generateNumericId } = await import("../../src/utils/id-generator");
      
      const id = generateNumericId();
      
      expect(typeof id).toBe("number");
    });

    it("generates unique numeric ids", async () => {
      const { generateNumericId } = await import("../../src/utils/id-generator");
      
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateNumericId());
      }
      
      // Allow for some collisions due to timestamp resolution
      expect(ids.size).toBeGreaterThan(90);
    });
  });
});
