// src/lib/database.ts
import type { Database } from "bun:sqlite";
import { DatabaseError } from "./errors";

/**
 * Executes a database operation within a transaction with proper error handling
 */
export function withTransaction<T>(db: Database, operation: () => T): T {
  const transaction = db.transaction(operation);
  try {
    return transaction();
  } catch (error) {
    console.error("Transaction failed:", error);
    throw new DatabaseError(
      error instanceof Error ? error.message : "Transaction failed"
    );
  }
}

/**
 * Type for SQLite parameter values
 */
export type SQLParam = string | number | boolean | null | Uint8Array;

/**
 * Safely executes a prepared statement with proper error handling and type safety
 */
export function safeQuery<T>(
  db: Database,
  query: string,
  params: SQLParam[] = []
): T | undefined {
  try {
    const statement = db.prepare(query);
    return statement.get(...params) as T | undefined;
  } catch (error) {
    console.error(`Query failed: ${query}`, error);
    throw new DatabaseError(
      error instanceof Error ? error.message : "Query execution failed"
    );
  }
}

/**
 * Safely executes a prepared statement that returns multiple rows
 */
export function safeQueryAll<T>(
  db: Database,
  query: string,
  params: SQLParam[] = []
): T[] {
  try {
    const statement = db.prepare(query);
    return statement.all(...params) as T[];
  } catch (error) {
    console.error(`Query failed: ${query}`, error);
    throw new DatabaseError(
      error instanceof Error ? error.message : "Query execution failed"
    );
  }
}

/**
 * Safely executes a prepared statement for insert/update/delete operations
 */
export function safeExecute(
  db: Database,
  query: string,
  params: SQLParam[] = []
): { changes: number; lastInsertRowid: number | bigint } {
  try {
    const statement = db.prepare(query);
    return statement.run(...params);
  } catch (error) {
    console.error(`Execute failed: ${query}`, error);
    throw new DatabaseError(
      error instanceof Error ? error.message : "Query execution failed"
    );
  }
}

/**
 * Type-safe database result types
 */
export interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  created_at: string;
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
