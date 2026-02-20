/**
 * Central snake_case ↔ camelCase conversion utilities
 * 
 * This module provides consistent key transformation across the codebase
 * for database (snake_case) to API (camelCase) conversions.
 */

/**
 * Convert snake_case string to camelCase
 * 
 * @example
 * toCamelCaseString('user_id') // 'userId'
 * toCamelCaseString('created_at') // 'createdAt'
 */
export function toCamelCaseString(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 * 
 * @example
 * toSnakeCaseString('userId') // 'user_id'
 * toSnakeCaseString('createdAt') // 'created_at'
 */
export function toSnakeCaseString(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Transform object keys from snake_case to camelCase
 * 
 * @example
 * transformKeysToCamel({ user_id: 1, created_at: '2024-01-01' })
 * // { userId: 1, createdAt: '2024-01-01' }
 */
export function transformKeysToCamel<T extends Record<string, unknown> = Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  if (!obj || typeof obj !== 'object') {
    return obj as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCaseString(key)] = value;
  }
  return result as T;
}

/**
 * Transform object keys from camelCase to snake_case
 * 
 * @example
 * transformKeysToSnake({ userId: 1, createdAt: '2024-01-01' })
 * // { user_id: 1, created_at: '2024-01-01' }
 */
export function transformKeysToSnake<T extends Record<string, unknown> = Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  if (!obj || typeof obj !== 'object') {
    return obj as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCaseString(key)] = value;
  }
  return result as T;
}

/**
 * Legacy alias for transformKeysToCamel - kept for backward compatibility
 * @deprecated Use transformKeysToCamel instead
 */
export function toCamelCase<T extends Record<string, any>>(obj: T): any {
  return transformKeysToCamel(obj);
}

/**
 * Legacy alias for transformKeysToSnake - kept for backward compatibility
 * @deprecated Use transformKeysToSnake instead
 */
export function toSnakeCase<T extends Record<string, any>>(obj: T): any {
  return transformKeysToSnake(obj);
}

/**
 * Transform an array of objects from snake_case to camelCase
 */
export function transformArrayToCamel<T extends Record<string, unknown>>(
  arr: Record<string, unknown>[]
): T[] {
  return arr.map(item => transformKeysToCamel<T>(item));
}

/**
 * Transform an array of objects from camelCase to snake_case
 */
export function transformArrayToSnake<T extends Record<string, unknown>>(
  arr: Record<string, unknown>[]
): T[] {
  return arr.map(item => transformKeysToSnake<T>(item));
}
