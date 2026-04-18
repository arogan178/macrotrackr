import { describe, expect, it, vi } from "vitest";

// Mock the logger module
vi.mock("../../src/lib/observability/logger", () => ({
  loggerHelpers: {
    error: vi.fn(),
  },
}));

import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  BadRequestError,
  ConflictError,
  AccountLinkRequiredError,
  AccountNotSyncedError,
  DatabaseError,
  isAppError,
  formatErrorResponse,
} from "../../src/lib/http/errors";

describe("errors", () => {
  describe("AppError", () => {
    it("creates error with default values", () => {
      const error = new AppError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.isOperational).toBe(true);
    });

    it("creates error with custom values", () => {
      const error = new AppError("Custom error", 400, "CUSTOM_CODE", false);
      expect(error.message).toBe("Custom error");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("CUSTOM_CODE");
      expect(error.isOperational).toBe(false);
    });
  });

  describe("AuthenticationError", () => {
    it("creates authentication error with correct defaults", () => {
      const error = new AuthenticationError();
      expect(error.message).toBe("Authentication required");
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("AUTHENTICATION_ERROR");
    });

    it("creates with custom message", () => {
      const error = new AuthenticationError("Please log in");
      expect(error.message).toBe("Please log in");
    });
  });

  describe("AuthorizationError", () => {
    it("creates authorization error with correct defaults", () => {
      const error = new AuthorizationError();
      expect(error.message).toBe("Access denied");
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("AUTHORIZATION_ERROR");
    });
  });

  describe("NotFoundError", () => {
    it("creates not found error with correct defaults", () => {
      const error = new NotFoundError();
      expect(error.message).toBe("Resource not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });

    it("creates with custom message", () => {
      const error = new NotFoundError("User not found");
      expect(error.message).toBe("User not found");
    });
  });

  describe("ValidationError", () => {
    it("creates validation error with correct defaults", () => {
      const error = new ValidationError("Invalid input");
      expect(error.message).toBe("Invalid input");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
    });

    it("includes details when provided", () => {
      const error = new ValidationError("Invalid input", { field: "email" });
      expect(error.details).toEqual({ field: "email" });
    });
  });

  describe("BadRequestError", () => {
    it("creates bad request error with correct defaults", () => {
      const error = new BadRequestError();
      expect(error.message).toBe("Bad request");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
    });
  });

  describe("ConflictError", () => {
    it("creates conflict error with correct defaults", () => {
      const error = new ConflictError();
      expect(error.message).toBe("Resource conflict");
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("RESOURCE_CONFLICT");
    });
  });

  describe("AccountLinkRequiredError", () => {
    it("creates account link required error with correct defaults", () => {
      const error = new AccountLinkRequiredError();
      expect(error.message).toBe("Account link required");
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("ACCOUNT_LINK_REQUIRED");
    });
  });

  describe("AccountNotSyncedError", () => {
    it("creates account not synced error with correct defaults", () => {
      const error = new AccountNotSyncedError();
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("ACCOUNT_NOT_SYNCED");
    });
  });

  describe("DatabaseError", () => {
    it("creates database error with correct defaults", () => {
      const error = new DatabaseError();
      expect(error.message).toBe("Database operation failed");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("DATABASE_ERROR");
    });
  });

  describe("isAppError", () => {
    it("returns true for AppError", () => {
      const error = new AppError("test");
      expect(isAppError(error)).toBe(true);
    });

    it("returns true for subclasses", () => {
      expect(isAppError(new AuthenticationError())).toBe(true);
      expect(isAppError(new NotFoundError())).toBe(true);
    });

    it("returns false for regular Error", () => {
      expect(isAppError(new Error("test"))).toBe(false);
    });

    it("returns false for non-error values", () => {
      expect(isAppError("string")).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });
  });

  describe("formatErrorResponse", () => {
    it("formats AppError correctly", () => {
      const error = new ValidationError("Invalid input", { field: "email" });
      const response = formatErrorResponse(error);
      expect(response.code).toBe("VALIDATION_ERROR");
      expect(response.message).toBe("Invalid input");
      expect(response.details).toEqual({ field: "email" });
    });

    it("formats regular Error with validation message", () => {
      const error = new Error("validation failed: email is required");
      const response = formatErrorResponse(error);
      expect(response.code).toBe("VALIDATION_ERROR");
      expect(response.message).toBe("Input validation failed");
    });

    it("formats unknown error as internal error", () => {
      const response = formatErrorResponse("unknown error");
      expect(response.code).toBe("INTERNAL_ERROR");
      expect(response.message).toBe("An unexpected error occurred");
    });
  });
});
