import { describe, expect, it } from "vitest";
import { z } from "zod";

// Re-create the EnvSchema for testing (without the side effects)
const TestEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_PATH: z
    .string()
    .default("./macro_tracker.db")
    .transform((path) => {
      const isAbsolute = (p: string) => p.startsWith("/");
      return isAbsolute(path) ? path : path; // Simplified for test
    }),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),

  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .transform((val) =>
      val.includes(",") ? val.split(",").map((v) => v.trim()) : val
    ),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  JWT_EXP: z.string().default("30d"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  STRIPE_PRICE_ID_MONTHLY: z
    .string()
    .min(
      1,
      "STRIPE_PRICE_ID_MONTHLY is required for Pro subscription (monthly)"
    ),

  STRIPE_PRICE_ID_YEARLY: z
    .string()
    .min(1, "STRIPE_PRICE_ID_YEARLY is required for Pro subscription (yearly)"),

  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "CLERK_PUBLISHABLE_KEY is required"),

  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  METRICS_API_KEY: z.string().min(1).optional(),
});

describe("config", () => {
  describe("EnvSchema validation", () => {
    it("parses valid environment variables", () => {
      const validEnv = {
        PORT: "3000",
        HOST: "0.0.0.0",
        DATABASE_PATH: "./test.db",
        JWT_SECRET: "this-is-a-32-character-secret-key!!",
        CORS_ORIGIN: "http://localhost:5173",
        NODE_ENV: "development",
        JWT_EXP: "30d",
        STRIPE_SECRET_KEY: "sk_test_123",
        STRIPE_WEBHOOK_SECRET: "test_webhook_secret_placeholder_local",
        STRIPE_PRICE_ID_MONTHLY: "price_monthly_123",
        STRIPE_PRICE_ID_YEARLY: "price_yearly_123",
        RESEND_API_KEY: "test_resend_api_key_placeholder_local",
        CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
      };

      const result = TestEnvSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(3000);
        expect(result.data.HOST).toBe("0.0.0.0");
        expect(result.data.NODE_ENV).toBe("development");
      }
    });

    it("applies defaults for missing optional fields", () => {
      const minimalEnv = {
        JWT_SECRET: "this-is-a-32-character-secret-key!!",
        STRIPE_SECRET_KEY: "sk_test_123",
        STRIPE_WEBHOOK_SECRET: "test_webhook_secret_placeholder_local",
        STRIPE_PRICE_ID_MONTHLY: "price_monthly_123",
        STRIPE_PRICE_ID_YEARLY: "price_yearly_123",
        RESEND_API_KEY: "test_resend_api_key_placeholder_local",
        CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
      };

      const result = TestEnvSchema.safeParse(minimalEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(3000); // default
        expect(result.data.HOST).toBe("0.0.0.0"); // default
        expect(result.data.NODE_ENV).toBe("development"); // default
        expect(result.data.JWT_EXP).toBe("30d"); // default
      }
    });

    it("rejects JWT_SECRET shorter than 32 characters", () => {
      const invalidEnv = {
        JWT_SECRET: "short",
        STRIPE_SECRET_KEY: "sk_test_123",
        STRIPE_WEBHOOK_SECRET: "test_webhook_secret_placeholder_local",
        STRIPE_PRICE_ID_MONTHLY: "price_monthly_123",
        STRIPE_PRICE_ID_YEARLY: "price_yearly_123",
        RESEND_API_KEY: "test_resend_api_key_placeholder_local",
        CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
      };

      const result = TestEnvSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
    });

    it("coerces PORT to number", () => {
      const envWithStringPort = {
        JWT_SECRET: "this-is-a-32-character-secret-key!!",
        STRIPE_SECRET_KEY: "sk_test_123",
        STRIPE_WEBHOOK_SECRET: "test_webhook_secret_placeholder_local",
        STRIPE_PRICE_ID_MONTHLY: "price_monthly_123",
        STRIPE_PRICE_ID_YEARLY: "price_yearly_123",
        RESEND_API_KEY: "test_resend_api_key_placeholder_local",
        CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
        PORT: "8080",
      };

      const result = TestEnvSchema.safeParse(envWithStringPort);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PORT).toBe(8080);
        expect(typeof result.data.PORT).toBe("number");
      }
    });

    it("transforms CORS_ORIGIN to array when comma-separated", () => {
      const envWithMultipleOrigins = {
        JWT_SECRET: "this-is-a-32-character-secret-key!!",
        STRIPE_SECRET_KEY: "sk_test_123",
        STRIPE_WEBHOOK_SECRET: "test_webhook_secret_placeholder_local",
        STRIPE_PRICE_ID_MONTHLY: "price_monthly_123",
        STRIPE_PRICE_ID_YEARLY: "price_yearly_123",
        RESEND_API_KEY: "test_resend_api_key_placeholder_local",
        CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
        CORS_ORIGIN: "http://localhost:5173,http://localhost:3000",
      };

      const result = TestEnvSchema.safeParse(envWithMultipleOrigins);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.CORS_ORIGIN).toEqual([
          "http://localhost:5173",
          "http://localhost:3000",
        ]);
      }
    });

    it("validates NODE_ENV enum values", () => {
      const validEnvs = [
        { ...baseValidEnv(), NODE_ENV: "development" },
        { ...baseValidEnv(), NODE_ENV: "production" },
        { ...baseValidEnv(), NODE_ENV: "test" },
      ];

      for (const env of validEnvs) {
        const result = TestEnvSchema.safeParse(env);
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid NODE_ENV values", () => {
      const invalidEnv = {
        ...baseValidEnv(),
        NODE_ENV: "invalid",
      };

      const result = TestEnvSchema.safeParse(invalidEnv);
      expect(result.success).toBe(false);
    });

    it("makes CLERK_WEBHOOK_SECRET optional", () => {
      const envWithoutOptional = {
        JWT_SECRET: "this-is-a-32-character-secret-key!!",
        STRIPE_SECRET_KEY: "sk_test_123",
        STRIPE_WEBHOOK_SECRET: "test_webhook_secret_placeholder_local",
        STRIPE_PRICE_ID_MONTHLY: "price_monthly_123",
        STRIPE_PRICE_ID_YEARLY: "price_yearly_123",
        RESEND_API_KEY: "test_resend_api_key_placeholder_local",
        CLERK_PUBLISHABLE_KEY: "pk_test_123",
        CLERK_SECRET_KEY: "sk_test_123",
      };

      const result = TestEnvSchema.safeParse(envWithoutOptional);
      expect(result.success).toBe(true);
    });
  });
});

// Helper for base valid environment
const baseValidEnv = () => ({
  JWT_SECRET: "this-is-a-32-character-secret-key!!",
  STRIPE_SECRET_KEY: "sk_test_123",
  STRIPE_WEBHOOK_SECRET: "test_webhook_secret_placeholder_local",
  STRIPE_PRICE_ID_MONTHLY: "price_monthly_123",
  STRIPE_PRICE_ID_YEARLY: "price_yearly_123",
  RESEND_API_KEY: "test_resend_api_key_placeholder_local",
  CLERK_PUBLISHABLE_KEY: "pk_test_123",
  CLERK_SECRET_KEY: "sk_test_123",
});
