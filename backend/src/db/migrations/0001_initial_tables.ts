import type { Database } from "bun:sqlite";

// IF NOT EXISTS lets a database from before numbered migrations run this too.
// It gains only the tables it lacks, and 0002-0021 add the missing columns.
export function initialTables(db: Database) {
  db.exec(`
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
            password_reset_expires DATETIME,
            -- Opaque per-account token handed to Play at purchase time and
            -- echoed back in notifications. Lets a Play notification find its
            -- account even when the app never got to claim the purchase.
            play_obfuscated_account_id TEXT,
            updated_at DATETIME
        );

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
            switching_source TEXT CHECK(switching_source IN ('cronometer', 'loseit', 'macrofactor', 'myfitnesspal', 'new_to_tracking', 'other', 'spreadsheet', 'unknown')),
            unit_system TEXT DEFAULT 'metric' CHECK(unit_system IN ('metric', 'imperial')), -- display only; values are always stored metric
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

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
            ingredients TEXT DEFAULT '[]',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

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
            period_date TEXT, -- User's local YYYY-MM-DD that current belongs to (the Monday for weekly); any other period reads as 0
            frequency TEXT NOT NULL DEFAULT 'daily' CHECK(frequency IN ('daily', 'weekly')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS weight_log (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL, -- Changed to INTEGER to match users.id
          timestamp TEXT NOT NULL, -- Store as ISO string (YYYY-MM-DD)
          weight REAL NOT NULL, -- Use REAL for floating-point numbers
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          -- Who took the money. Web checkout is 'stripe', the Android app is
          -- 'play'. Entitlement does not care which: both write the same
          -- status and current_period_end, so Pro bought on either surface
          -- unlocks the other.
          provider TEXT NOT NULL DEFAULT 'stripe' CHECK(provider IN ('stripe', 'play')),
          -- Stripe subscription id, or the Play purchase token.
          provider_subscription_id TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('active', 'canceled', 'past_due', 'unpaid')),
          current_period_end TEXT NOT NULL, -- Store as ISO string
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(provider, provider_subscription_id)
        );

        CREATE TABLE IF NOT EXISTS stripe_events (
          id TEXT PRIMARY KEY,
          received_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Play Real-time Developer Notification dedupe. Pub/Sub delivers at
        -- least once, so the same message id can arrive more than once.
        CREATE TABLE IF NOT EXISTS play_billing_events (
          id TEXT PRIMARY KEY,
          received_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Local auth mode sessions
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          secret_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip TEXT,
          user_agent TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          used_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS saved_meals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          protein REAL NOT NULL CHECK(protein >= 0.0),
          carbs REAL NOT NULL CHECK(carbs >= 0.0),
          fats REAL NOT NULL CHECK(fats >= 0.0),
          meal_type TEXT DEFAULT 'snack' CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ingredients TEXT DEFAULT '[]',
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
  `);
}
