// src/config.ts
import { z } from "zod";

// Define a schema for environment variables for validation and type safety
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"), // Default to listen on all interfaces
  DATABASE_PATH: z.string().default("./macro_tracker.db"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  CORS_ORIGIN: z
    .string()
    .url("CORS_ORIGIN must be a valid URL")
    .default("http://localhost:5173"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  // Stripe configuration
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  STRIPE_PRICE_ID: z
    .string()
    .min(1, "STRIPE_PRICE_ID is required for Pro subscription"),
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

// Export the validated and typed configuration object
export const config = parsedEnv.data;

// Use basic console.log for startup message as logger may not be initialized yet
if (process.env.NODE_ENV !== "test") {
  console.log(
    `✅ Configuration loaded successfully (NODE_ENV: ${config.NODE_ENV})`
  );
}
