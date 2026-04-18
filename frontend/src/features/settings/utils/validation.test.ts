import { describe, expect, it } from "vitest";

import { validateUserSettings } from "./validation";

describe("validateUserSettings", () => {
  const validSettings = {
    id: 1,
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: "1990-01-01",
    height: 180,
    weight: 75,
    activityLevel: 3,
    gender: "male" as const,
  };

  it("returns no errors for valid settings", () => {
    const result = validateUserSettings(validSettings);
    expect(result).toEqual({});
  });

  it("returns error for invalid email", () => {
    const settings = { ...validSettings, email: "invalid-email" };
    const result = validateUserSettings(settings);
    expect(result.email).toBe("Please enter a valid email address");
  });

  it("returns error for short first name", () => {
    const settings = { ...validSettings, firstName: "J" };
    const result = validateUserSettings(settings);
    expect(result.firstName).toBe("First name must be at least 2 characters");
  });

  it("returns no errors for undefined settings", () => {
    const result = validateUserSettings(undefined);
    expect(result).toEqual({});
  });
});
