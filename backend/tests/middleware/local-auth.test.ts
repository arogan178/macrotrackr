import { Elysia } from "elysia";
import { afterEach, describe, expect, it, vi } from "vitest";

const resolveSessionMock = vi.fn();

vi.mock("../../src/lib/auth/session", () => ({
  resolveSession: (...arguments_: unknown[]) => resolveSessionMock(...arguments_),
}));

import {
  isLocalAuthExemptPath,
  localAuthMiddleware,
} from "../../src/middleware/local-auth";

describe("local auth middleware", () => {
  afterEach(() => {
    resolveSessionMock.mockReset();
  });

  it("marks /api/auth/session as exempt", () => {
    expect(isLocalAuthExemptPath("/api/auth/session")).toBe(true);
  });

  it("exposes authenticatedUser on exempt session route when cookie session exists", async () => {
    resolveSessionMock.mockReturnValue({
      sessionId: "session-id",
      userId: 7,
      user: {
        id: 7,
        email: "local@example.com",
        first_name: "Local",
        last_name: "User",
      },
    });

    const app = new Elysia()
      .decorate("db", {} as Record<string, never>)
      .use(localAuthMiddleware)
      .get("/api/auth/session", ({ authenticatedUser }) => ({
        authenticated: Boolean(authenticatedUser?.userId),
        userId: authenticatedUser?.userId ?? null,
      }));

    const response = await app.handle(
      new Request("http://localhost/api/auth/session", {
        headers: {
          cookie: "mt_session=session-id.secret",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      authenticated: true,
      userId: 7,
    });
  });

  it("rejects protected routes when no local session exists", async () => {
    resolveSessionMock.mockReturnValue(null);

    const app = new Elysia()
      .decorate("db", {} as Record<string, never>)
      .use(localAuthMiddleware)
      .get("/api/protected", () => ({ ok: true }));

    const response = await app.handle(
      new Request("http://localhost/api/protected"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
