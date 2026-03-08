// src/modules/habits/routes.ts
import { Elysia } from "elysia";
import { db } from "../../db";
import { HabitSchemas } from "./schemas";
import type { AuthenticatedContext } from "../../types";
import {
  safeQuery,
  safeQueryAll,
  safeExecute,
  type HabitRow,
} from "../../lib/database";
import {
  AuthorizationError,
  AuthenticationError,
  NotFoundError,
} from "../../lib/errors";
import { checkFeatureLimit } from "../../middleware/clerk-guards";
import type { Database } from "bun:sqlite";

// Extended habits context type for route handlers
// Extends AuthenticatedContext with module-specific properties
interface HabitsRouteContext extends AuthenticatedContext {
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  query: Record<string, string | undefined>;
  db: Database;
}

export const habitRoutes = (app: Elysia) =>
  app.group("/api/habits", (group) =>
    group
      .decorate("db", db)

      // --- Get All Habits ---
      .get(
        "/",
        async (context: any) => {
          const { internalUserId, db } = context as HabitsRouteContext;

          const query = `
            SELECT id, user_id, title, icon_name, current, target, accent_color, 
                   is_complete, created_at, completed_at
            FROM habits
            WHERE user_id = ?
            ORDER BY created_at DESC
          `;

          const habitsResult = safeQueryAll(db, query, [internalUserId]) as HabitRow[];

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
              | "cyan"
              | "teal"
              | "green"
              | "lime"
              | "yellow"
              | "orange"
              | "red"
              | "pink"
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
      .post(
        "/",
        async (context: any) => {
          const { body, internalUserId, db } = context as HabitsRouteContext;

          if (!body) {
            throw new Error("Request body is required");
          }

          if (!internalUserId) {
            throw new AuthenticationError("Authentication required. Please sign in.");
          }

          // Check current habit count before creating new one
          const currentHabitCount =
            safeQuery<{ count: number }>(
              db,
              "SELECT COUNT(*) as count FROM habits WHERE user_id = ?",
              [internalUserId]
            )?.count || 0;

          // Check if user can create another habit based on Free/Pro limits
          const featureLimitResult = await checkFeatureLimit(
            internalUserId,
            "MAX_HABITS",
            currentHabitCount
          );
          if (!featureLimitResult.allowed) {
            throw new AuthorizationError(
              featureLimitResult.message || "Feature limit reached"
            );
          }

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
          } = body as {
            id: string;
            title: string;
            iconName: string;
            current: number;
            target: number;
            accentColor: string | undefined;
            isComplete: boolean;
            createdAt: string;
            completedAt: string | undefined;
          };

          // Normalize optional string fields to null if empty to avoid storing empty strings
          const normalizedAccent = accentColor && accentColor.length > 0 ? accentColor : null;

          const query = `
            INSERT INTO habits (
              id, user_id, title, icon_name, current, target, 
              accent_color, is_complete, created_at, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          safeExecute(db, query, [
            id,
            internalUserId,
            title,
            iconName,
            current,
            target,
            normalizedAccent,
            isComplete ? 1 : 0,
            createdAt,
            completedAt || null,
          ]);

          // Return properly typed response
          return {
            id,
            userId: internalUserId?.toString(),
            title,
            iconName,
            current,
            target,
            progress: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
            accentColor: normalizedAccent as "indigo" | "blue" | "green" | "purple" | "cyan" | "teal" | "lime" | "yellow" | "orange" | "red" | "pink" | undefined,
            isComplete,
            createdAt,
            completedAt,
          };
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
          const { params, body, internalUserId, db } = context as HabitsRouteContext;

          if (!body) {
            throw new Error("Request body is required");
          }

          const habitId = params?.id;
          if (!habitId) {
            throw new NotFoundError("Habit ID is required");
          }

          const {
            title,
            iconName,
            current,
            target,
            accentColor,
            isComplete,
            createdAt,
            completedAt,
          } = body as {
            title: string;
            iconName: string;
            current: number;
            target: number;
            accentColor: string | undefined;
            isComplete: boolean;
            createdAt: string;
            completedAt: string | undefined;
          };

          // Normalize optional string fields to null if empty to avoid storing empty strings
          const normalizedAccent = accentColor && accentColor.length > 0 ? accentColor : null;

          const checkQuery = `
            SELECT id FROM habits 
            WHERE id = ? AND user_id = ?
          `;
          const existingHabit = safeQuery(db, checkQuery, [
            habitId,
            internalUserId,
          ]);

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
            normalizedAccent,
            isComplete ? 1 : 0,
            createdAt,
            completedAt || null,
            habitId,
            internalUserId,
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
          const { params, internalUserId, db } = context as HabitsRouteContext;

          const habitId = params?.id;
          if (!habitId) {
            throw new NotFoundError("Habit ID is required");
          }

          const checkQuery = `
            SELECT id FROM habits 
            WHERE id = ? AND user_id = ?
          `;
          const existingHabit = safeQuery(db, checkQuery, [
            habitId,
            internalUserId,
          ]);

          if (!existingHabit) {
            throw new NotFoundError("Habit not found");
          }

          const deleteQuery = `
            DELETE FROM habits
            WHERE id = ? AND user_id = ?
          `;

          safeExecute(db, deleteQuery, [habitId, internalUserId]);

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
          const { internalUserId, db } = context as HabitsRouteContext;

          const query = `
            DELETE FROM habits
            WHERE user_id = ?
          `;

          safeExecute(db, query, [internalUserId]);

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
