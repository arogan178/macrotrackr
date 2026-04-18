import { describe, expect, it } from "vitest";

import { AUTH_ERROR_MESSAGES } from "./constants";

describe("auth constants", () => {
  describe("AUTH_ERROR_MESSAGES", () => {
    it("has date of birth required message", () => {
      expect(AUTH_ERROR_MESSAGES.dateOfBirthRequired).toBe("Date of birth is required");
    });

    it("has height required message", () => {
      expect(AUTH_ERROR_MESSAGES.heightRequired).toBe("Height is required");
    });

    it("has height invalid message", () => {
      expect(AUTH_ERROR_MESSAGES.heightInvalid).toBe("Please enter a valid height (100-250 cm)");
    });

    it("has weight required message", () => {
      expect(AUTH_ERROR_MESSAGES.weightRequired).toBe("Weight is required");
    });

    it("has weight invalid message", () => {
      expect(AUTH_ERROR_MESSAGES.weightInvalid).toBe("Please enter a valid weight (30-300 kg)");
    });

    it("has activity level required message", () => {
      expect(AUTH_ERROR_MESSAGES.activityLevelRequired).toBe("Activity level is required");
    });

    it("has exactly 6 error messages", () => {
      expect(Object.keys(AUTH_ERROR_MESSAGES)).toHaveLength(6);
    });

    it("all values are non-empty strings", () => {
      for (const message of Object.values(AUTH_ERROR_MESSAGES)) {
        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(0);
      }
    });
  });
});
