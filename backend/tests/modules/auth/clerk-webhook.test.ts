import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetConfigCache } from "../../../src/config";

const verifyWebhookMock = vi.fn();
const safeQueryMock = vi.fn();
const safeExecuteMock = vi.fn();

vi.mock("svix", () => {
  class MockWebhookVerificationError extends Error {}

  class MockWebhook {
    constructor(_secret: string) {}

    verify(payload: string, headers: Record<string, string>) {
      return verifyWebhookMock(payload, headers);
    }
  }

  return {
    WebhookVerificationError: MockWebhookVerificationError,
    Webhook: MockWebhook,
  };
});

vi.mock("../../../src/lib/data/database", () => ({
  safeQuery: (...arguments_: unknown[]) => safeQueryMock(...arguments_),
  safeExecute: (...arguments_: unknown[]) => safeExecuteMock(...arguments_),
}));

import { clerkWebhookHandler } from "../../../src/modules/auth/clerk-webhook";

type ClerkWebhookEvent = {
  data: {
    id: string;
    email_addresses?: Array<{ id?: string; email_address: string }>;
    primary_email_address_id?: string;
    first_name?: string;
    last_name?: string;
  };
  object: string;
  type: string;
};

function createWebhookApp(db?: Record<string, unknown>) {
  const baseApp = new Elysia();
  const appWithDatabase = db ? baseApp.decorate("db", db) : baseApp;

  return appWithDatabase.use(clerkWebhookHandler);
}

async function postWebhookEvent(
  app: ReturnType<typeof createWebhookApp>,
  event: ClerkWebhookEvent,
  headers: Record<string, string> = {},
) {
  return app.handle(
    new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "svix-id": "msg_test_1",
        "svix-timestamp": "1700000000",
        "svix-signature": "v1,test-signature",
        ...headers,
      },
      body: JSON.stringify(event),
    }),
  );
}

describe("clerk webhook handler", () => {
  const fakeDb = { kind: "test-db" };

  beforeEach(() => {
    verifyWebhookMock.mockReset();
    safeQueryMock.mockReset();
    safeExecuteMock.mockReset();

    vi.stubEnv("CLERK_WEBHOOK_SECRET", "test_webhook_secret_placeholder");
    resetConfigCache();
  });

  afterEach(() => {
    resetConfigCache();
    vi.unstubAllEnvs();
  });

  it("returns 500 when database is missing from route context", async () => {
    const app = createWebhookApp();

    const response = await postWebhookEvent(app, {
      object: "event",
      type: "user.created",
      data: {
        id: "clerk_missing_db",
      },
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Database not available",
    });
    expect(verifyWebhookMock).not.toHaveBeenCalled();
  });

  it("returns 500 when Clerk webhook secret is not configured", async () => {
    delete process.env.CLERK_WEBHOOK_SECRET;
    resetConfigCache();

    const app = createWebhookApp(fakeDb);
    const response = await postWebhookEvent(app, {
      object: "event",
      type: "user.created",
      data: {
        id: "clerk_no_secret",
      },
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Clerk webhook secret is not configured",
    });
    expect(verifyWebhookMock).not.toHaveBeenCalled();
  });

  it("returns 400 when Svix signature verification fails", async () => {
    verifyWebhookMock.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    const app = createWebhookApp(fakeDb);
    const response = await postWebhookEvent(app, {
      object: "event",
      type: "user.created",
      data: {
        id: "clerk_invalid_signature",
      },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Unauthorized",
    });
    expect(verifyWebhookMock).toHaveBeenCalledTimes(1);
  });

  it("updates names for linked users on user.created events", async () => {
    safeQueryMock.mockReturnValue({ id: 101 });

    verifyWebhookMock.mockReturnValue({
      object: "event",
      type: "user.created",
      data: {
        id: "clerk_linked",
        first_name: "Updated",
        last_name: "Person",
        primary_email_address_id: "email_primary",
        email_addresses: [
          {
            id: "email_primary",
            email_address: "updated@example.com",
          },
        ],
      },
    } satisfies ClerkWebhookEvent);

    const app = createWebhookApp(fakeDb);
    const response = await postWebhookEvent(app, {
      object: "event",
      type: "placeholder",
      data: {
        id: "unused",
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: "Webhook processed successfully",
    });

    expect(safeExecuteMock).toHaveBeenCalledWith(
      fakeDb,
      "UPDATE users SET first_name = ?, last_name = ? WHERE id = ?",
      ["Updated", "Person", 101],
    );
  });

  it("does not mutate users for unlinked user.created events", async () => {
    safeQueryMock.mockReturnValue(null);

    verifyWebhookMock.mockReturnValue({
      object: "event",
      type: "user.created",
      data: {
        id: "clerk_unlinked",
        first_name: "No",
        last_name: "Link",
        email_addresses: [
          {
            email_address: "unlinked@example.com",
          },
        ],
      },
    } satisfies ClerkWebhookEvent);

    const app = createWebhookApp(fakeDb);
    const response = await postWebhookEvent(app, {
      object: "event",
      type: "placeholder",
      data: {
        id: "unused",
      },
    });

    expect(response.status).toBe(200);
    expect(safeExecuteMock).not.toHaveBeenCalled();
  });

  it("keeps existing email on user.updated when the new email belongs to another account", async () => {
    safeQueryMock.mockImplementation((_db: unknown, query: string) => {
      if (query.includes("SELECT id FROM users WHERE clerk_id = ?")) {
        return { id: 11 };
      }

      if (
        query.includes(
          "SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND (clerk_id IS NULL OR clerk_id != ?)",
        )
      ) {
        return { id: 22 };
      }

      return null;
    });

    verifyWebhookMock.mockReturnValue({
      object: "event",
      type: "user.updated",
      data: {
        id: "clerk_primary",
        first_name: "Renamed",
        last_name: "Primary",
        primary_email_address_id: "email_primary",
        email_addresses: [
          {
            id: "email_primary",
            email_address: "conflict@example.com",
          },
        ],
      },
    } satisfies ClerkWebhookEvent);

    const app = createWebhookApp(fakeDb);
    const response = await postWebhookEvent(app, {
      object: "event",
      type: "placeholder",
      data: {
        id: "unused",
      },
    });

    expect(response.status).toBe(200);
    expect(safeExecuteMock).toHaveBeenCalledWith(
      fakeDb,
      "UPDATE users SET first_name = ?, last_name = ? WHERE clerk_id = ?",
      ["Renamed", "Primary", "clerk_primary"],
    );
  });

  it("deletes linked users on user.deleted events", async () => {
    safeQueryMock.mockReturnValue({ id: 77 });

    verifyWebhookMock.mockReturnValue({
      object: "event",
      type: "user.deleted",
      data: {
        id: "clerk_delete_me",
      },
    } satisfies ClerkWebhookEvent);

    const app = createWebhookApp(fakeDb);
    const response = await postWebhookEvent(app, {
      object: "event",
      type: "placeholder",
      data: {
        id: "unused",
      },
    });

    expect(response.status).toBe(200);
    expect(safeExecuteMock).toHaveBeenCalledWith(
      fakeDb,
      "DELETE FROM users WHERE id = ?",
      [77],
    );
  });
});
