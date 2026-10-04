import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function macroEntriesMealName(db: Database) {
  addColumnIfMissing(db, "macro_entries", "meal_name", "TEXT DEFAULT ''");
}
