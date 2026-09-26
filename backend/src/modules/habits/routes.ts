// src/modules/habits/routes.ts
import { Elysia } from "elysia";
import { HabitSchemas } from "./schemas";
import type { AuthenticatedRouteContextWithUser } from "../../types";
import {
  safeQuery,
  safeQueryAll,
  safeExecute,
  type HabitRow,
} from "../../lib/data/database";
import {
  AuthorizationError,
  AuthenticationError,
  BadRequestError,
  NotFoundError,
} from "../../lib/http/errors";
import { checkFeatureLimit } from "../../middleware/clerk-guards";
import { mutationSuccessWithId } from "../../lib/http/mutation-contract";
import { publishUserSyncEvent } from "../../lib/sync/eventBus";

type HabitsRouteContext =
  AuthenticatedRouteContextWithUser<Record<string, unknown>>;

type HabitProgressAction = "increment" | "decrement" | "reset" | "complete";

// A weekly habit's period is its ISO week, keyed by the Monday. UTC is only a
// timezone-free calendar here: the date is already the user's local day.
function periodKey(frequency: HabitRow["frequency"], date: string): string {
  if (frequency !== "weekly") return date;

  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  const monday = new Date(Date.UTC(year, month - 1, day));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));

  return monday.toISOString().slice(0, 10);
}

// Progress only counts in the period it was recorded, so a habit starts each day or week at 0.
function toHabitResponse(habit: HabitRow, date: string) {
  const isCurrentPeriod = habit.period_date === periodKey(habit.frequency, date);
  const current = isCurrentPeriod ? habit.current : 0;

  return {
    id: habit.id,
    title: habit.title,
    iconName: habit.icon_name,
    current,
    target: habit.target,
    progress:
      habit.target > 0
        ? Math.min(100, Math.round((current / habit.target) * 100))
        : 0,
    // Optional on create, so the column can be NULL; the response allows absent, not null.
    accentColor: (habit.accent_color ?? undefined) as
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
    frequency: habit.frequency,
    isComplete: isCurrentPeriod && Boolean(habit.is_complete),
    createdAt: habit.created_at,
    completedAt: isCurrentPeriod ? habit.completed_at : null,
  };
}

