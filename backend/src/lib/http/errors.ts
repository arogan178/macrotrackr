import { loggerHelpers } from "../observability/logger";

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

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthIntegrationError extends AppError {
  constructor(message: string = "Authentication service is temporarily unavailable") {
    super(message, 500, "AUTH_INTEGRATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR");
    if (details) {
      this.details = details;
    }
  }

  public readonly details?: unknown;
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409, "RESOURCE_CONFLICT");
  }
}

export class AccountLinkRequiredError extends AppError {
  constructor(message: string = "Account link required") {
    super(message, 409, "ACCOUNT_LINK_REQUIRED");
  }
}

export class AccountNotSyncedError extends AppError {
  constructor(
    message: string = "Your account is not linked yet. Please finish setup.",
  ) {
    super(message, 409, "ACCOUNT_NOT_SYNCED");
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Database operation failed") {
    super(message, 500, "DATABASE_ERROR");
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

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
  loggerHelpers.error(
    error instanceof Error ? error : new Error(String(error)),
    { type: "unexpected_error" }
  );
  return {
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  };
}
