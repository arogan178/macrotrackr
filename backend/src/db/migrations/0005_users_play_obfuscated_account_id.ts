import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function usersPlayObfuscatedAccountId(db: Database) {
  addColumnIfMissing(db, "users", "play_obfuscated_account_id", "TEXT");
}
