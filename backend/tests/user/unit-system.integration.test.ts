import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { Database } from "bun:sqlite";
import { Elysia } from "elysia";

mock.module("../../src/lib/sync/eventBus", () => ({
  publishUserSyncEvent: () => {},
}));

import { initializeSchema } from "../../src/db/schema";
import { userRoutes } from "../../src/modules/user/routes";

describe("unit system preference", () => {
  let db: Database;
  let app: Elysia;

  const getUnitSystem = async () => {
    const response = await app.handle(new Request("http://localhost/api/user/me"));
    expect(response.status).toBe(200);

    return ((await response.json()) as { unitSystem: string }).unitSystem;
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
    // A user_details row written before the column existed.
    db.exec(`
      CREATE TABLE user_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        date_of_birth TEXT,
        height REAL,
        weight REAL,
        gender TEXT,
        activity_level INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO user_details (user_id, height, weight) VALUES (1, 180, 80);
    `);
    initializeSchema(db);
    db.exec(`
      INSERT INTO users (id, first_name, last_name, email, password, clerk_id)
      VALUES (1, 'Test', 'User', 'test@example.com', 'hash', 'test_clerk');
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

  it("defaults existing users to metric", async () => {
    expect(await getUnitSystem()).toBe("metric");
  });

  it("persists imperial and keeps it when other settings change", async () => {
    expect((await putSettings({ unitSystem: "imperial" })).status).toBe(200);
    expect(await getUnitSystem()).toBe("imperial");

    expect((await putSettings({ firstName: "Renamed" })).status).toBe(200);
    expect(await getUnitSystem()).toBe("imperial");

    const stored = db
      .query("SELECT height, weight FROM user_details WHERE user_id = 1")
      .get();
    expect(stored).toEqual({ height: 180, weight: 80 });
  });

  it("rejects an unknown unit system", async () => {
    const response = await putSettings({ unitSystem: "stone" });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(await getUnitSystem()).toBe("imperial");
  });
});
