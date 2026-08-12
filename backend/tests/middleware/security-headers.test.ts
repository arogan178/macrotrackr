import { afterEach, describe, expect, it } from "vitest";
import { Elysia } from "elysia";
import { getSecurityHeaders, securityHeadersMiddleware } from "../../src/middleware/security-headers";
import { resetConfigCache, setConfigOverrides } from "../../src/config";

afterEach(() => {
  resetConfigCache();
});

describe("security headers middleware", () => {
  it("sets the baseline hardening headers on responses", async () => {
    const app = new Elysia()
      .use(securityHeadersMiddleware)
      .get("/api/ping", () => ({ ok: true }));

    const response = await app.handle(new Request("https://api.test/api/ping"));

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
  });

  it("relaxes CSP for the development docs UI only", async () => {
    const app = new Elysia()
      .use(securityHeadersMiddleware)
      .get("/api/docs", () => "ui");

    const response = await app.handle(new Request("https://api.test/api/docs"));

    expect(response.headers.get("Content-Security-Policy")).toBeNull();
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("only sends HSTS in production", () => {
    setConfigOverrides({ NODE_ENV: "development" });
    expect(getSecurityHeaders()["Strict-Transport-Security"]).toBeUndefined();

    resetConfigCache();
    setConfigOverrides({ NODE_ENV: "production" });
    expect(getSecurityHeaders()["Strict-Transport-Security"]).toContain("max-age=31536000");
  });
});
