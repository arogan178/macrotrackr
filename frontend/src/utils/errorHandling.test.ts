import { describe, expect, it } from "vitest";

import { getErrorMessage } from "./errorHandling";

describe("errorHandling", () => {
  describe("getErrorMessage", () => {
    it("extracts message from Error instance", () => {
      const error = new Error("Test error message");
      expect(getErrorMessage(error)).toBe("Test error message");
    });

    it("returns string error as-is", () => {
      expect(getErrorMessage("String error")).toBe("String error");
    });

    it("extracts message from object with message property", () => {
      const error = { message: "Object error" };
      expect(getErrorMessage(error)).toBe("Object error");
    });

    it("returns unknown error message for invalid input", () => {
      expect(getErrorMessage(null)).toBe("An unknown error occurred");
      expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
      expect(getErrorMessage(123)).toBe("An unknown error occurred");
    });
  });
});
