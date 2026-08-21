import { z } from "zod";
import { isAbsolute, resolve } from "node:path";

const BaseEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_PATH: z
    .string()
    .default(process.env.NODE_ENV === "test" ? ":memory:" : "./macrotrackr.db")
    .transform((path) =>
      path === ":memory:"
        ? path
        : isAbsolute(path)
          ? path
          : resolve(process.cwd(), path),
    ),

  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .transform((val) =>
      val.includes(",") ? val.split(",").map((v) => v.trim()) : val,
    ),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  APP_MODE: z.enum(["managed", "self-hosted"]).default("self-hosted"),
  AUTH_MODE: z.enum(["clerk", "local"]).default("local"),
  BILLING_MODE: z.enum(["managed", "disabled"]).default("disabled"),
  ANALYTICS_MODE: z.enum(["posthog", "disabled"]).default("disabled"),
  EMAIL_MODE: z.enum(["resend", "smtp", "disabled"]).default("disabled"),
  APP_URL: z
    .string()
    .url("APP_URL must be a valid URL")
    .default("http://localhost:5173"),
  PUBLIC_APP_NAME: z
    .string()
    .min(1, "PUBLIC_APP_NAME is required")
    .default("MacroTrackr"),
  SUPPORT_EMAIL: z
    .string()
    .email("SUPPORT_EMAIL must be a valid email")
    .default("support@local.invalid"),
  ENABLE_METRICS: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .transform((value) => value === true || value === "true")
    .default(false),

  // Only enable when the app sits behind a reverse proxy that overwrites
  // X-Forwarded-For. When false, rate limiting keys on the socket address so
  // clients cannot spoof their identity with a forged header.
  TRUST_PROXY: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .transform((value) => value === true || value === "true")
    .default(false),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ID_YEARLY: z.string().optional(),

  // Google Play billing. Independent of BILLING_MODE on purpose: the web app
  // can sell through Stripe with no Android build in the world, and a Play
  // release needs its own switch.
  PLAY_BILLING_MODE: z.enum(["enabled", "disabled"]).default("disabled"),
  GOOGLE_PLAY_PACKAGE_NAME: z.string().optional(),
  // Service account JSON, as a single-line string. Needs the
  // androidpublisher scope and Financial data access in the Play Console.
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: z.string().optional(),
  // Shared secret in the Pub/Sub push endpoint URL. Pub/Sub cannot sign its
  // payloads the way Stripe does, so the secret in the path is what proves
  // the request came from our subscription.
  GOOGLE_PLAY_RTDN_SECRET: z.string().optional(),
  GOOGLE_PLAY_PRODUCT_ID_MONTHLY: z.string().optional(),
  GOOGLE_PLAY_PRODUCT_ID_YEARLY: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url("POSTHOG_HOST must be a valid URL").optional(),
  ANALYTICS_INTERNAL_EMAILS: z
    .string()
    .default("")
    .transform((value) =>
      value
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email("SMTP_FROM must be a valid email").optional(),

  METRICS_API_KEY: z.string().min(1).optional(),
});

type BaseConfig = z.infer<typeof BaseEnvSchema>;

interface ConfigValidationIssue {
  path: keyof BaseConfig;
  message: string;
}

function requireValue(
  key: keyof BaseConfig,
  value: string | number | undefined,
  issues: ConfigValidationIssue[],
): void {
  if (value === undefined || value === "") {
    issues.push({
      path: key,
      message: `${key} is required`,
    });
  }
}

function validateModeCombinations(config: BaseConfig): ConfigValidationIssue[] {
  const errors: ConfigValidationIssue[] = [];

  if (config.APP_MODE === "managed") {
    if (config.AUTH_MODE !== "clerk") {
      errors.push({
        path: "APP_MODE",
        message: "APP_MODE=managed requires AUTH_MODE=clerk",
      });
    }
    if (config.BILLING_MODE !== "managed") {
      errors.push({
        path: "APP_MODE",
        message: "APP_MODE=managed requires BILLING_MODE=managed",
      });
    }
  }

  if (config.APP_MODE === "self-hosted") {
    if (config.AUTH_MODE !== "local") {
      errors.push({
        path: "APP_MODE",
        message: "APP_MODE=self-hosted requires AUTH_MODE=local",
      });
    }
    if (config.BILLING_MODE !== "disabled") {
      errors.push({
        path: "APP_MODE",
        message: "APP_MODE=self-hosted requires BILLING_MODE=disabled",
      });
    }
    if (config.ANALYTICS_MODE !== "disabled") {
      errors.push({
        path: "APP_MODE",
        message: "APP_MODE=self-hosted requires ANALYTICS_MODE=disabled",
      });
    }
  }

  return errors;
}

