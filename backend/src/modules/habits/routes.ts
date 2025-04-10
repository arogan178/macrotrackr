// src/modules/habits/routes.ts
import { Elysia } from "elysia";
import { db } from "../../db";
import { HabitSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../middleware/auth";

// Define types for DB results (snake_case) for clarity and type safety
type HabitFromDB = {
  id: string;
  user_id: number;
  title: string;
  icon_name: string;
  current: number;
  target: number;
  accent_color: string | null;
  is_complete: number; // SQLite stores booleans as 0 or 1
  created_at: string;
  completed_at: string | null;
};

export const habitRoutes = (app: Elysia) =>
  app.group("/api/habits", (group) =>
    group
      .decorate("db", db)

      // --- Get All Habits ---
      .get(
        "/",
        ({ user, set, db }: AuthenticatedContext) => {
          try {
            const query = `
              SELECT id, user_id, title, icon_name, current, target, accent_color, 
                     is_complete, created_at, completed_at
              FROM habits
              WHERE user_id = ?
              ORDER BY created_at DESC
            `;
            const statement = db.prepare(query);
            const habitsResult = statement.all(user.userId) as HabitFromDB[];

            // Map DB results to API format (camelCase)
            const apiResponse = habitsResult.map((habit) => ({
              id: habit.id,
              title: habit.title,
              iconName: habit.icon_name,
              current: habit.current,
              target: habit.target,
              progress:
                habit.target > 0
                  ? Math.min(
                      100,
                      Math.round((habit.current / habit.target) * 100)
                    )
                  : 0,
              accentColor: habit.accent_color as
                | "indigo"
                | "blue"
                | "green"
                | "purple"
                | undefined,
              isComplete: Boolean(habit.is_complete),
              createdAt: habit.created_at,
              completedAt: habit.completed_at,
            }));

            return apiResponse;
          } catch (error) {
            console.error("[GET /habits] CAUGHT ERROR:", error);
            set.status = 500;
            throw new Error("Failed to fetch habits");
          }
        },
        {
          response: HabitSchemas.getHabitsResponse,
          detail: {
            summary: "Get all habit goals for the user",
            tags: ["Habits"],
          },
        }
      )

      // --- Create New Habit ---
      .post(
        "/",
        async ({
          body,
          user,
          set,
          db,
        }: AuthenticatedContext & { body: any }) => {
          try {
            const {
              id,
              title,
              iconName,
              current,
              target,
              accentColor,
              isComplete,
              createdAt,
              completedAt,
            } = body;

            const query = `
              INSERT INTO habits (
                id, user_id, title, icon_name, current, target, 
                accent_color, is_complete, created_at, completed_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const statement = db.prepare(query);
            statement.run(
              id,
              user.userId,
              title,
              iconName,
              current,
              target,
              accentColor || null,
              isComplete ? 1 : 0,
              createdAt,
              completedAt || null
            );

            return body;
          } catch (error) {
            console.error("[POST /habits] CAUGHT ERROR:", error);
            set.status = 500;
            throw new Error("Failed to create habit");
          }
        },
        {
          body: HabitSchemas.createHabitBody,
          response: HabitSchemas.createHabitResponse,
          detail: {
            summary: "Create a new habit goal",
            tags: ["Habits"],
          },
        }
      )

      // --- Update Habit ---
      .put(
        "/:id",
        async ({
          params,
          body,
          user,
          set,
          db,
        }: AuthenticatedContext & { params: { id: string }; body: any }) => {
          try {
            const {
              title,
              iconName,
              current,
              target,
              progress,
              accentColor,
              isComplete,
              createdAt,
              completedAt,
            } = body;

            // First check if the habit belongs to the user
            const checkQuery = `
              SELECT id FROM habits 
              WHERE id = ? AND user_id = ?
            `;
            const checkStatement = db.prepare(checkQuery);
            const existingHabit = checkStatement.get(params.id, user.userId);

            if (!existingHabit) {
              set.status = 404;
              throw new Error("Habit not found");
            }

            // Update the habit
            const updateQuery = `
              UPDATE habits
              SET title = ?, icon_name = ?, current = ?, target = ?, 
                  accent_color = ?, is_complete = ?, created_at = ?, completed_at = ?
              WHERE id = ? AND user_id = ?
            `;

            const updateStatement = db.prepare(updateQuery);
            updateStatement.run(
              title,
              iconName,
              current,
              target,
              accentColor || null,
              isComplete ? 1 : 0,
              createdAt,
              completedAt || null,
              params.id,
              user.userId
            );

            return { success: true };
          } catch (error) {
            console.error(`[PUT /habits/${params.id}] CAUGHT ERROR:`, error);
            set.status = error.message === "Habit not found" ? 404 : 500;
            throw new Error(error.message || "Failed to update habit");
          }
        },
        {
          body: HabitSchemas.updateHabitBody,
          response: HabitSchemas.updateHabitResponse,
          detail: {
            summary: "Update an existing habit goal",
            tags: ["Habits"],
          },
        }
      )

      // --- Delete Habit ---
      .delete(
        "/:id",
        async ({
          params,
          user,
          set,
          db,
        }: AuthenticatedContext & { params: { id: string } }) => {
          try {
            // First check if the habit belongs to the user
            const checkQuery = `
              SELECT id FROM habits 
              WHERE id = ? AND user_id = ?
            `;
            const checkStatement = db.prepare(checkQuery);
            const existingHabit = checkStatement.get(params.id, user.userId);

            if (!existingHabit) {
              set.status = 404;
              throw new Error("Habit not found");
            }

            // Delete the habit
            const deleteQuery = `
              DELETE FROM habits
              WHERE id = ? AND user_id = ?
            `;

            const deleteStatement = db.prepare(deleteQuery);
            deleteStatement.run(params.id, user.userId);

            return { success: true };
          } catch (error) {
            console.error(`[DELETE /habits/${params.id}] CAUGHT ERROR:`, error);
            set.status = error.message === "Habit not found" ? 404 : 500;
            throw new Error(error.message || "Failed to delete habit");
          }
        },
        {
          response: HabitSchemas.deleteHabitResponse,
          detail: {
            summary: "Delete a habit goal",
            tags: ["Habits"],
          },
        }
      )

      // --- Reset All Habits ---
      .delete(
        "/",
        async ({ user, set, db }: AuthenticatedContext) => {
          try {
            const query = `
              DELETE FROM habits
              WHERE user_id = ?
            `;

            const statement = db.prepare(query);
            statement.run(user.userId);

            return { success: true };
          } catch (error) {
            console.error("[DELETE /habits] CAUGHT ERROR:", error);
            set.status = 500;
            throw new Error("Failed to reset habits");
          }
        },
        {
          response: HabitSchemas.resetHabitsResponse,
          detail: {
            summary: "Reset all habit goals",
            tags: ["Habits"],
          },
        }
      )
  );
