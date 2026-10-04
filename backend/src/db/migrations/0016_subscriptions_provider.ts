import type { Database } from "bun:sqlite";

// The original table hard-coded Stripe in a UNIQUE NOT NULL column, so a Play
// purchase token had nowhere to live. Rebuild it with provider and
// provider_subscription_id, tagging every existing row as Stripe.
export function subscriptionsProvider(db: Database) {
  const table = db
    .query(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'subscriptions'",
    )
    .get() as { sql: string } | null;

  const needsProviderColumns =
    table !== null &&
    table.sql.includes("stripe_subscription_id") &&
    !table.sql.includes("provider_subscription_id");
  if (!needsProviderColumns) {
    return;
  }

  db.exec(`
    CREATE TABLE subscriptions_new (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      provider TEXT NOT NULL DEFAULT 'stripe' CHECK(provider IN ('stripe', 'play')),
      provider_subscription_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'canceled', 'past_due', 'unpaid')),
      current_period_end TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(provider, provider_subscription_id)
    );
    INSERT INTO subscriptions_new (
      id, user_id, provider, provider_subscription_id, status,
      current_period_end, created_at, updated_at
    )
    SELECT
      id, user_id, 'stripe', stripe_subscription_id, status,
      current_period_end, created_at, updated_at
    FROM subscriptions;
    DROP TABLE subscriptions;
    ALTER TABLE subscriptions_new RENAME TO subscriptions;
  `);
}
