import { describe, expect, it, vi } from "vitest";

const bunPasswordMock = {
  hash: vi.fn(async (plaintextPassword: string) => {
    const salt = Math.random().toString(36).slice(2, 10);
    const encodedPassword = Buffer.from(plaintextPassword, "utf8").toString(
      "base64url",
    );
    return `$2mock$${salt}$${encodedPassword}`;
  }),
  verify: vi.fn(
    async (
      plaintextPassword: string,
      hashedPassword: string,
      _algorithm?: string,
    ) => {
      if (typeof hashedPassword !== "string") {
        return false;
      }

      const segments = hashedPassword.split("$");
      const encodedPassword = segments[segments.length - 1];
      if (!encodedPassword) {
        return false;
      }

      try {
        const decodedPassword = Buffer.from(encodedPassword, "base64url").toString(
          "utf8",
        );
        return decodedPassword === plaintextPassword;
      } catch {
        return false;
      }
    },
  ),
};

vi.stubGlobal("Bun", {
  password: bunPasswordMock,
});

// Set required environment variables before importing password module
const mockEnv = {
  APP_MODE: "self-hosted",
  AUTH_MODE: "local",
  BILLING_MODE: "disabled",
  ANALYTICS_MODE: "disabled",
  EMAIL_MODE: "disabled",
  APP_URL: "http://localhost:5173",
  PUBLIC_APP_NAME: "Macro Trackr",
  SUPPORT_EMAIL: "support@local.invalid",
  ENABLE_METRICS: "false",
  STRIPE_SECRET_KEY: "sk_test_123",
  STRIPE_WEBHOOK_SECRET: "whsec_123",
  STRIPE_PRICE_ID_MONTHLY: "price_monthly_123",
  STRIPE_PRICE_ID_YEARLY: "price_yearly_123",
  RESEND_API_KEY: "re_123",
  CLERK_PUBLISHABLE_KEY: "pk_test_123",
  CLERK_SECRET_KEY: "sk_test_123",
};

vi.stubEnv("APP_MODE", mockEnv.APP_MODE);
vi.stubEnv("AUTH_MODE", mockEnv.AUTH_MODE);
vi.stubEnv("BILLING_MODE", mockEnv.BILLING_MODE);
vi.stubEnv("ANALYTICS_MODE", mockEnv.ANALYTICS_MODE);
vi.stubEnv("EMAIL_MODE", mockEnv.EMAIL_MODE);
vi.stubEnv("APP_URL", mockEnv.APP_URL);
vi.stubEnv("PUBLIC_APP_NAME", mockEnv.PUBLIC_APP_NAME);
vi.stubEnv("SUPPORT_EMAIL", mockEnv.SUPPORT_EMAIL);
vi.stubEnv("ENABLE_METRICS", mockEnv.ENABLE_METRICS);
vi.stubEnv("STRIPE_SECRET_KEY", mockEnv.STRIPE_SECRET_KEY);
vi.stubEnv("STRIPE_WEBHOOK_SECRET", mockEnv.STRIPE_WEBHOOK_SECRET);
vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", mockEnv.STRIPE_PRICE_ID_MONTHLY);
vi.stubEnv("STRIPE_PRICE_ID_YEARLY", mockEnv.STRIPE_PRICE_ID_YEARLY);
vi.stubEnv("RESEND_API_KEY", mockEnv.RESEND_API_KEY);
vi.stubEnv("CLERK_PUBLISHABLE_KEY", mockEnv.CLERK_PUBLISHABLE_KEY);
vi.stubEnv("CLERK_SECRET_KEY", mockEnv.CLERK_SECRET_KEY);

describe("password", () => {
  describe("hashPassword", () => {
    it("returns a hashed password", async () => {
      const { hashPassword } = await import("../../src/lib/auth/password");
      const hashed = await hashPassword("testpassword123");
      
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe("string");
      expect(hashed.length).toBeGreaterThan(0);
      // bcrypt hashes start with $2
      expect(hashed.startsWith("$2")).toBe(true);
    });

    it("produces different hashes for the same password", async () => {
      const { hashPassword } = await import("../../src/lib/auth/password");
      const hash1 = await hashPassword("samepassword");
      const hash2 = await hashPassword("samepassword");
      
      // bcrypt generates unique salts, so hashes should be different
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("returns true for correct password", async () => {
      const { hashPassword, verifyPassword } = await import("../../src/lib/auth/password");
      const password = "testpassword123";
      const hashed = await hashPassword(password);
      
      const result = await verifyPassword(password, hashed);
      expect(result).toBe(true);
    });

    it("returns false for incorrect password", async () => {
      const { hashPassword, verifyPassword } = await import("../../src/lib/auth/password");
      const hashed = await hashPassword("correctpassword");
      
      const result = await verifyPassword("wrongpassword", hashed);
      expect(result).toBe(false);
    });

    it("returns false for invalid hash", async () => {
      const { verifyPassword } = await import("../../src/lib/auth/password");
      const result = await verifyPassword("anypassword", "invalidhash");
      expect(result).toBe(false);
    });
  });
});
