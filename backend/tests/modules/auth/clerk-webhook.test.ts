import { Elysia } from "elysia";
import { Webhook } from "svix";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetConfigCache } from "../../../src/config";

const safeQueryMock = vi.fn();
const safeExecuteMock = vi.fn();

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

const WEBHOOK_SECRET = `whsec_${Buffer.from("macrotrackr-clerk-webhook-secret").toString("base64")}`;
const OTHER_SECRET = `whsec_${Buffer.from("some-other-clerk-webhook-secret").toString("base64")}`;
const MESSAGE_ID = "msg_test_1";
const fakeDb = { kind: "test-db" };

const userCreated: ClerkWebhookEvent = {
  object: "event",
  type: "user.created",
  data: {
    id: "clerk_linked",
    first_name: "Updated",
    last_name: "Person",
    primary_email_address_id: "email_primary",
    email_addresses: [{ id: "email_primary", email_address: "updated@example.com" }],
  },
};

const userUpdated: ClerkWebhookEvent = {
  object: "event",
  type: "user.updated",
  data: {
    id: "clerk_primary",
    first_name: "Renamed",
    last_name: "Primary",
    primary_email_address_id: "email_primary",
    email_addresses: [{ id: "email_primary", email_address: "renamed@example.com" }],
  },
};

const userDeleted: ClerkWebhookEvent = {
  object: "event",
  type: "user.deleted",
  data: { id: "clerk_delete_me" },
};

const handledEvents = [userCreated, userUpdated, userDeleted];

function createWebhookApp(db?: Record<string, unknown>) {
  const baseApp = new Elysia();
  const appWithDatabase = db ? baseApp.decorate("db", db) : baseApp;

  return appWithDatabase.use(clerkWebhookHandler);
}

function signedHeaders(
  payload: string,
  { secret = WEBHOOK_SECRET, sentAt = new Date() }: { secret?: string; sentAt?: Date } = {},
) {
  return {
    "svix-id": MESSAGE_ID,
    "svix-timestamp": String(Math.floor(sentAt.getTime() / 1000)),
    "svix-signature": new Webhook(secret).sign(MESSAGE_ID, sentAt, payload),
  };
}

function postWebhook(body: string, headers: Record<string, string>, db = fakeDb) {
  return createWebhookApp(db).handle(
    new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body,
    }),
  );
}

function postSignedEvent(event: ClerkWebhookEvent) {
  const payload = JSON.stringify(event);
  return postWebhook(payload, signedHeaders(payload));
}

async function expectRejected(response: Response) {
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toEqual({
    success: false,
    message: "Unauthorized",
  });
  expect(safeQueryMock).not.toHaveBeenCalled();
  expect(safeExecuteMock).not.toHaveBeenCalled();
}

