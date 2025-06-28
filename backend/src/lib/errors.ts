// src/lib/errors.ts

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication related errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

/**
 * Authorization related errors
 */
export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR");
    if (details) {
      this.details = details;
    }
  }

  public readonly details?: unknown;
}

/**
 * Conflict errors (e.g., duplicate email)
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409, "RESOURCE_CONFLICT");
  }
}

/**
 * Database operation errors
 */
export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super(message, 500, "DATABASE_ERROR");
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Error handler that formats errors for API responses
 */
export function formatErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.message,
      details: (error as ValidationError).details,
    };
  }

  // Handle Elysia validation errors
  if (error instanceof Error && error.message.includes("validation")) {
    return {
      code: "VALIDATION_ERROR",
      message: "Input validation failed",
      details: error.message,
    };
  }

  // Generic error fallback
  // Import logger only when needed to avoid circular dependencies
  const { loggerHelpers } = require("./logger");
  loggerHelpers.error(
    error instanceof Error ? error : new Error(String(error)),
    { type: "unexpected_error" }
  );
  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  };
}
