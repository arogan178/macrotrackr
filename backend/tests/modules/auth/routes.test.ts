import { Elysia } from "elysia";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleError } from "../../../src/lib/http/responses";

const safeQueryMock = vi.fn();
const safeExecuteMock = vi.fn();
const withTransactionMock = vi.fn();
const hashPasswordMock = vi.fn();

vi.mock("../../../src/lib/data/database", () => ({
  safeQuery: (...arguments_: unknown[]) => safeQueryMock(...arguments_),
  safeExecute: (...arguments_: unknown[]) => safeExecuteMock(...arguments_),
  withTransaction: (...arguments_: unknown[]) =>
    withTransactionMock(...arguments_),
}));

vi.mock("../../../src/lib/auth/password", () => ({
  hashPassword: (...arguments_: unknown[]) => hashPasswordMock(...arguments_),
}));

import { authRoutes } from "../../../src/modules/auth/routes";

interface TestClerkUser {
  userId: number | null;
  id: string;
  clerkUserId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthTestAppOptions {
  user?: TestClerkUser;
  clerkClient?: {
    users?: {
      getUser?: (userId: string) => Promise<{
        emailAddresses?: Array<{ id?: string; emailAddress?: string }>;
        primaryEmailAddressId?: string;
        firstName?: string;
        lastName?: string;
      }>;
    };
  };
}

function createAuthTestApp(
  db: Record<string, unknown>,
  options: AuthTestAppOptions = {},
) {
  const user: TestClerkUser =
    options.user ?? {
      userId: null,
      id: "clerk_test_user",
      clerkUserId: "clerk_test_user",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
    };

  const baseApp = new Elysia().decorate("db", db);
  const appWithClerkClient =
    options.clerkClient ?
      baseApp.decorate("clerkClient", options.clerkClient)
    : baseApp;

  return (appWithClerkClient as Elysia)
    .derive({ as: "scoped" }, () => ({
      user,
      clerkUserId: user.clerkUserId,
      internalUserId: user.userId,
      correlationId: "test-correlation-id",
    }))
    .onError(({ code, error, set }) => {
      if (code === "VALIDATION") {
        set.status = 400;
        return {
          success: false,
          code: "VALIDATION_ERROR",
          message: "Input validation failed",
          details: error instanceof Error ? error.message : String(error),
        };
      }

      return handleError(error, set);
    })
    .use(authRoutes);
}

async function postJson(app: Elysia, path: string, payload: unknown) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    }),
  );
}

