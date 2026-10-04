import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function savedMealsIngredients(db: Database) {
  addColumnIfMissing(db, "saved_meals", "ingredients", "TEXT DEFAULT '[]'");
}
