// backend/tests/contracts/api-responses.test.ts
// Contract tests for API response schemas

import { describe, it, expect } from "vitest";
import {
  // Type guards
  isValidMacroTargetResponse,
  isValidMacroTotalsResponse,
  isValidMacroEntryResponse,
  isValidMacroHistoryResponse,
  isValidWeightGoalResponse,
  isValidWeightLogResponse,
  isValidUserProfileResponse,
  isValidMacroTarget,
  isValidMealType,
  isValidWeightGoalType,
  isValidWeightLogEntry,
  isValidUserSubscription,
  isValidDateString,
  isValidTimeString,
  isValidISODateTimeString,
  // Types (imported for type checking)
  type MacroTargetResponse,
  type MacroTotalsResponse,
  type MacroEntryResponse,
  type MacroHistoryResponse,
  type WeightGoalResponse,
  type WeightLogResponse,
  type UserProfileResponse,
} from "./schemas";

// ============================================================================
// Macro Target Response Tests
// GET /api/macros/target
// ============================================================================

describe("MacroTargetResponse Contract", () => {
  describe("isValidMacroTarget", () => {
    it("accepts valid macro target with all required fields", () => {
      const validTarget = {
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
        lockedMacros: ["protein", "carbs"],
      };
      expect(isValidMacroTarget(validTarget)).toBe(true);
    });

    it("accepts macro target with empty lockedMacros array", () => {
      const validTarget = {
        proteinPercentage: 25,
        carbsPercentage: 50,
        fatsPercentage: 25,
        lockedMacros: [],
      };
      expect(isValidMacroTarget(validTarget)).toBe(true);
    });

    it("rejects macro target with invalid lockedMacros values", () => {
      const invalidTarget = {
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
        lockedMacros: ["invalid", "protein"],
      };
      expect(isValidMacroTarget(invalidTarget)).toBe(false);
    });

    it("rejects macro target with missing fields", () => {
      const invalidTarget = {
        proteinPercentage: 30,
        carbsPercentage: 40,
        // missing fatsPercentage
        lockedMacros: [],
      };
      expect(isValidMacroTarget(invalidTarget)).toBe(false);
    });

    it("rejects macro target with wrong types", () => {
      const invalidTarget = {
        proteinPercentage: "30",
        carbsPercentage: 40,
        fatsPercentage: 30,
        lockedMacros: [],
      };
      expect(isValidMacroTarget(invalidTarget)).toBe(false);
    });
  });

  describe("isValidMacroTargetResponse", () => {
    it("accepts valid response with macroTarget object", () => {
      const validResponse: MacroTargetResponse = {
        macroTarget: {
          proteinPercentage: 30,
          carbsPercentage: 40,
          fatsPercentage: 30,
          lockedMacros: [],
        },
      };
      expect(isValidMacroTargetResponse(validResponse)).toBe(true);
    });

    it("rejects response without macroTarget", () => {
      const invalidResponse = {
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
      };
      expect(isValidMacroTargetResponse(invalidResponse)).toBe(false);
    });

    it("rejects null", () => {
      expect(isValidMacroTargetResponse(null)).toBe(false);
    });

    it("rejects undefined", () => {
      expect(isValidMacroTargetResponse(undefined)).toBe(false);
    });

    it("rejects primitive values", () => {
      expect(isValidMacroTargetResponse("string")).toBe(false);
      expect(isValidMacroTargetResponse(123)).toBe(false);
      expect(isValidMacroTargetResponse(true)).toBe(false);
    });
  });
});

// ============================================================================
// Macro Totals Response Tests
// GET /api/macros/totals
// ============================================================================

