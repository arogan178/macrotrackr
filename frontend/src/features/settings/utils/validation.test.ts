import { describe, expect, it } from "vitest";

import { validateSettingsComplete, validateUserSettings } from "./validation";

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

describe("validateSettingsComplete", () => {
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

  it("returns no errors for complete valid settings", () => {
    const result = validateSettingsComplete(validSettings);
    expect(result).toEqual({});
  });

  it("returns errors when required profile fields are missing", () => {
    const incompleteSettings = {
      id: 1,
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: undefined,
      height: undefined,
      weight: undefined,
      activityLevel: undefined,
      gender: undefined,
    };
    const result = validateSettingsComplete(incompleteSettings);
    expect(result.dateOfBirth).toBe("Date of birth required");
    expect(result.gender).toBe("Gender required");
    expect(result.height).toBe("Height required");
    expect(result.weight).toBe("Weight required");
    expect(result.activityLevel).toBe("Activity level required");
  });
});
