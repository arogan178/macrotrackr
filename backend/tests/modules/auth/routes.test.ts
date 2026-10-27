import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { handleError } from "../../../src/lib/http/responses";

const safeQueryMock = vi.fn();
const safeExecuteMock = vi.fn();
const withTransactionMock = vi.fn();
const hashPasswordMock = vi.fn();
const verifyPasswordMock = vi.fn();
const deleteAllUserSessionsMock = vi.fn();
const deleteSessionMock = vi.fn();
const deleteAllSessionsExceptMock = vi.fn();
const createSessionMock = vi.fn();
const readSessionTokenFromRequestMock = vi.fn(() => null);
let authMode: "local" | "clerk" = "local";

vi.mock("../../../src/lib/data/database", () => ({
  safeQuery: (...arguments_: unknown[]) => safeQueryMock(...arguments_),
  safeExecute: (...arguments_: unknown[]) => safeExecuteMock(...arguments_),
  withTransaction: (...arguments_: unknown[]) =>
    withTransactionMock(...arguments_),
}));

vi.mock("../../../src/lib/auth/password", () => ({
  hashPassword: (...arguments_: unknown[]) => hashPasswordMock(...arguments_),
  verifyPassword: (...arguments_: unknown[]) => verifyPasswordMock(...arguments_),
}));

vi.mock("../../../src/lib/auth/session", () => ({
  createExpiredSessionCookieValue: () => "mt_session=; Max-Age=0",
  createSessionCookieValue: (token: string) => `mt_session=${token}; Path=/; HttpOnly`,
  createSession: (...arguments_: unknown[]) => createSessionMock(...arguments_),
  deleteAllSessionsExcept: (...arguments_: unknown[]) =>
    deleteAllSessionsExceptMock(...arguments_),
  deleteAllUserSessions: (...arguments_: unknown[]) =>
    deleteAllUserSessionsMock(...arguments_),
  deleteSession: (...arguments_: unknown[]) => deleteSessionMock(...arguments_),
  readSessionTokenFromRequest: (...arguments_: unknown[]) =>
    readSessionTokenFromRequestMock(...arguments_),
}));

const verifyGoogleIdTokenMock = vi.fn();
const findClerkUserForGoogleMock = vi.fn();
vi.mock("../../../src/lib/auth/google-native", () => ({
  verifyGoogleIdToken: (...arguments_: unknown[]) => verifyGoogleIdTokenMock(...arguments_),
  findClerkUserForGoogle: (...arguments_: unknown[]) =>
    findClerkUserForGoogleMock(...arguments_),
}));

import { resetConfigCache } from "../../../src/config";

import { authRoutes } from "../../../src/modules/auth/routes";

interface TestClerkUser {
  userId: number | null;
  providerUserId: string;
  authProvider: "clerk" | "local";
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthTestAppOptions {
  user?: TestClerkUser;
  authenticatedUser?: {
    userId: number | null;
    providerUserId: string;
    authProvider: "clerk" | "local";
    sessionId?: string;
    clerkUserId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  clerkClient?: {
    users?: {
      getUser?: (userId: string) => Promise<{
        emailAddresses?: Array<{ id?: string; emailAddress?: string }>;
        primaryEmailAddressId?: string;
        firstName?: string;
        lastName?: string;
      }>;
      deleteUser?: (userId: string) => Promise<unknown>;
    };
  };
  clerk?: unknown;
}

function createAuthTestApp(
  db: Record<string, unknown>,
  options: AuthTestAppOptions = {},
) {
  const user: TestClerkUser =
    options.user ?? {
      userId: null,
      providerUserId: "clerk_test_user",
      authProvider: "clerk",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
    };

  const baseApp = new Elysia().decorate("db", db);
  const appWithClerkClient =
    options.clerkClient ?
      baseApp.decorate("clerkClient", options.clerkClient)
    : baseApp;
  const appWithClerk =
    options.clerk ? appWithClerkClient.decorate("clerk", options.clerk) : appWithClerkClient;
  const scopedApp = appWithClerk as unknown as Elysia;

  return scopedApp
    .derive({ as: "scoped" }, () => ({
      user,
      authenticatedUser:
        Object.prototype.hasOwnProperty.call(options, "authenticatedUser")
          ? options.authenticatedUser ?? null
          : user,
      correlationId: "test-correlation-id",
    }))
    .onError((context: any) => {
      const { code, error, set } = context;
      if (code === "VALIDATION") {
        set.status = 400;
        return {
          success: false,
          code: "VALIDATION_ERROR",
          message: "Input validation failed",
          details: error instanceof Error ? error.message : String(error),
        };
      }

      return handleError(error, set as unknown as { status?: number; headers?: Record<string, string> });
    })
    .use(authRoutes);
}

async function postJson(
  app: { handle: (request: Request) => Response | Promise<Response> },
  path: string,
  payload: unknown,
  headers: Record<string, string> = {},
) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify(payload),
    }),
  );
}

