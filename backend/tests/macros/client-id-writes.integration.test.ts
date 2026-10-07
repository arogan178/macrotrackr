import { beforeEach, describe, expect, it } from "bun:test";
import { Database } from "bun:sqlite";
import { Elysia } from "elysia";

import { initializeSchema } from "../../src/db/schema";
import { handleError } from "../../src/lib/http/responses";
import { macroRoutes } from "../../src/modules/macros/routes";

const ENTRY_ID = "6f1c2b9e-4d3a-4f8e-9b7c-1a2b3c4d5e6f";

const entry = {
  protein: 30,
  carbs: 40,
  fats: 10,
  mealType: "lunch",
  mealName: "Rice bowl",
  entryDate: "2026-10-01",
  entryTime: "12:30",
  clientId: ENTRY_ID,
  clientUpdatedAt: 1000,
};

describe("macro entry writes keyed by clientId", () => {
  let db: Database;
  let apps: Record<number, Elysia>;

  const send = async (
    userId: number,
    method: string,
    path: string,
    body?: unknown,
  ) => {
    const response = await apps[userId]!.handle(
      new Request(`http://localhost/api/macros${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
    const text = await response.text();
    return {
      status: response.status,
      body: (response.ok ? JSON.parse(text) : text) as Record<string, unknown>,
    };
  };

  const rows = () =>
    db
      .query(
        "SELECT id, user_id, protein, meal_name, client_id, client_updated_at FROM macro_entries ORDER BY id",
      )
      .all();

  beforeEach(() => {
    db = new Database(":memory:");
    initializeSchema(db);
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'user_1'),
             (2, 'Other', 'User', 'other@example.com', 'user_2');
    `);
    const mount = (userId: number) =>
      new Elysia()
        .decorate("db", db)
        .derive(() => ({ authenticatedUser: { userId } }))
        .onError(({ error, set }) => handleError(error, set))
        .use(macroRoutes) as unknown as Elysia;
    apps = { 1: mount(1), 2: mount(2) };
  });

  it("stores one row when the same create arrives twice", async () => {
    const first = await send(1, "POST", "/", entry);
    const repeat = await send(1, "POST", "/", entry);

    expect(first.status).toBe(200);
    expect(repeat.status).toBe(200);
    expect(repeat.body.id).toBe(first.body.id);
    expect(repeat.body.clientId).toBe(ENTRY_ID);
    expect(rows()).toEqual([
      { id: 1, user_id: 1, protein: 30, meal_name: "Rice bowl", client_id: ENTRY_ID, client_updated_at: 1000 },
    ]);
  });

  it("returns the edited row when a create is retried after an edit", async () => {
    await send(1, "POST", "/", entry);
    await send(1, "PUT", `/by-client-id/${ENTRY_ID}`, { ...entry, protein: 45, clientUpdatedAt: 2000 });

    const retry = await send(1, "POST", "/", entry);

    expect(retry.body.protein).toBe(45);
    expect(retry.body.clientUpdatedAt).toBe(2000);
    expect(rows()).toEqual([
      { id: 1, user_id: 1, protein: 45, meal_name: "Rice bowl", client_id: ENTRY_ID, client_updated_at: 2000 },
    ]);
  });

  it("applies a repeated edit once", async () => {
    await send(1, "POST", "/", entry);
    const edit = { ...entry, protein: 45, mealName: "Bigger bowl", clientUpdatedAt: 2000 };

    const first = await send(1, "PUT", `/by-client-id/${ENTRY_ID}`, edit);
    const repeat = await send(1, "PUT", `/by-client-id/${ENTRY_ID}`, edit);

    expect(first.status).toBe(200);
    expect(repeat.status).toBe(200);
    expect(repeat.body.protein).toBe(45);
    expect(rows()).toEqual([
      { id: 1, user_id: 1, protein: 45, meal_name: "Bigger bowl", client_id: ENTRY_ID, client_updated_at: 2000 },
    ]);
  });

  it("ignores an older edit that arrives after a newer one", async () => {
    await send(1, "POST", "/", entry);
    await send(1, "PUT", `/by-client-id/${ENTRY_ID}`, { ...entry, protein: 50, clientUpdatedAt: 3000 });

    const stale = await send(1, "PUT", `/by-client-id/${ENTRY_ID}`, { ...entry, protein: 45, clientUpdatedAt: 2000 });

    expect(stale.status).toBe(200);
    expect(stale.body.protein).toBe(50);
    expect(rows()).toEqual([
      { id: 1, user_id: 1, protein: 50, meal_name: "Rice bowl", client_id: ENTRY_ID, client_updated_at: 3000 },
    ]);
  });

  it("succeeds when deleting an entry that is already gone", async () => {
    await send(1, "POST", "/", entry);

    const first = await send(1, "DELETE", `/by-client-id/${ENTRY_ID}`);
    const repeat = await send(1, "DELETE", `/by-client-id/${ENTRY_ID}`);

    expect(first).toEqual({ status: 200, body: { success: true, clientId: ENTRY_ID } });
    expect(repeat).toEqual({ status: 200, body: { success: true, clientId: ENTRY_ID } });
    expect(rows()).toEqual([]);
  });

  it("keeps two accounts that use the same clientId apart", async () => {
    await send(1, "POST", "/", entry);
    await send(2, "POST", "/", { ...entry, protein: 5 });

    expect(rows()).toEqual([
      { id: 1, user_id: 1, protein: 30, meal_name: "Rice bowl", client_id: ENTRY_ID, client_updated_at: 1000 },
      { id: 2, user_id: 2, protein: 5, meal_name: "Rice bowl", client_id: ENTRY_ID, client_updated_at: 1000 },
    ]);
  });

  it("does not let another account edit or delete your entry", async () => {
    await send(1, "POST", "/", entry);

    const edit = await send(2, "PUT", `/by-client-id/${ENTRY_ID}`, { ...entry, protein: 99, clientUpdatedAt: 9000 });
    await send(2, "DELETE", `/by-client-id/${ENTRY_ID}`);

    expect(edit.status).toBe(404);
    expect(rows()).toEqual([
      { id: 1, user_id: 1, protein: 30, meal_name: "Rice bowl", client_id: ENTRY_ID, client_updated_at: 1000 },
    ]);
  });

  it("gives entries from older clients a clientId of their own", async () => {
    const { clientId: _clientId, clientUpdatedAt: _version, ...legacy } = entry;

    const created = await send(1, "POST", "/", legacy);

    expect(created.body.clientId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(created.body.clientUpdatedAt).toBeNull();
  });
});
