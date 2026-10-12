import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { Elysia } from "elysia";

import * as originalClerkGuards from "../../src/middleware/clerk-guards";

let isPro = true;
mock.module("../../src/middleware/clerk-guards", () => ({
  ...originalClerkGuards,
  checkProStatus: async () => isPro,
}));

import { initializeSchema } from "../../src/db/schema";
import { handleError } from "../../src/lib/http/responses";
import { subscribeUserSync } from "../../src/lib/sync/eventBus";
import { macroRoutes } from "../../src/modules/macros/routes";

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0] as string;
};

describe("/api/macros/partial-days", () => {
  let db: Database;
  let app: Elysia;

  const put = (date: string, partial: unknown) =>
    app.handle(
      new Request(`http://localhost/api/macros/partial-days/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partial }),
      }),
    );

  const list = async (startDate: string, endDate: string) => {
    const response = await app.handle(
      new Request(
        `http://localhost/api/macros/partial-days?startDate=${startDate}&endDate=${endDate}`,
      ),
    );
    expect(response.status).toBe(200);
    return ((await response.json()) as { dates: string[] }).dates;
  };

  beforeEach(() => {
    isPro = true;
    db = new Database(":memory:");
    initializeSchema(db);
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk'),
             (2, 'Other', 'User', 'other@example.com', 'hash', 'other_clerk');
    `);
    app = new Elysia()
      .decorate("db", db)
      .derive(() => ({ authenticatedUser: { userId: 1 } }))
      // Mirrors app.ts: schema failures are 400, app errors keep their status.
      .onError(({ code, error, set }) => {
        if (code === "VALIDATION") {
          set.status = 400;
          return { code: "VALIDATION_ERROR" };
        }
        return handleError(error, set);
      })
      .use(macroRoutes) as unknown as Elysia;
  });

  afterAll(() => {
    db.close();
  });

  it("marks and unmarks a day, and repeating either changes nothing", async () => {
    expect((await put("2026-10-01", true)).status).toBe(200);
    expect((await put("2026-10-01", true)).status).toBe(200);
    expect(await list("2026-10-01", "2026-10-31")).toEqual(["2026-10-01"]);

    const response = await put("2026-10-01", false);
    expect(await response.json()).toEqual({
      date: "2026-10-01",
      partial: false,
    });
    expect((await put("2026-10-01", false)).status).toBe(200);
    expect(await list("2026-10-01", "2026-10-31")).toEqual([]);
  });

  it("returns only dates inside the range", async () => {
    await put("2026-09-30", true);
    await put("2026-10-02", true);
    await put("2026-10-05", true);
    expect(await list("2026-10-01", "2026-10-05")).toEqual([
      "2026-10-02",
      "2026-10-05",
    ]);
  });

  it("rejects a malformed date or body", async () => {
    expect((await put("2026-13-01", true)).status).toBe(400);
    expect((await put("yesterday", true)).status).toBe(400);
    expect((await put("2026-10-01", "yes")).status).toBe(400);
    const response = await app.handle(
      new Request(
        "http://localhost/api/macros/partial-days?startDate=10/01/2026&endDate=2026-10-31",
      ),
    );
    expect(response.status).toBe(400);
  });

  it("never shows or touches another user's days", async () => {
    db.run(
      "INSERT INTO partial_days (user_id, entry_date) VALUES (2, '2026-10-03')",
    );
    expect(await list("2026-10-01", "2026-10-31")).toEqual([]);
    await put("2026-10-03", false);
    expect(
      db.query("SELECT user_id, entry_date FROM partial_days").all(),
    ).toEqual([{ user_id: 2, entry_date: "2026-10-03" }]);
  });

  it("keeps free accounts inside the visible history window", async () => {
    db.run(
      "INSERT INTO partial_days (user_id, entry_date) VALUES (1, ?), (1, ?)",
      [daysAgo(30), daysAgo(1)],
    );
    isPro = false;

    expect(await list(daysAgo(60), daysAgo(0))).toEqual([daysAgo(1)]);
    expect((await put(daysAgo(30), false)).status).toBe(403);
    expect((await put(daysAgo(2), true)).status).toBe(200);

    isPro = true;
    expect(await list(daysAgo(60), daysAgo(0))).toEqual([
      daysAgo(30),
      daysAgo(2),
      daysAgo(1),
    ]);
  });

  it("publishes a sync event only when something changed", async () => {
    const topics: string[] = [];
    const unsubscribe = subscribeUserSync(1, (event) =>
      topics.push(event.topic),
    );
    await put("2026-10-01", true);
    await put("2026-10-01", true);
    await put("2026-10-01", false);
    unsubscribe();
    expect(topics).toEqual(["macros", "macros"]);
  });

  it("deleting the account removes its partial days", async () => {
    await put("2026-10-01", true);
    db.run(
      "INSERT INTO partial_days (user_id, entry_date) VALUES (2, '2026-10-01')",
    );
    db.run("DELETE FROM users WHERE id = 1");
    expect(db.query("SELECT user_id FROM partial_days").all()).toEqual([
      { user_id: 2 },
    ]);
  });
});
