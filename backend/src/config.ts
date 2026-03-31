import { z } from "zod";
import { isAbsolute, resolve } from "node:path";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_PATH: z
    .string()
    .default(process.env.NODE_ENV === "test" ? ":memory:" : "./macro_tracker.db")
    .transform((path) =>
      path === ":memory:" ? path : isAbsolute(path) ? path : resolve(process.cwd(), path)
    ),

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

const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "Invalid environment variables:",
    parsedEnv.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables");
}

export type Config = z.infer<typeof EnvSchema>;

export const config: Config = parsedEnv.data;

const nodeEnv = process.env.NODE_ENV || config.NODE_ENV || "unknown";
if (nodeEnv !== "test") {
  console.log(`Configuration loaded successfully (NODE_ENV: ${nodeEnv})`);
}
