// src/modules/habits/routes.ts
import { Elysia } from "elysia";
import { db } from "../../db";
import { HabitSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../middleware/auth";
import { safeQuery, safeExecute } from "../../lib/database";
import { NotFoundError } from "../../lib/errors";
import { featureLimitGuard } from "../../middleware/pro-guard";

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
        async (context: any) => {
          const { user, db } = context as AuthenticatedContext;

          const query = `
            SELECT id, user_id, title, icon_name, current, target, accent_color, 
                   is_complete, created_at, completed_at
            FROM habits
            WHERE user_id = ?
            ORDER BY created_at DESC
          `;

          const habitsResult = safeQuery(db, query, [
            user.userId,
          ]) as HabitFromDB[];

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
      .use(featureLimitGuard("MAX_HABITS"))
      .post(
        "/",
        async (context: any) => {
          const { body, user, db, checkLimit } =
            context as AuthenticatedContext & {
              body: any;
              checkLimit: (count: number) => Promise<any>;
            };

          // Check current habit count before creating new one
          const currentHabitCount =
            safeQuery<{ count: number }>(
              db,
              "SELECT COUNT(*) as count FROM habits WHERE user_id = ?",
              [user.userId]
            )?.count || 0;

          // Check if user can create another habit
          await checkLimit(currentHabitCount + 1);

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

          safeExecute(db, query, [
            id,
            user.userId,
            title,
            iconName,
            current,
            target,
            accentColor || null,
            isComplete ? 1 : 0,
            createdAt,
            completedAt || null,
          ]);

          return body;
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
        async (context: any) => {
          const { params, body, user, db } = context as AuthenticatedContext & {
            params: { id: string };
            body: any;
          };

          const {
            title,
            iconName,
            current,
            target,
            accentColor,
            isComplete,
            createdAt,
            completedAt,
          } = body;

          const checkQuery = `
            SELECT id FROM habits 
            WHERE id = ? AND user_id = ?
          `;
          const existingHabitResult = safeQuery(db, checkQuery, [
            params.id,
            user.userId,
          ]) as { id: string }[];
          const existingHabit = existingHabitResult[0];

          if (!existingHabit) {
            throw new NotFoundError("Habit not found");
          }

          const updateQuery = `
            UPDATE habits
            SET title = ?, icon_name = ?, current = ?, target = ?, 
                accent_color = ?, is_complete = ?, created_at = ?, completed_at = ?
            WHERE id = ? AND user_id = ?
          `;

          safeExecute(db, updateQuery, [
            title,
            iconName,
            current,
            target,
            accentColor || null,
            isComplete ? 1 : 0,
            createdAt,
            completedAt || null,
            params.id,
            user.userId,
          ]);

          return { success: true };
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
        async (context: any) => {
          const { params, user, db } = context as AuthenticatedContext & {
            params: { id: string };
          };

          const checkQuery = `
            SELECT id FROM habits 
            WHERE id = ? AND user_id = ?
          `;
          const existingHabitResult = safeQuery(db, checkQuery, [
            params.id,
            user.userId,
          ]) as { id: string }[];
          const existingHabit = existingHabitResult[0];

          if (!existingHabit) {
            throw new NotFoundError("Habit not found");
          }

          const deleteQuery = `
            DELETE FROM habits
            WHERE id = ? AND user_id = ?
          `;

          safeExecute(db, deleteQuery, [params.id, user.userId]);

          return { success: true };
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
        async (context: any) => {
          const { user, db } = context as AuthenticatedContext;

          const query = `
            DELETE FROM habits
            WHERE user_id = ?
          `;

          safeExecute(db, query, [user.userId]);

          return { success: true };
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
