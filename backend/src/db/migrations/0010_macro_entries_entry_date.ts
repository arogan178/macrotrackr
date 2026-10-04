import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function macroEntriesEntryDate(db: Database) {
  addColumnIfMissing(db, "macro_entries", "entry_date", "TEXT");
  db.exec("UPDATE macro_entries SET entry_date = DATE(created_at) WHERE entry_date IS NULL");
}
