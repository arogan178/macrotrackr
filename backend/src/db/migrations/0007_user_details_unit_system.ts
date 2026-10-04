import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function userDetailsUnitSystem(db: Database) {
  addColumnIfMissing(db, "user_details", "unit_system", "TEXT DEFAULT 'metric' CHECK(unit_system IN ('metric', 'imperial'))");
}
