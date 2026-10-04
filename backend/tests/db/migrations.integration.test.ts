import { describe, expect, it } from "bun:test";
import { Database } from "bun:sqlite";

import { migrations } from "../../src/db/migrations";
import { initializeSchema } from "../../src/db/schema";

const LATEST = migrations.length;

function userVersion(db: Database) {
  return (db.query("PRAGMA user_version").get() as { user_version: number })
    .user_version;
}

function schemaOf(db: Database) {
  return db
    .query(
      "SELECT type, name, sql FROM sqlite_master WHERE name != 'sqlite_sequence' ORDER BY type, name",
    )
    .all();
}

// Tables as the oldest startup code created them, before Clerk, Play billing,
// units, ingredients and weekly habits added columns.
const LEGACY_SCHEMA = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE macro_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    protein REAL NOT NULL,
    carbs REAL NOT NULL,
    fats REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE habits (
    id TEXT PRIMARY KEY NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    current INTEGER NOT NULL DEFAULT 0,
    target INTEGER NOT NULL DEFAULT 1,
    accent_color TEXT CHECK(accent_color IN ('indigo', 'blue', 'green', 'purple')),
    is_complete INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'canceled', 'past_due', 'unpaid')),
    current_period_end TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  INSERT INTO users (id, first_name, last_name, email, password)
  VALUES (1, 'Local', 'User', 'local@example.com', '$2b$10$hash'),
         (2, 'Clerk', 'User', 'clerk@example.com', 'clerk-auth'),
         (3, 'Gone', 'User', 'gone@example.com', 'clerk-auth');
  DELETE FROM users WHERE id = 3;
  INSERT INTO macro_entries (user_id, protein, carbs, fats, created_at)
  VALUES (1, 30, 40, 10, '2025-04-01 08:00:00'), (2, 20, 50, 5, '2025-04-02 09:00:00');
  INSERT INTO habits (id, user_id, title, icon_name, accent_color, created_at)
  VALUES ('h1', 1, 'Water', 'droplet', 'blue', '2025-04-01T00:00:00.000Z');
  INSERT INTO subscriptions (id, user_id, stripe_subscription_id, status, current_period_end)
  VALUES ('s1', 2, 'sub_abc', 'active', '2030-01-01T00:00:00.000Z');
