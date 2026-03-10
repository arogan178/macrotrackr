import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
  loggerHelpers: {
    error: vi.fn(),
  },
}));

import { NotFoundError } from "../../src/lib/errors";
import { handleServiceError } from "../../src/lib/error-handler";
import { logger } from "../../src/lib/logger";

describe("handleServiceError", () => {
  beforeEach(() => {
    vi.mocked(logger.error).mockReset();
  });

  it("rethrows known error types after logging", () => {
    const error = new NotFoundError("Meal not found");

    expect(() =>
      handleServiceError(error, "load_meal", { mealId: 42 }, [NotFoundError]),
    ).toThrow(error);

    expect(logger.error).toHaveBeenCalledWith(
      {
        error,
        operation: "load_meal",
        mealId: 42,
      },
      "Failed to load meal",
    );
  });

  it("wraps unknown failures in a generic service error", () => {
    expect(() =>
      handleServiceError("boom", "save_settings", { userId: 7 }),
    ).toThrow("An unexpected error occurred. Please try again later.");

    expect(logger.error).toHaveBeenCalledWith(
      {
        error: expect.any(Error),
        operation: "save_settings",
        userId: 7,
      },
      "Failed to save settings",
    );
  });

  it("handles missing context", () => {
    expect(() => handleServiceError(new Error("bad"), "refresh_cache")).toThrow(
      "An unexpected error occurred. Please try again later.",
    );

    expect(logger.error).toHaveBeenCalledWith(
      {
        error: expect.any(Error),
        operation: "refresh_cache",
      },
      "Failed to refresh cache",
    );
  });
});
