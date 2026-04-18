import { describe, expect, it, vi, beforeEach } from "vitest";

describe("responses", () => {
  // Stub env before importing anything
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "test-secret-that-is-at-least-32-chars");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "test_webhook_secret_marker");
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "price_monthly");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "price_yearly");
    vi.stubEnv("RESEND_API_KEY", "test_resend_api_key_marker");
    vi.stubEnv("CLERK_PUBLISHABLE_KEY", "pk_test");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test");
  });

  describe("createSuccessResponse", () => {
    it("creates a success response with data", async () => {
      const { createSuccessResponse } = await import("../../src/lib/http/responses");
      
      const response = createSuccessResponse({ id: 1, name: "test" });
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: 1, name: "test" });
    });

    it("creates a success response with message", async () => {
      const { createSuccessResponse } = await import("../../src/lib/http/responses");
      
      const response = createSuccessResponse({ id: 1 }, "Operation successful");
      
      expect(response.success).toBe(true);
      expect(response.message).toBe("Operation successful");
    });
  });

  describe("createErrorResponse", () => {
    it("creates an error response", async () => {
      const { createErrorResponse } = await import("../../src/lib/http/responses");
      
      const response = createErrorResponse("NOT_FOUND", "Resource not found");
      
      expect(response.success).toBe(false);
      expect(response.code).toBe("NOT_FOUND");
      expect(response.message).toBe("Resource not found");
    });

    it("creates an error response with details", async () => {
      const { createErrorResponse } = await import("../../src/lib/http/responses");
      
      const response = createErrorResponse(
        "VALIDATION_ERROR",
        "Invalid input",
        { field: "email", reason: "Invalid format" }
      );
      
      expect(response.details).toEqual({ field: "email", reason: "Invalid format" });
    });
  });

  describe("handleError", () => {
    it("handles AppError with status code", async () => {
      const { handleError } = await import("../../src/lib/http/responses");
      const { AppError } = await import("../../src/lib/http/errors");
      
      // Create an actual AppError instance
      const error = new AppError("Resource not found", 404, "NOT_FOUND");
      const set = {} as any;
      const response = handleError(error, set);
      
      expect(set.status).toBe(404);
      expect(response.code).toBe("NOT_FOUND");
      expect(response.success).toBe(false);
    });

    it("handles generic error", async () => {
      const { handleError } = await import("../../src/lib/http/responses");
      
      const error = new Error("Something went wrong");
      const set = {} as any;
      
      const response = handleError(error, set);
      
      expect(set.status).toBe(500);
      expect(response.code).toBe("INTERNAL_ERROR");
    });

    it("handles validation errors", async () => {
      const { handleError } = await import("../../src/lib/http/responses");
      
      const error = new Error("validation failed: invalid email");
      const set = {} as any;
      
      const response = handleError(error, set);
      
      expect(set.status).toBe(400);
      expect(response.code).toBe("VALIDATION_ERROR");
    });

    it("sets Content-Type header", async () => {
      const { handleError } = await import("../../src/lib/http/responses");
      
      const error = new Error("test");
      const set = {} as any;
      
      handleError(error, set);
      
      expect(set.headers).toEqual({ "Content-Type": "application/json" });
    });
  });
});
