import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function usersClerkId(db: Database) {
  addColumnIfMissing(db, "users", "clerk_id", "TEXT");
}
