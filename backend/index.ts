import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { Database } from "bun:sqlite";
import { hash, verify } from "@node-rs/bcrypt";
// import jwt_secret from "./.env";

const db = new Database("macro_tracker.db");

// Initialize database
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
`);

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
      secret: process.env.JWT_SECRET!,
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
        activityLevel 
      } = body as {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        height: number;
        weight: number;
        gender: 'male' | 'female';
        activityLevel: 'sedentary' | 'light' | 'moderate' | 'very' | 'extra';
      };

      // Double check email uniqueness
      const existingUser = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email);

      if (existingUser) {
        set.status = 400;
        return { error: "Email already registered" };
      }

      const activityLevelMap = {
        'sedentary': 1,
        'light': 2,
        'moderate': 3,
        'very': 4,
        'extra': 5
      };

      const hashedPassword = await hash(password, 10);
      
      // Use a transaction to ensure both user and details are created or neither is
      db.exec('BEGIN TRANSACTION');
      
      try {
        // Insert user
        const userResult = db
          .prepare(
            "INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)"
          )
          .run(email, hashedPassword, firstName, lastName);

        const userId = Number(userResult.lastInsertRowid);

        // Insert user details
        db.prepare(`
          INSERT INTO user_details (
            user_id, 
            date_of_birth, 
            height, 
            weight,
            gender,
            activity_level
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          dateOfBirth,
          height,
          weight,
          gender,
          activityLevelMap[activityLevel]
        );

        db.exec('COMMIT');

        const token = await jwt.sign({
          userId,
          email,
          firstName,
          lastName
        });

        return { token };
      } catch (error) {
        db.exec('ROLLBACK');
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
          lastName: user.last_name
        });

        return { token };
      } catch (error) {
        console.error("Login error:", error);
        set.status = 500;
        return { error: "Login failed" };
      }
    }
  )
  // Protected routes
  .derive(async ({ jwt, request: { headers } }) => {
    const authHeader = headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return { userId: null };

    const token = authHeader.slice(7);
    const payload = await jwt.verify(token);

    if (!payload) return { userId: null };

    return { userId: (payload as { userId: number }).userId };
  })
  .onBeforeHandle({ as: "global" }, ({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  // User endpoints
  .get("/api/user/me", ({ userId }) => {
    try {
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

      return user;
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
        AND DATE(created_at) = DATE('now', 'localtime')`
      )
      .get(userId) as { protein: number; carbs: number; fats: number };

    const calories = result.protein * 4 + result.carbs * 4 + result.fats * 9;
    return { ...result, calories };
  })

  .get("/api/macros/history/:unused?", ({ userId }) => {
    return db
      .prepare(
        `SELECT id, protein, carbs, fats, created_at 
          FROM macro_entries 
          WHERE user_id = ? 
          ORDER BY created_at DESC`
      )
      .all(userId);
  })
  .post("/api/macro_entry", ({ userId, body }) => {
    const { protein, carbs, fats } = body as Record<string, number>;

    if ([protein, carbs, fats].some((val) => val < 0)) {
      throw new Error("Invalid macro values");
    }

    db.prepare(
      "INSERT INTO macro_entries (protein, carbs, fats, user_id) VALUES (?, ?, ?, ?)"
    ).run(protein, carbs, fats, userId);

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
    const { protein, carbs, fats } = body as Record<string, number>;

    if ([protein, carbs, fats].some((val) => val < 0)) {
      throw new Error("Invalid macro values");
    }

    db.prepare(
      "UPDATE macro_entries SET protein = ?, carbs = ?, fats = ? WHERE id = ? AND user_id = ?"
    ).run(protein, carbs, fats, id, userId);

    return { success: true };
  })
  .put("/api/user/settings", ({ userId, body }) => {
    const { first_name, last_name, email, date_of_birth, height, weight, gender, activity_level } = body as {
      first_name: string;
      last_name: string;
      email: string;
      date_of_birth?: string;
      height?: number;
      weight?: number;
      gender?: 'male' | 'female';
      activity_level?: number;
    };
  
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
      const dateOfBirthValue = date_of_birth === undefined ? null : date_of_birth;
      const heightValue = height === undefined ? null : height;
      const weightValue = weight === undefined ? null : weight;
      const genderValue = gender === undefined ? null : gender;
      const activityLevelValue = activity_level === undefined ? null : activity_level;

      // Update user_details table
      db.prepare(`
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
      `).run(
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
      const activityLevelValue = activityLevel === undefined ? null : activityLevel;

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
