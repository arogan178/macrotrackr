import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const safeQueryMock = vi.fn();
const safeExecuteMock = vi.fn();
const withTransactionAsyncMock = vi.fn();

vi.mock("../../../src/lib/data/database", () => ({
  safeQuery: (...arguments_: unknown[]) => safeQueryMock(...arguments_),
  safeExecute: (...arguments_: unknown[]) => safeExecuteMock(...arguments_),
  withTransactionAsync: (...arguments_: unknown[]) =>
    withTransactionAsyncMock(...arguments_),
}));

import { resetConfigCache } from "../../../src/config";
import { userRoutes } from "../../../src/modules/user/routes";

const deleteClerkUserMock = vi.fn();

function createApp(options: { withClerk?: boolean } = {}) {
  const app = new Elysia().decorate("db", { kind: "test-db" });
  if (options.withClerk) {
    app.decorate("clerkClient", {
      users: { deleteUser: deleteClerkUserMock },
    });
  }
  return app
    .derive({ as: "global" }, () => ({
      authenticatedUser: {
        userId: 7,
        providerUserId: "clerk_abc",
        authProvider: "clerk" as const,
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      },
      correlationId: "test-correlation-id",
    }))
    .use(userRoutes);
}

const del = (app: Elysia) =>
  app.handle(new Request("http://localhost/api/user/me", { method: "DELETE" }));

describe("DELETE /api/user/me", () => {
  beforeEach(() => {
    process.env.APP_MODE = "managed";
    process.env.AUTH_MODE = "clerk";
    process.env.BILLING_MODE = "managed";
    resetConfigCache();
    safeQueryMock.mockReset();
    safeExecuteMock.mockReset();
    withTransactionAsyncMock.mockReset();
    deleteClerkUserMock.mockReset();
  });

  it("deletes the users row, relying on cascades for owned data", async () => {
    safeQueryMock.mockReturnValue({ id: 7, subscription_status: "free" });
    safeExecuteMock.mockReturnValue({ changes: 1 });

    const response = await del(createApp());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true });

    // One DELETE against users; every other table cascades.
    expect(safeExecuteMock).toHaveBeenCalledTimes(1);
    const [, sql, parameters] = safeExecuteMock.mock.calls[0] as [
      unknown,
      string,
      unknown[],
    ];
    expect(sql).toContain("DELETE FROM users");
    expect(parameters).toEqual([7]);
  });

  it("refuses while a subscription is active, and deletes nothing", async () => {
    safeQueryMock.mockReturnValue({ id: 7, subscription_status: "pro" });

    const response = await del(createApp());
    expect(response.status).toBe(409);
    // The guard exists so nobody keeps being billed for an account that is
    // gone — so it must not have deleted anything.
    expect(safeExecuteMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the account no longer exists", async () => {
    safeQueryMock.mockReturnValue(undefined);

    const response = await del(createApp());
    expect(response.status).toBe(404);
    expect(safeExecuteMock).not.toHaveBeenCalled();
  });

  it("removes the Clerk identity before the local row", async () => {
    safeQueryMock.mockReturnValue({ id: 7, subscription_status: "free" });
    safeExecuteMock.mockReturnValue({ changes: 1 });
    deleteClerkUserMock.mockResolvedValue(undefined);

    const response = await del(createApp({ withClerk: true }));
    expect(response.status).toBe(200);
    expect(deleteClerkUserMock).toHaveBeenCalledWith("clerk_abc");
  });

  it("keeps the local row when Clerk deletion fails", async () => {
    safeQueryMock.mockReturnValue({ id: 7, subscription_status: "free" });
    deleteClerkUserMock.mockRejectedValue(new Error("clerk is down"));

    const response = await del(createApp({ withClerk: true }));
    expect(response.status).toBe(500);
    // Deleting locally anyway would orphan a Clerk identity whose account is
    // gone, leaving the user unable to sign in or retry.
    expect(safeExecuteMock).not.toHaveBeenCalled();
  });
});
