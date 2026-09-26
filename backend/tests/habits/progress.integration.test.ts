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
  frequency: "daily" | "weekly";
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

  const storedPeriod = () =>
    (db.query("SELECT period_date FROM habits WHERE id = 'water'").get() as {
      period_date: string | null;
    }).period_date;

  const editHabit = async (frequency?: "daily" | "weekly") => {
    const response = await app.handle(
      new Request("http://localhost/api/habits/water", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Water, 2L",
          iconName: "droplet",
          current: 1,
          target: 2,
          accentColor: "cyan",
          isComplete: false,
          createdAt: "2026-09-01T08:00:00.000Z",
          frequency,
        }),
      }),
    );
    expect(response.status).toBe(200);
    return (await response.json()) as HabitResponse;
  };

  beforeEach(() => {
    setStoredProgress(0, null);
    db.run("UPDATE habits SET frequency = 'daily' WHERE id = 'water'");
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

  it("reads a habit saved before frequency existed as daily", async () => {
    await updateProgress("increment", "2026-09-25");

    expect(await readHabit("2026-09-25")).toMatchObject({ frequency: "daily", current: 1 });
    expect(storedPeriod()).toBe("2026-09-25");
  });

  describe("weekly", () => {
    beforeEach(() => {
      db.run("UPDATE habits SET frequency = 'weekly' WHERE id = 'water'");
    });

    it("keeps progress across the days of one week and resets on Monday", async () => {
      await updateProgress("increment", "2026-09-21");
      expect(await updateProgress("increment", "2026-09-23")).toMatchObject({
        frequency: "weekly",
        current: 2,
        isComplete: true,
      });

      expect(await readHabit("2026-09-27")).toMatchObject({ current: 2, isComplete: true });
      expect(await readHabit("2026-09-28")).toMatchObject({
        current: 0,
        isComplete: false,
        completedAt: null,
      });
    });

    it("counts a Sunday in the week that began the Monday before", async () => {
      await updateProgress("increment", "2026-09-27");
      expect(storedPeriod()).toBe("2026-09-21");
      expect(await readHabit("2026-09-21")).toMatchObject({ current: 1 });

      expect(await updateProgress("increment", "2026-09-28")).toMatchObject({ current: 1 });
      expect(storedPeriod()).toBe("2026-09-28");
    });

    it("keys a week that spans the new year by its Monday", async () => {
      await updateProgress("increment", "2027-01-03");

      expect(storedPeriod()).toBe("2026-12-28");
      expect(await readHabit("2026-12-28")).toMatchObject({ current: 1 });
    });

    it("keeps this week's progress through an edit that leaves frequency alone", async () => {
      await updateProgress("increment", "2026-09-22");

      expect(await editHabit()).toMatchObject({ frequency: "weekly" });
      expect(await readHabit("2026-09-24")).toMatchObject({ frequency: "weekly", current: 1 });
    });

    it("starts from 0 when switched to daily", async () => {
      await updateProgress("increment", "2026-09-21");

      expect(await editHabit("daily")).toMatchObject({ frequency: "daily" });
      expect(await readHabit("2026-09-21")).toMatchObject({ frequency: "daily", current: 0 });
    });
  });

  it("adds frequency to an existing habits table as daily", () => {
    const legacy = new Database(":memory:");
    legacy.exec(`
      CREATE TABLE habits (
        id TEXT PRIMARY KEY NOT NULL, user_id INTEGER NOT NULL, title TEXT NOT NULL,
        icon_name TEXT NOT NULL, current INTEGER NOT NULL DEFAULT 0,
        target INTEGER NOT NULL DEFAULT 1, accent_color TEXT,
        is_complete INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
        completed_at TEXT, period_date TEXT
      );
      INSERT INTO habits (id, user_id, title, icon_name, created_at)
      VALUES ('old', 1, 'Old', 'target', '2026-01-01T00:00:00.000Z');
    `);

    try {
      initializeSchema(legacy);

      expect(legacy.query("SELECT frequency FROM habits").get()).toEqual({ frequency: "daily" });
      expect(() => legacy.run("UPDATE habits SET frequency = 'monthly'")).toThrow();
    } finally {
      legacy.close();
    }
  });

  it("lists a habit saved without a colour", async () => {
    db.run("UPDATE habits SET accent_color = NULL WHERE id = 'water'");
    try {
      expect(await readHabit("2026-09-25")).toMatchObject({ id: "water" });
    } finally {
      db.run("UPDATE habits SET accent_color = 'cyan' WHERE id = 'water'");
    }
  });
});
