// src/modules/auth/routes.ts
import { Elysia } from "elysia"; // Removed named Error imports
import { db } from "../../db"; // Import shared db instance
import { AuthSchemas } from "./schemas"; // Import schemas for this module
import { hashPassword, verifyPassword } from "../../lib/password"; // Import password utils
import type { AuthenticatedUserPayload } from "../../middleware/auth"; // Import user type if needed

export const authRoutes = (
  app: Elysia // Pass Elysia instance to attach routes
) =>
  app.group(
    "/api/auth",
    (
      group // Group routes under /api/auth
    ) =>
      group
        // Use the shared DB instance available in the context (decorated in index.ts)
        .decorate("db", db)
        // Inject JWT capabilities (already available via middleware, but explicit dependency can be good)
        .derive(({ jwt }) => ({ jwt }))

        // --- Email Validation ---
        .post(
          "/validate-email",
          async ({ body, db, set }) => {
            // Added 'set'
            try {
              const existingUser = db
                .prepare("SELECT id FROM users WHERE email = ?")
                .get(body.email);

              if (existingUser) {
                set.status = 409; // Conflict
                throw new Error("Email is already registered.");
              }
              return { valid: true };
            } catch (error) {
              // Re-throw if it's our specific error
              if (error instanceof Error && set.status === 409) throw error;
              console.error("Email validation DB error:", error);
              set.status = 500; // Internal Server Error
              throw new Error("Failed to validate email.");
            }
          },
          {
            body: AuthSchemas.validateEmail,
            detail: {
              summary: "Check if an email is available for registration",
              tags: ["Auth"],
            },
          }
        )

        // --- User Registration ---
        // Changed path to /register from /register-complete
        .post(
          "/register",
          async ({ body, db, jwt, set }) => {
            // Added 'set'
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
            } = body;

            // Hash password before database operations
            const hashedPassword = await hashPassword(password);

            // Use a transaction for atomic inserts
            const transaction = db.transaction(() => {
              // 1. Double-check email uniqueness within the transaction
              const existingUser = db
                .prepare("SELECT id FROM users WHERE email = ?")
                .get(email);
              if (existingUser) {
                set.status = 409; // Conflict
                throw new Error(
                  "Email has just been registered. Please try logging in."
                );
              }

              // 2. Insert user
              const userResult = db
                .prepare(
                  "INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)"
                )
                .run(email, hashedPassword, firstName, lastName);
              const userId = Number(userResult.lastInsertRowid);

              // 3. Insert user details
              db.prepare(
                `
                        INSERT INTO user_details (user_id, date_of_birth, height, weight, gender, activity_level)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `
              ).run(userId, dateOfBirth, height, weight, gender, activityLevel);

              // 4. Insert default macro target settings
              db.prepare(
                `
    INSERT INTO macro_targets (user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros)
    VALUES (?, 30, 40, 30, '[]')
`
              ).run(userId);

              return { userId, email, firstName, lastName }; // Return data needed for JWT signing
            });

            try {
              // Execute the transaction
              const userData = transaction();

              // Generate JWT token upon successful registration
              const token = await jwt.sign({
                userId: userData.userId,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
              });

              return { token };
            } catch (error) {
              // Re-throw if it's our specific error from the transaction
              if (error instanceof Error && set.status === 409) throw error;
              console.error("Registration transaction error:", error);
              set.status = 500; // Internal Server Error
              throw new Error("Registration failed due to a server issue.");
            }
          },
          {
            body: AuthSchemas.register,
            response: AuthSchemas.tokenResponse, // Validate response shape
            detail: { summary: "Register a new user account", tags: ["Auth"] },
          }
        )

        // --- User Login ---
        .post(
          "/login",
          async ({ body, db, jwt, set }) => {
            // Added 'set'
            try {
              // Retrieve user by email
              const user = db
                .prepare(
                  "SELECT id, password, first_name, last_name, email FROM users WHERE email = ?"
                )
                .get(body.email) as {
                id: number;
                password?: string;
                first_name: string;
                last_name: string;
                email: string;
              } | null;

              // Check if user exists and has a password set
              if (!user || !user.password) {
                set.status = 401; // Unauthorized
                throw new Error("Invalid email or password."); // Generic error for security
              }

              // Verify the provided password against the stored hash
              const isPasswordValid = await verifyPassword(
                body.password,
                user.password
              );

              if (!isPasswordValid) {
                set.status = 401; // Unauthorized
                throw new Error("Invalid email or password."); // Generic error
              }

              // Generate JWT token upon successful login
              const token = await jwt.sign({
                userId: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
              });

              return { token };
            } catch (error) {
              // Re-throw if it's our specific error
              if (error instanceof Error && set.status === 401) throw error;
              console.error("Login error:", error);
              set.status = 500; // Internal Server Error
              throw new Error("Login failed due to a server issue.");
            }
          },
          {
            body: AuthSchemas.login,
            response: AuthSchemas.tokenResponse, // Validate response shape
            detail: {
              summary: "Authenticate user and retrieve JWT token",
              tags: ["Auth"],
            },
          }
        )
  );
