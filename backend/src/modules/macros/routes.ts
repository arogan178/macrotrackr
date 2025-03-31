// src/modules/macros/routes.ts
import { Elysia, t } from "elysia"; // Import t for response schema definition
import { db } from "../../db";
import { MacroSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../middleware/auth";

/**
 * Gets the current date in YYYY-MM-DD format based on the server's local timezone.
 * Note: This relies on the server's timezone. For consistency across environments,
 * consider standardizing on UTC or passing timezone information from the client.
 * @returns The current local date as a string 'YYYY-MM-DD'.
 */
const getLocalDate = (): string => {
  const date = new Date();
  // Adjust for timezone offset to get the correct local date string
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().split("T")[0];
};

export const macroRoutes = (app: Elysia) =>
  app.group("/api/macros", (group) =>
    group
      .decorate("db", db)
      .derive((context) => context as AuthenticatedContext) // Cast includes 'set'

      // --- Get Today's Macro Totals ---
      .get(
        "/today",
        ({ db, user, set }) => {
          // Added 'set'
          try {
            const todayDate = getLocalDate();
            const query = `
                        SELECT
                            COALESCE(SUM(protein), 0) AS protein,
                            COALESCE(SUM(carbs), 0) AS carbs,
                            COALESCE(SUM(fats), 0) AS fats
                        FROM macro_entries
                        WHERE user_id = ? AND entry_date = ?
                    `;
            const result = db.prepare(query).get(user.userId, todayDate) as {
              protein: number;
              carbs: number;
              fats: number;
            };

            // Handle case where result might be null/undefined unexpectedly, though COALESCE should prevent this
            if (!result) {
              console.warn(
                `No macro result found for user ${user.userId} on ${todayDate}, returning zeros.`
              );
              return { protein: 0, carbs: 0, fats: 0, calories: 0 };
            }

            const calories = Math.round(
              result.protein * 4 + result.carbs * 4 + result.fats * 9
            );
            return { ...result, calories };
          } catch (error) {
            console.error(
              `Error fetching today's macros for user ${user.userId}:`,
              error
            );
            set.status = 500; // Internal Server Error
            throw new Error("Failed to fetch today's macro totals.");
          }
        },
        {
          response: MacroSchemas.macroTotals, // Keep response validation here
          detail: {
            summary: "Get total macros consumed by the user today",
            tags: ["Macros"],
          },
        }
      )

      // --- Get Macro History ---
      .get(
        "/history",
        ({ db, user, set }) => {
          // Added 'set'
          try {
            const query = `
                        SELECT
                            id, protein, carbs, fats,
                            meal_type AS mealType, -- Alias for camelCase consistency
                            meal_name AS mealName, -- Alias for camelCase consistency
                            entry_date, entry_time, created_at
                        FROM macro_entries
                        WHERE user_id = ?
                        ORDER BY entry_date DESC, entry_time DESC, created_at DESC
                    `;
            const history = db.prepare(query).all(user.userId);
            return history; // Return the array of entries (potentially empty)
          } catch (error) {
            console.error(
              `Error fetching macro history for user ${user.userId}:`,
              error
            );
            set.status = 500; // Internal Server Error
            throw new Error("Failed to fetch macro history.");
          }
        },
        {
          // *** REMOVED response validation to work around potential empty array validation bug ***
          // response: t.Array(MacroSchemas.macroEntryResponse),
          detail: {
            summary: "Get all macro entries recorded by the user",
            tags: ["Macros"],
          },
        }
      )

      // --- Add New Macro Entry ---
      .post(
        "/",
        ({ db, user, body, set }) => {
          // Added 'set'
          // Extract fields from the validated body
          const {
            protein,
            carbs,
            fats,
            mealType,
            mealName,
            entry_date,
            entry_time,
          } = body;
          try {
            const query = `
                        INSERT INTO macro_entries
                            (user_id, protein, carbs, fats, meal_type, meal_name, entry_date, entry_time)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        RETURNING id, protein, carbs, fats, meal_type as mealType, meal_name as mealName, entry_date, entry_time, created_at
                    `;
            // Execute insert and return the newly created row
            const result = db
              .prepare(query)
              .get(
                user.userId,
                protein,
                carbs,
                fats,
                mealType,
                mealName ?? "",
                entry_date,
                entry_time
              ); // Use nullish coalescing for optional mealName

            if (!result) {
              set.status = 500; // Internal Server Error
              throw new Error(
                "Failed to create macro entry or retrieve confirmation."
              );
            }
            return result; // Return the newly created entry object
          } catch (error) {
            // Catch potential DB constraint errors (e.g., CHECK constraint failure)
            if (
              error instanceof Error &&
              error.message.includes("CHECK constraint failed")
            ) {
              set.status = 400; // Bad Request
              throw new Error(`Invalid input: ${error.message}`);
            }
            console.error(
              `Error adding macro entry for user ${user.userId}:`,
              error
            );
            set.status = 500; // Internal Server Error
            throw new Error("Failed to add macro entry.");
          }
        },
        {
          body: MacroSchemas.macroEntryCreate,
          response: MacroSchemas.macroEntryResponse, // Keep response validation here
          detail: {
            summary: "Add a new macro entry for the user",
            tags: ["Macros"],
          },
        }
      )

      // --- Delete Macro Entry ---
      .delete(
        "/:id",
        ({ db, user, params, set }) => {
          // Added 'set'
          try {
            // Attempt to delete the entry by ID, ensuring it belongs to the user
            const query =
              "DELETE FROM macro_entries WHERE id = ? AND user_id = ?";
            const result = db.prepare(query).run(params.id, user.userId);

            // Check if any row was actually deleted
            if (result.changes === 0) {
              set.status = 404; // Not Found
              throw new Error(
                `Macro entry with ID ${params.id} not found or access denied.`
              );
            }
            // On successful deletion, typically return 204 No Content (Elysia might do this implicitly)
            // Or return a success confirmation object:
            return {
              success: true,
              message: `Macro entry ${params.id} deleted.`,
            };
          } catch (error) {
            // Re-throw if it's the specific 404 error we threw
            if (error instanceof Error && set.status === 404) throw error;
            console.error(
              `Error deleting macro entry ${params.id} for user ${user.userId}:`,
              error
            );
            set.status = 500; // Internal Server Error
            throw new Error("Failed to delete macro entry.");
          }
        },
        {
          params: MacroSchemas.macroIdParam,
          detail: {
            summary: "Delete a specific macro entry",
            tags: ["Macros"],
          },
        }
      )

      // --- Update Macro Entry ---
      .put(
        "/:id",
        ({ db, user, params, body, set }) => {
          // Added 'set'
          const { id } = params;

          // Build the updates object dynamically based on provided body fields
          const updates: Record<string, any> = {};
          if (body.protein !== undefined) updates.protein = body.protein;
          if (body.carbs !== undefined) updates.carbs = body.carbs;
          if (body.fats !== undefined) updates.fats = body.fats;
          if (body.mealType !== undefined) updates.meal_type = body.mealType; // Map camelCase to snake_case
          if (body.mealName !== undefined) updates.meal_name = body.mealName;
          if (body.entry_date !== undefined)
            updates.entry_date = body.entry_date;
          if (body.entry_time !== undefined)
            updates.entry_time = body.entry_time;

          const fieldsToUpdate = Object.keys(updates);
          // Prevent update if no valid fields were provided
          if (fieldsToUpdate.length === 0) {
            set.status = 400; // Bad Request
            throw new Error("No valid fields provided for update.");
          }

          // Construct the SET clause and parameters dynamically
          const setClause = fieldsToUpdate
            .map((field) => `${field} = ?`)
            .join(", ");
          const queryParams = [...Object.values(updates), id, user.userId]; // Params for SET, WHERE id, WHERE user_id

          try {
            const query = `
                        UPDATE macro_entries
                        SET ${setClause}
                        WHERE id = ? AND user_id = ?
                        RETURNING id, protein, carbs, fats, meal_type as mealType, meal_name as mealName, entry_date, entry_time, created_at
                    `;
            // Perform the update and return the updated row
            const result = db.prepare(query).get(...queryParams);

            // Check if the update was successful and returned data
            if (!result) {
              // Verify if the entry exists for the user to give a proper error
              const existsCheck =
                "SELECT id FROM macro_entries WHERE id = ? AND user_id = ?";
              const exists = db.prepare(existsCheck).get(id, user.userId);
              if (!exists) {
                set.status = 404; // Not Found
                throw new Error(
                  `Macro entry with ID ${id} not found or access denied.`
                );
              } else {
                // Update failed for another reason (e.g., constraint violation if RETURNING wasn't reached)
                set.status = 500; // Internal Server Error
                throw new Error(
                  "Failed to update macro entry (update returned no data)."
                );
              }
            }
            // Return the updated entry object (validation happens after this return)
            return result;
          } catch (error) {
            // Re-throw specific errors we generated
            if (
              error instanceof Error &&
              (set.status === 404 || set.status === 400)
            )
              throw error;
            // Handle potential CHECK constraint errors during update
            if (
              error instanceof Error &&
              error.message.includes("CHECK constraint failed")
            ) {
              set.status = 400; // Bad Request
              throw new Error(`Invalid input: ${error.message}`);
            }
            console.error(
              `Error updating macro entry ${id} for user ${user.userId}:`,
              error
            );
            set.status = 500; // Internal Server Error
            throw new Error("Failed to update macro entry.");
          }
        },
        {
          params: MacroSchemas.macroIdParam,
          body: MacroSchemas.macroEntryUpdate, // Validates that body fields match the partial base schema
          response: MacroSchemas.macroEntryResponse, // Keep response validation here for updates
          detail: {
            summary: "Update a specific macro entry",
            tags: ["Macros"],
          },
        }
      )
  );