describe("auth routes", () => {
  const fakeDb = { kind: "test-db" };

  beforeEach(() => {
    vi.restoreAllMocks();

    safeQueryMock.mockReset();
    safeExecuteMock.mockReset();
    withTransactionMock.mockReset();
    hashPasswordMock.mockReset();

    safeQueryMock.mockReturnValue(null);
    safeExecuteMock.mockReturnValue({ lastInsertRowid: 0 });
    withTransactionMock.mockImplementation(
      (_db: unknown, callback: () => unknown) => callback(),
    );
    hashPasswordMock.mockResolvedValue("hashed-password");
  });

  describe("POST /api/auth/reset-password", () => {
    it("resets password with a valid token", async () => {
      safeQueryMock.mockReturnValue({
        id: 42,
        password_reset_expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });

      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/reset-password", {
        token: "valid-reset-token",
        newPassword: "new-password-123",
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        message: "Password has been reset successfully.",
      });

      expect(hashPasswordMock).toHaveBeenCalledWith("new-password-123");
      expect(safeExecuteMock).toHaveBeenCalledWith(
        fakeDb,
        expect.stringContaining("UPDATE users SET password = ?"),
        ["hashed-password", 42],
      );
    });

    it("returns 401 for unknown reset token", async () => {
      safeQueryMock.mockReturnValue(null);

      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/reset-password", {
        token: "unknown-token",
        newPassword: "new-password-123",
      });

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        code: "AUTHENTICATION_ERROR",
        message: "Invalid or expired password reset token.",
      });
    });

    it("returns 401 for expired reset token", async () => {
      safeQueryMock.mockReturnValue({
        id: 11,
        password_reset_expires: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      });

      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/reset-password", {
        token: "expired-token",
        newPassword: "new-password-123",
      });

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        code: "AUTHENTICATION_ERROR",
        message: "Invalid or expired password reset token.",
      });
    });

    it("returns 400 for schema-invalid payload", async () => {
      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/reset-password", {
        token: "token",
        newPassword: "short",
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      });
    });
  });

  describe("POST /api/auth/clerk-sync", () => {
    it("creates a new user and default records for a fresh Clerk account", async () => {
      safeQueryMock.mockImplementation((_db: unknown, query: string) => {
        if (query.includes("SELECT id, email FROM users WHERE clerk_id = ?")) {
          return null;
        }

        if (
          query.includes(
            "SELECT id, clerk_id, email FROM users WHERE LOWER(email) = LOWER(?)",
          )
        ) {
          return null;
        }

        return null;
      });

      safeExecuteMock
        .mockReturnValueOnce({ lastInsertRowid: 321 })
        .mockReturnValue({ lastInsertRowid: 0 });

      const app = createAuthTestApp(fakeDb, {
        user: {
          userId: null,
          id: "clerk_new_user",
          clerkUserId: "clerk_new_user",
          email: "new-user@example.com",
          firstName: "New",
          lastName: "User",
        },
      });

      const response = await postJson(app, "/api/auth/clerk-sync", {});

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        id: 321,
        clerkId: "clerk_new_user",
        email: "new-user@example.com",
        firstName: "New",
        lastName: "User",
        message: "User created and synced successfully",
      });

      expect(safeExecuteMock).toHaveBeenCalledTimes(3);
      expect(safeExecuteMock).toHaveBeenNthCalledWith(
        1,
        fakeDb,
        expect.stringContaining("INSERT INTO users"),
        ["new-user@example.com", "New", "User", "clerk_new_user", "clerk-auth"],
      );
      expect(safeExecuteMock).toHaveBeenNthCalledWith(
        2,
        fakeDb,
        expect.stringContaining("INSERT INTO user_details"),
        [321],
      );
      expect(safeExecuteMock).toHaveBeenNthCalledWith(
        3,
        fakeDb,
        expect.stringContaining("INSERT INTO macro_targets"),
        [321],
      );
    });

    it("updates an existing user matched by Clerk ID", async () => {
      safeQueryMock.mockImplementation((_db: unknown, query: string) => {
        if (query.includes("SELECT id, email FROM users WHERE clerk_id = ?")) {
          return { id: 15, email: "old-email@example.com" };
        }

        if (
          query.includes(
            "SELECT id, clerk_id, email FROM users WHERE LOWER(email) = LOWER(?)",
          )
        ) {
          return {
            id: 15,
            clerk_id: "clerk_existing",
            email: "old-email@example.com",
          };
        }

        if (
          query.includes(
            "SELECT id, clerk_id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?",
          )
        ) {
          return null;
        }

        return null;
      });

      const app = createAuthTestApp(fakeDb, {
        user: {
          userId: 123,
          id: "clerk_existing",
          clerkUserId: "clerk_existing",
          email: "updated-email@example.com",
          firstName: "Updated",
          lastName: "User",
        },
      });

      const response = await postJson(app, "/api/auth/clerk-sync", {});

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        clerkId: "clerk_existing",
        email: "updated-email@example.com",
        firstName: "Updated",
        lastName: "User",
        message: "User synced successfully",
      });

      expect(safeExecuteMock).toHaveBeenCalledWith(
        fakeDb,
        expect.stringContaining("UPDATE users SET clerk_id = ?, email = ?"),
        [
          "clerk_existing",
          "updated-email@example.com",
          "Updated",
          "User",
          15,
        ],
      );
    });

    it("returns 409 when email already belongs to a different user", async () => {
      safeQueryMock.mockImplementation((_db: unknown, query: string) => {
        if (query.includes("SELECT id, email FROM users WHERE clerk_id = ?")) {
          return null;
        }

        if (
          query.includes(
            "SELECT id, clerk_id, email FROM users WHERE LOWER(email) = LOWER(?)",
          )
        ) {
          return {
            id: 7,
            clerk_id: "clerk_existing_owner",
            email: "existing@example.com",
          };
        }

        return null;
      });

      const app = createAuthTestApp(fakeDb, {
        user: {
          userId: null,
          id: "clerk_new_conflict",
          clerkUserId: "clerk_new_conflict",
          email: "existing@example.com",
          firstName: "New",
          lastName: "Conflict",
        },
      });

      const response = await postJson(app, "/api/auth/clerk-sync", {});

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        code: "RESOURCE_CONFLICT",
      });
      expect(safeExecuteMock).not.toHaveBeenCalled();
    });

    it("uses clerkClient fallback when auth context lacks profile fields", async () => {
      safeQueryMock.mockImplementation((_db: unknown, query: string) => {
        if (query.includes("SELECT id, email FROM users WHERE clerk_id = ?")) {
          return null;
        }

        if (
          query.includes(
            "SELECT id, clerk_id, email FROM users WHERE LOWER(email) = LOWER(?)",
          )
        ) {
          return null;
        }

        return null;
      });

      safeExecuteMock
        .mockReturnValueOnce({ lastInsertRowid: 999 })
        .mockReturnValue({ lastInsertRowid: 0 });

      const getUserMock = vi.fn(async () => ({
        primaryEmailAddressId: "primary_email_id",
        emailAddresses: [
          {
            id: "primary_email_id",
            emailAddress: "fallback@example.com",
          },
        ],
        firstName: "Fallback",
        lastName: "Resolver",
      }));

      const app = createAuthTestApp(fakeDb, {
        user: {
          userId: null,
          id: "clerk_fallback",
          clerkUserId: "clerk_fallback",
        },
        clerkClient: {
          users: {
            getUser: getUserMock,
          },
        },
      });

      const response = await postJson(app, "/api/auth/clerk-sync", {});

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        id: 999,
        email: "fallback@example.com",
        firstName: "Fallback",
        lastName: "Resolver",
      });
      expect(getUserMock).toHaveBeenCalledWith("clerk_fallback");
    });
  });
});
