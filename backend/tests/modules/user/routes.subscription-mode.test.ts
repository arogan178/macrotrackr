import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const safeQueryMock = vi.fn();
const safeExecuteMock = vi.fn();
const withTransactionAsyncMock = vi.fn();

let appMode: "managed" | "self-hosted" = "managed";

vi.mock("../../../src/lib/data/database", () => ({
  safeQuery: (...arguments_: unknown[]) => safeQueryMock(...arguments_),
  safeExecute: (...arguments_: unknown[]) => safeExecuteMock(...arguments_),
  withTransactionAsync: (...arguments_: unknown[]) =>
    withTransactionAsyncMock(...arguments_),
}));

import { resetConfigCache } from "../../../src/config";

import { userRoutes } from "../../../src/modules/user/routes";

function createUserRoutesTestApp() {
  return new Elysia()
    .decorate("db", { kind: "test-db" })
    .derive({ as: "global" }, () => ({
      authenticatedUser: {
        userId: 7,
        providerUserId: "local-7",
        authProvider: "local" as const,
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
      correlationId: "test-correlation-id",
    }))
    .use(userRoutes);
}

describe("user routes subscription mode behavior", () => {
  beforeEach(() => {
    appMode = "managed";
    process.env.APP_MODE = "managed";
    process.env.AUTH_MODE = "clerk";
    process.env.BILLING_MODE = "managed";
    resetConfigCache();
    safeQueryMock.mockReset();
    safeExecuteMock.mockReset();
    withTransactionAsyncMock.mockReset();
  });

  it("returns free status in managed mode for free users", async () => {
    safeQueryMock.mockReturnValue({
      id: 7,
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      created_at: "2026-01-01T00:00:00.000Z",
      subscription_status: "free",
      date_of_birth: "1990-01-01",
      height: 180,
      weight: 75,
      gender: "male",
      activity_level: 3,
    });

    const app = createUserRoutesTestApp();
    const response = await app.handle(
      new Request("http://localhost/api/user/me", { method: "GET" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      subscription: { status: "free" },
    });
  });

  it("returns pro status in self-hosted mode regardless of db status", async () => {
    appMode = "self-hosted";
    process.env.APP_MODE = "self-hosted";
    process.env.AUTH_MODE = "local";
    process.env.BILLING_MODE = "disabled";
    resetConfigCache();
    safeQueryMock.mockReturnValue({
      id: 7,
      email: "test@example.com",
      first_name: "Test",
      last_name: "User",
      created_at: "2026-01-01T00:00:00.000Z",
      subscription_status: "free",
      date_of_birth: "1990-01-01",
      height: 180,
      weight: 75,
      gender: "male",
      activity_level: 3,
    });

    const app = createUserRoutesTestApp();
    const response = await app.handle(
      new Request("http://localhost/api/user/me", { method: "GET" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      subscription: { status: "pro" },
    });
  });
});
