import { resolve } from "node:path";

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const originalEnv = { ...process.env };

const requiredEnv: Record<string, string> = {
  APP_MODE: "managed",
  AUTH_MODE: "clerk",
  BILLING_MODE: "managed",
  ANALYTICS_MODE: "disabled",
  APP_URL: "http://localhost:5173",
  SUPPORT_EMAIL: "support@local.invalid",
  ENABLE_METRICS: "false",
  STRIPE_SECRET_KEY: "sk_test_123",
  STRIPE_WEBHOOK_SECRET: "test_webhook_secret_placeholder",
  STRIPE_PRICE_ID_MONTHLY: "price_monthly_123",
  STRIPE_PRICE_ID_YEARLY: "price_yearly_123",
  CLERK_PUBLISHABLE_KEY: "pk_test_123",
  CLERK_SECRET_KEY: "sk_test_123",
  NODE_ENV: "test",
};

const managedKeys = [
  "PORT",
  "HOST",
  "DATABASE_PATH",
  "CORS_ORIGIN",
  "NODE_ENV",
  "APP_MODE",
  "AUTH_MODE",
  "BILLING_MODE",
  "ANALYTICS_MODE",
  "EMAIL_MODE",
  "APP_URL",
  "SUPPORT_EMAIL",
  "ENABLE_METRICS",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_MONTHLY",
  "STRIPE_PRICE_ID_YEARLY",
  "RESEND_API_KEY",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET",
  "POSTHOG_KEY",
  "POSTHOG_HOST",
  "SMTP_FROM",
  "METRICS_API_KEY",
];