export const habitRoutes = (app: Elysia) =>
  app.group("/api/habits", (group) =>
    group
      // --- Get All Habits ---
      .get(
        "/",
        async (rawContext: unknown) => {
          const context = rawContext as HabitsRouteContext;
          const { db } = context;
          const internalUserId = context.authenticatedUser.userId;

          // The server has no user timezone; the client names its local day.
          const date = context.query.date ?? new Date().toISOString().slice(0, 10);

          const query = `
            SELECT id, user_id, title, icon_name, current, target, accent_color, 
                   is_complete, created_at, completed_at, period_date, frequency
            FROM habits
            WHERE user_id = ?
            ORDER BY created_at DESC
          `;

          const habitsResult = safeQueryAll(db, query, [internalUserId]) as HabitRow[];

          return habitsResult.map((habit) => toHabitResponse(habit, date));
        },
        {
          query: HabitSchemas.getHabitsQuery,
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
        async (rawContext: unknown) => {
          const context = rawContext as HabitsRouteContext;
          const { body, db } = context;
          const internalUserId = context.authenticatedUser.userId;

          if (!body) {
            throw new BadRequestError("Request body is required");
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
            )?.count ?? 0;

          // Check if user can create another habit based on Free/Pro limits
          const featureLimitResult = await checkFeatureLimit(
            internalUserId,
            "MAX_HABITS",
            currentHabitCount
          );
          if (!featureLimitResult.allowed) {
            throw new AuthorizationError(
              featureLimitResult.message ?? "Feature limit reached"
            );
          }

          const {
            id,
            title,
            iconName,
            current,
            target,
            accentColor,
            frequency = "daily",
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
            frequency: HabitRow["frequency"] | undefined;
            isComplete: boolean;
            createdAt: string;
            completedAt: string | undefined;
          };

          // Normalize optional string fields to null if empty to avoid storing empty strings
          const normalizedAccent = accentColor && accentColor.length > 0 ? accentColor : null;

          const query = `
            INSERT INTO habits (
              id, user_id, title, icon_name, current, target, 
              accent_color, is_complete, created_at, completed_at, frequency
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            completedAt ?? null,
            frequency,
          ]);

          publishUserSyncEvent(internalUserId, "habits");

          // Return properly typed response
          return {
            id,
            userId: internalUserId.toString(),
            title,
            iconName,
            current,
            target,
            progress: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
            accentColor: normalizedAccent as "indigo" | "blue" | "green" | "purple" | "cyan" | "teal" | "lime" | "yellow" | "orange" | "red" | "pink" | undefined,
            frequency,
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
        async (rawContext: unknown) => {
          const context = rawContext as HabitsRouteContext;
          const { params, body, db } = context;
          const internalUserId = context.authenticatedUser.userId;

          if (!body) {
            throw new BadRequestError("Request body is required");
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
            frequency: requestedFrequency,
            isComplete,
            createdAt,
            completedAt,
          } = body as {
            title: string;
            iconName: string;
            current: number;
            target: number;
            accentColor: string | undefined;
            frequency: HabitRow["frequency"] | undefined;
            isComplete: boolean;
            createdAt: string;
            completedAt: string | undefined;
          };

          // Normalize optional string fields to null if empty to avoid storing empty strings
          const normalizedAccent = accentColor && accentColor.length > 0 ? accentColor : null;

          const checkQuery = `
            SELECT id, frequency, period_date FROM habits 
            WHERE id = ? AND user_id = ?
          `;
          const existingHabit = safeQuery<
            Pick<HabitRow, "id" | "frequency" | "period_date">
          >(db, checkQuery, [habitId, internalUserId]);

          if (!existingHabit) {
            throw new NotFoundError("Habit not found");
          }

          const frequency = requestedFrequency ?? existingHabit.frequency;
          // A day's count is not a week's, so switching frequency starts the new period at 0.
          const periodDate =
            frequency === existingHabit.frequency ? existingHabit.period_date : null;

          const updateQuery = `
            UPDATE habits
            SET title = ?, icon_name = ?, current = ?, target = ?, 
                accent_color = ?, is_complete = ?, created_at = ?, completed_at = ?,
                frequency = ?, period_date = ?
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
            completedAt ?? null,
            frequency,
            periodDate,
            habitId,
            internalUserId,
          ]);

          publishUserSyncEvent(internalUserId, "habits");

          return {
            id: habitId,
            title,
            iconName,
            current,
            target,
            progress:
              target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
            accentColor: normalizedAccent as
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
            frequency,
            isComplete,
            createdAt,
            completedAt: completedAt ?? null,
          };
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
        async (rawContext: unknown) => {
          const context = rawContext as HabitsRouteContext;
          const { params, db } = context;
          const internalUserId = context.authenticatedUser.userId;

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

          publishUserSyncEvent(internalUserId, "habits");

          return mutationSuccessWithId(habitId);
        },
        {
          response: HabitSchemas.deleteHabitResponse,
          detail: {
            summary: "Delete a habit goal",
            tags: ["Habits"],
          },
        }
      )

      // --- Update Habit Progress ---
      .post(
        "/:id/progress",
        async (rawContext: unknown) => {
          const context = rawContext as HabitsRouteContext;
          const { params, body, db } = context;
          const internalUserId = context.authenticatedUser.userId;

          const habitId = params?.id;
          if (!habitId) {
            throw new NotFoundError("Habit ID is required");
          }

          const { action, date } = body as {
            action: HabitProgressAction;
            date: string;
          };

          const habit = safeQuery<HabitRow>(
            db,
            "SELECT * FROM habits WHERE id = ? AND user_id = ?",
            [habitId, internalUserId]
          );

          if (!habit) {
            throw new NotFoundError("Habit not found");
          }

          const previous = toHabitResponse(habit, date);
          const periodDate = periodKey(habit.frequency, date);
          const requested = {
            increment: previous.current + 1,
            decrement: previous.current - 1,
            reset: 0,
            complete: habit.target,
          }[action];
          const current = Math.min(habit.target, Math.max(0, requested));
          const isComplete = current >= habit.target;
          const completedAt = isComplete
            ? previous.isComplete && previous.completedAt
              ? previous.completedAt
              : new Date().toISOString()
            : null;

          safeExecute(
            db,
            `UPDATE habits
             SET current = ?, is_complete = ?, completed_at = ?, period_date = ?
             WHERE id = ? AND user_id = ?`,
            [
              current,
              isComplete ? 1 : 0,
              completedAt,
              periodDate,
              habitId,
              internalUserId,
            ]
          );

          publishUserSyncEvent(internalUserId, "habits");

          return toHabitResponse(
            {
              ...habit,
              current,
              is_complete: isComplete ? 1 : 0,
              completed_at: completedAt,
              period_date: periodDate,
            },
            date
          );
        },
        {
          body: HabitSchemas.habitProgressBody,
          response: HabitSchemas.habitData,
          detail: {
            summary: "Increment, decrement, reset or complete the current day's or week's habit progress",
            tags: ["Habits"],
          },
        }
      )
  );
