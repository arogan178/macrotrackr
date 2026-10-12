import type { Database } from "bun:sqlite";

export function partialDays(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS partial_days (
      user_id INTEGER NOT NULL,
      entry_date TEXT NOT NULL, -- YYYY-MM-DD, the user's local day
      PRIMARY KEY (user_id, entry_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}