describe("MacroTotalsResponse Contract", () => {
  describe("isValidMacroTotalsResponse", () => {
    it("accepts valid totals response", () => {
      const validResponse: MacroTotalsResponse = {
        protein: 150,
        carbs: 200,
        fats: 65,
        calories: 1985,
      };
      expect(isValidMacroTotalsResponse(validResponse)).toBe(true);
    });

    it("accepts totals with zero values", () => {
      const validResponse: MacroTotalsResponse = {
        protein: 0,
        carbs: 0,
        fats: 0,
        calories: 0,
      };
      expect(isValidMacroTotalsResponse(validResponse)).toBe(true);
    });

    it("accepts totals with decimal values", () => {
      const validResponse = {
        protein: 150.5,
        carbs: 200.25,
        fats: 65.75,
        calories: 1985,
      };
      expect(isValidMacroTotalsResponse(validResponse)).toBe(true);
    });

    it("rejects response with missing calories", () => {
      const invalidResponse = {
        protein: 150,
        carbs: 200,
        fats: 65,
        // missing calories
      };
      expect(isValidMacroTotalsResponse(invalidResponse)).toBe(false);
    });

    it("rejects response with wrong types", () => {
      const invalidResponse = {
        protein: "150",
        carbs: 200,
        fats: 65,
        calories: 1985,
      };
      expect(isValidMacroTotalsResponse(invalidResponse)).toBe(false);
    });

    it("rejects null", () => {
      expect(isValidMacroTotalsResponse(null)).toBe(false);
    });
  });
});

// ============================================================================
// Macro Entry Response Tests
// POST /api/macros
// ============================================================================

describe("MacroEntryResponse Contract", () => {
  describe("isValidMealType", () => {
    it("accepts valid meal types", () => {
      expect(isValidMealType("breakfast")).toBe(true);
      expect(isValidMealType("lunch")).toBe(true);
      expect(isValidMealType("dinner")).toBe(true);
      expect(isValidMealType("snack")).toBe(true);
    });

    it("rejects invalid meal types", () => {
      expect(isValidMealType("breakfast ")).toBe(false);
      expect(isValidMealType("BREAKFAST")).toBe(false);
      expect(isValidMealType("brunch")).toBe(false);
      expect(isValidMealType("")).toBe(false);
    });
  });

  describe("isValidMacroEntryResponse", () => {
    it("accepts valid macro entry response", () => {
      const validResponse: MacroEntryResponse = {
        id: 1,
        protein: 30,
        carbs: 40,
        fats: 15,
        mealType: "lunch",
        mealName: "Chicken Salad",
        entryDate: "2026-02-18",
        entryTime: "12:30",
        createdAt: "2026-02-18T12:30:00Z",
      };
      expect(isValidMacroEntryResponse(validResponse)).toBe(true);
    });

    it("accepts macro entry without mealName", () => {
      const validResponse = {
        id: 1,
        protein: 30,
        carbs: 40,
        fats: 15,
        mealType: "snack",
        entryDate: "2026-02-18",
        entryTime: "15:00:00",
        createdAt: "2026-02-18T15:00:00Z",
      };
      expect(isValidMacroEntryResponse(validResponse)).toBe(true);
    });

    it("accepts macro entry with empty mealName", () => {
      const validResponse = {
        id: 1,
        protein: 30,
        carbs: 40,
        fats: 15,
        mealType: "breakfast",
        mealName: "",
        entryDate: "2026-02-18",
        entryTime: "08:00",
        createdAt: "2026-02-18T08:00:00Z",
      };
      expect(isValidMacroEntryResponse(validResponse)).toBe(true);
    });

    it("rejects entry with invalid mealType", () => {
      const invalidResponse = {
        id: 1,
        protein: 30,
        carbs: 40,
        fats: 15,
        mealType: "brunch",
        entryDate: "2026-02-18",
        entryTime: "12:30",
        createdAt: "2026-02-18T12:30:00Z",
      };
      expect(isValidMacroEntryResponse(invalidResponse)).toBe(false);
    });

    it("rejects entry with missing required fields", () => {
      const invalidResponse = {
        id: 1,
        protein: 30,
        // missing carbs, fats
        mealType: "lunch",
        entryDate: "2026-02-18",
        entryTime: "12:30",
        createdAt: "2026-02-18T12:30:00Z",
      };
      expect(isValidMacroEntryResponse(invalidResponse)).toBe(false);
    });

    it("rejects entry with wrong id type", () => {
      const invalidResponse = {
        id: "1",
        protein: 30,
        carbs: 40,
        fats: 15,
        mealType: "lunch",
        entryDate: "2026-02-18",
        entryTime: "12:30",
        createdAt: "2026-02-18T12:30:00Z",
      };
      expect(isValidMacroEntryResponse(invalidResponse)).toBe(false);
    });
  });
});