function validateProviderRequirements(
  config: BaseConfig,
): ConfigValidationIssue[] {
  const errors: ConfigValidationIssue[] = [];

  if (config.AUTH_MODE === "clerk") {
    requireValue("CLERK_PUBLISHABLE_KEY", config.CLERK_PUBLISHABLE_KEY, errors);
    requireValue("CLERK_SECRET_KEY", config.CLERK_SECRET_KEY, errors);
  }

  if (config.BILLING_MODE === "managed") {
    requireValue("STRIPE_SECRET_KEY", config.STRIPE_SECRET_KEY, errors);
    requireValue("STRIPE_WEBHOOK_SECRET", config.STRIPE_WEBHOOK_SECRET, errors);
    requireValue(
      "STRIPE_PRICE_ID_MONTHLY",
      config.STRIPE_PRICE_ID_MONTHLY,
      errors,
    );
    requireValue(
      "STRIPE_PRICE_ID_YEARLY",
      config.STRIPE_PRICE_ID_YEARLY,
      errors,
    );
  }

  if (config.PLAY_BILLING_MODE === "enabled") {
    requireValue(
      "GOOGLE_PLAY_PACKAGE_NAME",
      config.GOOGLE_PLAY_PACKAGE_NAME,
      errors,
    );
    requireValue(
      "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
      config.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON,
      errors,
    );
    requireValue(
      "GOOGLE_PLAY_RTDN_SECRET",
      config.GOOGLE_PLAY_RTDN_SECRET,
      errors,
    );
    requireValue(
      "GOOGLE_PLAY_PRODUCT_ID_MONTHLY",
      config.GOOGLE_PLAY_PRODUCT_ID_MONTHLY,
      errors,
    );
    requireValue(
      "GOOGLE_PLAY_PRODUCT_ID_YEARLY",
      config.GOOGLE_PLAY_PRODUCT_ID_YEARLY,
      errors,
    );
  }

  if (config.ANALYTICS_MODE === "posthog") {
    requireValue("POSTHOG_KEY", config.POSTHOG_KEY, errors);
    requireValue("POSTHOG_HOST", config.POSTHOG_HOST, errors);
  }

  if (config.EMAIL_MODE === "resend") {
    requireValue("RESEND_API_KEY", config.RESEND_API_KEY, errors);
  }

  if (config.EMAIL_MODE === "smtp") {
    requireValue("SMTP_HOST", config.SMTP_HOST, errors);
    requireValue("SMTP_PORT", config.SMTP_PORT, errors);
    requireValue("SMTP_USER", config.SMTP_USER, errors);
    requireValue("SMTP_PASS", config.SMTP_PASS, errors);
    requireValue("SMTP_FROM", config.SMTP_FROM, errors);
  }

  return errors;
}

const EnvSchema = BaseEnvSchema.superRefine((config, ctx) => {
  const profileErrors = validateModeCombinations(config);
  const providerErrors = validateProviderRequirements(config);

  for (const issue of [...profileErrors, ...providerErrors]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: issue.message,
      path: [issue.path],
    });
  }
});

export type Config = z.infer<typeof EnvSchema>;

let cachedConfig: Config | null = null;
let configOverrides: Partial<Config> | null = null;

function parseConfigFromEnvironment(): Config {
  const parsedEnv = EnvSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    console.error(
      "Invalid environment variables:",
      parsedEnv.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables");
  }

  return parsedEnv.data;
}

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsedConfig = parseConfigFromEnvironment();
  cachedConfig = configOverrides
    ? { ...parsedConfig, ...configOverrides }
    : parsedConfig;

  const nodeEnv = process.env.NODE_ENV ?? cachedConfig.NODE_ENV;
  if (nodeEnv !== "test") {
    console.warn(`Configuration loaded successfully (NODE_ENV: ${nodeEnv})`);
  }

  return cachedConfig;
}

export function setConfigOverrides(overrides: Partial<Config> | null) {
  configOverrides = overrides;
  cachedConfig = null;
}

export function resetConfigCache() {
  cachedConfig = null;
  configOverrides = null;
}

export const config: Config = new Proxy({} as Config, {
  get(_target, property: keyof Config) {
    return getConfig()[property];
  },
  ownKeys() {
    return Reflect.ownKeys(getConfig());
  },
  getOwnPropertyDescriptor(_target, property) {
    return Object.getOwnPropertyDescriptor(getConfig(), property);
  },
});
