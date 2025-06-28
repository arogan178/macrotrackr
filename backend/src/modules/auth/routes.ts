// src/modules/auth/routes.ts
import { Elysia } from "elysia";
import { db } from "../../db";
import { AuthSchemas } from "./schemas";
import { hashPassword, verifyPassword } from "../../lib/password";
import {
  safeQuery,
  safeExecute,
  withTransaction,
  type UserRow,
} from "../../lib/database";
import { ConflictError, AuthenticationError } from "../../lib/errors";

export const authRoutes = (app: Elysia) =>
  app.group("/api/auth", (group) =>
    group
      .decorate("db", db)

      // Email Validation
      .post(
        "/validate-email",
        async ({ body, db }) => {
          const existingUser = safeQuery<UserRow>(
            db,
            "SELECT id FROM users WHERE email = ?",
            [body.email]
          );

          if (existingUser) {
            throw new ConflictError("Email is already registered.");
          }

          return { valid: true };
        },
        {
          body: AuthSchemas.validateEmail,
          detail: {
            summary: "Check if an email is available for registration",
            tags: ["Auth"],
          },
        }
      )

      // User Registration
      .post(
        "/register",
        async (context: any) => {
          const { body, db, jwt } = context;
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

          const hashedPassword = await hashPassword(password);

          const userData = withTransaction(db, () => {
            // Check email uniqueness within transaction
            const existingUser = safeQuery<UserRow>(
              db,
              "SELECT id FROM users WHERE email = ?",
              [email]
            );

            if (existingUser) {
              throw new ConflictError(
                "Email has just been registered. Please try logging in."
              );
            }

            // Insert user
            const userResult = safeExecute(
              db,
              "INSERT INTO users (email, password, first_name, last_name) VALUES (?, ?, ?, ?)",
              [email, hashedPassword, firstName, lastName]
            );
            const userId = Number(userResult.lastInsertRowid);

            // Insert user details
            safeExecute(
              db,
              `INSERT INTO user_details (user_id, date_of_birth, height, weight, gender, activity_level)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [userId, dateOfBirth, height, weight, gender, activityLevel]
            );

            // Insert default macro targets
            safeExecute(
              db,
              `INSERT INTO macro_targets (user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros)
               VALUES (?, 30, 40, 30, '[]')`,
              [userId]
            );

            return { userId, email, firstName, lastName };
          });

          // Generate JWT token
          const token = await jwt.sign({
            userId: userData.userId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
          });

          return { token };
        },
        {
          body: AuthSchemas.register,
          response: AuthSchemas.tokenResponse,
          detail: { summary: "Register a new user account", tags: ["Auth"] },
        }
      )

      // User Login
      .post(
        "/login",
        async (context: any) => {
          const { body, db, jwt } = context;

          const user = safeQuery<UserRow>(
            db,
            "SELECT id, password, first_name, last_name, email FROM users WHERE email = ?",
            [body.email]
          );

          if (!user || !user.password) {
            throw new AuthenticationError("Invalid email or password.");
          }

          const isPasswordValid = await verifyPassword(
            body.password,
            user.password
          );
          if (!isPasswordValid) {
            throw new AuthenticationError("Invalid email or password.");
          }

          // Generate JWT token
          const token = await jwt.sign({
            userId: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
          });

          return { token };
        },
        {
          body: AuthSchemas.login,
          response: AuthSchemas.tokenResponse,
          detail: {
            summary: "Authenticate user and retrieve JWT token",
            tags: ["Auth"],
          },
        }
      )
  );
