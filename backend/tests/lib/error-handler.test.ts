import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the logger module
vi.mock("../../src/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { logger } from "../../src/lib/logger";

import { handleServiceError } from "../../src/lib/error-handler";
import { NotFoundError, ValidationError } from "../../src/lib/errors";

describe("error-handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe("handleServiceError", () => {
    it("throws generic error for unknown errors", () => {
      expect(() =>
        handleServiceError(new Error("Unknown error"), "fetch_user")
      ).toThrow("An unexpected error occurred. Please try again later.");
    });

    it("throws for string errors", () => {
      expect(() =>
        handleServiceError("String error", "fetch_user")
      ).toThrow("An unexpected error occurred. Please try again later.");
    });

    it("rethrows known error types when provided", () => {
      const notFoundError = new NotFoundError("User not found");

      expect(() =>
        handleServiceError(notFoundError, "fetch_user", {}, [NotFoundError])
      ).toThrow(NotFoundError);
    });

    it("does not rethrow unknown errors even when knownErrors provided", () => {
      const validationError = new ValidationError("Invalid");

      expect(() =>
        handleServiceError(validationError, "fetch_user", {}, [NotFoundError])
      ).toThrow("An unexpected error occurred. Please try again later.");
    });

    it("logs error with operation name", () => {
      const loggerError = vi.fn();
      vi.mocked(logger.error).mockImplementation(loggerError);

      try {
        handleServiceError(new Error("test"), "fetch_user");
      } catch {
        // Expected to throw
      }

      expect(loggerError).toHaveBeenCalled();
    });

    it("includes context in log", () => {
      const loggerError = vi.fn();
      vi.mocked(logger.error).mockImplementation(loggerError);

      try {
        handleServiceError(new Error("test"), "fetch_user", { userId: 123 });
      } catch {
        // Expected to throw
      }

      expect(loggerError).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 123,
        }),
        expect.any(String)
      );
    });
  });
});