function applyTestEnv(overrides: Record<string, string | undefined> = {}) {
  for (const key of managedKeys) {
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(requiredEnv)) {
    process.env[key] = value;
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

async function loadConfigModule(
  overrides: Record<string, string | undefined> = {},
) {
  applyTestEnv(overrides);
  const configModule = await import("../src/config");
  configModule.setConfigOverrides(null);
  configModule.resetConfigCache();
  configModule.getConfig();
  return configModule;
}

import { resetConfigCache } from "../src/config";

describe("config", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    applyTestEnv();
    resetConfigCache();
  });

  afterAll(() => {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }

    Object.assign(process.env, originalEnv);
  });

  it("loads expected defaults for test environment", async () => {
    const { config } = await loadConfigModule();

    expect(config.PORT).toBe(3000);
    expect(config.HOST).toBe("0.0.0.0");
    expect(config.NODE_ENV).toBe("test");
    expect(config.DATABASE_PATH).toBe(":memory:");
    expect(config.APP_MODE).toBe("managed");
    expect(config.AUTH_MODE).toBe("clerk");
    expect(config.BILLING_MODE).toBe("managed");
    expect(config.ANALYTICS_MODE).toBe("disabled");
    expect(config.APP_URL).toBe("http://localhost:5173");
    expect(config.SUPPORT_EMAIL).toBe("support@local.invalid");
    expect(config.ENABLE_METRICS).toBe(false);
    expect(config.CORS_ORIGIN).toBe("http://localhost:5173");
  });

  it("transforms CSV CORS origins and resolves relative database paths", async () => {
    const { config } = await loadConfigModule({
      DATABASE_PATH: "./tmp/dev.sqlite",
      CORS_ORIGIN: "https://app.example.com, https://admin.example.com",
    });

    expect(config.DATABASE_PATH).toBe(
      resolve(process.cwd(), "./tmp/dev.sqlite"),
    );
    expect(config.CORS_ORIGIN).toEqual([
      "https://app.example.com",
      "https://admin.example.com",
    ]);
  });

  it("throws when profile combination is invalid", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      loadConfigModule({
        APP_MODE: "self-hosted",
        AUTH_MODE: "clerk",
      }),
    ).rejects.toThrow("Invalid environment variables");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Invalid environment variables:",
      expect.objectContaining({
        APP_MODE: expect.any(Array),
      }),
    );
  });

  it("reports exact messages naming each invalid variable", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      loadConfigModule({
        APP_URL: "not-a-url",
        SUPPORT_EMAIL: "not-an-email",
        POSTHOG_HOST: "not-a-url",
        PORT: "abc",
        BILLING_MODE: "bogus",
      }),
    ).rejects.toThrow("Invalid environment variables");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Invalid environment variables:",
      {
        PORT: ["Invalid input: expected number, received NaN"],
        BILLING_MODE: ['Invalid option: expected one of "managed"|"disabled"'],
        APP_URL: ["APP_URL must be a valid URL"],
        SUPPORT_EMAIL: ["SUPPORT_EMAIL must be a valid email"],
        POSTHOG_HOST: ["POSTHOG_HOST must be a valid URL"],
      },
    );
  });

  it("reports exact messages for missing provider keys", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      loadConfigModule({
        CLERK_PUBLISHABLE_KEY: undefined,
        STRIPE_SECRET_KEY: undefined,
      }),
    ).rejects.toThrow("Invalid environment variables");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Invalid environment variables:",
      {
        CLERK_PUBLISHABLE_KEY: ["CLERK_PUBLISHABLE_KEY is required"],
        STRIPE_SECRET_KEY: ["STRIPE_SECRET_KEY is required"],
      },
    );
  });

  it("reports the exact message for an invalid mode combination", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      loadConfigModule({ APP_MODE: "self-hosted", AUTH_MODE: "clerk" }),
    ).rejects.toThrow("Invalid environment variables");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Invalid environment variables:",
      {
        APP_MODE: [
          "APP_MODE=self-hosted requires AUTH_MODE=local",
          "APP_MODE=self-hosted requires BILLING_MODE=disabled",
        ],
      },
    );
  });

  it("allows self-hosted local mode without Clerk/Stripe secrets", async () => {
    const { config } = await loadConfigModule({
      APP_MODE: "self-hosted",
      AUTH_MODE: "local",
      BILLING_MODE: "disabled",
      CLERK_PUBLISHABLE_KEY: undefined,
      CLERK_SECRET_KEY: undefined,
      STRIPE_SECRET_KEY: undefined,
      STRIPE_WEBHOOK_SECRET: undefined,
      STRIPE_PRICE_ID_MONTHLY: undefined,
      STRIPE_PRICE_ID_YEARLY: undefined,
    });

    expect(config.APP_MODE).toBe("self-hosted");
    expect(config.AUTH_MODE).toBe("local");
    expect(config.BILLING_MODE).toBe("disabled");
    expect(config.CLERK_PUBLISHABLE_KEY).toBeUndefined();
    expect(config.STRIPE_SECRET_KEY).toBeUndefined();
  });

  it("requires Clerk keys when AUTH_MODE=clerk", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      loadConfigModule({
        CLERK_PUBLISHABLE_KEY: undefined,
      }),
    ).rejects.toThrow("Invalid environment variables");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Invalid environment variables:",
      expect.objectContaining({
        CLERK_PUBLISHABLE_KEY: expect.any(Array),
      }),
    );
  });

  it("ignores retired email settings left in an existing .env", async () => {
    const { config } = await loadConfigModule({
      EMAIL_MODE: "resend",
      RESEND_API_KEY: "re_live_key",
      SMTP_PORT: "not-a-port",
      SMTP_FROM: "not-an-email",
    });

    expect(config.AUTH_MODE).toBe("clerk");
    expect(Object.keys(config)).not.toContain("EMAIL_MODE");
    expect(Object.keys(config)).not.toContain("RESEND_API_KEY");
  });

  it("requires PostHog settings when ANALYTICS_MODE=posthog", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      loadConfigModule({
        ANALYTICS_MODE: "posthog",
        POSTHOG_KEY: undefined,
        POSTHOG_HOST: undefined,
      }),
    ).rejects.toThrow("Invalid environment variables");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Invalid environment variables:",
      expect.objectContaining({
        POSTHOG_KEY: expect.any(Array),
        POSTHOG_HOST: expect.any(Array),
      }),
    );
  });

  it("rejects analytics in self-hosted mode", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(
      loadConfigModule({
        APP_MODE: "self-hosted",
        AUTH_MODE: "local",
        BILLING_MODE: "disabled",
        ANALYTICS_MODE: "posthog",
        POSTHOG_KEY: "phc_test",
        POSTHOG_HOST: "https://eu.i.posthog.com",
      }),
    ).rejects.toThrow("Invalid environment variables");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Invalid environment variables:",
      expect.objectContaining({ APP_MODE: expect.any(Array) }),
    );
  });
});
