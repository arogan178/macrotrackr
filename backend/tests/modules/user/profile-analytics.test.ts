import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const captureProductEventMock = vi.fn();
const safeExecuteMock = vi.fn();
const safeQueryMock = vi.fn();
const withTransactionAsyncMock = vi.fn();

vi.mock("../../../src/lib/analytics/product-analytics", () => ({
  captureProductEvent: (...arguments_: unknown[]) =>
    captureProductEventMock(...arguments_),
}));

vi.mock("../../../src/lib/data/database", () => ({
  safeExecute: (...arguments_: unknown[]) => safeExecuteMock(...arguments_),
  safeQuery: (...arguments_: unknown[]) => safeQueryMock(...arguments_),
  withTransactionAsync: (...arguments_: unknown[]) =>
    withTransactionAsyncMock(...arguments_),
}));

vi.mock("../../../src/lib/sync/eventBus", () => ({
  publishUserSyncEvent: vi.fn(),
}));

import { userRoutes } from "../../../src/modules/user/routes";

function createApp() {
  return new Elysia()
    .decorate("db", { kind: "test-db" })
    .derive({ as: "global" }, () => ({
      authenticatedUser: {
        authProvider: "clerk" as const,
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        providerUserId: "clerk-7",
        userId: 7,
      },
      correlationId: "test-correlation-id",
    }))
    .use(userRoutes);
}

async function completeProfile(app: ReturnType<typeof createApp>) {
  return app.handle(
    new Request("http://localhost/api/user/complete-profile", {
      body: JSON.stringify({
        dateOfBirth: "1990-01-01",
        switchingSource: "cronometer",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );
}

describe("profile completion analytics", () => {
  beforeEach(() => {
    captureProductEventMock.mockReset();
    safeExecuteMock.mockReset();
    safeQueryMock.mockReset();
    withTransactionAsyncMock.mockReset();
    withTransactionAsyncMock.mockImplementation(
      (_database: unknown, callback: () => unknown) => callback(),
    );
  });

  it("captures the first incomplete-to-complete transition", async () => {
    safeQueryMock.mockReturnValue({ date_of_birth: null });

    const response = await completeProfile(createApp());

    expect(response.status).toBe(200);
    expect(captureProductEventMock).toHaveBeenCalledWith({
      distinctId: 7,
      event: "profile_completed",
      properties: { switchingSource: "cronometer" },
    });
    expect(safeExecuteMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("switching_source"),
      expect.arrayContaining(["cronometer"]),
    );
  });

  it("does not recapture an already complete profile", async () => {
    safeQueryMock.mockReturnValue({ date_of_birth: "1988-04-12" });

    const response = await completeProfile(createApp());

    expect(response.status).toBe(200);
    expect(captureProductEventMock).not.toHaveBeenCalled();
  });
});