`;

describe("initializeSchema", () => {
  it("builds a fresh database at the latest version", () => {
    const db = new Database(":memory:");
    initializeSchema(db);

    expect(userVersion(db)).toBe(LATEST);
    expect(
      db
        .query(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name != 'sqlite_sequence' ORDER BY name",
        )
        .all()
        .map((row) => (row as { name: string }).name),
    ).toEqual([
      "habits",
      "macro_entries",
      "macro_targets",
      "password_reset_tokens",
      "play_billing_events",
      "saved_meals",
      "sessions",
      "stripe_events",
      "subscriptions",
      "user_details",
      "users",
      "weight_goals",
      "weight_log",
    ]);
    db.run(
      "INSERT INTO users (first_name, last_name, email, clerk_id) VALUES ('A', 'B', 'a@example.com', 'user_1')",
    );
    expect(db.query("SELECT password FROM users").get()).toEqual({
      password: null,
    });
    expect(db.query("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
    db.close();
  });

  it("upgrades a pre-migration database without losing rows", () => {
    const db = new Database(":memory:");
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(LEGACY_SCHEMA);

    initializeSchema(db);

    expect(userVersion(db)).toBe(LATEST);
    expect(
      db.query("SELECT id, password FROM users ORDER BY id").all(),
    ).toEqual([
      { id: 1, password: "$2b$10$hash" },
      { id: 2, password: null },
    ]);
    expect(
      db
        .query(
          "SELECT user_id, entry_date, entry_time, meal_type, ingredients FROM macro_entries ORDER BY id",
        )
        .all(),
    ).toEqual([
      { user_id: 1, entry_date: "2025-04-01", entry_time: "12:00:00", meal_type: "snack", ingredients: "[]" },
      { user_id: 2, entry_date: "2025-04-02", entry_time: "12:00:00", meal_type: "snack", ingredients: "[]" },
    ]);
    expect(
      db
        .query(
          "SELECT COUNT(DISTINCT client_id) AS ids, COUNT(*) - COUNT(client_id) AS missing FROM macro_entries",
        )
        .get(),
    ).toEqual({ ids: 2, missing: 0 });
    expect(
      db
        .query(
          "SELECT sql FROM sqlite_master WHERE name = 'idx_macro_entries_user_client_id'",
        )
        .get(),
    ).toEqual({
      sql: "CREATE UNIQUE INDEX idx_macro_entries_user_client_id ON macro_entries(user_id, client_id)",
    });
    expect(
      db.query("SELECT id, accent_color, frequency FROM habits").all(),
    ).toEqual([{ id: "h1", accent_color: "blue", frequency: "daily" }]);
    expect(
      db
        .query(
          "SELECT id, user_id, provider, provider_subscription_id FROM subscriptions",
        )
        .all(),
    ).toEqual([
      { id: "s1", user_id: 2, provider: "stripe", provider_subscription_id: "sub_abc" },
    ]);

    db.run(
      "INSERT INTO users (first_name, last_name, email, password) VALUES ('New', 'User', 'new@example.com', '$2b$10$other')",
    );
    expect(
      db.query("SELECT id FROM users WHERE email = 'new@example.com'").get(),
    ).toEqual({ id: 4 });

    db.run("DELETE FROM users WHERE id = 2");
    expect(db.query("SELECT COUNT(*) AS n FROM subscriptions").get()).toEqual({
      n: 0,
    });
    db.close();
  });

  it("gives a database the old startup code built the same schema as a fresh one", () => {
    const fresh = new Database(":memory:");
    initializeSchema(fresh);

    // 0001-0022 rebuild what the startup code before numbered migrations left behind.
    const existing = new Database(":memory:");
    initializeSchema(existing, migrations.slice(0, 22));
    existing.exec("PRAGMA user_version = 0;");
    existing.run(
      "INSERT INTO users (first_name, last_name, email, password, clerk_id) VALUES ('C', 'U', 'c@example.com', 'clerk-auth', 'user_c')",
    );

    initializeSchema(existing);

    expect(userVersion(existing)).toBe(LATEST);
    expect(schemaOf(existing)).toEqual(schemaOf(fresh));
    expect(existing.query("SELECT password FROM users").get()).toEqual({
      password: null,
    });
    fresh.close();
    existing.close();
  });

  it("does nothing on a database that is already current", () => {
    const db = new Database(":memory:");
    const steps = [
      (d: Database) => d.exec("CREATE TABLE log (n INTEGER)"),
      (d: Database) => d.exec("INSERT INTO log VALUES (1)"),
    ];

    initializeSchema(db, steps);
    initializeSchema(db, steps);

    expect(userVersion(db)).toBe(2);
    expect(db.query("SELECT n FROM log").all()).toEqual([{ n: 1 }]);
    db.close();
  });

  it("rolls back a failing migration and resumes from it on the next start", () => {
    const db = new Database(":memory:");
    const createTable = (d: Database) => d.exec("CREATE TABLE a (n INTEGER)");
    const failHalfway = (d: Database) => {
      d.exec("CREATE TABLE b (n INTEGER)");
      throw new Error("boom");
    };

    expect(() => initializeSchema(db, [createTable, failHalfway])).toThrow("boom");
    expect(userVersion(db)).toBe(1);
    expect(
      db.query("SELECT name FROM sqlite_master WHERE type = 'table'").all(),
    ).toEqual([{ name: "a" }]);
    expect(db.query("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });

    initializeSchema(db, [createTable, (d) => d.exec("CREATE TABLE b (n INTEGER)")]);
    expect(userVersion(db)).toBe(2);
    db.close();
  });
});
