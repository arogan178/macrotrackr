import type { Database } from "bun:sqlite";

import { addColumnIfMissing } from "./add-column";

export function usersSubscriptionStatus(db: Database) {
  addColumnIfMissing(db, "users", "subscription_status", "TEXT DEFAULT 'free'");
}
