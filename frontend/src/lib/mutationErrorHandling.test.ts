import {
  logMutationError,
  createMutationErrorLogger,
  retryConfigs,
  shouldRetryError,
  calculateRetryDelay,
  createMutationRetryFunction,
  createMutationRetryDelayFunction,
  isNetworkError,
  isTimeoutError,
  isServerError,
  isRateLimitError,
  isAuthError,
  isValidationError,
  isConflictError,
  MutationErrorHandler,
  createMutationErrorHandler,
} from "./mutationErrorHandling";

describe("mutationErrorHandling", () => {
  describe("logMutationError", () => {
    it("should log error with operation", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      logMutationError("saveUser", new Error("Test error"));
      expect(consoleSpy).toHaveBeenCalledWith("saveUser:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("createMutationErrorLogger", () => {
    it("should create a logger function", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const logger = createMutationErrorLogger("testOp");
      logger(new Error("Test"));
      expect(consoleSpy).toHaveBeenCalledWith("testOp:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("retryConfigs", () => {
    it("should have critical config", () => {
      expect(retryConfigs.critical.maxRetries).toBe(2);
    });

    it("should have standard config", () => {
      expect(retryConfigs.standard.maxRetries).toBe(3);
    });

    it("should have background config", () => {
      expect(retryConfigs.background.maxRetries).toBe(5);
    });
  });

  describe("shouldRetryError", () => {
    it("should return false when exceeding max retries", () => {
      const error = { message: "error" } as MutationError;
      expect(shouldRetryError(error, 5, 3)).toBe(false);
    });

    it("should return false for 401 auth errors", () => {
      const error = { status: 401, message: "Unauthorized" } as MutationError;
      expect(shouldRetryError(error, 0, 3)).toBe(false);
    });

    it("should return false for 403 forbidden errors", () => {
      const error = { status: 403, message: "Forbidden" } as MutationError;
      expect(shouldRetryError(error, 0, 3)).toBe(false);
    });

    it("should return false for 400 validation errors", () => {
      const error = { status: 400, message: "Bad request" } as MutationError;
      expect(shouldRetryError(error, 0, 3)).toBe(false);
    });

    it("should return false for 404 not found errors", () => {
      const error = { status: 404, message: "Not found" } as MutationError;
      expect(shouldRetryError(error, 0, 3)).toBe(false);
    });

    it("should return false for 409 conflict errors", () => {
      const error = { status: 409, message: "Conflict" } as MutationError;
      expect(shouldRetryError(error, 0, 3)).toBe(false);
    });

    it("should return true for 429 rate limit errors", () => {
      const error = { status: 429, message: "Rate limited" } as MutationError;
      expect(shouldRetryError(error, 0, 3)).toBe(true);
    });

    it("should return true for 500 server errors", () => {
      const error = { status: 500, message: "Server error" } as MutationError;
      expect(shouldRetryError(error, 0, 3)).toBe(true);
    });

    it("should return true for network errors", () => {
      const error = { message: "network request failed" } as MutationError;
      expect(shouldRetryError(error, 0, 3)).toBe(true);
    });

    it("should return true for timeout errors", () => {
      const error = { message: "Request timeout" } as MutationError;
      expect(shouldRetryError(error, 0, 3)).toBe(true);
    });
  });

  describe("calculateRetryDelay", () => {
    const config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitterFactor: 0,
    };

    it("should calculate exponential backoff", () => {
      const delay = calculateRetryDelay(0, config);
      expect(delay).toBe(1000);
    });

    it("should increase delay with attempt index", () => {
      const delay0 = calculateRetryDelay(0, config);
      const delay1 = calculateRetryDelay(1, config);
      expect(delay1).toBeGreaterThan(delay0);
    });

    it("should respect max delay", () => {
      const configWithLowMax = { ...config, maxDelay: 1500 };
      const delay = calculateRetryDelay(10, configWithLowMax);
      expect(delay).toBeLessThanOrEqual(1500);
    });

    it("should use longer delay for rate limiting", () => {
      const error = { status: 429 } as MutationError;
      const delay = calculateRetryDelay(0, config, error);
      expect(delay).toBeGreaterThan(1000);
    });

    it("should have minimum delay of 100ms", () => {
      const delay = calculateRetryDelay(0, { ...config, baseDelay: 0 });
      expect(delay).toBeGreaterThanOrEqual(100);
    });
  });

  describe("createMutationRetryFunction", () => {
    it("should create retry function using config", () => {
      const retryFn = createMutationRetryFunction(retryConfigs.standard);
      const error = { message: "network error" } as MutationError;
      expect(retryFn(0, error)).toBe(true);
    });
  });

  describe("createMutationRetryDelayFunction", () => {
    it("should create delay function", () => {
      const delayFn = createMutationRetryDelayFunction(retryConfigs.standard);
      const delay = delayFn(0, undefined as unknown as MutationError);
      expect(typeof delay).toBe("number");
    });
  });

  describe("error classification", () => {
    it("should detect network errors in message", () => {
      const error = { message: "network request failed", name: "Error" } as MutationError;
      expect(isNetworkError(error)).toBe(true);
    });

    it("should detect fetch errors", () => {
      const error = { message: "fetch failed", name: "Error" } as MutationError;
      expect(isNetworkError(error)).toBe(true);
    });

    it("should detect NetworkError name", () => {
      const error = { message: "error", name: "NetworkError" } as MutationError;
      expect(isNetworkError(error)).toBe(true);
    });

    describe("isTimeoutError", () => {
      it("should detect timeout errors", () => {
        const error = { message: "Request timeout", name: "Error" } as MutationError;
        expect(isTimeoutError(error)).toBe(true);
      });

      it("should detect abort errors", () => {
        const error = { message: "Request aborted", name: "AbortError" } as MutationError;
        expect(isTimeoutError(error)).toBe(true);
      });
    });

    describe("isServerError", () => {
      it("should detect 500 status", () => {
        const error = { status: 500 } as MutationError;
        expect(isServerError(error)).toBe(true);
      });

      it("should detect 503 status", () => {
        const error = { status: 503 } as MutationError;
        expect(isServerError(error)).toBe(true);
      });

      it("should return false for client errors", () => {
        const error = { status: 400 } as MutationError;
        expect(isServerError(error)).toBe(false);
      });
    });

    describe("isRateLimitError", () => {
      it("should detect 429 status", () => {
        const error = { status: 429 } as MutationError;
        expect(isRateLimitError(error)).toBe(true);
      });
    });

    describe("isAuthError", () => {
      it("should detect 401 status", () => {
        const error = { status: 401 } as MutationError;
        expect(isAuthError(error)).toBe(true);
      });

      it("should detect 403 status", () => {
        const error = { status: 403 } as MutationError;
        expect(isAuthError(error)).toBe(true);
      });
    });

    describe("isValidationError", () => {
      it("should detect 400 status", () => {
        const error = { status: 400 } as MutationError;
        expect(isValidationError(error)).toBe(true);
      });

      it("should detect 422 status", () => {
        const error = { status: 422 } as MutationError;
        expect(isValidationError(error)).toBe(true);
      });
    });

    describe("isConflictError", () => {
      it("should detect 409 status", () => {
        const error = { status: 409 } as MutationError;
        expect(isConflictError(error)).toBe(true);
      });
    });
  });

  describe("MutationErrorHandler", () => {
    it("should handle error and log", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const handler = new MutationErrorHandler({} as any);
      handler.handleError({ message: "Error", status: 500 } as MutationError);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should call onError callback", () => {
      const onError = vi.fn();
      const handler = new MutationErrorHandler({ onError } as any);
      handler.handleError({ message: "Error" } as MutationError);
      expect(onError).toHaveBeenCalled();
    });

    it("should handle retry and log", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const handler = new MutationErrorHandler({} as any);
      handler.handleRetry({ message: "Error" } as MutationError, 1, "testOp");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("createMutationErrorHandler", () => {
    it("should create error handler instance", () => {
      const handler = createMutationErrorHandler({} as any);
      expect(handler).toBeInstanceOf(MutationErrorHandler);
    });
  });
});
