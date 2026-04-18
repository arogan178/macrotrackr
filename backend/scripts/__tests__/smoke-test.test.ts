import { afterEach, describe, expect, it, vi } from "vitest";

import {
	fetchWithTimeout,
	normalizeUrl,
	resolveSmokeTestConfig,
	smokeTest,
} from "../smoke-test";

const originalFetch = globalThis.fetch;

describe("smoke-test script helpers", () => {
	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("normalizes URLs by trimming and removing trailing slashes", () => {
		expect(
			normalizeUrl("  https://example.com/api///  ", "http://fallback", "SMOKE_TEST_URL"),
		).toBe("https://example.com/api");
	});

	it("requires explicit URL values in CI", () => {
		expect(() => normalizeUrl(undefined, "http://fallback", "SMOKE_TEST_URL")).not.toThrow();

		const originalCI = process.env.CI;
		process.env.CI = "true";

		try {
			expect(() => normalizeUrl(undefined, "http://fallback", "SMOKE_TEST_URL")).toThrow(
				"Missing required environment variable: SMOKE_TEST_URL",
			);
		} finally {
			process.env.CI = originalCI;
		}
	});

	it("detects when backend and frontend share the same origin", () => {
		const resolved = resolveSmokeTestConfig({
			SMOKE_TEST_URL: "https://macrotracker.app/api",
			FRONTEND_URL: "https://macrotracker.app",
		});

		expect(resolved.baseUrl).toBe("https://macrotracker.app/api");
		expect(resolved.frontendUrl).toBe("https://macrotracker.app");
		expect(resolved.sharedPublicOrigin).toBe(true);
	});

	it("reports successful smoke test execution", async () => {
		const result = await smokeTest("happy path", async () => {
			await Promise.resolve();
		});

		expect(result).toMatchObject({
			name: "happy path",
			passed: true,
		});
		expect(result.duration).toBeGreaterThanOrEqual(0);
	});

	it("captures failure information from smoke test execution", async () => {
		const result = await smokeTest("failing test", async () => {
			throw new Error("Backend unavailable");
		});

		expect(result).toMatchObject({
			name: "failing test",
			passed: false,
			error: "Backend unavailable",
		});
		expect(result.duration).toBeGreaterThanOrEqual(0);
	});

	it("passes an AbortSignal to fetch and returns response", async () => {
		const response = new Response("ok", { status: 200 });
		const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
			expect(init?.signal).toBeInstanceOf(AbortSignal);
			return response;
		});

		globalThis.fetch = fetchMock as unknown as typeof fetch;

		await expect(fetchWithTimeout("http://localhost:3000/health", 50)).resolves.toBe(
			response,
		);
	});

	it("aborts timed-out fetch requests", async () => {
		vi.useFakeTimers();

		const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
		const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
			return new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener("abort", () => reject(abortError), {
					once: true,
				});
			});
		});

		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const promise = fetchWithTimeout("http://localhost:3000/slow", 10);
		vi.advanceTimersByTime(10);
		await Promise.resolve();

		await expect(promise).rejects.toBe(abortError);
	});
});
