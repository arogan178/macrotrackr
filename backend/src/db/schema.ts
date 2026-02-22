// src/db/schema.ts

import { Database } from "bun:sqlite";
import { logger } from "../lib/logger";

/**
 * Initializes the database schema, creating tables and applying migrations.
 * @param db - The Bun SQLite database instance.
 */
export function initializeSchema(db: Database) {
  logger.info("🚀 Initializing database schema...");

  // Enable Foreign Key support (important for relationships)
  db.exec("PRAGMA foreign_keys = ON;");

  // Initialize database tables
  db.exec(`
        -- Users Table --
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL, -- Store hashed password
            clerk_id TEXT UNIQUE,
            subscription_status TEXT DEFAULT 'free' CHECK(subscription_status IN ('free', 'pro', 'canceled')),
            stripe_customer_id TEXT UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            password_reset_token TEXT,
            password_reset_expires DATETIME
        );

        -- User Details Table --
        CREATE TABLE IF NOT EXISTS user_details (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            date_of_birth TEXT, -- Store as ISO 8601 string 'YYYY-MM-DD'
            height REAL,
            weight REAL,
            gender TEXT CHECK(gender IN ('male', 'female')),
            activity_level INTEGER CHECK(activity_level BETWEEN 1 AND 5),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Macro Entries Table --
        CREATE TABLE IF NOT EXISTS macro_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            protein REAL NOT NULL CHECK(protein >= 0.0),
            carbs REAL NOT NULL CHECK(carbs >= 0.0),
            fats REAL NOT NULL CHECK(fats >= 0.0),
            meal_type TEXT DEFAULT 'snack' CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
            meal_name TEXT DEFAULT '',
            entry_date TEXT NOT NULL, -- Store as ISO 8601 string 'YYYY-MM-DD'
            entry_time TEXT NOT NULL, -- Store as ISO 8601 string 'HH:MM:SS' or 'HH:MM'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Weight Goals Table --
        CREATE TABLE IF NOT EXISTS weight_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            starting_weight REAL,
            target_weight REAL,
            weight_goal TEXT CHECK(weight_goal IN ('lose', 'maintain', 'gain')), -- Type of goal
            start_date TEXT, -- YYYY-MM-DD
            target_date TEXT, -- YYYY-MM-DD
            calorie_target REAL, -- Recommended calories for goal
            calculated_weeks INTEGER, -- Estimated duration
            weekly_change REAL, -- Estimated kg/week change
            daily_change REAL, --  Estimated calorie deficit/surplus per day
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );        
        -- Macro Targets Table --
        CREATE TABLE IF NOT EXISTS macro_targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            protein_percentage INTEGER DEFAULT 30,
            carbs_percentage INTEGER DEFAULT 40,
            fats_percentage INTEGER DEFAULT 30,
            locked_macros TEXT DEFAULT '[]', -- Store as JSON array string '["protein", "fats"]'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CHECK (protein_percentage + carbs_percentage + fats_percentage = 100),
            CHECK (protein_percentage >= 5 AND protein_percentage <= 70),
            CHECK (carbs_percentage >= 5 AND carbs_percentage <= 70),
            CHECK (fats_percentage >= 5 AND fats_percentage <= 70)
        );

        -- Habits Table --
        CREATE TABLE IF NOT EXISTS habits (
            id TEXT PRIMARY KEY NOT NULL,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            icon_name TEXT NOT NULL,
            current INTEGER NOT NULL DEFAULT 0,
            target INTEGER NOT NULL DEFAULT 1,
            accent_color TEXT, -- CHECK removed; validated at app layer
            is_complete INTEGER NOT NULL DEFAULT 0, -- SQLite boolean (0=false, 1=true)
            created_at TEXT NOT NULL, -- Store as ISO 8601 date-time string
            completed_at TEXT, -- Store as ISO 8601 date-time string, NULL until completed
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- NEW: Weight Log Table --
        CREATE TABLE IF NOT EXISTS weight_log (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL, -- Changed to INTEGER to match users.id
          timestamp TEXT NOT NULL, -- Store as ISO string (YYYY-MM-DD)
          weight REAL NOT NULL, -- Use REAL for floating-point numbers
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- NEW: Subscriptions Table --
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          stripe_subscription_id TEXT UNIQUE NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('active', 'canceled', 'past_due', 'unpaid')),
          current_period_end TEXT NOT NULL, -- Store as ISO string
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Stripe Events Table for Deduplication --
        CREATE TABLE IF NOT EXISTS stripe_events (
          id TEXT PRIMARY KEY,
          received_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

  // --- Simple Migration Logic (Add columns if they don't exist) ---
  const checkAndAddColumn = (
    tableName: string,
    columnName: string,
    columnDefinition: string,
    updateLogic?: string
  ) => {
    const columnExists = db
      .prepare(
        `SELECT COUNT(*) as count FROM pragma_table_info(?) WHERE name = ?`
      )
      .get(tableName, columnName) as { count: number };

    if (columnExists.count === 0) {
      logger.info(
        `    ➕ Adding column '${columnName}' to table '${tableName}'...`
      );
      try {
        db.exec(
          `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`
        );
        if (updateLogic) {
          logger.info(
            `       🔄 Running update logic for new column '${columnName}'...`
          );
          db.exec(updateLogic);
        }
      } catch (error) {
        logger.error(
          {
            error: error instanceof Error ? error : new Error(String(error)),
            operation: "add_column",
            tableName,
            columnName,
          },
          `Failed to add column '${columnName}' to '${tableName}'`
        );
      }
    }
  };

  // Apply necessary column additions for existing tables (idempotent)
  checkAndAddColumn("users", "password_reset_token", "TEXT");
  checkAndAddColumn("users", "password_reset_expires", "DATETIME");
  checkAndAddColumn("users", "clerk_id", "TEXT");
  checkAndAddColumn(
    "macro_entries",
    "meal_type",
    "TEXT DEFAULT 'snack' CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))"
  );
  checkAndAddColumn("macro_entries", "meal_name", "TEXT DEFAULT ''");
  checkAndAddColumn(
    "macro_entries",
    "entry_date",
    "TEXT",
    "UPDATE macro_entries SET entry_date = DATE(created_at) WHERE entry_date IS NULL"
  );
  checkAndAddColumn(
    "macro_entries",
    "entry_time",
    "TEXT",
    "UPDATE macro_entries SET entry_time = '12:00:00' WHERE entry_time IS NULL"
  );

  // Apply subscription-related column additions to users table
  checkAndAddColumn(
    "users",
    "subscription_status",
    "subscription_status TEXT DEFAULT 'free'"
  );
  checkAndAddColumn("users", "stripe_customer_id", "stripe_customer_id TEXT");
  // SQLite does not allow adding a column with non-constant default (e.g., CURRENT_TIMESTAMP)
  // So: 1) Add column without default, 2) Backfill, 3) Enforce default in app layer for new inserts
  checkAndAddColumn("users", "updated_at", "updated_at DATETIME");
  // Backfill updated_at for existing rows if column was just added (safe to run every time)
  try {
    db.exec(`
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
    `);
  } catch (error) {
    logger.debug(
      "Backfill for users.updated_at skipped (column may not exist yet)"
    );
  }

  // Apply data constraints for subscription_status (SQLite doesn't support CHECK in ALTER)
  // We'll handle validation in the application layer instead
  try {
    db.exec(`
      UPDATE users 
      SET subscription_status = 'free' 
      WHERE subscription_status NOT IN ('free', 'pro', 'canceled') OR subscription_status IS NULL
    `);
  } catch (error) {
    logger.debug(
      "Subscription status normalization skipped (column may not exist yet)"
    );
  }

  // --- Conditional migration: rebuild habits table if old CHECK constraint exists ---
  try {
    // Inspect current CREATE TABLE statement for habits
    const habitsCreate = db
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'habits'")
      .get() as { sql?: string } | undefined;

    const hasOldCheck =
      habitsCreate?.sql?.includes(
        "accent_color TEXT CHECK(accent_color IN ('indigo', 'blue', 'green', 'purple'))"
      ) ?? false;

    if (hasOldCheck) {
      logger.info("    🔧 Migrating habits table to remove accent_color CHECK constraint...");

      db.exec("BEGIN IMMEDIATE TRANSACTION;");

      // Create new table without CHECK constraint
      db.exec(`
        CREATE TABLE IF NOT EXISTS habits_new (
          id TEXT PRIMARY KEY NOT NULL,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          icon_name TEXT NOT NULL,
          current INTEGER NOT NULL DEFAULT 0,
          target INTEGER NOT NULL DEFAULT 1,
          accent_color TEXT,
          is_complete INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          completed_at TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // Copy all existing data
      db.exec(`
        INSERT INTO habits_new (
          id, user_id, title, icon_name, current, target, accent_color, is_complete, created_at, completed_at
        )
        SELECT
          id, user_id, title, icon_name, current, target, accent_color, is_complete, created_at, completed_at
        FROM habits;
      `);

      // Replace old table
      db.exec("DROP TABLE habits;");
      db.exec("ALTER TABLE habits_new RENAME TO habits;");

      // Recreate indexes for habits (idempotent below will ensure existence)
      db.exec("COMMIT;");
      logger.info("    ✅ habits table migrated successfully.");
    }
  } catch (error) {
    logger.error({ error }, "    ❌ Failed migrating habits table; continuing with initialization");
    try { db.exec("ROLLBACK;"); } catch { /* ROLLBACK can fail if transaction not active */ }
  }

  // --- Indexes for Performance ---
  logger.info("    ⚡ Creating indexes...");

  // Basic single-column indexes
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_entries_user_date ON macro_entries(user_id, entry_date)"
  );
  // Additional performance indexes for macro_entries
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_entries_user_id ON macro_entries(user_id)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_entries_date ON macro_entries(entry_date)"
  );
  db.exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id)");
  // Additional performance index for habits active status
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id, is_complete)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_weight_goals_user ON weight_goals(user_id)"
  );
  // Additional performance index for goals (weight_goals) active status
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_goals_user_id ON weight_goals(user_id)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_targets_user ON macro_targets(user_id)"
  );

  // Weight log indexes
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_weight_log_user_timestamp ON weight_log(user_id, timestamp)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_weight_log_user_created_at ON weight_log(user_id, created_at)"
  );

  // --- Advanced Compound Indexes for Performance Optimization ---
  logger.info("    🚀 Creating compound performance indexes...");

  // Macro entries optimized for common query patterns
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_entries_user_date_meal ON macro_entries(user_id, entry_date, meal_type)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_macro_entries_user_date_desc ON macro_entries(user_id, entry_date DESC, created_at DESC)"
  );

  // Weight log optimized for chronological queries
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_weight_log_user_timestamp_desc ON weight_log(user_id, timestamp DESC)"
  );

  // Habits optimized for completion status queries
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_habits_user_complete ON habits(user_id, is_complete)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_habits_user_created ON habits(user_id, created_at DESC)"
  );

  // User details lookup optimization
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_user_details_user ON user_details(user_id)"
  );

  // Subscription system indexes
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)"
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_subscriptions_active_until ON subscriptions(current_period_end)"
  );

  logger.info("✅ Database schema initialized successfully.");
}
