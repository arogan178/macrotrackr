import { describe, expect, it, vi } from "vitest";

vi.mock("elysia", () => ({
  Elysia: class {
    use() {
      return this;
    }

    resolve() {
      return this;
    }

    onBeforeHandle() {
      return this;
    }
  },
}));

vi.mock("elysia-clerk", () => ({
  clerkPlugin: vi.fn(() => ({ name: "clerkPlugin" })),
  verifyToken: vi.fn(),
}));

vi.mock("../../src/config", () => ({
  config: {
    CLERK_PUBLISHABLE_KEY: "pk_test_123",
    CLERK_SECRET_KEY: "sk_test_123",
    NODE_ENV: "test",
  },
}));

vi.mock("../../src/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../src/lib/clerk-utils", () => ({
  getInternalUserId: vi.fn(),
}));

import { isExemptPath } from "../../src/middleware/clerkAuth";

describe("isExemptPath", () => {
  it("allows exact public endpoints", () => {
    expect(isExemptPath("/")).toBe(true);
    expect(isExemptPath("/health")).toBe(true);
    expect(isExemptPath("/health/ready")).toBe(true);
    expect(isExemptPath("/api/auth/reset-password")).toBe(true);
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
    expect(isExemptPath("/api/auth/reset-password?token=abc")).toBe(false);
    expect(isExemptPath("/API/AUTH/RESET-PASSWORD")).toBe(false);
    expect(isExemptPath("api/docs")).toBe(false);
    expect(isExemptPath("")).toBe(false);
  });
});
