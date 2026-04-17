import { resolve } from "node:path";

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

const requiredEnv: Record<string, string> = {
	JWT_SECRET: "test_jwt_secret_must_be_long_enough_32_chars",
	STRIPE_SECRET_KEY: "sk_test_123",
	STRIPE_WEBHOOK_SECRET: "whsec_test_123",
	STRIPE_PRICE_ID_MONTHLY: "price_monthly_123",
	STRIPE_PRICE_ID_YEARLY: "price_yearly_123",
	RESEND_API_KEY: "re_test_123",
	CLERK_PUBLISHABLE_KEY: "pk_test_123",
	CLERK_SECRET_KEY: "sk_test_123",
	NODE_ENV: "test",
};

const managedKeys = [
	"PORT",
	"HOST",
	"DATABASE_PATH",
	"JWT_SECRET",
	"CORS_ORIGIN",
	"NODE_ENV",
	"JWT_EXP",
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
		expect(config.JWT_EXP).toBe("30d");
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

	it("throws when required environment variables are invalid", async () => {
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		await expect(
			loadConfigModule({
				JWT_SECRET: "too-short",
			}),
		).rejects.toThrow("Invalid environment variables");

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Invalid environment variables:",
			expect.objectContaining({
				JWT_SECRET: expect.any(Array),
			}),
		);
	});
});
