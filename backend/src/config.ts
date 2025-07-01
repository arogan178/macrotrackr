// src/config.ts
import { z } from "zod";

// Define a schema for environment variables for validation and type safety
const EnvSchema = z.object({
  /**
   * Port to run the server on
   */
  PORT: z.coerce.number().int().positive().default(3000),

  /**
   * Hostname to bind the server (default: all interfaces)
   */
  HOST: z.string().default("0.0.0.0"),

  /**
   * Path to SQLite database file
   */
  DATABASE_PATH: z.string().default("./macro_tracker.db"),

  /**
   * JWT secret for signing tokens (must be at least 32 chars)
   */
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),

  /**
   * CORS origin(s) allowed. Accepts comma-separated list or single URL.
   */
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .transform((val) =>
      val.includes(",") ? val.split(",").map((v) => v.trim()) : val
    ),

  /**
   * Node environment
   */
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  /**
   * Stripe secret key
   */
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),

  /**
   * Stripe webhook secret
   */
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),

  /**
   * Stripe price ID for Pro subscription (monthly)
   */
  STRIPE_PRICE_ID_MONTHLY: z
    .string()
    .min(1, "STRIPE_PRICE_ID_MONTHLY is required for Pro subscription (monthly)"),

  /**
   * Stripe price ID for Pro subscription (yearly)
   */
  STRIPE_PRICE_ID_YEARLY: z
    .string()
    .min(1, "STRIPE_PRICE_ID_YEARLY is required for Pro subscription (yearly)"),
});

// Validate environment variables on startup
// Bun automatically loads .env, process.env provides access
const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    parsedEnv.error.flatten().fieldErrors
  );
  // Throwing an error prevents the application from starting with invalid config
  throw new Error("Invalid environment variables");
}

/**
 * Type for validated config object
 */
export type Config = z.infer<typeof EnvSchema>;

/**
 * Validated and typed configuration object
 */
export const config: Config = parsedEnv.data;

// Use basic console.log for startup message as logger may not be initialized yet
const nodeEnv =
  process.env.NODE_ENV ||
  (typeof config === "object" && "NODE_ENV" in config
    ? config.NODE_ENV
    : "unknown");
if (nodeEnv !== "test") {
  console.log(`✅ Configuration loaded successfully (NODE_ENV: ${nodeEnv})`);
}
