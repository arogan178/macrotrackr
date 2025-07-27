import { QueryClient } from "@tanstack/react-query";
import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  shouldRetryError,
  calculateRetryDelay,
  createMutationRetryFn,
  createMutationRetryDelayFn,
  retryConfigs,
  isNetworkError,
  isServerError,
  isRateLimitError,
  isAuthError,
  isValidationError,
  MutationErrorHandler,
  createMutationErrorHandler,
  type MutationError,
} from "../mutationErrorHandling";

describe("mutationErrorHandling", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe("shouldRetryError", () => {
    it("should not retry when max attempts exceeded", () => {
      const error: MutationError = { name: "Error", message: "Test error" };
      expect(shouldRetryError(error, 3, 3)).toBe(false);
      expect(shouldRetryError(error, 5, 3)).toBe(false);
    });

    it("should not retry auth errors", () => {
      const authError: MutationError = { name: "Error", message: "Unauthorized", status: 401 };
      expect(shouldRetryError(authError, 1, 3)).toBe(false);

      const forbiddenError: MutationError = { name: "Error", message: "Forbidden", status: 403 };
      expect(shouldRetryError(forbiddenError, 1, 3)).toBe(false);
    });

    it("should not retry validation errors", () => {
      const badRequestError: MutationError = { name: "Error", message: "Bad request", status: 400 };
      expect(shouldRetryError(badRequestError, 1, 3)).toBe(false);

      const validationError: MutationError = { name: "Error", message: "Validation failed", status: 422 };
      expect(shouldRetryError(validationError, 1, 3)).toBe(false);
    });

    it("should not retry not found errors", () => {
      const notFoundError: MutationError = { name: "Error", message: "Not found", status: 404 };
      expect(shouldRetryError(notFoundError, 1, 3)).toBe(false);
    });

    it("should not retry conflict errors", () => {
      const conflictError: MutationError = { name: "Error", message: "Conflict", status: 409 };
      expect(shouldRetryError(conflictError, 1, 3)).toBe(false);
    });

    it("should retry rate limiting errors", () => {
      const rateLimitError: MutationError = { name: "Error", message: "Too many requests", status: 429 };
      expect(shouldRetryError(rateLimitError, 1, 3)).toBe(true);
    });

    it("should retry server errors", () => {
      const serverError: MutationError = { name: "Error", message: "Internal server error", status: 500 };
      expect(shouldRetryError(serverError, 1, 3)).toBe(true);

      const badGatewayError: MutationError = { name: "Error", message: "Bad gateway", status: 502 };
      expect(shouldRetryError(badGatewayError, 1, 3)).toBe(true);
    });

    it("should retry network errors", () => {
      const networkError: MutationError = { name: "NetworkError", message: "fetch failed" };
      expect(shouldRetryError(networkError, 1, 3)).toBe(true);

      const fetchError: MutationError = { name: "Error", message: "network error occurred" };
      expect(shouldRetryError(fetchError, 1, 3)).toBe(true);
    });

    it("should retry timeout errors", () => {
      const timeoutError: MutationError = { name: "TimeoutError", message: "Request timeout" };
      expect(shouldRetryError(timeoutError, 1, 3)).toBe(true);

      const abortError: MutationError = { name: "AbortError", message: "Request aborted" };
      expect(shouldRetryError(abortError, 1, 3)).toBe(true);
    });

    it("should not retry unknown errors by default", () => {
      const unknownError: MutationError = { name: "Error", message: "Unknown error" };
      expect(shouldRetryError(unknownError, 1, 3)).toBe(false);
    });
  });

  describe("calculateRetryDelay", () => {
    const config = retryConfigs.standard;

    it("should calculate exponential backoff delay", () => {
      expect(calculateRetryDelay(0, config)).toBeGreaterThanOrEqual(800); // ~1000ms with jitter
      expect(calculateRetryDelay(0, config)).toBeLessThanOrEqual(1200);

      expect(calculateRetryDelay(1, config)).toBeGreaterThanOrEqual(1600); // ~2000ms with jitter
      expect(calculateRetryDelay(1, config)).toBeLessThanOrEqual(2400);
    });

    it("should respect max delay", () => {
      const delay = calculateRetryDelay(10, config);
      expect(delay).toBeLessThanOrEqual(config.maxDelay * 1.5); // Account for jitter
    });

    it("should use longer delays for rate limiting", () => {
      const rateLimitError: MutationError = { name: "Error", message: "Rate limited", status: 429 };
      const normalDelay = calculateRetryDelay(1, config);
      const rateLimitDelay = calculateRetryDelay(1, config, rateLimitError);
      
      expect(rateLimitDelay).toBeGreaterThan(normalDelay);
    });

    it("should have minimum delay", () => {
      const smallConfig = { ...config, baseDelay: 50 };
      const delay = calculateRetryDelay(0, smallConfig);
      expect(delay).toBeGreaterThanOrEqual(100);
    });
  });

  describe("createMutationRetryFn", () => {
    it("should create retry function with config", () => {
      const retryFn = createMutationRetryFn(retryConfigs.standard);
      
      const serverError: MutationError = { name: "Error", message: "Server error", status: 500 };
      expect(retryFn(1, serverError)).toBe(true);
      expect(retryFn(3, serverError)).toBe(false); // Exceeds maxRetries

      const authError: MutationError = { name: "Error", message: "Unauthorized", status: 401 };
      expect(retryFn(1, authError)).toBe(false);
    });
  });

  describe("createMutationRetryDelayFn", () => {
    it("should create retry delay function with config", () => {
      const retryDelayFn = createMutationRetryDelayFn(retryConfigs.standard);
      
      const delay = retryDelayFn(1, { name: "Error", message: "Test" });
      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThanOrEqual(retryConfigs.standard.maxDelay * 1.5);
    });
  });

  describe("error classification functions", () => {
    it("should identify network errors correctly", () => {
      expect(isNetworkError({ name: "NetworkError", message: "" } as MutationError)).toBe(true);
      expect(isNetworkError({ name: "TypeError", message: "" } as MutationError)).toBe(true);
      expect(isNetworkError({ name: "Error", message: "fetch failed" } as MutationError)).toBe(true);
      expect(isNetworkError({ name: "Error", message: "network error" } as MutationError)).toBe(true);
      expect(isNetworkError({ name: "Error", message: "other error" } as MutationError)).toBe(false);
    });

    it("should identify server errors correctly", () => {
      expect(isServerError({ status: 500 } as MutationError)).toBe(true);
      expect(isServerError({ status: 502 } as MutationError)).toBe(true);
      expect(isServerError({ status: 599 } as MutationError)).toBe(true);
      expect(isServerError({ status: 400 } as MutationError)).toBe(false);
      expect(isServerError({ status: 600 } as MutationError)).toBe(false);
      expect(isServerError({} as MutationError)).toBe(false);
    });

    it("should identify rate limit errors correctly", () => {
      expect(isRateLimitError({ status: 429 } as MutationError)).toBe(true);
      expect(isRateLimitError({ status: 400 } as MutationError)).toBe(false);
      expect(isRateLimitError({} as MutationError)).toBe(false);
    });

    it("should identify auth errors correctly", () => {
      expect(isAuthError({ status: 401 } as MutationError)).toBe(true);
      expect(isAuthError({ status: 403 } as MutationError)).toBe(true);
      expect(isAuthError({ status: 400 } as MutationError)).toBe(false);
      expect(isAuthError({} as MutationError)).toBe(false);
    });

    it("should identify validation errors correctly", () => {
      expect(isValidationError({ status: 400 } as MutationError)).toBe(true);
      expect(isValidationError({ status: 422 } as MutationError)).toBe(true);
      expect(isValidationError({ status: 401 } as MutationError)).toBe(false);
      expect(isValidationError({} as MutationError)).toBe(false);
    });
  });

  describe("MutationErrorHandler", () => {
    let mockOnError: ReturnType<typeof vi.fn>;
    let mockOnRetry: ReturnType<typeof vi.fn>;
    let handler: MutationErrorHandler;

    beforeEach(() => {
      mockOnError = vi.fn();
      mockOnRetry = vi.fn();
      handler = createMutationErrorHandler({
        queryClient,
        onError: mockOnError,
        onRetry: mockOnRetry,
        showNotification: false,
      });
    });

    it("should handle errors with context", () => {
      const error: MutationError = { name: "Error", message: "Test error", status: 500 };
      const context = { operation: "testOperation", variables: { id: 1 } };

      handler.handleError(error, context);

      expect(mockOnError).toHaveBeenCalledWith(error);
    });

    it("should handle retry attempts", () => {
      const error: MutationError = { name: "Error", message: "Test error", status: 500 };
      
      handler.handleRetry(error, 2, "testOperation");

      expect(mockOnRetry).toHaveBeenCalledWith(error, 2);
    });

    it("should work without optional callbacks", () => {
      const simpleHandler = createMutationErrorHandler({ queryClient });
      const error: MutationError = { name: "Error", message: "Test error" };

      expect(() => {
        simpleHandler.handleError(error);
        simpleHandler.handleRetry(error, 1, "test");
      }).not.toThrow();
    });
  });

  describe("retry configs", () => {
    it("should have different configs for different operation types", () => {
      expect(retryConfigs.critical.maxRetries).toBeLessThan(retryConfigs.standard.maxRetries);
      expect(retryConfigs.standard.maxRetries).toBeLessThan(retryConfigs.background.maxRetries);
      
      expect(retryConfigs.critical.maxDelay).toBeLessThan(retryConfigs.background.maxDelay);
    });

    it("should have reasonable default values", () => {
      Object.values(retryConfigs).forEach(config => {
        expect(config.maxRetries).toBeGreaterThan(0);
        expect(config.baseDelay).toBeGreaterThan(0);
        expect(config.maxDelay).toBeGreaterThan(config.baseDelay);
        expect(config.backoffMultiplier).toBeGreaterThan(1);
        expect(config.jitterFactor).toBeGreaterThan(0);
        expect(config.jitterFactor).toBeLessThan(1);
      });
    });
  });
});