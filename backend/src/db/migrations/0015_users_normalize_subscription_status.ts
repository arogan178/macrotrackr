import type { Database } from "bun:sqlite";

export function usersNormalizeSubscriptionStatus(db: Database) {
  db.exec(`
    UPDATE users
    SET subscription_status = 'free'
    WHERE subscription_status NOT IN ('free', 'pro', 'canceled') OR subscription_status IS NULL
  `);
}
