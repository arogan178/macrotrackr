// src/lib/responses.ts
import { isAppError } from "./errors";

/**
 * Standard success response format
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  if (message) {
    response.message = message;
  }
  return response;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    code,
    message,
  };
  if (details) {
    response.details = details;
  }
  return response;
}

/**
 * Handles errors and sets appropriate status codes
 */
export function handleError(error: unknown, set: any): ErrorResponse {
  const { loggerHelpers } = require("./logger");
  loggerHelpers.error(
    error instanceof Error ? error : new Error(String(error)),
    { type: "response_error_handling" }
  );

  // Always ensure JSON content type for error responses
  set.headers = set.headers || {};
  set.headers["Content-Type"] = "application/json";

  if (isAppError(error)) {
    set.status = error.statusCode;
    return createErrorResponse(
      error.code,
      error.message,
      (error as any).details
    );
  }

  // Handle Elysia validation errors
  if (error instanceof Error && error.message.includes("validation")) {
    set.status = 400;
    return createErrorResponse(
      "VALIDATION_ERROR",
      "Input validation failed",
      error.message
    );
  }

  // Generic error fallback
  set.status = 500;
  return createErrorResponse("INTERNAL_ERROR", "An unexpected error occurred");
}

/**
 * Wraps a route handler with standardized error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => R | Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      const result = await handler(...args);
      return result;
    } catch (error) {
      // Extract the 'set' parameter from args (typically the last context parameter)
      const context = args[args.length - 1] as any;
      if (context && context.set) {
        throw error; // Let the global error handler deal with it
      }
      throw error;
    }
  };
}

/**
 * Converts snake_case object keys to camelCase
 */
export function toCamelCase<T extends Record<string, any>>(obj: T): any {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    );
    result[camelKey] = value;
  }
  return result;
}

/**
 * Converts camelCase object keys to snake_case
 */
export function toSnakeCase<T extends Record<string, any>>(obj: T): any {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(
      /[A-Z]/g,
      (letter) => `_${letter.toLowerCase()}`
    );
    result[snakeKey] = value;
  }
  return result;
}
