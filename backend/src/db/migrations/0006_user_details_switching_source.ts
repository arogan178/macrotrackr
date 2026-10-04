import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function userDetailsSwitchingSource(db: Database) {
  addColumnIfMissing(db, "user_details", "switching_source", "TEXT CHECK(switching_source IN ('cronometer', 'loseit', 'macrofactor', 'myfitnesspal', 'new_to_tracking', 'other', 'spreadsheet', 'unknown'))");
}
