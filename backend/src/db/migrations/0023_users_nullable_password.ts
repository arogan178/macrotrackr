import type { Database } from "bun:sqlite";

// Clerk accounts have no local password. They used to store the string
// 'clerk-auth' to satisfy NOT NULL; NULL says the same without a magic value.
export function usersNullablePassword(db: Database) {
  const indexesAndTriggers = db
    .query(
      "SELECT sql FROM sqlite_master WHERE tbl_name = 'users' AND type IN ('index', 'trigger') AND sql IS NOT NULL",
    )
    .all() as Array<{ sql: string }>;

  db.exec(`
    CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT, -- bcrypt hash; NULL when the account has no local password
        clerk_id TEXT UNIQUE,
        subscription_status TEXT DEFAULT 'free' CHECK(subscription_status IN ('free', 'pro', 'canceled')),
        stripe_customer_id TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        password_reset_token TEXT,
        password_reset_expires DATETIME,
        -- Opaque per-account token handed to Play at purchase time and
        -- echoed back in notifications. Lets a Play notification find its
        -- account even when the app never got to claim the purchase.
        play_obfuscated_account_id TEXT,
        updated_at DATETIME
    );
    INSERT INTO users_new (
        id, first_name, last_name, email, password, clerk_id, subscription_status,
        stripe_customer_id, created_at, password_reset_token, password_reset_expires,
        play_obfuscated_account_id, updated_at
    )
    SELECT
        id, first_name, last_name, email, NULLIF(password, 'clerk-auth'), clerk_id, subscription_status,
        stripe_customer_id, created_at, password_reset_token, password_reset_expires,
        play_obfuscated_account_id, updated_at
    FROM users;
    -- Keep the high-water mark so ids of deleted accounts are never reissued.
    DELETE FROM sqlite_sequence WHERE name = 'users_new';
    INSERT INTO sqlite_sequence (name, seq)
    SELECT 'users_new', seq FROM sqlite_sequence WHERE name = 'users';
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
  `);

  for (const { sql } of indexesAndTriggers) {
    db.exec(sql);
  }
}
