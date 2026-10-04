import type { Database } from "bun:sqlite";

// Accent colours are validated in the app, so the old fixed list in a CHECK
// blocked every colour added since.
export function habitsDropAccentColorCheck(db: Database) {
  const table = db
    .query(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'habits'",
    )
    .get() as { sql: string } | null;

  const hasOldCheck =
    table?.sql.includes(
      "accent_color TEXT CHECK(accent_color IN ('indigo', 'blue', 'green', 'purple'))",
    ) ?? false;
  if (!hasOldCheck) {
    return;
  }

  db.exec(`
    CREATE TABLE habits_new (
      id TEXT PRIMARY KEY NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      icon_name TEXT NOT NULL,
      current INTEGER NOT NULL DEFAULT 0,
      target INTEGER NOT NULL DEFAULT 1,
      accent_color TEXT,
      is_complete INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    INSERT INTO habits_new (
      id, user_id, title, icon_name, current, target, accent_color, is_complete, created_at, completed_at
    )
    SELECT
      id, user_id, title, icon_name, current, target, accent_color, is_complete, created_at, completed_at
    FROM habits;
    DROP TABLE habits;
    ALTER TABLE habits_new RENAME TO habits;
  `);
}
