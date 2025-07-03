// src/lib/error-handler.ts
import { logger } from "./logger";

/**
 * Shared error handler for service methods.
 * Logs the error and throws a user-friendly error message.
 * Optionally rethrows known error types (e.g., NotFoundError).
 */
export function handleServiceError(
  error: unknown,
  operation: string,
  context?: Record<string, any>,
  knownErrors: Array<Function> = []
): never {
  logger.error(
    {
      error: error instanceof Error ? error : new Error(String(error)),
      operation,
      ...context,
    },
    `Failed to ${operation.replace(/_/g, " ")}`
  );
  for (const KnownError of knownErrors) {
    if (error instanceof KnownError) throw error;
  }
  throw new Error("An unexpected error occurred. Please try again later.");
}
