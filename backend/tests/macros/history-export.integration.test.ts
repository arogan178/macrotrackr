import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { Elysia } from "elysia";

import * as originalClerkGuards from "../../src/middleware/clerk-guards";

mock.module("../../src/middleware/clerk-guards", () => ({
  ...originalClerkGuards,
  checkProStatus: async () => false,
}));

import { initializeSchema } from "../../src/db/schema";
import { macroRoutes } from "../../src/modules/macros/routes";

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
};

describe("GET /api/macros/history for a free user", () => {
  let db: Database;
  let app: Elysia;

  const getHistory = async (query = "") => {
    const response = await app.handle(
      new Request(`http://localhost/api/macros/history?limit=100${query}`),
    );
    expect(response.status).toBe(200);
    return (await response.json()) as {
      entries: { mealName: string }[];
      limits?: { isRestricted: boolean };
    };
  };

  beforeAll(() => {
    db = new Database(":memory:");
    initializeSchema(db);
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk'),
             (2, 'Other', 'User', 'other@example.com', 'hash', 'other_clerk');
    `);
    const insert = db.prepare(
      `INSERT INTO macro_entries (user_id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time)
       VALUES (?, 10, 10, 10, 'lunch', ?, ?, '12:00:00')`,
    );
    insert.run(1, "recent", daysAgo(1));
    insert.run(1, "old", daysAgo(60));
    insert.run(2, "someone else's", daysAgo(60));

    app = new Elysia()
      .decorate("db", db)
      .derive(() => ({ authenticatedUser: { userId: 1 } }))
      .use(macroRoutes) as unknown as Elysia;
  });

  afterAll(() => {
    db.close();
  });

  it("only returns the visible window by default", async () => {
    const body = await getHistory();
    expect(body.entries.map((entry) => entry.mealName)).toEqual(["recent"]);
    expect(body.limits?.isRestricted).toBe(true);
  });

  it("returns every one of the caller's entries for the full export", async () => {
    const body = await getHistory("&fullExport=true");
    expect(body.entries.map((entry) => entry.mealName)).toEqual([
      "recent",
      "old",
    ]);
    expect(body.limits).toBeUndefined();
  });
});
