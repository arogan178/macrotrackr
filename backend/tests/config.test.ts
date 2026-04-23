import { resolve } from "node:path";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

const requiredEnv: Record<string, string> = {
	APP_MODE: "managed",
	AUTH_MODE: "clerk",
	BILLING_MODE: "managed",
	ANALYTICS_MODE: "disabled",
	EMAIL_MODE: "disabled",
	APP_URL: "http://localhost:5173",
	PUBLIC_APP_NAME: "Macro Trackr",
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
	"PUBLIC_APP_NAME",
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

async function loadConfigModule(overrides: Record<string, string | undefined> = {}) {
	applyTestEnv(overrides);
	const configModule = await import("../src/config");
	configModule.setConfigOverrides(null);
	configModule.resetConfigCache();
	configModule.getConfig();
	return configModule;
}

describe("config", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
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
		expect(config.EMAIL_MODE).toBe("disabled");
		expect(config.APP_URL).toBe("http://localhost:5173");
		expect(config.PUBLIC_APP_NAME).toBe("Macro Trackr");
		expect(config.SUPPORT_EMAIL).toBe("support@local.invalid");
		expect(config.ENABLE_METRICS).toBe(false);
		expect(config.CORS_ORIGIN).toBe("http://localhost:5173");
	});

	it("transforms CSV CORS origins and resolves relative database paths", async () => {
		const { config } = await loadConfigModule({
			DATABASE_PATH: "./tmp/dev.sqlite",
			CORS_ORIGIN: "https://app.example.com, https://admin.example.com",
		});

		expect(config.DATABASE_PATH).toBe(resolve(process.cwd(), "./tmp/dev.sqlite"));
		expect(config.CORS_ORIGIN).toEqual([
			"https://app.example.com",
			"https://admin.example.com",
		]);
	});

	it("throws when profile combination is invalid", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

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

	it("allows self-hosted local mode without Clerk/Stripe/Resend secrets", async () => {
		const { config } = await loadConfigModule({
			APP_MODE: "self-hosted",
			AUTH_MODE: "local",
			BILLING_MODE: "disabled",
			EMAIL_MODE: "disabled",
			CLERK_PUBLISHABLE_KEY: undefined,
			CLERK_SECRET_KEY: undefined,
			STRIPE_SECRET_KEY: undefined,
			STRIPE_WEBHOOK_SECRET: undefined,
			STRIPE_PRICE_ID_MONTHLY: undefined,
			STRIPE_PRICE_ID_YEARLY: undefined,
			RESEND_API_KEY: undefined,
		});

		expect(config.APP_MODE).toBe("self-hosted");
		expect(config.AUTH_MODE).toBe("local");
		expect(config.BILLING_MODE).toBe("disabled");
		expect(config.EMAIL_MODE).toBe("disabled");
		expect(config.CLERK_PUBLISHABLE_KEY).toBeUndefined();
		expect(config.STRIPE_SECRET_KEY).toBeUndefined();
		expect(config.RESEND_API_KEY).toBeUndefined();
	});

	it("requires Clerk keys when AUTH_MODE=clerk", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

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

	it("requires Resend key when EMAIL_MODE=resend", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		await expect(
			loadConfigModule({
				EMAIL_MODE: "resend",
				RESEND_API_KEY: undefined,
			}),
		).rejects.toThrow("Invalid environment variables");

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Invalid environment variables:",
			expect.objectContaining({
				RESEND_API_KEY: expect.any(Array),
			}),
		);
	});

	it("requires SMTP values when EMAIL_MODE=smtp", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		await expect(
			loadConfigModule({
				EMAIL_MODE: "smtp",
				SMTP_HOST: undefined,
				SMTP_PORT: undefined,
				SMTP_USER: undefined,
				SMTP_PASS: undefined,
				SMTP_FROM: undefined,
			}),
		).rejects.toThrow("Invalid environment variables");

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Invalid environment variables:",
			expect.objectContaining({
				SMTP_HOST: expect.any(Array),
				SMTP_PORT: expect.any(Array),
				SMTP_USER: expect.any(Array),
				SMTP_PASS: expect.any(Array),
				SMTP_FROM: expect.any(Array),
			}),
		);
	});

	it("requires PostHog settings when ANALYTICS_MODE=posthog", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

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
});
