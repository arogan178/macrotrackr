import { describe, expect, it, vi } from "vitest";
import { getErrorMessage, handleApiError } from "./errorHandling";

describe("errorHandling", () => {
  describe("getErrorMessage", () => {
    it("extracts message from Error instance", () => {
      const error = new Error("Test error message");
      expect(getErrorMessage(error)).toBe("Test error message");
    });

    it("returns string as-is", () => {
      expect(getErrorMessage("String error")).toBe("String error");
    });

    it("extracts message from object with message property", () => {
      const error = { message: "Object error message" };
      expect(getErrorMessage(error)).toBe("Object error message");
    });

    it("returns unknown error message for other types", () => {
      expect(getErrorMessage(null)).toBe("An unknown error occurred");
      expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
      expect(getErrorMessage(123)).toBe("An unknown error occurred");
    });
  });

  describe("handleApiError", () => {
    it("logs error to console", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("API Error");

      handleApiError(error);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("includes context in log message", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("API Error");

      handleApiError(error, "test context");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("test context"),
        error
      );
      consoleSpy.mockRestore();
    });

    it("handles string errors", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      handleApiError("String error");

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
