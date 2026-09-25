import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { Elysia } from "elysia";

mock.module("../../src/lib/sync/eventBus", () => ({
  publishUserSyncEvent: () => {},
}));

import { initializeSchema } from "../../src/db/schema";
import { habitRoutes } from "../../src/modules/habits/routes";

interface HabitResponse {
  id: string;
  current: number;
  progress: number;
  isComplete: boolean;
  completedAt: string | null;
}

describe("habit progress", () => {
  let db: Database;
  let app: Elysia;

  const updateProgress = async (action: string, date: string) => {
    const response = await app.handle(
      new Request("http://localhost/api/habits/water/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, date }),
      }),
    );
    expect(response.status).toBe(200);
    return (await response.json()) as HabitResponse;
  };

  const readHabit = async (date: string) => {
    const response = await app.handle(
      new Request(`http://localhost/api/habits?date=${date}`),
    );
    expect(response.status).toBe(200);
    return ((await response.json()) as HabitResponse[])[0]!;
  };

  const setStoredProgress = (current: number, periodDate: string | null) => {
    db.run(
      "UPDATE habits SET current = ?, is_complete = ?, completed_at = NULL, period_date = ? WHERE id = 'water'",
      [current, current >= 2 ? 1 : 0, periodDate],
    );
  };

  beforeAll(() => {
    db = new Database(":memory:");
    initializeSchema(db);
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk');
      INSERT INTO habits (id, user_id, title, icon_name, current, target, accent_color, is_complete, created_at)
      VALUES ('water', 1, 'Water, 2L', 'droplet', 0, 2, 'cyan', 0, '2026-09-01T08:00:00.000Z');
    `);

    app = new Elysia()
      .decorate("db", db)
      .derive(() => ({ authenticatedUser: { userId: 1 } }))
      .use(habitRoutes) as unknown as Elysia;
  });

  beforeEach(() => {
    setStoredProgress(0, null);
  });

  afterAll(() => {
    db.close();
  });

  it("reads a completed habit as 0 on the next local day", async () => {
    await updateProgress("increment", "2026-09-24");
    const completed = await updateProgress("increment", "2026-09-24");
    expect(completed).toMatchObject({ current: 2, progress: 100, isComplete: true });
    expect(completed.completedAt).not.toBeNull();

    expect(await readHabit("2026-09-24")).toMatchObject({ current: 2, isComplete: true });
    expect(await readHabit("2026-09-25")).toMatchObject({
      current: 0,
      progress: 0,
      isComplete: false,
      completedAt: null,
    });
  });

  it("counts an increment on a new day from 0, not from yesterday's total", async () => {
    setStoredProgress(1, "2026-09-24");

    expect(await updateProgress("increment", "2026-09-25")).toMatchObject({
      current: 1,
      isComplete: false,
    });
  });

  it("treats progress stored before the period column existed as a past day", async () => {
    setStoredProgress(2, null);

    expect(await readHabit("2026-09-25")).toMatchObject({ current: 0, isComplete: false });
  });

  it("keeps incrementing a complete habit at its target instead of failing", async () => {
    await updateProgress("complete", "2026-09-25");

    expect(await updateProgress("increment", "2026-09-25")).toMatchObject({
      current: 2,
      isComplete: true,
    });
  });

  it("decrements a complete habit back to in progress and stops at 0", async () => {
    await updateProgress("complete", "2026-09-25");

    expect(await updateProgress("decrement", "2026-09-25")).toMatchObject({
      current: 1,
      isComplete: false,
      completedAt: null,
    });
    await updateProgress("decrement", "2026-09-25");
    expect(await updateProgress("decrement", "2026-09-25")).toMatchObject({ current: 0 });
  });

  it("resets today's progress to 0", async () => {
    await updateProgress("increment", "2026-09-25");

    expect(await updateProgress("reset", "2026-09-25")).toMatchObject({
      current: 0,
      isComplete: false,
    });
    expect(await readHabit("2026-09-25")).toMatchObject({ current: 0 });
  });

  it("rejects a date that is not a calendar day", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/habits/water/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "increment", date: "2026-09-25T23:00:00Z" }),
      }),
    );

    expect(response.status).toBe(422);
  });
});