describe("clerk webhook handler", () => {
  beforeEach(() => {
    safeQueryMock.mockReset();
    safeExecuteMock.mockReset();

    process.env.NODE_ENV = "test";
    process.env.APP_MODE = "self-hosted";
    process.env.AUTH_MODE = "local";
    process.env.BILLING_MODE = "disabled";
    process.env.APP_URL = "http://localhost:5173";
    process.env.SUPPORT_EMAIL = "support@local.invalid";
    process.env.CLERK_PUBLISHABLE_KEY = "pk_test_placeholder";
    process.env.CLERK_SECRET_KEY = "sk_test_placeholder";
    process.env.CLERK_WEBHOOK_SECRET = WEBHOOK_SECRET;
    resetConfigCache();
  });

  afterEach(() => {
    resetConfigCache();
  });

  it("returns 500 when database is missing from route context", async () => {
    const response = await createWebhookApp().handle(
      new Request("http://localhost/api/webhooks/clerk", {
        method: "POST",
        body: JSON.stringify(userCreated),
        headers: signedHeaders(JSON.stringify(userCreated)),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Database not available",
    });
  });

  it("returns 500 when Clerk webhook secret is not configured", async () => {
    delete process.env.CLERK_WEBHOOK_SECRET;
    resetConfigCache();

    const response = await postSignedEvent(userCreated);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Clerk webhook secret is not configured",
    });
    expect(safeQueryMock).not.toHaveBeenCalled();
  });

  it("rejects a request without Svix headers", async () => {
    await expectRejected(await postWebhook(JSON.stringify(userCreated), {}));
  });

  describe.each(handledEvents.map((event) => [event.type, event] as const))(
    "%s signature verification",
    (_type, event) => {
      it("rejects a tampered body", async () => {
        const payload = JSON.stringify(event);
        const tampered = JSON.stringify({ ...event, data: { ...event.data, id: "clerk_attacker" } });

        await expectRejected(await postWebhook(tampered, signedHeaders(payload)));
      });

      it("rejects a signature made with the wrong secret", async () => {
        const payload = JSON.stringify(event);

        await expectRejected(
          await postWebhook(payload, signedHeaders(payload, { secret: OTHER_SECRET })),
        );
      });

      it("rejects a timestamp older than the 5 minute tolerance", async () => {
        const payload = JSON.stringify(event);
        const sentAt = new Date(Date.now() - 6 * 60 * 1000);

        await expectRejected(await postWebhook(payload, signedHeaders(payload, { sentAt })));
      });

      it("rejects a timestamp more than 5 minutes in the future", async () => {
        const payload = JSON.stringify(event);
        const sentAt = new Date(Date.now() + 6 * 60 * 1000);

        await expectRejected(await postWebhook(payload, signedHeaders(payload, { sentAt })));
      });
    },
  );

  it("verifies the exact raw body rather than re-serialised JSON", async () => {
    safeQueryMock.mockReturnValue({ id: 77 });
    const payload = `{\n  "type": "user.deleted",\n  "object": "event",\n  "data": { "id": "clerk_delete_me" }\n}`;

    const response = await postWebhook(payload, signedHeaders(payload));

    expect(response.status).toBe(200);
    expect(safeExecuteMock).toHaveBeenCalledWith(fakeDb, "DELETE FROM users WHERE id = ?", [77]);
  });

  it("accepts a timestamp within the 5 minute tolerance", async () => {
    safeQueryMock.mockReturnValue({ id: 77 });
    const payload = JSON.stringify(userDeleted);
    const sentAt = new Date(Date.now() - 4 * 60 * 1000);

    const response = await postWebhook(payload, signedHeaders(payload, { sentAt }));

    expect(response.status).toBe(200);
    expect(safeExecuteMock).toHaveBeenCalledWith(fakeDb, "DELETE FROM users WHERE id = ?", [77]);
  });

  it("updates names for linked users on signed user.created events", async () => {
    safeQueryMock.mockReturnValue({ id: 101 });

    const response = await postSignedEvent(userCreated);

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

  it("does not mutate users for unlinked signed user.created events", async () => {
    safeQueryMock.mockReturnValue(null);

    const response = await postSignedEvent(userCreated);

    expect(response.status).toBe(200);
    expect(safeExecuteMock).not.toHaveBeenCalled();
  });

  it("updates email and names for linked users on signed user.updated events", async () => {
    safeQueryMock.mockImplementation((_db: unknown, query: string) =>
      query === "SELECT id FROM users WHERE clerk_id = ?" ? { id: 11 } : null,
    );

    const response = await postSignedEvent(userUpdated);

    expect(response.status).toBe(200);
    expect(safeExecuteMock).toHaveBeenCalledWith(
      fakeDb,
      "UPDATE users SET email = ?, first_name = ?, last_name = ? WHERE clerk_id = ?",
      ["renamed@example.com", "Renamed", "Primary", "clerk_primary"],
    );
  });

  it("keeps existing email on signed user.updated when the new email belongs to another account", async () => {
    safeQueryMock.mockImplementation((_db: unknown, query: string) =>
      query === "SELECT id FROM users WHERE clerk_id = ?" ? { id: 11 } : { id: 22 },
    );

    const response = await postSignedEvent(userUpdated);

    expect(response.status).toBe(200);
    expect(safeExecuteMock).toHaveBeenCalledTimes(1);
    expect(safeExecuteMock).toHaveBeenCalledWith(
      fakeDb,
      "UPDATE users SET first_name = ?, last_name = ? WHERE clerk_id = ?",
      ["Renamed", "Primary", "clerk_primary"],
    );
  });

  it("deletes linked users on signed user.deleted events", async () => {
    safeQueryMock.mockReturnValue({ id: 77 });

    const response = await postSignedEvent(userDeleted);

    expect(response.status).toBe(200);
    expect(safeExecuteMock).toHaveBeenCalledWith(fakeDb, "DELETE FROM users WHERE id = ?", [77]);
  });
});
