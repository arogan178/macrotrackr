import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { Elysia } from "elysia";

mock.module("../../src/lib/sync/eventBus", () => ({
  publishUserSyncEvent: () => {},
}));

import { migrations } from "../../src/db/migrations";
import { initializeSchema } from "../../src/db/schema";
import { userRoutes } from "../../src/modules/user/routes";

const hasOverrideColumn = (db: Database) =>
  db
    .query(
      "SELECT 1 FROM pragma_table_info('user_details') WHERE name = 'expenditure_override'",
    )
    .get() !== null;

describe("expenditure_override migration", () => {
  it("adds the column to a fresh database", () => {
    const db = new Database(":memory:");
    initializeSchema(db);

    expect(hasOverrideColumn(db)).toBe(true);
    db.close();
  });

  it("adds it to an existing database and keeps its rows", () => {
    const db = new Database(":memory:");
    initializeSchema(db);
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash');
      INSERT INTO user_details (user_id, height, weight) VALUES (1, 180, 80);
      ALTER TABLE user_details DROP COLUMN expenditure_override;
      PRAGMA user_version = ${migrations.length - 1};
    `);

    initializeSchema(db);

    expect(hasOverrideColumn(db)).toBe(true);
    expect(
      db
        .query(
          "SELECT height, weight, expenditure_override FROM user_details WHERE user_id = 1",
        )
        .get(),
    ).toEqual({ height: 180, weight: 80, expenditure_override: null });
    db.close();
  });
});

describe("expenditure override setting", () => {
  let db: Database;
  let app: Elysia;

  const getOverride = async () => {
    const response = await app.handle(new Request("http://localhost/api/user/me"));
    expect(response.status).toBe(200);

    return ((await response.json()) as { expenditureOverride: number | null })
      .expenditureOverride;
  };

  const putSettings = (body: Record<string, unknown>) =>
    app.handle(
      new Request("http://localhost/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

  beforeAll(() => {
    db = new Database(":memory:");
    initializeSchema(db);
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash');
      INSERT INTO user_details (user_id, height, weight) VALUES (1, 180, 80);
    `);

    app = new Elysia()
      .decorate("db", db)
      .derive(() => ({
        authenticatedUser: {
          userId: 1,
          authProvider: "local" as const,
          providerUserId: null,
        },
      }))
      .use(userRoutes) as unknown as Elysia;
  });

  afterAll(() => {
    db.close();
  });

  it("starts empty", async () => {
    expect(await getOverride()).toBeNull();
  });

  it("saves a number and keeps it when other settings change", async () => {
    expect((await putSettings({ expenditureOverride: 2500 })).status).toBe(200);
    expect(await getOverride()).toBe(2500);

    expect((await putSettings({ firstName: "Renamed" })).status).toBe(200);
    expect(await getOverride()).toBe(2500);
  });

  it("accepts the bounds and rejects values outside 800 to 6000", async () => {
    expect((await putSettings({ expenditureOverride: 800 })).status).toBe(200);
    expect((await putSettings({ expenditureOverride: 6000 })).status).toBe(200);

    for (const value of [799, 6001, 2500.5, "lots"]) {
      const response = await putSettings({ expenditureOverride: value });
      expect(response.status).toBeGreaterThanOrEqual(400);
    }
    expect(await getOverride()).toBe(6000);
  });

  it("clears back to the formula with null", async () => {
    expect((await putSettings({ expenditureOverride: null })).status).toBe(200);
    expect(await getOverride()).toBeNull();
  });
});