// ============================================================================
// Macro History Response Tests
// GET /api/macros/history
// ============================================================================

describe("MacroHistoryResponse Contract", () => {
  describe("isValidMacroHistoryResponse", () => {
    it("accepts valid history response with entries", () => {
      const validResponse: MacroHistoryResponse = {
        entries: [
          {
            id: 1,
            protein: 30,
            carbs: 40,
            fats: 15,
            mealType: "lunch",
            mealName: "Salad",
            entryDate: "2026-02-18",
            entryTime: "12:30",
            createdAt: "2026-02-18T12:30:00Z",
          },
          {
            id: 2,
            protein: 25,
            carbs: 30,
            fats: 10,
            mealType: "breakfast",
            entryDate: "2026-02-18",
            entryTime: "08:00",
            createdAt: "2026-02-18T08:00:00Z",
          },
        ],
        total: 50,
        limit: 20,
        offset: 0,
        hasMore: true,
      };
      expect(isValidMacroHistoryResponse(validResponse)).toBe(true);
    });

    it("accepts history response with empty entries", () => {
      const validResponse: MacroHistoryResponse = {
        entries: [],
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      };
      expect(isValidMacroHistoryResponse(validResponse)).toBe(true);
    });

    it("rejects response with invalid entry in array", () => {
      const invalidResponse = {
        entries: [
          {
            id: 1,
            protein: 30,
            carbs: 40,
            fats: 15,
            mealType: "invalid_meal",
            entryDate: "2026-02-18",
            entryTime: "12:30",
            createdAt: "2026-02-18T12:30:00Z",
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
      };
      expect(isValidMacroHistoryResponse(invalidResponse)).toBe(false);
    });

    it("rejects response with missing pagination fields", () => {
      const invalidResponse = {
        entries: [],
        total: 0,
        // missing limit, offset, hasMore
      };
      expect(isValidMacroHistoryResponse(invalidResponse)).toBe(false);
    });

    it("rejects response with wrong hasMore type", () => {
      const invalidResponse = {
        entries: [],
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: "true",
      };
      expect(isValidMacroHistoryResponse(invalidResponse)).toBe(false);
    });
  });
});

// ============================================================================
// Weight Goal Response Tests
// GET /api/goals/weight
// ============================================================================

describe("WeightGoalResponse Contract", () => {
  describe("isValidWeightGoalType", () => {
    it("accepts valid weight goal types", () => {
      expect(isValidWeightGoalType("lose")).toBe(true);
      expect(isValidWeightGoalType("maintain")).toBe(true);
      expect(isValidWeightGoalType("gain")).toBe(true);
    });

    it("rejects invalid weight goal types", () => {
      expect(isValidWeightGoalType("bulk")).toBe(false);
      expect(isValidWeightGoalType("cut")).toBe(false);
      expect(isValidWeightGoalType("LOSE")).toBe(false);
      expect(isValidWeightGoalType("")).toBe(false);
    });
  });

  describe("isValidWeightGoalResponse", () => {
    it("accepts valid weight goal response with all fields", () => {
      const validResponse: WeightGoalResponse = {
        startingWeight: 85.5,
        currentWeight: 83.2,
        targetWeight: 80,
        weightGoal: "lose",
        startDate: "2026-01-01",
        targetDate: "2026-06-01",
        calorieTarget: 2000,
        calculatedWeeks: 22,
        weeklyChange: 0.25,
        dailyChange: 250,
      };
      expect(isValidWeightGoalResponse(validResponse)).toBe(true);
    });

    it("accepts weight goal response with null values", () => {
      const validResponse: WeightGoalResponse = {
        startingWeight: null,
        currentWeight: null,
        targetWeight: null,
        weightGoal: null,
        startDate: null,
        targetDate: null,
        calorieTarget: null,
        calculatedWeeks: null,
        weeklyChange: null,
        dailyChange: null,
      };
      expect(isValidWeightGoalResponse(validResponse)).toBe(true);
    });

    it("accepts weight goal response with mixed null and values", () => {
      const validResponse: WeightGoalResponse = {
        startingWeight: 85.5,
        currentWeight: 84,
        targetWeight: null,
        weightGoal: "maintain",
        startDate: "2026-01-01",
        targetDate: null,
        calorieTarget: 2200,
        calculatedWeeks: null,
        weeklyChange: null,
        dailyChange: null,
      };
      expect(isValidWeightGoalResponse(validResponse)).toBe(true);
    });

    it("rejects response with invalid weightGoal type", () => {
      const invalidResponse = {
        startingWeight: 85.5,
        currentWeight: 83.2,
        targetWeight: 80,
        weightGoal: "bulk",
        startDate: "2026-01-01",
        targetDate: "2026-06-01",
        calorieTarget: 2000,
        calculatedWeeks: 22,
        weeklyChange: 0.25,
        dailyChange: 250,
      };
      expect(isValidWeightGoalResponse(invalidResponse)).toBe(false);
    });

    it("rejects response with wrong number type", () => {
      const invalidResponse = {
        startingWeight: "85.5",
        currentWeight: 83.2,
        targetWeight: 80,
        weightGoal: "lose",
        startDate: "2026-01-01",
        targetDate: "2026-06-01",
        calorieTarget: 2000,
        calculatedWeeks: 22,
        weeklyChange: 0.25,
        dailyChange: 250,
      };
      expect(isValidWeightGoalResponse(invalidResponse)).toBe(false);
    });

    it("rejects response with missing fields", () => {
      const invalidResponse = {
        startingWeight: 85.5,
        // missing other fields
      };
      expect(isValidWeightGoalResponse(invalidResponse)).toBe(false);
    });
  });
});

// ============================================================================
// Weight Log Response Tests
// GET /api/goals/weight-log
// ============================================================================

describe("WeightLogResponse Contract", () => {
  describe("isValidWeightLogEntry", () => {
    it("accepts valid weight log entry", () => {
      const validEntry = {
        id: "abc123",
        timestamp: "2026-02-18T08:30:00Z",
        weight: 83.5,
      };
      expect(isValidWeightLogEntry(validEntry)).toBe(true);
    });

    it("rejects entry with missing fields", () => {
      const invalidEntry = {
        id: "abc123",
        timestamp: "2026-02-18T08:30:00Z",
        // missing weight
      };
      expect(isValidWeightLogEntry(invalidEntry)).toBe(false);
    });

    it("rejects entry with wrong id type", () => {
      const invalidEntry = {
        id: 123,
        timestamp: "2026-02-18T08:30:00Z",
        weight: 83.5,
      };
      expect(isValidWeightLogEntry(invalidEntry)).toBe(false);
    });

    it("rejects entry with wrong weight type", () => {
      const invalidEntry = {
        id: "abc123",
        timestamp: "2026-02-18T08:30:00Z",
        weight: "83.5",
      };
      expect(isValidWeightLogEntry(invalidEntry)).toBe(false);
    });
  });

  describe("isValidWeightLogResponse", () => {
    it("accepts valid weight log response with entries", () => {
      const validResponse: WeightLogResponse = [
        { id: "abc123", timestamp: "2026-02-18T08:30:00Z", weight: 83.5 },
        { id: "def456", timestamp: "2026-02-17T08:30:00Z", weight: 83.7 },
        { id: "ghi789", timestamp: "2026-02-16T08:30:00Z", weight: 84.0 },
      ];
      expect(isValidWeightLogResponse(validResponse)).toBe(true);
    });

    it("accepts empty weight log response", () => {
      const validResponse: WeightLogResponse = [];
      expect(isValidWeightLogResponse(validResponse)).toBe(true);
    });

    it("rejects response with invalid entry", () => {
      const invalidResponse = [
        { id: "abc123", timestamp: "2026-02-18T08:30:00Z", weight: 83.5 },
        { id: 456, timestamp: "2026-02-17T08:30:00Z", weight: 83.7 }, // invalid id
      ];
      expect(isValidWeightLogResponse(invalidResponse)).toBe(false);
    });

    it("rejects non-array", () => {
      expect(isValidWeightLogResponse(null)).toBe(false);
      expect(isValidWeightLogResponse({})).toBe(false);
      expect(isValidWeightLogResponse("not an array")).toBe(false);
    });
  });
});

// ============================================================================
// User Profile Response Tests
// GET /api/user/me
// ============================================================================

describe("UserProfileResponse Contract", () => {
  describe("isValidUserSubscription", () => {
    it("accepts valid subscription with all fields", () => {
      const validSubscription = {
        status: "pro",
        hasStripeCustomer: true,
        currentPeriodEnd: "2026-03-18T00:00:00Z",
      };
      expect(isValidUserSubscription(validSubscription)).toBe(true);
    });

    it("accepts subscription with null currentPeriodEnd", () => {
      const validSubscription = {
        status: "free",
        hasStripeCustomer: false,
        currentPeriodEnd: null,
      };
      expect(isValidUserSubscription(validSubscription)).toBe(true);
    });

    it("accepts subscription without currentPeriodEnd", () => {
      const validSubscription = {
        status: "free",
        hasStripeCustomer: false,
      };
      expect(isValidUserSubscription(validSubscription)).toBe(true);
    });

    it("rejects subscription with invalid status", () => {
      const invalidSubscription = {
        status: "premium",
        hasStripeCustomer: true,
      };
      expect(isValidUserSubscription(invalidSubscription)).toBe(false);
    });

    it("rejects subscription with wrong hasStripeCustomer type", () => {
      const invalidSubscription = {
        status: "pro",
        hasStripeCustomer: "yes",
      };
      expect(isValidUserSubscription(invalidSubscription)).toBe(false);
    });
  });

  describe("isValidUserProfileResponse", () => {
    it("accepts valid user profile response", () => {
      const validResponse: UserProfileResponse = {
        id: 1,
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: "2026-01-01T00:00:00Z",
        dateOfBirth: "1990-05-15",
        height: 180,
        weight: 75,
        gender: "male",
        activityLevel: 3,
        isProfileComplete: true,
        subscription: {
          status: "pro",
          hasStripeCustomer: true,
          currentPeriodEnd: "2026-03-18T00:00:00Z",
        },
      };
      expect(isValidUserProfileResponse(validResponse)).toBe(true);
    });

    it("accepts user profile with null optional fields", () => {
      const validResponse: UserProfileResponse = {
        id: 1,
        email: "user@example.com",
        firstName: "Jane",
        lastName: "Smith",
        createdAt: "2026-01-01T00:00:00Z",
        dateOfBirth: null,
        height: null,
        weight: null,
        gender: null,
        activityLevel: null,
        isProfileComplete: false,
        subscription: {
          status: "free",
          hasStripeCustomer: false,
        },
      };
      expect(isValidUserProfileResponse(validResponse)).toBe(true);
    });

    it("accepts user profile with female gender", () => {
      const validResponse = {
        id: 1,
        email: "user@example.com",
        firstName: "Jane",
        lastName: "Doe",
        createdAt: "2026-01-01T00:00:00Z",
        dateOfBirth: "1992-08-20",
        height: 165,
        weight: 60,
        gender: "female",
        activityLevel: 4,
        isProfileComplete: true,
        subscription: {
          status: "free",
          hasStripeCustomer: false,
        },
      };
      expect(isValidUserProfileResponse(validResponse)).toBe(true);
    });

    it("rejects profile with invalid email", () => {
      const invalidResponse = {
        id: 1,
        email: 123, // should be string
        firstName: "John",
        lastName: "Doe",
        createdAt: "2026-01-01T00:00:00Z",
        dateOfBirth: null,
        height: null,
        weight: null,
        gender: null,
        activityLevel: null,
        isProfileComplete: false,
        subscription: {
          status: "free",
          hasStripeCustomer: false,
        },
      };
      expect(isValidUserProfileResponse(invalidResponse)).toBe(false);
    });

    it("rejects profile with invalid gender", () => {
      const invalidResponse = {
        id: 1,
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: "2026-01-01T00:00:00Z",
        dateOfBirth: null,
        height: null,
        weight: null,
        gender: "other", // invalid
        activityLevel: null,
        isProfileComplete: false,
        subscription: {
          status: "free",
          hasStripeCustomer: false,
        },
      };
      expect(isValidUserProfileResponse(invalidResponse)).toBe(false);
    });

    it("rejects profile with invalid subscription", () => {
      const invalidResponse = {
        id: 1,
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: "2026-01-01T00:00:00Z",
        dateOfBirth: null,
        height: null,
        weight: null,
        gender: null,
        activityLevel: null,
        isProfileComplete: false,
        subscription: {
          status: "invalid_status", // invalid
          hasStripeCustomer: false,
        },
      };
      expect(isValidUserProfileResponse(invalidResponse)).toBe(false);
    });

    it("rejects profile with missing required fields", () => {
      const invalidResponse = {
        id: 1,
        email: "user@example.com",
        // missing firstName, lastName
        createdAt: "2026-01-01T00:00:00Z",
        isProfileComplete: false,
        subscription: {
          status: "free",
          hasStripeCustomer: false,
        },
      };
      expect(isValidUserProfileResponse(invalidResponse)).toBe(false);
    });

    it("rejects profile with wrong isProfileComplete type", () => {
      const invalidResponse = {
        id: 1,
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: "2026-01-01T00:00:00Z",
        dateOfBirth: null,
        height: null,
        weight: null,
        gender: null,
        activityLevel: null,
        isProfileComplete: "yes", // should be boolean
        subscription: {
          status: "free",
          hasStripeCustomer: false,
        },
      };
      expect(isValidUserProfileResponse(invalidResponse)).toBe(false);
    });
  });
});

// ============================================================================
// Helper Function Tests
// ============================================================================

describe("Helper Functions", () => {
  describe("isValidDateString", () => {
    it("accepts valid date strings in YYYY-MM-DD format", () => {
      expect(isValidDateString("2026-02-18")).toBe(true);
      expect(isValidDateString("2026-01-01")).toBe(true);
      expect(isValidDateString("2025-12-31")).toBe(true);
    });

    it("rejects invalid date strings", () => {
      expect(isValidDateString("2026-2-18")).toBe(false);
      expect(isValidDateString("18-02-2026")).toBe(false);
      expect(isValidDateString("2026/02/18")).toBe(false);
      expect(isValidDateString("2026-13-01")).toBe(false);
      expect(isValidDateString("not-a-date")).toBe(false);
    });
  });

  describe("isValidTimeString", () => {
    it("accepts valid time strings in HH:MM format", () => {
      expect(isValidTimeString("00:00")).toBe(true);
      expect(isValidTimeString("12:30")).toBe(true);
      expect(isValidTimeString("23:59")).toBe(true);
    });

    it("accepts valid time strings in HH:MM:SS format", () => {
      expect(isValidTimeString("00:00:00")).toBe(true);
      expect(isValidTimeString("12:30:45")).toBe(true);
      expect(isValidTimeString("23:59:59")).toBe(true);
    });

    it("rejects invalid time strings", () => {
      expect(isValidTimeString("24:00")).toBe(false);
      expect(isValidTimeString("12:60")).toBe(false);
      expect(isValidTimeString("12:30:60")).toBe(false);
      expect(isValidTimeString("1:30")).toBe(false);
      expect(isValidTimeString("not-a-time")).toBe(false);
    });
  });

  describe("isValidISODateTimeString", () => {
    it("accepts valid ISO 8601 datetime strings", () => {
      expect(isValidISODateTimeString("2026-02-18T08:30:00Z")).toBe(true);
      expect(isValidISODateTimeString("2026-02-18T08:30:00+01:00")).toBe(true);
      expect(isValidISODateTimeString("2026-02-18T08:30:00.123Z")).toBe(true);
    });

    it("rejects invalid datetime strings", () => {
      expect(isValidISODateTimeString("not-a-datetime")).toBe(false);
      expect(isValidISODateTimeString("2026-02-18")).toBe(true); // Valid date
      expect(isValidISODateTimeString("")).toBe(false);
    });
  });
});

// ============================================================================
// Edge Cases and Boundary Tests
// ============================================================================

describe("Edge Cases and Boundary Tests", () => {
  describe("Macro percentages boundary values", () => {
    it("accepts macro target with minimum percentages", () => {
      const validTarget = {
        proteinPercentage: 5,
        carbsPercentage: 5,
        fatsPercentage: 5,
        lockedMacros: [],
      };
      expect(isValidMacroTarget(validTarget)).toBe(true);
    });

    it("accepts macro target with maximum percentages", () => {
      const validTarget = {
        proteinPercentage: 70,
        carbsPercentage: 70,
        fatsPercentage: 70,
        lockedMacros: [],
      };
      expect(isValidMacroTarget(validTarget)).toBe(true);
    });
  });

  describe("Activity level boundary values", () => {
    it("accepts user profile with activity level 1", () => {
      const validResponse = {
        id: 1,
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: "2026-01-01T00:00:00Z",
        dateOfBirth: null,
        height: null,
        weight: null,
        gender: null,
        activityLevel: 1,
        isProfileComplete: false,
        subscription: {
          status: "free",
          hasStripeCustomer: false,
        },
      };
      expect(isValidUserProfileResponse(validResponse)).toBe(true);
    });

    it("accepts user profile with activity level 5", () => {
      const validResponse = {
        id: 1,
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        createdAt: "2026-01-01T00:00:00Z",
        dateOfBirth: null,
        height: null,
        weight: null,
        gender: null,
        activityLevel: 5,
        isProfileComplete: false,
        subscription: {
          status: "free",
          hasStripeCustomer: false,
        },
      };
      expect(isValidUserProfileResponse(validResponse)).toBe(true);
    });
  });

  describe("Large arrays", () => {
    it("accepts history response with many entries", () => {
      const entries = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        protein: 30,
        carbs: 40,
        fats: 15,
        mealType: "lunch" as const,
        entryDate: "2026-02-18",
        entryTime: "12:30",
        createdAt: "2026-02-18T12:30:00Z",
      }));
      
      const validResponse = {
        entries,
        total: 100,
        limit: 100,
        offset: 0,
        hasMore: false,
      };
      expect(isValidMacroHistoryResponse(validResponse)).toBe(true);
    });

    it("accepts weight log with many entries", () => {
      const entries = Array.from({ length: 365 }, (_, i) => ({
        id: `entry-${i}`,
        timestamp: `2026-01-01T08:30:00Z`,
        weight: 80 + Math.random(),
      }));
      expect(isValidWeightLogResponse(entries)).toBe(true);
    });
  });

  describe("Special characters in strings", () => {
    it("accepts mealName with special characters", () => {
      const validResponse = {
        id: 1,
        protein: 30,
        carbs: 40,
        fats: 15,
        mealType: "dinner" as const,
        mealName: "Chicken & Rice (w/ veggies) - 500g!",
        entryDate: "2026-02-18",
        entryTime: "19:00",
        createdAt: "2026-02-18T19:00:00Z",
      };
      expect(isValidMacroEntryResponse(validResponse)).toBe(true);
    });

    it("accepts user names with unicode characters", () => {
      const validResponse = {
        id: 1,
        email: "user@example.com",
        firstName: "José",
        lastName: "Müller",
        createdAt: "2026-01-01T00:00:00Z",
        dateOfBirth: null,
        height: null,
        weight: null,
        gender: null,
        activityLevel: null,
        isProfileComplete: false,
        subscription: {
          status: "free",
          hasStripeCustomer: false,
        },
      };
      expect(isValidUserProfileResponse(validResponse)).toBe(true);
    });
  });
});
