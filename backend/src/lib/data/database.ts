import type { Database } from "bun:sqlite";
import { DatabaseError } from "../http/errors";
import { loggerHelpers } from "../observability/logger";
import { traceQuerySync } from "../observability/query-tracer";

export function withTransaction<T>(db: Database, operation: () => T): T {
  const transaction = db.transaction(operation);
  try {
    return transaction();
  } catch (error) {
    loggerHelpers.error(error as Error, { operation: "database_transaction" });
    throw new DatabaseError(
      error instanceof Error ? error.message : "Transaction failed"
    );
  }
}

export async function withTransactionAsync<T>(
  db: Database,
  operation: () => Promise<T>
): Promise<T> {
  safeExecute(db, "BEGIN");

  try {
    const result = await operation();
    safeExecute(db, "COMMIT");
    return result;
  } catch (error) {
    try {
      safeExecute(db, "ROLLBACK");
    } catch (rollbackError) {
      loggerHelpers.error(rollbackError as Error, {
        operation: "database_transaction_rollback",
      });
    }

    loggerHelpers.error(error as Error, { operation: "database_transaction" });
    throw new DatabaseError(
      error instanceof Error ? error.message : "Transaction failed"
    );
  }
}

export type SQLParam = string | number | boolean | null | Uint8Array;

export function safeQuery<T>(
  db: Database,
  query: string,
  params: SQLParam[] = []
): T | undefined {
  return traceQuerySync(query, params, () => {
    try {
      const statement = db.prepare(query);
      const result = statement.get(...params) as T | undefined;
      loggerHelpers.dbQuery("SELECT", extractTableName(query));
      return result;
    } catch (error) {
      loggerHelpers.error(error as Error, {
        query: sanitizeQuery(query),
        params: params.length,
      });
      throw new DatabaseError(
        error instanceof Error ? error.message : "Query execution failed"
      );
    }
  });
}

export function safeQueryAll<T>(
  db: Database,
  query: string,
  params: SQLParam[] = []
): T[] {
  return traceQuerySync(query, params, () => {
    try {
      const statement = db.prepare(query);
      const result = statement.all(...params) as T[];
      loggerHelpers.dbQuery(
        "SELECT_ALL",
        extractTableName(query),
        undefined,
        result.length
      );
      return result;
    } catch (error) {
      loggerHelpers.error(error as Error, {
        query: sanitizeQuery(query),
        params: params.length,
      });
      throw new DatabaseError(
        error instanceof Error ? error.message : "Query execution failed"
      );
    }
  });
}

export function safeExecute(
  db: Database,
  query: string,
  params: SQLParam[] = []
): { changes: number; lastInsertRowid: number | bigint } {
  return traceQuerySync(query, params, () => {
    try {
      const statement = db.prepare(query);
      const result = statement.run(...params);
      loggerHelpers.dbQuery(
        getQueryOperation(query),
        extractTableName(query),
        undefined,
        result.changes
      );
      return result;
    } catch (error) {
      loggerHelpers.error(error as Error, {
        query: sanitizeQuery(query),
        params: params.length,
      });
      throw new DatabaseError(
        error instanceof Error ? error.message : "Query execution failed"
      );
    }
  });
}

export interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  created_at: string;
  password_reset_token?: string;
  password_reset_expires?: string | Date;
  clerk_id?: string | null;
}

export interface SessionRow {
  id: string;
  user_id: number;
  secret_hash: string;
  created_at: string;
  expires_at: string;
  last_used_at: string;
  ip: string | null;
  user_agent: string | null;
}

export interface PasswordResetTokenRow {
  id: string;
  user_id: number;
  token_hash: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

export interface UserDetailsRow {
  id: number;
  user_id: number;
  date_of_birth: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  activity_level: number | null;
  created_at: string;
  updated_at: string;
}

export interface MacroEntryRow {
  id: number;
  user_id: number;
  protein: number;
  carbs: number;
  fats: number;
  meal_type: string;
  meal_name: string | null;
  entry_date: string;
  entry_time: string;
  created_at: string;
}

export interface MacroTargetRow {
  id: number;
  user_id: number;
  protein_percentage: number;
  carbs_percentage: number;
  fats_percentage: number;
  locked_macros: string;
  created_at: string;
  updated_at: string;
}

export interface WeightGoalRow {
  id: number;
  user_id: number;
  starting_weight: number | null;
  target_weight: number | null;
  weight_goal: "lose" | "maintain" | "gain" | null;
  start_date: string | null;
  target_date: string | null;
  calorie_target: number | null;
  calculated_weeks: number | null;
  weekly_change: number | null;
  daily_change: number | null;
  created_at: string;
  updated_at: string;
}

export interface WeightLogRow {
  id: string;
  user_id: number;
  timestamp: string;
  weight: number;
  created_at: string;
}

export interface HabitRow {
  id: string;
  user_id: number;
  title: string;
  icon_name: string;
  current: number;
  target: number;
  accent_color: string | null;
  is_complete: number;
  created_at: string;
  completed_at: string | null;
}

export interface SubscriptionRow {
  id: string;
  user_id: number;
  stripe_subscription_id: string;
  status: "active" | "canceled" | "past_due" | "unpaid";
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

// Helper functions for secure logging
function extractTableName(query: string): string {
  const normalizedQuery = query.trim().toLowerCase();

  // Extract table name from different query types
  if (normalizedQuery.startsWith("select")) {
    const match = normalizedQuery.match(/from\s+(\w+)/);
    return match?.[1] ?? "unknown";
  } else if (normalizedQuery.startsWith("insert")) {
    const match = normalizedQuery.match(/insert\s+into\s+(\w+)/);
    return match?.[1] ?? "unknown";
  } else if (normalizedQuery.startsWith("update")) {
    const match = normalizedQuery.match(/update\s+(\w+)/);
    return match?.[1] ?? "unknown";
  } else if (normalizedQuery.startsWith("delete")) {
    const match = normalizedQuery.match(/delete\s+from\s+(\w+)/);
    return match?.[1] ?? "unknown";
  }

  return "unknown";
}

function getQueryOperation(query: string): string {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.startsWith("select")) return "SELECT";
  if (normalizedQuery.startsWith("insert")) return "INSERT";
  if (normalizedQuery.startsWith("update")) return "UPDATE";
  if (normalizedQuery.startsWith("delete")) return "DELETE";

  return "UNKNOWN";
}

function sanitizeQuery(query: string): string {
  // Remove potential sensitive data from query for logging
  // Replace parameter placeholders with [PARAM] for security
  return query.replace(/\?/g, "[PARAM]").trim();
}
