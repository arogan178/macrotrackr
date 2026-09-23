import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { Elysia } from "elysia";

mock.module("../../src/lib/sync/eventBus", () => ({
  publishUserSyncEvent: () => {},
}));

import { initializeSchema } from "../../src/db/schema";
import { goalRoutes } from "../../src/modules/goals/routes";

describe("POST /api/goals/weight-log", () => {
  let db: Database;
  let app: Elysia;

  const profileWeight = () =>
    (
      db.query("SELECT weight FROM user_details WHERE user_id = 1").get() as {
        weight: number;
      }
    ).weight;

  const logWeight = (timestamp: string, weight: number) =>
    app.handle(
      new Request("http://localhost/api/goals/weight-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestamp, weight }),
      }),
    );

  beforeAll(() => {
    db = new Database(":memory:");
    initializeSchema(db);
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk');
      INSERT INTO user_details (user_id, weight) VALUES (1, 80);
    `);

    app = new Elysia()
      .decorate("db", db)
      .derive(() => ({ authenticatedUser: { userId: 1 } }))
      .use(goalRoutes) as unknown as Elysia;
  });

  afterAll(() => {
    db.close();
  });

  it("keeps the profile weight on the newest entry when a backdated one is logged", async () => {
    expect((await logWeight("2026-09-20T08:00:00.000Z", 78)).status).toBe(200);
    expect(profileWeight()).toBe(78);

    expect((await logWeight("2026-09-01T08:00:00.000Z", 82)).status).toBe(200);
    expect(profileWeight()).toBe(78);
  });

  it("falls back to the next newest entry when the newest is deleted", async () => {
    const newest = (await (
      await logWeight("2026-09-22T08:00:00.000Z", 77)
    ).json()) as { id: string };
    expect(profileWeight()).toBe(77);

    const response = await app.handle(
      new Request(`http://localhost/api/goals/weight-log/${newest.id}`, {
        method: "DELETE",
      }),
    );
    expect(response.status).toBe(200);
    expect(profileWeight()).toBe(78);
  });
});
