// src/modules/user/routes.ts
import { Elysia, t } from "elysia";
import { db } from "../../db";
// Import schemas that now use macroTarget and camelCase
import { UserSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../middleware/auth";
// Import the specific type for percentages if needed, or rely on schema inference
// Assuming MacroTargetPercentages is defined in schemas.ts or types
import type { MacroTargetPercentages } from "./schemas"; // Adjust import path if needed

// Helper function
const nullify = <T>(value: T | undefined | null): T | null =>
  value === undefined || value === null ? null : value;

// DB Result Type for the JOIN query in GET /me (snake_case)
// Fetches from users, user_details, and macro_targets
type UserMeQueryResult = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string | Date;
  date_of_birth: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  activity_level: number | null;
  // Fields from macro_targets table (snake_case)
  protein_percentage: number | null;
  carbs_percentage: number | null;
  fats_percentage: number | null;
  locked_macros: string | null; // JSON string
};

// API Response Type (camelCase) - Matches UserSchemas.userDetailsResponse
type UserMeApiResponse = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string | Date;
  dateOfBirth: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  activityLevel: number | null;
  macroTarget: MacroTargetPercentages | null; // Use the specific type
};

export const userRoutes = (app: Elysia) =>
  app.group("/api/user", (group) =>
    group
      .decorate("db", db)
      // GET /me Handler - Updated Query and Mapping
      .get(
        "/me",
        ({ db, user, set }: AuthenticatedContext): UserMeApiResponse | null => {
          console.log(
            `[GET /user/me] Fetching details for user ID: ${user.userId}`
          );
          try {
            // Fetch user base info, details, and macro distribution settings
            const query = `
                SELECT
                    u.id, u.email, u.first_name, u.last_name, u.created_at,
                    ud.date_of_birth, ud.height, ud.weight, ud.gender, ud.activity_level,
                    md.protein_percentage, md.carbs_percentage, md.fats_percentage, md.locked_macros
                FROM users u
                LEFT JOIN user_details ud ON u.id = ud.user_id
                LEFT JOIN macro_targets md ON u.id = md.user_id
                WHERE u.id = ?
            `;
            const dbResult = db.prepare(query).get(user.userId) as
              | UserMeQueryResult
              | undefined;
            console.log("[GET /user/me] Raw DB result:", dbResult);

            if (dbResult === undefined) {
              console.log("[GET /user/me] User not found in DB.");
              set.status = 404;
              throw new Error("User data not found.");
            }

            let parsedLockedMacros: Array<"protein" | "carbs" | "fats"> = [];
            let macroTargetMapped: MacroTargetPercentages | null = null;

            // Check if macro distribution data exists before parsing/mapping
            // Use a key field like protein_percentage to check existence
            if (dbResult.protein_percentage !== null) {
              const lockedMacrosJson = dbResult.locked_macros;
              console.log(
                "[GET /user/me] Raw locked_macros JSON:",
                lockedMacrosJson
              );
              if (lockedMacrosJson) {
                try {
                  parsedLockedMacros = JSON.parse(lockedMacrosJson);
                  console.log(
                    "[GET /user/me] Parsed locked_macros:",
                    parsedLockedMacros
                  );
                } catch (e) {
                  console.error(
                    "[GET /user/me] Failed to parse locked_macros JSON:",
                    e
                  );
                }
              }
              // Construct the nested object using camelCase keys
              macroTargetMapped = {
                proteinPercentage: dbResult.protein_percentage,
                carbsPercentage: dbResult.carbs_percentage,
                fatsPercentage: dbResult.fats_percentage,
                lockedMacros: parsedLockedMacros, // Use camelCase key
              };
            } else {
              console.log("[GET /user/me] No macro distribution data found.");
            }

            // Map DB result (snake_case) to API response (camelCase)
            const apiResponse: UserMeApiResponse = {
              id: dbResult.id,
              email: dbResult.email,
              firstName: dbResult.first_name,
              lastName: dbResult.last_name,
              createdAt: dbResult.created_at,
              dateOfBirth: dbResult.date_of_birth,
              height: dbResult.height,
              weight: dbResult.weight,
              gender: dbResult.gender,
              activityLevel: dbResult.activity_level,
              macroTarget: macroTargetMapped, // Use the mapped object (or null) and camelCase key
            };
            console.log("[GET /user/me] Mapped API response:", apiResponse);

            return apiResponse; // Return the mapped camelCase object
          } catch (error) {
            console.error("[GET /user/me] Handler error:", error);
            if (error instanceof Error && set.status === 404) throw error;
            set.status = 500;
            throw new Error("Failed to fetch user details");
          }
        },
        {
          // Response schema expects camelCase and macroTarget
          response: UserSchemas.userDetailsResponse,
          detail: {
            summary: "Get current authenticated user's profile and settings",
            tags: ["User"],
          },
        }
      )

      // PUT /settings Handler - Updated to handle macroTarget
      .put(
        "/settings",
        ({
          db,
          user,
          body,
          set,
        }: AuthenticatedContext & {
          body: typeof UserSchemas.userSettingsUpdate.static;
        }) => {
          const {
            // Destructure camelCase fields, including macroTarget
            firstName,
            lastName,
            email,
            dateOfBirth,
            height,
            weight,
            gender,
            activityLevel,
            macroTarget, // Renamed from macroDistribution
          } = body;

          const transaction = db.transaction(() => {
            // 1. Update users table (same as before)
            const userUpdateFields: string[] = []; /* ... */
            const userParams: (string | number | null)[] = []; /* ... */
            if (firstName !== undefined) {
              userUpdateFields.push("first_name = ?");
              userParams.push(firstName);
            }
            if (lastName !== undefined) {
              userUpdateFields.push("last_name = ?");
              userParams.push(lastName);
            }
            if (email !== undefined) {
              /* ... email check ... */ userUpdateFields.push("email = ?");
              userParams.push(email);
            }
            if (userUpdateFields.length > 0) {
              userParams.push(user.userId);
              db.prepare(
                `UPDATE users SET ${userUpdateFields.join(", ")} WHERE id = ?`
              ).run(...userParams);
            }

            // 2. Update user_details table (UPSERT - same as before)
            const detailsUpsertQuery = `INSERT INTO user_details (...) VALUES (...) ON CONFLICT(...) DO UPDATE SET ...`; // Use snake_case cols
            db.prepare(detailsUpsertQuery).run(
              user.userId,
              nullify(dateOfBirth),
              nullify(height),
              nullify(weight),
              nullify(gender),
              nullify(activityLevel)
            );

            // 3. Update or Insert macro_targets if macroTarget is provided
            // Check the camelCase variable from body
            if (macroTarget !== undefined && macroTarget !== null) {
              // Use snake_case column names for the macro_targets table
              const distUpsertQuery = `
                    INSERT INTO macro_targets (
                        user_id, protein_percentage, carbs_percentage, fats_percentage, locked_macros, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(user_id) DO UPDATE SET
                        protein_percentage = excluded.protein_percentage,
                        carbs_percentage = excluded.carbs_percentage,
                        fats_percentage = excluded.fats_percentage,
                        locked_macros = excluded.locked_macros,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = excluded.user_id;
                `;
              // Pass camelCase values from body.macroTarget, stringify lockedMacros
              db.prepare(distUpsertQuery).run(
                user.userId,
                macroTarget.proteinPercentage, // Access camelCase properties
                macroTarget.carbsPercentage,
                macroTarget.fatsPercentage,
                JSON.stringify(macroTarget.lockedMacros || []) // Access camelCase, stringify
              );
            } else if (macroTarget === null) {
              // Handle explicit null: delete existing distribution settings for the user
              db.prepare("DELETE FROM macro_targets WHERE user_id = ?").run(
                user.userId
              );
            }
          }); // End of transaction definition

          try {
            transaction();
            set.status = 200;
            return { success: true, message: "Settings updated successfully." };
          } catch (error) {
            if (
              error instanceof Error &&
              (set.status === 400 || set.status === 409)
            )
              throw error;
            console.error(
              `Error updating settings for user ${user.userId}:`,
              error
            );
            if (!set.status || set.status === 200) {
              set.status = 500;
            }
            throw new Error("Failed to update settings");
          }
        },
        {
          body: UserSchemas.userSettingsUpdate, // Expects camelCase with macroTarget
          response: {
            200: t.Object({ success: t.Boolean(), message: t.String() }),
          },
          detail: {
            summary: "Update user profile and settings",
            tags: ["User"],
          },
        }
      )

      // POST /complete-profile Handler (remains the same)
      .post(
        "/complete-profile",
        ({
          db,
          user,
          body,
          set,
        }: AuthenticatedContext & {
          body: typeof UserSchemas.profileCompletion.static;
        }) => {
          const { dateOfBirth, height, weight, activityLevel } = body;
          try {
            const stmt = db.prepare(
              `INSERT INTO user_details (...) VALUES (...) ON CONFLICT(...) DO UPDATE SET ...`
            ); // Use snake_case cols
            stmt.run(
              user.userId,
              nullify(dateOfBirth),
              nullify(height),
              nullify(weight),
              nullify(activityLevel)
            );
            set.status = 200;
            return { success: true, message: "Profile details updated." };
          } catch (error) {
            console.error(
              `Error completing profile for user ${user.userId}:`,
              error
            );
            set.status = 500;
            throw new Error("Failed to update profile details");
          }
        },
        {
          body: UserSchemas.profileCompletion,
          response: {
            200: t.Object({ success: t.Boolean(), message: t.String() }),
          },
          detail: {
            summary:
              "Add or update specific user details (e.g., during onboarding)",
            tags: ["User"],
          },
        }
      )
  );
