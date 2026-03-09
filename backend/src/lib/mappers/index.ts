export function toCamelCaseString(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function toSnakeCaseString(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function transformKeysToCamel<T extends Record<string, unknown> = Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelCaseString(key)] = value;
  }
  return result as T;
}

export function transformKeysToSnake<T extends Record<string, unknown> = Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCaseString(key)] = value;
  }
  return result as T;
}

export function transformArrayToCamel<T extends Record<string, unknown>>(
  arr: Record<string, unknown>[]
): T[] {
  return arr.map(item => transformKeysToCamel<T>(item));
}

export function transformArrayToSnake<T extends Record<string, unknown>>(
  arr: Record<string, unknown>[]
): T[] {
  return arr.map(item => transformKeysToSnake<T>(item));
}
