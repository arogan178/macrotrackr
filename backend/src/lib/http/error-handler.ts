// src/lib/error-handler.ts
import { logger } from "../observability/logger";
import { AppError } from "./errors";

export class ServiceError extends AppError {
  public readonly operation: string;
  public readonly cause?: unknown;

  constructor(operation: string, message: string, cause?: unknown) {
    super(message, 500, "SERVICE_ERROR");
    this.operation = operation;
    this.cause = cause;
  }
}

/**
 * Shared error handler for service methods.
 * Logs the error and throws a user-friendly error message.
 * Optionally rethrows known error types (e.g., NotFoundError).
 */
export function handleServiceError(
  error: unknown,
  operation: string,
  context?: Record<string, unknown>,
  knownErrors: Array<new (...arguments_: never[]) => unknown> = [],
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
  throw new ServiceError(
    operation,
    "An unexpected error occurred. Please try again later.",
    error,
  );
}
