import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function macroEntriesMealType(db: Database) {
  addColumnIfMissing(db, "macro_entries", "meal_type", "TEXT DEFAULT 'snack' CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))");
}
