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
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    date_of_birth TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  .post("/api/auth/register", async ({ body, set, jwt }) => {
    try {
      const { email, password, fullName } = body as {
        email: string;
        password: string;
        fullName: string;
      };

      const existingUser = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email);

      if (existingUser) {
        set.status = 400;
        return { error: "User already exists" };
      }

      const hashedPassword = await hash(password, 10);
      // Update SQL query to include fullName
      const result = db
        .prepare(
          "INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)"
        )
        .run(email, hashedPassword, fullName);

      const token = await jwt.sign({
        userId: Number(result.lastInsertRowid),
        email: email,
        fullName: fullName, // Keep camelCase in JWT
      });

      return { token };
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

        // Select fullName from database
        const user = db
          .prepare(
            `
        SELECT 
          id, 
          password, 
          full_name AS fullName 
        FROM users 
        WHERE email = ?
      `
          )
          .get(email) as {
          id: number;
          password: string;
          fullName: string;
        };

        if (!user || !user.password) {
          set.status = 401;
          return { error: "User does not exist" };
        }

        const valid = await verify(password, user.password); // Updated here

        if (!valid) {
          set.status = 401;
          return { error: "Invalid credentials" };
        }

        const token = await jwt.sign({
          userId: user.id,
          email,
          fullName: user.fullName, // Use aliased property
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

    return { userId: payload?.userId as number | null };
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
            id, 
            email,
            full_name,
            strftime('%Y-%m-%d %H:%M:%S', created_at) as created_at 
          FROM users 
          WHERE id = ?
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
  .listen(3000);

console.log(
  `Server running at http://${app.server?.hostname}:${app.server?.port}`
);
