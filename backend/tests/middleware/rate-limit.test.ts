import { afterEach, describe, expect, it } from "vitest";
import { Elysia } from "elysia";
import {
  isSensitiveAuthRequest,
  rateLimit,
  rateLimiters,
  resolveClientIdentifier,
} from "../../src/middleware/rate-limit";
import { resetConfigCache, setConfigOverrides } from "../../src/config";

function makeRequest(headers: Record<string, string> = {}, url = "https://api.test/api/ping") {
  return new Request(url, { headers });
}

afterEach(() => {
  resetConfigCache();
});

describe("rate-limit middleware", () => {
  describe("resolveClientIdentifier", () => {
    it("ignores forwarded headers when the proxy is not trusted", () => {
      setConfigOverrides({ TRUST_PROXY: false });

      const identifier = resolveClientIdentifier(
        makeRequest({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "5.6.7.8" }),
        { requestIP: () => ({ address: "10.0.0.9" }) },
      );

      expect(identifier).toBe("10.0.0.9");
    });

    it("falls back to a shared bucket when the socket address is unavailable", () => {
      setConfigOverrides({ TRUST_PROXY: false });

      expect(
        resolveClientIdentifier(makeRequest({ "x-forwarded-for": "1.2.3.4" }), null),
      ).toBe("unknown");
    });

    it("prefers the proxy-overwritten X-Real-IP over the appendable X-Forwarded-For", () => {
      setConfigOverrides({ TRUST_PROXY: true });

      const identifier = resolveClientIdentifier(
        makeRequest({ "x-forwarded-for": "1.2.3.4, 10.0.0.9", "x-real-ip": "10.0.0.9" }),
        { requestIP: () => ({ address: "172.18.0.2" }) },
      );

      expect(identifier).toBe("10.0.0.9");
    });
  });

  describe("isSensitiveAuthRequest", () => {
    it("matches credential endpoints", () => {
      expect(
        isSensitiveAuthRequest(
          new Request("https://api.test/api/auth/login", { method: "POST" }),
        ),
      ).toBe(true);
    });

    it("ignores unrelated routes and non-POST verbs", () => {
      expect(
        isSensitiveAuthRequest(
          new Request("https://api.test/api/macros", { method: "POST" }),
        ),
      ).toBe(false);
      expect(
        isSensitiveAuthRequest(new Request("https://api.test/api/auth/login")),
      ).toBe(false);
    });
  });

  describe("enforcement", () => {
    it("rejects a client once it exceeds the window budget", async () => {
      setConfigOverrides({ TRUST_PROXY: true });

      const app = new Elysia()
        .use(
          rateLimit({
            scope: `test-${Math.random()}`,
            windowMs: 60000,
            maxRequests: 2,
          }),
        )
        .get("/api/ping", () => ({ ok: true }));

      const headers = { "x-real-ip": "203.0.113.10" };
      expect((await app.handle(makeRequest(headers))).status).toBe(200);
      expect((await app.handle(makeRequest(headers))).status).toBe(200);

      const blocked = await app.handle(makeRequest(headers));
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("Retry-After")).toBeTruthy();
    });

    it("does not let a forged X-Forwarded-For reset the counter", async () => {
      setConfigOverrides({ TRUST_PROXY: false });

      const app = new Elysia()
        .use(
          rateLimit({
            scope: `spoof-${Math.random()}`,
            windowMs: 60000,
            maxRequests: 1,
          }),
        )
        .get("/api/ping", () => ({ ok: true }));

      expect(
        (await app.handle(makeRequest({ "x-forwarded-for": "1.1.1.1" }))).status,
      ).toBe(200);
      expect(
        (await app.handle(makeRequest({ "x-forwarded-for": "2.2.2.2" }))).status,
      ).toBe(429);
    });

    it("only applies a scoped limiter to the paths it targets", async () => {
      setConfigOverrides({ TRUST_PROXY: true });

      const app = new Elysia()
        .use(
          rateLimit({
            scope: `scoped-${Math.random()}`,
            windowMs: 60000,
            maxRequests: 1,
            appliesTo: isSensitiveAuthRequest,
          }),
        )
        .get("/api/ping", () => ({ ok: true }));

      const headers = { "x-real-ip": "203.0.113.11" };
      expect((await app.handle(makeRequest(headers))).status).toBe(200);
      expect((await app.handle(makeRequest(headers))).status).toBe(200);
    });
  });

  describe("rateLimiters", () => {
    it("exposes the api and auth limiters", () => {
      expect(rateLimiters.api).toBeDefined();
      expect(rateLimiters.auth).toBeDefined();
    });
  });
});
