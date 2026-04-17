import { isAppError } from "./errors";
import { loggerHelpers } from "../observability/logger";

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: unknown;
}

interface ResponseContextSet {
  status?: number;
  headers?: Record<string, string>;
}

function getErrorDetails(error: unknown): unknown {
  if (error && typeof error === "object" && "details" in error) {
    return (error as { details?: unknown }).details;
  }

  return undefined;
}

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

export function handleError(
  error: unknown,
  set: ResponseContextSet,
): ErrorResponse {
  loggerHelpers.error(
    error instanceof Error ? error : new Error(String(error)),
    { type: "response_error_handling" }
  );

  // Always ensure JSON content type for error responses
  set.headers = set.headers || {};
  set.headers["Content-Type"] = "application/json";

  if (isAppError(error)) {
    set.status = error.statusCode;
    return createErrorResponse(error.code, error.message, getErrorDetails(error));
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

export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => R | Promise<R>,
) {
  return async (...args: T): Promise<R> => {
    try {
      const result = await handler(...args);
      return result;
    } catch (error) {
      // Extract the 'set' parameter from args (typically the last context parameter)
      const context = args[args.length - 1] as { set?: unknown } | undefined;
      if (context?.set) {
        throw error; // Let the global error handler deal with it
      }
      throw error;
    }
  };
}

export {
  toCamelCaseString,
  toSnakeCaseString,
  transformKeysToCamel,
  transformKeysToSnake,
  transformArrayToCamel,
  transformArrayToSnake,
} from "../mappers";
