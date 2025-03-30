import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { Database } from "bun:sqlite";
import { hash, verify } from "@node-rs/bcrypt";
// import jwt_secret from "@/.env";

const db = new Database("macro_tracker.db");

// Initialize database with basic tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    date_of_birth TEXT,
    height FLOAT,
    weight FLOAT,
    gender TEXT CHECK(gender IN ('male', 'female')),
    activity_level INTEGER CHECK(activity_level BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS macro_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protein INTEGER NOT NULL,
    carbs INTEGER NOT NULL,
    fats INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  
  CREATE TABLE IF NOT EXISTS macro_distribution (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    protein_percentage INTEGER NOT NULL DEFAULT 30,
    carbs_percentage INTEGER NOT NULL DEFAULT 40,
    fats_percentage INTEGER NOT NULL DEFAULT 30,
    locked_macros TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    CHECK (protein_percentage + carbs_percentage + fats_percentage = 100),
    CHECK (protein_percentage >= 5 AND protein_percentage <= 70),
    CHECK (carbs_percentage >= 5 AND carbs_percentage <= 70),
    CHECK (fats_percentage >= 5 AND fats_percentage <= 70)
  );
`);

// Check if meal_type column exists in macro_entries table
const mealTypeExists = db
  .prepare("PRAGMA table_info(macro_entries)")
  .all()
  .some((col) => col.name === "meal_type");
if (!mealTypeExists) {
  console.log("Adding meal_type column to macro_entries table");
  db.exec(
    "ALTER TABLE macro_entries ADD COLUMN meal_type TEXT DEFAULT 'breakfast'"
  );
}

// Check if meal_name column exists in macro_entries table
const mealNameExists = db
  .prepare("PRAGMA table_info(macro_entries)")
  .all()
  .some((col) => col.name === "meal_name");
if (!mealNameExists) {
  console.log("Adding meal_name column to macro_entries table");
  db.exec("ALTER TABLE macro_entries ADD COLUMN meal_name TEXT DEFAULT ''");
}

// Check if entry_date column exists in macro_entries table
const entryDateExists = db
  .prepare("PRAGMA table_info(macro_entries)")
  .all()
  .some((col) => col.name === "entry_date");
if (!entryDateExists) {
  console.log("Adding entry_date column to macro_entries table");
  // Add column without default value
  db.exec("ALTER TABLE macro_entries ADD COLUMN entry_date DATE");

  // Update existing rows to use the date part of created_at
  console.log("Updating existing entries with dates from created_at");
  db.exec("UPDATE macro_entries SET entry_date = DATE(created_at)");
}

// Check if entry_time column exists in macro_entries table
const entryTimeExists = db
  .prepare("PRAGMA table_info(macro_entries)")
  .all()
  .some((col) => col.name === "entry_time");
if (!entryTimeExists) {
  console.log("Adding entry_time column to macro_entries table");
  db.exec("ALTER TABLE macro_entries ADD COLUMN entry_time TEXT");

  // Set default times for existing entries
  console.log("Updating existing entries with default time");
  db.exec(
    "UPDATE macro_entries SET entry_time = '12:00' WHERE entry_time IS NULL"
  );
}

// Create indexes for performance
db.exec(
  "CREATE INDEX IF NOT EXISTS idx_macro_entries_user_date ON macro_entries(user_id, entry_date)"
);
db.exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");

const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "macro-tracker-default-secret-key",
      exp: "7d",
    })
  )
  // Auth endpoints
  .post("/api/auth/validate-email", async ({ body, set }) => {
    try {
      const { email } = body as { email: string };

      const existingUser = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email);

      if (existingUser) {
        set.status = 400;
        return { error: "Email already registered" };
      }

      return { valid: true };
    } catch (error) {
      console.error("Email validation error:", error);
      set.status = 500;
      return { error: "Validation failed" };
    }
  })

  .post("/api/auth/register-complete", async ({ body, set, jwt }) => {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        dateOfBirth,
        height,
        weight,
        gender,
        activityLevel,
      } = body as {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        height: number;
        weight: number;
        gender: "male" | "female" | "";
        activityLevel: "sedentary" | "light" | "moderate" | "very" | "extra";
      };

      // Double check email uniqueness
      const existingUser = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email);

      if (existingUser) {
        set.status = 400;
        return { error: "Email already registered" };
      }

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        set.status = 400;
        return { error: "Missing required fields" };
      }

      // Validate gender - must be either 'male' or 'female'
      if (gender !== "male" && gender !== "female") {
        set.status = 400;
        return { error: "Gender must be either 'male' or 'female'" };
      }

      const activityLevelMap = {
        sedentary: 1,
        light: 2,
        moderate: 3,
        very: 4,
        extra: 5,
      };

      const hashedPassword = await hash(password, 10);

      // Use a transaction to ensure both user and details are created or neither is
      db.exec("BEGIN TRANSACTION");

      try {
        // Insert user
        const userResult = db
          .prepare(
            "INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)"
          )
          .run(email, hashedPassword, firstName, lastName);

        const userId = Number(userResult.lastInsertRowid);

        // Insert user details
        db.prepare(
          `
          INSERT INTO user_details (
            user_id, 
            date_of_birth, 
            height, 
            weight,
            gender,
            activity_level
          ) VALUES (?, ?, ?, ?, ?, ?)
        `
        ).run(
          userId,
          dateOfBirth,
          height,
          weight,
          gender,
          activityLevelMap[activityLevel]
        );

        // Insert default macro distribution
        db.prepare(
          `
          INSERT INTO macro_distribution (
            user_id, 
            protein_percentage, 
            carbs_percentage, 
            fats_percentage
          ) VALUES (?, ?, ?, ?)
        `
        ).run(userId, 30, 40, 30);

        db.exec("COMMIT");

        const token = await jwt.sign({
          userId,
          email,
          firstName,
          lastName,
        });

        return { token };
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("Registration error:", error);
      set.status = 500;
      return { error: "Registration failed" };
    }
  })

  .post(
    "/api/auth/login",
    async ({ body, set, jwt }: { body: any; set: any; jwt: any }) => {
      try {
        const { email, password } = body as { email: string; password: string };

        const user = db
          .prepare(
            `
            SELECT 
              id, 
              password, 
              first_name,
              last_name,
              email
            FROM users 
            WHERE email = ?
            `
          )
          .get(email) as {
          id: number;
          password: string;
          first_name: string;
          last_name: string;
          email: string;
        };

        if (!user || !user.password) {
          set.status = 401;
          return { error: "User does not exist" };
        }

        const valid = await verify(password, user.password);

        if (!valid) {
          set.status = 401;
          return { error: "Invalid credentials" };
        }

        const token = await jwt.sign({
          userId: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        });

        return { token };
      } catch (error) {
        console.error("Login error:", error);
        set.status = 500;
        return { error: "Login failed" };
      }
    }
  )
  // Authentication middleware
  .derive(async ({ jwt, request: { headers }, path }) => {
    // Skip authentication for login/register routes
    const authExemptPaths = [
      "/api/auth/login",
      "/api/auth/register-complete",
      "/api/auth/validate-email",
    ];

    if (authExemptPaths.includes(path)) {
      return { userId: "exempt" };
    }

    const authHeader = headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return { userId: null };
    }

    const token = authHeader.slice(7);
    try {
      const payload = await jwt.verify(token);

      if (!payload) {
        return { userId: null };
      }

      return { userId: (payload as { userId: number }).userId };
    } catch (error) {
      return { userId: null };
    }
  })
  .onBeforeHandle({ as: "global" }, ({ userId, set, path }) => {
    // Skip authentication for login/register routes
    const authExemptPaths = [
      "/api/auth/login",
      "/api/auth/register-complete",
      "/api/auth/validate-email",
    ];

    if (authExemptPaths.includes(path) || userId === "exempt") {
      return;
    }

    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  // User endpoints
  .get("/api/user/me", ({ userId }) => {
    try {
      // Get user and user details
      const user = db
        .prepare(
          `
          SELECT 
            u.id,
            u.email,
            u.first_name,
            u.last_name,
            ud.date_of_birth,
            ud.height,
            ud.weight,
            ud.gender,
            ud.activity_level,
            u.created_at
          FROM users u
          LEFT JOIN user_details ud ON u.id = ud.user_id
          WHERE u.id = ?
        `
        )
        .get(userId);

      if (!user) {
        throw new Error("User not found");
      }

      // Get macro distribution settings
      const macroDistribution = db
        .prepare(
          `
          SELECT 
            protein_percentage AS proteinPercentage,
            carbs_percentage AS carbsPercentage,
            fats_percentage AS fatsPercentage,
            locked_macros
          FROM macro_distribution
          WHERE user_id = ?
        `
        )
        .get(userId) || {
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
        locked_macros: "[]",
      };

      return {
        ...user,
        macro_distribution: {
          ...macroDistribution,
          locked_macros: JSON.parse(macroDistribution.locked_macros),
        },
      };
    } catch (error) {
      console.error("User details error:", error);
      throw new Error("Failed to fetch user details");
    }
  })
  // Macro endpoints
  .get("/api/macro_entry/:unused?", ({ userId }) => {
    const result = db
      .prepare(
        `SELECT 
          COALESCE(SUM(protein), 0) AS protein,
          COALESCE(SUM(carbs), 0) AS carbs,
          COALESCE(SUM(fats), 0) AS fats
        FROM macro_entries
        WHERE user_id = ?
        AND DATE(entry_date) = DATE('now', 'localtime')`
      )
      .get(userId) as { protein: number; carbs: number; fats: number };

    const calories = result.protein * 4 + result.carbs * 4 + result.fats * 9;
    return { ...result, calories };
  })

  .get("/api/macros/history/:unused?", ({ userId }) => {
    return db
      .prepare(
        `SELECT 
          id, 
          protein, 
          carbs, 
          fats, 
          meal_type, 
          meal_name, 
          entry_date,
          entry_time, 
          created_at 
        FROM macro_entries 
        WHERE user_id = ? 
        ORDER BY entry_date DESC, entry_time DESC, created_at DESC`
      )
      .all(userId);
  })
  .post("/api/macro_entry", ({ userId, body }) => {
    const { protein, carbs, fats, mealType, mealName, date, time } = body as {
      protein: number;
      carbs: number;
      fats: number;
      mealType: string;
      mealName: string;
      date: string;
      time: string; // Added time parameter
    };

    if ([protein, carbs, fats].some((val) => val < 0)) {
      throw new Error("Invalid macro values");
    }

    db.prepare(
      `INSERT INTO macro_entries 
        (protein, carbs, fats, meal_type, meal_name, entry_date, entry_time, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(protein, carbs, fats, mealType, mealName, date, time, userId);

    return { success: true };
  })
  .delete("/api/macro_entry/:id", ({ params, userId }) => {
    const id = Number(params.id);
    db.prepare("DELETE FROM macro_entries WHERE id = ? AND user_id = ?").run(
      id,
      userId
    );
    return { success: true };
  })
  .put("/api/macro_entry/:id", ({ params, userId, body }) => {
    const id = Number(params.id);
    const { protein, carbs, fats, mealType, mealName, date } = body as {
      protein: number;
      carbs: number;
      fats: number;
      mealType?: string;
      mealName?: string;
      date?: string;
    };

    if ([protein, carbs, fats].some((val) => val < 0)) {
      throw new Error("Invalid macro values");
    }

    const updateFields = ["protein = ?", "carbs = ?", "fats = ?"];
    const queryParams = [protein, carbs, fats]; // Changed variable name from params to queryParams

    if (mealType) {
      updateFields.push("meal_type = ?");
      queryParams.push(mealType);
    }

    if (mealName) {
      updateFields.push("meal_name = ?");
      queryParams.push(mealName);
    }

    if (date) {
      updateFields.push("entry_date = ?");
      queryParams.push(date);
    }

    queryParams.push(id, userId); // Using queryParams instead of params

    db.prepare(
      `UPDATE macro_entries 
       SET ${updateFields.join(", ")} 
       WHERE id = ? AND user_id = ?`
    ).run(...queryParams); // Using queryParams instead of params

    return { success: true };
  })
  .put("/api/user/settings", ({ userId, body }) => {
    const {
      first_name,
      last_name,
      email,
      date_of_birth,
      height,
      weight,
      gender,
      activity_level,
      macro_distribution,
    } = body as {
      first_name: string;
      last_name: string;
      email: string;
      date_of_birth?: string;
      height?: number;
      weight?: number;
      gender?: "male" | "female";
      activity_level?: number;
      macro_distribution?: {
        proteinPercentage: number;
        carbsPercentage: number;
        fatsPercentage: number;
        locked_macros?: string[];
      };
    };

    try {
      // Use a transaction to ensure all updates succeed or fail together
      db.exec("BEGIN TRANSACTION");

      try {
        // Update users table
        const userUpdateFields = [];
        const userParams = [];

        if (first_name) {
          userUpdateFields.push("first_name = ?");
          userParams.push(first_name);
        }
        if (last_name) {
          userUpdateFields.push("last_name = ?");
          userParams.push(last_name);
        }
        if (email) {
          userUpdateFields.push("email = ?");
          userParams.push(email);
        }

        userParams.push(userId);

        if (userUpdateFields.length > 0) {
          db.prepare(
            `UPDATE users SET ${userUpdateFields.join(", ")} WHERE id = ?`
          ).run(...userParams);
        }

        // Convert undefined values to null for SQLite
        const dateOfBirthValue =
          date_of_birth === undefined ? null : date_of_birth;
        const heightValue = height === undefined ? null : height;
        const weightValue = weight === undefined ? null : weight;
        const genderValue = gender === undefined ? null : gender;
        const activityLevelValue =
          activity_level === undefined ? null : activity_level;

        // Update user_details table
        db.prepare(
          `
          INSERT INTO user_details (
            user_id,
            date_of_birth,
            height,
            weight,
            gender,
            activity_level,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id) DO UPDATE SET
            date_of_birth = ?,
            height = ?,
            weight = ?,
            gender = ?,
            activity_level = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `
        ).run(
          userId,
          dateOfBirthValue,
          heightValue,
          weightValue,
          genderValue,
          activityLevelValue,
          dateOfBirthValue,
          heightValue,
          weightValue,
          genderValue,
          activityLevelValue,
          userId
        );

        // Update macro distribution if provided
        if (macro_distribution) {
          db.prepare(
            `
            INSERT INTO macro_distribution (
              user_id,
              protein_percentage,
              carbs_percentage,
              fats_percentage,
              locked_macros,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
              protein_percentage = ?,
              carbs_percentage = ?,
              fats_percentage = ?,
              locked_macros = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `
          ).run(
            userId,
            macro_distribution.proteinPercentage,
            macro_distribution.carbsPercentage,
            macro_distribution.fatsPercentage,
            JSON.stringify(macro_distribution.locked_macros || []),
            macro_distribution.proteinPercentage,
            macro_distribution.carbsPercentage,
            macro_distribution.fatsPercentage,
            JSON.stringify(macro_distribution.locked_macros || []),
            userId
          );
        }

        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error("Settings update error:", error);
      throw new Error("Failed to update settings");
    }
  })
  .post("/api/user/complete-profile", async ({ body, userId, set }) => {
    try {
      const { dateOfBirth, height, weight, activityLevel } = body as {
        dateOfBirth?: string;
        height?: number;
        weight?: number;
        activityLevel?: number;
      };

      // Convert undefined values to null for SQLite
      const dateOfBirthValue = dateOfBirth === undefined ? null : dateOfBirth;
      const heightValue = height === undefined ? null : height;
      const weightValue = weight === undefined ? null : weight;
      const activityLevelValue =
        activityLevel === undefined ? null : activityLevel;

      const stmt = db.prepare(`
        INSERT INTO user_details (user_id, date_of_birth, height, weight, activity_level)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          date_of_birth = COALESCE(?, date_of_birth),
          height = COALESCE(?, height),
          weight = COALESCE(?, weight),
          activity_level = COALESCE(?, activity_level),
          updated_at = CURRENT_TIMESTAMP
      `);

      stmt.run(
        userId,
        dateOfBirthValue,
        heightValue,
        weightValue,
        activityLevelValue,
        dateOfBirthValue,
        heightValue,
        weightValue,
        activityLevelValue
      );

      return { success: true };
    } catch (error) {
      console.error("Profile completion error:", error);
      set.status = 500;
      return { error: "Failed to complete profile" };
    }
  })
  .listen(3000);

console.log(
  `Server running at http://${app.server?.hostname}:${app.server?.port}`
);