async function getRequest(
  app: { handle: (request: Request) => Response | Promise<Response> },
  path: string,
  headers: Record<string, string> = {},
) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method: "GET",
      headers,
    }),
  );
}

describe("auth routes", () => {
  const fakeDb = { kind: "test-db" };
  const localAuthenticatedUser = {
    userId: 7,
    providerUserId: "7",
    authProvider: "local" as const,
    sessionId: "session-7",
    email: "local@example.com",
    firstName: "Local",
    lastName: "User",
  };
  const clerkAuthenticatedUser = {
    userId: 7,
    providerUserId: "clerk_7",
    authProvider: "clerk" as const,
    email: "clerk@example.com",
    firstName: "Clerk",
    lastName: "User",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    authMode = "local";
    process.env.APP_MODE = "self-hosted";
    process.env.AUTH_MODE = "local";
    process.env.BILLING_MODE = "disabled";
    resetConfigCache();

    safeQueryMock.mockReset();
    safeExecuteMock.mockReset();
    withTransactionMock.mockReset();
    hashPasswordMock.mockReset();
    verifyPasswordMock.mockReset();
    createSessionMock.mockReset();
    deleteAllSessionsExceptMock.mockReset();
    deleteAllUserSessionsMock.mockReset();
    deleteSessionMock.mockReset();
    readSessionTokenFromRequestMock.mockReset();

    safeQueryMock.mockReturnValue(null);
    safeExecuteMock.mockReturnValue({ lastInsertRowid: 0 });
    withTransactionMock.mockImplementation(
      (_db: unknown, callback: () => unknown) => callback(),
    );
    hashPasswordMock.mockResolvedValue("hashed-password");
    verifyPasswordMock.mockResolvedValue(true);
    createSessionMock.mockReturnValue({ token: "new-session-id.secret", sessionId: "new-session-id" });
    readSessionTokenFromRequestMock.mockReturnValue(null);
  });

  describe("POST /api/auth/register", () => {
    it("creates account and session in local mode", async () => {
      safeQueryMock.mockReturnValue(null);
      safeExecuteMock
        .mockReturnValueOnce({ lastInsertRowid: 77 })
        .mockReturnValue({ lastInsertRowid: 0 });

      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/register", {
        email: "new@example.com",
        password: "secure-password",
        firstName: "New",
        lastName: "Person",
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        success: true,
      });
      expect(hashPasswordMock).toHaveBeenCalledWith("secure-password");
      expect(createSessionMock).toHaveBeenCalledWith(
        fakeDb,
        77,
        expect.objectContaining({ ip: null, userAgent: null }),
      );
    });

    it("returns 409 when email exists", async () => {
      safeQueryMock.mockReturnValue({ id: 77 });

      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/register", {
        email: "new@example.com",
        password: "secure-password",
        firstName: "New",
        lastName: "Person",
      });

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        code: "RESOURCE_CONFLICT",
      });
    });

    describe("with ENABLE_SIGNUPS=0", () => {
      beforeEach(() => {
        process.env.ENABLE_SIGNUPS = "0";
        resetConfigCache();
      });

      afterEach(() => {
        delete process.env.ENABLE_SIGNUPS;
        resetConfigCache();
      });

      it("returns 403 once an account exists", async () => {
        safeQueryMock.mockReturnValue({ id: 1 });

        const app = createAuthTestApp(fakeDb);
        const response = await postJson(app, "/api/auth/register", {
          email: "new@example.com",
          password: "secure-password",
          firstName: "New",
          lastName: "Person",
        });

        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toMatchObject({
          message: "Sign-ups are disabled on this server.",
        });
        expect(withTransactionMock).not.toHaveBeenCalled();
      });

      it("still lets the first account register", async () => {
        safeQueryMock.mockReturnValue(null);
        safeExecuteMock
          .mockReturnValueOnce({ lastInsertRowid: 1 })
          .mockReturnValue({ lastInsertRowid: 0 });

        const app = createAuthTestApp(fakeDb);
        const response = await postJson(app, "/api/auth/register", {
          email: "owner@example.com",
          password: "secure-password",
          firstName: "Owner",
          lastName: "Person",
        });

        expect(response.status).toBe(200);
      });
    });

    it("returns 404 outside local auth mode", async () => {
      authMode = "clerk";
      process.env.APP_MODE = "managed";
      process.env.AUTH_MODE = "clerk";
      process.env.BILLING_MODE = "managed";
      resetConfigCache();
      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/register", {
        email: "new@example.com",
        password: "secure-password",
        firstName: "New",
        lastName: "Person",
      });

      expect(response.status).toBe(404);
    });

    it("returns 404 when bearer auth header is used", async () => {
      const app = createAuthTestApp(fakeDb);
      const response = await postJson(
        app,
        "/api/auth/register",
        {
          email: "new@example.com",
          password: "secure-password",
          firstName: "New",
          lastName: "Person",
        },
        { authorization: "Bearer clerk-token" },
      );

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/auth/login", () => {
    it("creates a new session and sets a new cookie without revoking other sessions", async () => {
      safeQueryMock.mockReturnValue({
        id: 5,
        email: "local@example.com",
        password: "stored-hash",
      });

      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/login", {
        email: "local@example.com",
        password: "secure-password",
      });

      expect(response.status).toBe(200);
      expect(verifyPasswordMock).toHaveBeenCalledWith("secure-password", "stored-hash");
      expect(deleteAllUserSessionsMock).not.toHaveBeenCalled();
      expect(createSessionMock).toHaveBeenCalledWith(
        fakeDb,
        5,
        expect.objectContaining({ ip: null, userAgent: null }),
      );
    });

    it("returns empty strings for an account with no stored name", async () => {
      safeQueryMock.mockReturnValue({
        id: 5,
        email: "local@example.com",
        first_name: null,
        last_name: null,
        password: "stored-hash",
      });

      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/login", {
        email: "local@example.com",
        password: "secure-password",
      });

      expect(response.status).toBe(200);
      expect((await response.json()).user).toEqual({
        id: 5,
        email: "local@example.com",
        firstName: "",
        lastName: "",
      });
    });

    it("returns 401 for invalid credentials", async () => {
      safeQueryMock.mockReturnValue({
        id: 5,
        email: "local@example.com",
        password: "stored-hash",
      });
      verifyPasswordMock.mockResolvedValue(false);

      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/login", {
        email: "local@example.com",
        password: "bad-password",
      });

      expect(response.status).toBe(401);
    });

    it("rejects an account with no local password", async () => {
      safeQueryMock.mockReturnValue({
        id: 5,
        email: "clerk@example.com",
        password: null,
      });

      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/login", {
        email: "clerk@example.com",
        password: "any-password",
      });

      expect(response.status).toBe(401);
      expect(createSessionMock).not.toHaveBeenCalled();
    });

    it("returns 404 outside local auth mode", async () => {
      authMode = "clerk";
      process.env.APP_MODE = "managed";
      process.env.AUTH_MODE = "clerk";
      process.env.BILLING_MODE = "managed";
      resetConfigCache();

      const app = createAuthTestApp(fakeDb);
      const response = await postJson(app, "/api/auth/login", {
        email: "local@example.com",
        password: "secure-password",
      });

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("removes current session for authenticated local user", async () => {
      const app = createAuthTestApp(fakeDb, {
        authenticatedUser: localAuthenticatedUser,
      });

      const response = await postJson(app, "/api/auth/logout", {});

      expect(response.status).toBe(200);
      expect(deleteSessionMock).toHaveBeenCalledWith(fakeDb, "session-7");
    });

    it("returns 401 when local session is missing", async () => {
      const app = createAuthTestApp(fakeDb, {
        authenticatedUser: null,
      });

      const response = await postJson(app, "/api/auth/logout", {});

      expect(response.status).toBe(401);
    });

    it("returns 404 for non-local auth provider", async () => {
      const app = createAuthTestApp(fakeDb, {
        authenticatedUser: clerkAuthenticatedUser,
      });

      const response = await postJson(app, "/api/auth/logout", {});

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/auth/logout-all", () => {
    it("removes all sessions for authenticated local user", async () => {
      const app = createAuthTestApp(fakeDb, {
        authenticatedUser: localAuthenticatedUser,
      });

      const response = await postJson(app, "/api/auth/logout-all", {});

      expect(response.status).toBe(200);
      expect(deleteAllUserSessionsMock).toHaveBeenCalledWith(fakeDb, 7);
    });
  });

  describe("GET /api/auth/session", () => {
    it("returns authenticated session details in local mode", async () => {
      safeQueryMock.mockReturnValue({
        id: 7,
        email: "local@example.com",
        first_name: "Local",
        last_name: "User",
      });

      const app = createAuthTestApp(fakeDb, {
        authenticatedUser: localAuthenticatedUser,
      });

      const response = await getRequest(app, "/api/auth/session");

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        authenticated: true,
        user: {
          id: 7,
          email: "local@example.com",
          firstName: "Local",
          lastName: "User",
        },
      });
    });

    it("returns unauthenticated payload in clerk mode", async () => {
      authMode = "clerk";
      process.env.APP_MODE = "managed";
      process.env.AUTH_MODE = "clerk";
      process.env.BILLING_MODE = "managed";
      resetConfigCache();
      const app = createAuthTestApp(fakeDb);

      const response = await getRequest(app, "/api/auth/session");

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        authenticated: false,
        user: null,
      });
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("updates password and rotates session", async () => {
      safeQueryMock.mockReturnValue({ password: "stored-hash" });

      const app = createAuthTestApp(fakeDb, {
        authenticatedUser: localAuthenticatedUser,
      });

      const response = await postJson(app, "/api/auth/change-password", {
        currentPassword: "old-password",
        newPassword: "new-password-123",
      });

      expect(response.status).toBe(200);
      expect(verifyPasswordMock).toHaveBeenCalledWith("old-password", "stored-hash");
      expect(deleteAllUserSessionsMock).toHaveBeenCalledWith(fakeDb, 7);
      expect(createSessionMock).toHaveBeenCalledWith(
        fakeDb,
        7,
        expect.objectContaining({ ip: null, userAgent: null }),
      );
      expect(deleteAllSessionsExceptMock).toHaveBeenCalledWith(fakeDb, 7, "new-session-id");
      expect(deleteSessionMock).toHaveBeenCalledWith(fakeDb, "session-7");
    });

    it("returns 401 when current password is invalid", async () => {
      safeQueryMock.mockReturnValue({ password: "stored-hash" });
      verifyPasswordMock.mockResolvedValue(false);

      const app = createAuthTestApp(fakeDb, {
        authenticatedUser: localAuthenticatedUser,
      });

      const response = await postJson(app, "/api/auth/change-password", {
        currentPassword: "wrong-password",
        newPassword: "new-password-123",
      });

      expect(response.status).toBe(401);
    });

    it("rejects an account with no local password", async () => {
      safeQueryMock.mockReturnValue({ password: null });

      const app = createAuthTestApp(fakeDb, {
        authenticatedUser: localAuthenticatedUser,
      });

      const response = await postJson(app, "/api/auth/change-password", {
        currentPassword: "any-password",
        newPassword: "new-password-123",
      });

      expect(response.status).toBe(401);
      expect(safeExecuteMock).not.toHaveBeenCalled();
    });

    it("returns 404 for non-local provider", async () => {
      const app = createAuthTestApp(fakeDb, {
        authenticatedUser: clerkAuthenticatedUser,
      });

      const response = await postJson(app, "/api/auth/change-password", {
        currentPassword: "old-password",
        newPassword: "new-password-123",
      });

      expect(response.status).toBe(404);
    });
  });

  describe("session freshness helpers", () => {
    it("isSessionFresh returns true for recent timestamps", async () => {
      const { isSessionFresh } = await import("../../../src/modules/auth/routes");
      const recentTimestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      expect(isSessionFresh(recentTimestamp)).toBe(true);
    });

    it("isSessionFresh returns false for stale timestamps", async () => {
      const { isSessionFresh } = await import("../../../src/modules/auth/routes");
      const staleTimestamp = new Date(
        Date.now() - 31 * 24 * 60 * 60 * 1000,
      ).toISOString();

      expect(isSessionFresh(staleTimestamp)).toBe(false);
    });

    it("isSessionFresh returns false for invalid timestamps", async () => {
      const { isSessionFresh } = await import("../../../src/modules/auth/routes");

      expect(isSessionFresh("not-a-date")).toBe(false);
    });
  });

  describe("clearCurrentSession", () => {
    it("deletes session when request contains mt_session cookie", async () => {
      const { clearCurrentSession } = await import("../../../src/modules/auth/routes");
      readSessionTokenFromRequestMock.mockReturnValueOnce("session-id.secret");
      const request = new Request("http://localhost/api/auth/logout", {
        headers: {
          cookie: "mt_session=session-id.secret",
        },
      });

      clearCurrentSession(fakeDb as unknown as import("bun:sqlite").Database, request);

      expect(deleteSessionMock).toHaveBeenCalledWith(fakeDb, "session-id");
    });

    it("no-ops when cookie is missing", async () => {
      const { clearCurrentSession } = await import("../../../src/modules/auth/routes");
      const request = new Request("http://localhost/api/auth/logout");

      clearCurrentSession(fakeDb as unknown as import("bun:sqlite").Database, request);

      expect(deleteSessionMock).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/clerk-sync", () => {
    beforeEach(() => {
      authMode = "clerk";
      process.env.APP_MODE = "managed";
      process.env.AUTH_MODE = "clerk";
      process.env.BILLING_MODE = "managed";
      resetConfigCache();
    });

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
          providerUserId: "clerk_new_user",
          authProvider: "clerk",
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
        ["new-user@example.com", "New", "User", "clerk_new_user"],
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
          providerUserId: "clerk_existing",
          authProvider: "clerk",
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
      const deleteUserMock = vi.fn(async () => undefined);

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
          providerUserId: "clerk_new_conflict",
          authProvider: "clerk",
          email: "existing@example.com",
          firstName: "New",
          lastName: "Conflict",
        },
        clerkClient: {
          users: {
            deleteUser: deleteUserMock,
          },
        },
      });

      const response = await postJson(app, "/api/auth/clerk-sync", {});

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        code: "ACCOUNT_LINK_REQUIRED",
      });
      expect(deleteUserMock).toHaveBeenCalledWith("clerk_new_conflict");
      expect(safeExecuteMock).not.toHaveBeenCalled();
    });

    it("still returns account link required when transient cleanup fails", async () => {
      const deleteUserMock = vi.fn(async () => {
        throw new Error("cleanup failed");
      });

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
            id: 99,
            clerk_id: "clerk_existing_owner",
            email: "existing@example.com",
          };
        }

        return null;
      });

      const app = createAuthTestApp(fakeDb, {
        user: {
          userId: null,
          providerUserId: "clerk_conflict_cleanup_error",
          authProvider: "clerk",
          email: "existing@example.com",
          firstName: "Cleanup",
          lastName: "Failure",
        },
        clerkClient: {
          users: {
            deleteUser: deleteUserMock,
          },
        },
      });

      const response = await postJson(app, "/api/auth/clerk-sync", {});

      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        code: "ACCOUNT_LINK_REQUIRED",
      });
      expect(deleteUserMock).toHaveBeenCalledWith("clerk_conflict_cleanup_error");
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
          providerUserId: "clerk_fallback",
          authProvider: "clerk",
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

    it("returns 404 when clerk sync route is called in local mode", async () => {
      authMode = "local";
      process.env.APP_MODE = "self-hosted";
      process.env.AUTH_MODE = "local";
      process.env.BILLING_MODE = "disabled";
      resetConfigCache();
      const app = createAuthTestApp(fakeDb);

      const response = await postJson(app, "/api/auth/clerk-sync", {});

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("POST /api/auth/google-native", () => {
    const createSignInTokenMock = vi.fn();
    const clerk = { signInTokens: { createSignInToken: createSignInTokenMock } };
    const identity = { sub: "google-sub-1", email: "player@gmail.com" };

    beforeEach(() => {
      process.env.APP_MODE = "managed";
      process.env.AUTH_MODE = "clerk";
      process.env.BILLING_MODE = "managed";
      process.env.GOOGLE_WEB_CLIENT_ID = "web-client";
      process.env.GOOGLE_ANDROID_CLIENT_IDS = "debug-client, play-client";
      resetConfigCache();
      verifyGoogleIdTokenMock.mockReset().mockResolvedValue(identity);
      findClerkUserForGoogleMock.mockReset().mockResolvedValue("user_owner");
      createSignInTokenMock.mockReset().mockResolvedValue({ token: "ticket_1" });
    });

    afterEach(() => {
      delete process.env.GOOGLE_WEB_CLIENT_ID;
      delete process.env.GOOGLE_ANDROID_CLIENT_IDS;
    });

    it("issues a short-lived ticket for the linked account", async () => {
      const app = createAuthTestApp(fakeDb, { clerk });

      const response = await postJson(app, "/api/auth/google-native", { idToken: "token" });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ ticket: "ticket_1" });
      expect(verifyGoogleIdTokenMock).toHaveBeenCalledWith("token", {
        webClientId: "web-client",
        androidClientIds: ["debug-client", "play-client"],
      });
      expect(createSignInTokenMock).toHaveBeenCalledWith({
        userId: "user_owner",
        expiresInSeconds: 60,
      });
    });

    it("returns no ticket when no account has this Google login", async () => {
      findClerkUserForGoogleMock.mockResolvedValue(null);
      const app = createAuthTestApp(fakeDb, { clerk });

      const response = await postJson(app, "/api/auth/google-native", { idToken: "token" });

      await expect(response.json()).resolves.toEqual({ ticket: null });
      expect(createSignInTokenMock).not.toHaveBeenCalled();
    });

    it("refuses a token that does not verify", async () => {
      verifyGoogleIdTokenMock.mockResolvedValue(null);
      const app = createAuthTestApp(fakeDb, { clerk });

      const response = await postJson(app, "/api/auth/google-native", { idToken: "token" });

      expect(response.status).toBe(401);
      expect(createSignInTokenMock).not.toHaveBeenCalled();
    });

    it("is not found until both client IDs are configured", async () => {
      delete process.env.GOOGLE_ANDROID_CLIENT_IDS;
      resetConfigCache();
      const app = createAuthTestApp(fakeDb, { clerk });

      const response = await postJson(app, "/api/auth/google-native", { idToken: "token" });

      expect(response.status).toBe(404);
      expect(verifyGoogleIdTokenMock).not.toHaveBeenCalled();
    });
  });
});
