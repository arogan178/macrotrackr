import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function macroEntriesIngredients(db: Database) {
  addColumnIfMissing(db, "macro_entries", "ingredients", "TEXT DEFAULT '[]'");
}
