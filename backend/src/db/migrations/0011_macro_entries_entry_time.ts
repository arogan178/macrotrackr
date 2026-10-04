import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function macroEntriesEntryTime(db: Database) {
  addColumnIfMissing(db, "macro_entries", "entry_time", "TEXT");
  db.exec("UPDATE macro_entries SET entry_time = '12:00:00' WHERE entry_time IS NULL");
}
