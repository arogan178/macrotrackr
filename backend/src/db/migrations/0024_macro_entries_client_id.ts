import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function macroEntriesClientId(db: Database) {
  addColumnIfMissing(db, "macro_entries", "client_id", "TEXT");
  addColumnIfMissing(db, "macro_entries", "client_updated_at", "INTEGER");

  // Backfilled so a device can edit or delete offline any entry,
  // including ones logged before this release.
  const rows = db
    .query("SELECT id FROM macro_entries WHERE client_id IS NULL")
    .all() as Array<{ id: number }>;
  const setClientId = db.prepare(
    "UPDATE macro_entries SET client_id = ? WHERE id = ?",
  );
  for (const { id } of rows) {
    setClientId.run(crypto.randomUUID(), id);
  }

  db.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_macro_entries_user_client_id ON macro_entries(user_id, client_id)",
  );
}
