import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { Elysia } from "elysia";

mock.module("../../src/lib/sync/eventBus", () => ({
  publishUserSyncEvent: () => {},
}));

import { initializeSchema } from "../../src/db/schema";
import { handleError } from "../../src/lib/http/responses";
import { goalRoutes } from "../../src/modules/goals/routes";

describe("PUT /api/goals/weight-log/:id", () => {
  let db: Database;
  let app: Elysia;

  const profileWeight = () =>
    (
      db.query("SELECT weight FROM user_details WHERE user_id = 1").get() as {
        weight: number;
      }
    ).weight;

  const updateEntry = (id: string, body: Record<string, unknown>) =>
    app.handle(
      new Request(`http://localhost/api/goals/weight-log/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

  beforeAll(() => {
    db = new Database(":memory:");
    initializeSchema(db);
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk'),
             (2, 'Other', 'User', 'other@example.com', 'hash', 'other_clerk');
      INSERT INTO user_details (user_id, weight) VALUES (1, 78), (2, 90);
      INSERT INTO weight_log (id, user_id, timestamp, weight) VALUES
        ('older', 1, '2026-09-01T08:00:00.000Z', 82),
        ('newest', 1, '2026-09-20T08:00:00.000Z', 78),
        ('someone-else', 2, '2026-09-21T08:00:00.000Z', 90);
    `);

    app = new Elysia()
      .decorate("db", db)
      .derive(() => ({ authenticatedUser: { userId: 1 } }))
      .onError(({ error, set }) => handleError(error, set))
      .use(goalRoutes) as unknown as Elysia;
  });

  afterAll(() => {
    db.close();
  });

  it("changes the weight and keeps the profile on the newest entry", async () => {
    const response = await updateEntry("newest", { weight: 77.5 });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "newest",
      timestamp: "2026-09-20T08:00:00.000Z",
      weight: 77.5,
    });
    expect(profileWeight()).toBe(77.5);

    expect((await updateEntry("older", { weight: 81 })).status).toBe(200);
    expect(profileWeight()).toBe(77.5);
  });

  it("follows the newest entry when a timestamp moves", async () => {
    expect(
      (await updateEntry("older", { timestamp: "2026-09-22T08:00:00.000Z" }))
        .status,
    ).toBe(200);
    expect(profileWeight()).toBe(81);

    expect(
      (await updateEntry("older", { timestamp: "2026-09-01T08:00:00.000Z" }))
        .status,
    ).toBe(200);
    expect(profileWeight()).toBe(77.5);
  });

  it("does not touch another user's entry", async () => {
    expect((await updateEntry("someone-else", { weight: 50 })).status).toBe(
      404,
    );
    const entry = db
      .query("SELECT weight FROM weight_log WHERE id = 'someone-else'")
      .get();
    expect(entry).toEqual({ weight: 90 });
  });

  it("rejects an update with nothing to change", async () => {
    expect((await updateEntry("newest", {})).status).toBe(400);
  });
});
