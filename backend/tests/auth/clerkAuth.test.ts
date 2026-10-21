import { describe, expect, it, vi } from "vitest";

vi.mock("elysia-clerk", () => ({
  clerkPlugin: vi.fn(() => ({
    resolve: vi.fn(() => ({
      onBeforeHandle: vi.fn(() => ({ name: "clerkPlugin" })),
    })),
  })),
  verifyToken: vi.fn(),
}));

vi.mock("../../src/lib/observability/logger", () => ({
  logger: new Proxy({}, { get: () => vi.fn() }),
  loggerHelpers: new Proxy({}, { get: () => vi.fn() }),
}));

vi.mock("../../src/lib/auth/clerk-utils", () => ({
  getInternalUserId: vi.fn(),
}));

import { issueSyncTicket } from "../../src/lib/auth/sync-ticket";
import { authenticateSyncTicket, isExemptPath } from "../../src/middleware/clerk-auth";

describe("isExemptPath", () => {
  it("allows exact public endpoints", () => {
    expect(isExemptPath("/")).toBe(true);
    expect(isExemptPath("/health")).toBe(true);
    expect(isExemptPath("/health/ready")).toBe(true);
    expect(isExemptPath("/api/billing/webhook")).toBe(true);
  });

  it("allows webhook and docs prefixes", () => {
    expect(isExemptPath("/api/webhooks/clerk")).toBe(true);
    expect(isExemptPath("/api/webhooks/custom")).toBe(true);
    expect(isExemptPath("/api/docs")).toBe(true);
    expect(isExemptPath("/api/docs/swagger")).toBe(true);
    expect(isExemptPath("/api/api/docs/swagger")).toBe(true);
  });

  it("keeps authenticated routes protected", () => {
    expect(isExemptPath("/api/auth/clerk-sync")).toBe(false);
    expect(isExemptPath("/api/user/me")).toBe(false);
    expect(isExemptPath("/api/billing/status")).toBe(false);
    expect(isExemptPath("/api/macros/entry")).toBe(false);
  });

  it("is path-sensitive", () => {
    expect(isExemptPath("/api/billing/webhook?token=abc")).toBe(false);
    expect(isExemptPath("/API/BILLING/WEBHOOK")).toBe(false);
    expect(isExemptPath("api/docs")).toBe(false);
    expect(isExemptPath("")).toBe(false);
  });
});

describe("authenticateSyncTicket", () => {
  function clerkReturning(userId: string | null) {
    return {
      authenticateRequest: vi.fn(async () => ({ toAuth: () => ({ userId, sessionId: "sess_1" }) })),
    };
  }

  it("verifies the session token a sync ticket was minted from", async () => {
    const clerk = clerkReturning("user_1");
    const { ticket } = issueSyncTicket("clerk-session-jwt");
    const request = new Request(`https://api.test/api/sync/events?ticket=${ticket}`);

    expect(await authenticateSyncTicket(request, clerk)).toEqual({ userId: "user_1", sessionId: "sess_1" });
    const [verified] = clerk.authenticateRequest.mock.calls[0] as unknown as [Request];
    expect(verified.headers.get("authorization")).toBe("Bearer clerk-session-jwt");
  });

  it("burns the ticket after one connect", async () => {
    const clerk = clerkReturning("user_1");
    const { ticket } = issueSyncTicket("clerk-session-jwt");
    const request = () => new Request(`https://api.test/api/sync/events?ticket=${ticket}`);

    await authenticateSyncTicket(request(), clerk);
    expect(await authenticateSyncTicket(request(), clerk)).toBeNull();
  });

  it("ignores tickets on any other endpoint", async () => {
    const clerk = clerkReturning("user_1");
    const { ticket } = issueSyncTicket("clerk-session-jwt");
    const request = new Request(`https://api.test/api/user/me?ticket=${ticket}`);

    expect(await authenticateSyncTicket(request, clerk)).toBeNull();
    expect(clerk.authenticateRequest).not.toHaveBeenCalled();
  });

  it("rejects a token Clerk does not accept", async () => {
    const { ticket } = issueSyncTicket("expired-jwt");
    const request = new Request(`https://api.test/api/sync/events?ticket=${ticket}`);

    expect((await authenticateSyncTicket(request, clerkReturning(null)))?.userId).toBeUndefined();
  });
});
