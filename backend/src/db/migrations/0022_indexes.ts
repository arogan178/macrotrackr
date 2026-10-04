import type { Database } from "bun:sqlite";

// Indexes come after 0002-0021 because a database created before numbered
// migrations may only gain some of these columns there.
export function indexes(db: Database) {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_macro_entries_user_date ON macro_entries(user_id, entry_date);
    CREATE INDEX IF NOT EXISTS idx_macro_entries_user_id ON macro_entries(user_id);
    CREATE INDEX IF NOT EXISTS idx_macro_entries_date ON macro_entries(entry_date);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
    CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
    CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id, is_complete);
    CREATE INDEX IF NOT EXISTS idx_weight_goals_user ON weight_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON weight_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_macro_targets_user ON macro_targets(user_id);
    CREATE INDEX IF NOT EXISTS idx_weight_log_user_timestamp ON weight_log(user_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_weight_log_user_created_at ON weight_log(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_macro_entries_user_date_meal ON macro_entries(user_id, entry_date, meal_type);
    CREATE INDEX IF NOT EXISTS idx_macro_entries_user_date_desc ON macro_entries(user_id, entry_date DESC, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_weight_log_user_timestamp_desc ON weight_log(user_id, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_habits_user_complete ON habits(user_id, is_complete);
    CREATE INDEX IF NOT EXISTS idx_habits_user_created ON habits(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_user_details_user ON user_details(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
    CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_play_obfuscated_account_id ON users(play_obfuscated_account_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id ON subscriptions(provider, provider_subscription_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_active_until ON subscriptions(current_period_end);
    CREATE INDEX IF NOT EXISTS idx_saved_meals_user_created ON saved_meals(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
  `);
}
