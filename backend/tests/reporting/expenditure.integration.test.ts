import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { Elysia } from "elysia";

import * as originalClerkGuards from "../../src/middleware/clerk-guards";

// Every account here is free; the endpoint must not care.
mock.module("../../src/middleware/clerk-guards", () => ({
  ...originalClerkGuards,
  checkProStatus: async () => false,
}));

import { initializeSchema } from "../../src/db/schema";
import { handleError } from "../../src/lib/http/responses";
import { reportingRoutes } from "../../src/modules/reporting/routes";

// Window for this "today": 2026-03-01 to 2026-03-21.
const TODAY = "2026-03-22";

const march = (day: number) => `2026-03-${String(day).padStart(2, "0")}`;

describe("GET /api/reporting/expenditure", () => {
  let db: Database;
  let app: Elysia;

  const get = (query: string, userId: number | null = 1) =>
    app.handle(
      new Request(`http://localhost/api/reporting/expenditure?${query}`, {
        headers: userId === null ? {} : { "x-test-user": String(userId) },
      }),
    );

  const insertEntry = (userId: number, date: string, carbs: number, fats: number) =>
    db.run(
      `INSERT INTO macro_entries (user_id, protein, carbs, fats, entry_date, entry_time)
       VALUES (?, 100, ?, ?, ?, '12:00')`,
      [userId, carbs, fats, date],
    );

  const insertWeight = (userId: number, timestamp: string, weight: number) =>
    db.run(
      "INSERT INTO weight_log (id, user_id, timestamp, weight) VALUES (?, ?, ?, ?)",
      [crypto.randomUUID(), userId, timestamp, weight],
    );

  beforeEach(() => {
    db = new Database(":memory:");
    initializeSchema(db);
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk'),
             (2, 'Other', 'User', 'other@example.com', 'hash', 'other_clerk');
    `);

    // User 1: 100 g protein, 250 g carbs, 80 g fats = 400 + 1,000 + 720 = 2,120 kcal
    // on March 1 to 18. March 19 is a partial 500 kcal day. Weight holds at 80 kg.
    for (let day = 1; day <= 18; day++) insertEntry(1, march(day), 250, 80);
    insertEntry(1, march(19), 25, 0);
    db.run("INSERT INTO partial_days (user_id, entry_date) VALUES (1, ?)", [march(19)]);
    insertWeight(1, "2026-02-20", 80);
    insertWeight(1, "2026-03-01T07:00:00.000Z", 80);
    insertWeight(1, "2026-03-11T07:00:00.000Z", 80);
    // 23:30 UTC on March 21 is already March 22, today, at UTC+2.
    insertWeight(1, "2026-03-21T23:30:00.000Z", 80);

    // User 2 eats far more and loses weight; none of it may leak into user 1.
    for (let day = 1; day <= 21; day++) insertEntry(2, march(day), 500, 150);
    insertWeight(2, "2026-03-01", 90);
    insertWeight(2, "2026-03-21", 85);

    app = new Elysia()
      .decorate("db", db)
      .derive(({ request }) => {
        const header = request.headers.get("x-test-user");
        return { authenticatedUser: { userId: header ? Number(header) : null } };
      })
      // Mirrors app.ts: schema failures are 400, app errors keep their status.
      .onError(({ code, error, set }) => {
        if (code === "VALIDATION") {
          set.status = 400;
          return { code: "VALIDATION_ERROR" };
        }
        return handleError(error, set);
      })
      .use(reportingRoutes) as unknown as Elysia;
  });

  afterAll(() => {
    db.close();
  });

  it("measures expenditure from the seeded window for a free account", async () => {
    const response = await get(`today=${TODAY}&tzOffsetMinutes=0`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "measured",
      estimate: 2120,
      avgIntake: 2120,
      usableDays: 18,
      windowDays: 21,
      trendStartKg: 80,
      trendEndKg: 80,
      spanDays: 20,
      dailyBalance: 0,
    });
  });

  it("files weigh-ins under the user's own day", async () => {
    const response = await get(`today=${TODAY}&tzOffsetMinutes=-120`);
    expect(await response.json()).toEqual({
      status: "insufficient",
      usableDays: 18,
      weighInsInWindow: 2,
      needs: { loggedDays: 0, weighIns: 1 },
    });
  });

  it("only reads the signed-in user's data", async () => {
    // User 1's measured case above already excludes user 2's 21 days and weigh-ins.
    const response = await get(`today=${TODAY}&tzOffsetMinutes=0`, 2);
    expect(await response.json()).toEqual({
      status: "insufficient",
      usableDays: 21,
      weighInsInWindow: 2,
      needs: { loggedDays: 0, weighIns: 1 },
    });
  });

  it("requires a signed-in user", async () => {
    expect((await get(`today=${TODAY}&tzOffsetMinutes=0`, null)).status).toBe(401);
  });

  it("rejects a malformed day or offset", async () => {
    for (const query of [
      "tzOffsetMinutes=0",
      `today=${TODAY}`,
      "today=22/03/2026&tzOffsetMinutes=0",
      "today=2026-13-01&tzOffsetMinutes=0",
      `today=${TODAY}&tzOffsetMinutes=1.5`,
      `today=${TODAY}&tzOffsetMinutes=abc`,
      `today=${TODAY}&tzOffsetMinutes=900`,
    ]) {
      expect({ query, status: (await get(query)).status }).toEqual({
        query,
        status: 400,
      });
    }
  });
});
