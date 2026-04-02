// backend/tests/contracts/response-snapshots.test.ts
// Snapshot tests for API response shapes to catch regressions

import { describe, it, expect } from 'vitest';
import { transformKeysToCamel } from '../../src/lib/mappers';
import {
  // Macro entry fixtures
  mockMacroEntry,
  mockBreakfastEntry,
  mockDinnerEntry,
  mockSnackEntry,
  // Macro totals fixtures
  mockMacroDailyTotals,
  mockEmptyMacroTotals,
  mockHighMacroTotals,
  // Macro target fixtures
  mockMacroTargetResponse,
  mockMacroTargetWithLocks,
  // Macro history fixtures
  mockMacroHistoryResponse,
  mockMacroHistoryWithPagination,
  mockEmptyMacroHistory,
  // Weight goal fixtures
  mockWeightLossGoal,
  mockWeightGainGoal,
  mockMaintainGoal,
  mockEmptyWeightGoal,
  // Weight log fixtures
  mockWeightLogResponse,
  mockEmptyWeightLog,
  // User profile fixtures
  mockUserProfileComplete,
  mockUserProfileIncomplete,
  mockUserProfileFemale,
  // Database row fixtures
  mockMacroEntryRow,
  mockUserRow,
  mockUserDetailsRow,
  mockWeightGoalRow,
} from '../fixtures/macro-responses';

// ============================================================================
// Response Contracts (Explicit Assertions)
// ============================================================================

describe('Macro Entry Response Contracts', () => {
  it('defines a valid lunch entry contract', () => {
    expect(mockMacroEntry).toMatchObject({
      id: 1,
      mealType: 'lunch',
      mealName: 'Grilled Chicken Salad',
      entryDate: '2026-02-18',
      entryTime: '12:30',
      protein: 30,
      carbs: 40,
      fats: 15,
    });
  });

  it('defines valid breakfast, dinner, and snack meal types', () => {
    expect(mockBreakfastEntry.mealType).toBe('breakfast');
    expect(mockDinnerEntry.mealType).toBe('dinner');
    expect(mockSnackEntry.mealType).toBe('snack');
  });
});

describe('Macro Totals Response Contracts', () => {
  it('defines expected daily totals values', () => {
    expect(mockMacroDailyTotals).toEqual({
      protein: 150,
      carbs: 250,
      fats: 67,
      calories: 2000,
    });
  });

  it('defines expected empty totals values', () => {
    expect(mockEmptyMacroTotals).toEqual({
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
    });
  });

  it('defines expected high totals values', () => {
    expect(mockHighMacroTotals).toEqual({
      protein: 200,
      carbs: 400,
      fats: 90,
      calories: 3200,
    });
  });
});

describe('Macro Target Response Contracts', () => {
  it('defines expected default macro target percentages', () => {
    expect(mockMacroTargetResponse.macroTarget).toEqual({
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatsPercentage: 30,
      lockedMacros: [],
    });
  });

  it('defines expected locked macro target percentages', () => {
    expect(mockMacroTargetWithLocks.macroTarget).toEqual({
      proteinPercentage: 35,
      carbsPercentage: 40,
      fatsPercentage: 25,
      lockedMacros: ['protein', 'fats'],
    });
  });
});

describe('Macro History Response Contracts', () => {
  it('defines expected non-empty history metadata and ordering', () => {
    expect(mockMacroHistoryResponse.total).toBe(4);
    expect(mockMacroHistoryResponse.hasMore).toBe(false);
    expect(mockMacroHistoryResponse.entries).toHaveLength(4);
    expect(mockMacroHistoryResponse.entries.map((entry) => entry.mealType)).toEqual([
      'dinner',
      'snack',
      'lunch',
      'breakfast',
    ]);
  });

  it('defines expected paginated history metadata', () => {
    expect(mockMacroHistoryWithPagination.total).toBe(50);
    expect(mockMacroHistoryWithPagination.hasMore).toBe(true);
    expect(mockMacroHistoryWithPagination.entries).toHaveLength(2);
  });

  it('defines expected empty history metadata', () => {
    expect(mockEmptyMacroHistory).toEqual({
      entries: [],
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false,
    });
  });
});

describe('Weight Goal Response Contracts', () => {
  it('defines expected weight loss goal fields', () => {
    expect(mockWeightLossGoal).toMatchObject({
      weightGoal: 'lose',
      startingWeight: 85.5,
      targetWeight: 80,
      calorieTarget: 2000,
      calculatedWeeks: 22,
    });
  });

  it('defines expected weight gain and maintenance goal fields', () => {
    expect(mockWeightGainGoal.weightGoal).toBe('gain');
    expect(mockMaintainGoal.weightGoal).toBe('maintain');
  });

  it('defines expected empty weight goal fields', () => {
    expect(mockEmptyWeightGoal).toMatchObject({
      weightGoal: null,
      startingWeight: null,
      targetWeight: null,
      calorieTarget: null,
    });
  });
});

describe('Weight Log Response Contracts', () => {
  it('defines expected populated weight log entries', () => {
    expect(mockWeightLogResponse).toHaveLength(4);
    expect(mockWeightLogResponse[0]).toMatchObject({
      id: 'weight-1',
      weight: 83.2,
    });
  });

  it('defines expected empty weight log entries', () => {
    expect(mockEmptyWeightLog).toEqual([]);
  });
});

describe('User Profile Response Contracts', () => {
  it('defines expected complete profile fields', () => {
    expect(mockUserProfileComplete).toMatchObject({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      isProfileComplete: true,
    });
    expect(mockUserProfileComplete.subscription.status).toBe('pro');
  });

  it('defines expected incomplete and female profile variants', () => {
    expect(mockUserProfileIncomplete.isProfileComplete).toBe(false);
    expect(mockUserProfileFemale.gender).toBe('female');
  });
});

describe('Database Row Transformation Contracts', () => {
  it('transforms macro entry row to camelCase fields', () => {
    const transformed = transformKeysToCamel(mockMacroEntryRow) as Record<string, unknown>;
    expect(transformed).toMatchObject({
      userId: 1,
      mealType: 'lunch',
      mealName: 'Grilled Chicken Salad',
      entryDate: '2026-02-18',
      entryTime: '12:30',
    });
    expect(transformed).not.toHaveProperty('meal_type');
  });

  it('transforms user and detail rows to camelCase fields', () => {
    const user = transformKeysToCamel(mockUserRow) as Record<string, unknown>;
    const details = transformKeysToCamel(mockUserDetailsRow) as Record<string, unknown>;

    expect(user).toMatchObject({
      firstName: 'John',
      lastName: 'Doe',
      clerkId: 'clerk_user_123',
    });
    expect(details).toMatchObject({
      dateOfBirth: '1990-05-15',
      activityLevel: 3,
    });
    expect(user).not.toHaveProperty('first_name');
    expect(details).not.toHaveProperty('date_of_birth');
  });

  it('transforms weight goal row to camelCase fields', () => {
    const transformed = transformKeysToCamel(mockWeightGoalRow) as Record<string, unknown>;
    expect(transformed).toMatchObject({
      startingWeight: 85.5,
      targetWeight: 80,
      weightGoal: 'lose',
      calorieTarget: 2000,
    });
    expect(transformed).not.toHaveProperty('starting_weight');
  });
});

// ============================================================================
// Field Naming Contract Tests
// ============================================================================

describe('Field Naming Contracts', () => {
  describe('Macro Totals Field Names', () => {
    it('uses correct field names for macro totals', () => {
      const totals = mockMacroDailyTotals;
      
      // Verify the expected field names exist
      expect(totals).toHaveProperty('calories');
      expect(totals).toHaveProperty('protein');
      expect(totals).toHaveProperty('carbs');
      expect(totals).toHaveProperty('fats');
      
      // Verify the incorrect field names do NOT exist
      expect(totals).not.toHaveProperty('totalCalories');
      expect(totals).not.toHaveProperty('totalProtein');
      expect(totals).not.toHaveProperty('totalCarbs');
      expect(totals).not.toHaveProperty('totalFat');
    });
  });

  describe('Macro Entry Field Names', () => {
    it('uses correct field names for macro entry', () => {
      const entry = mockMacroEntry;
      
      // Verify the expected field names exist
      expect(entry).toHaveProperty('mealType');
      expect(entry).toHaveProperty('mealName');
      expect(entry).toHaveProperty('entryDate');
      expect(entry).toHaveProperty('entryTime');
      expect(entry).toHaveProperty('createdAt');
      
      // Verify the incorrect field names do NOT exist (snake_case)
      expect(entry).not.toHaveProperty('meal_type');
      expect(entry).not.toHaveProperty('meal_name');
      expect(entry).not.toHaveProperty('entry_date');
      expect(entry).not.toHaveProperty('entry_time');
      expect(entry).not.toHaveProperty('created_at');
    });
  });

  describe('Weight Goal Field Names', () => {
    it('uses correct field names for weight goal', () => {
      const goal = mockWeightLossGoal;
      
      // Verify the expected field names exist
      expect(goal).toHaveProperty('startingWeight');
      expect(goal).toHaveProperty('targetWeight');
      expect(goal).toHaveProperty('weightGoal');
      expect(goal).toHaveProperty('startDate');
      expect(goal).toHaveProperty('targetDate');
      expect(goal).toHaveProperty('calorieTarget');
      expect(goal).toHaveProperty('calculatedWeeks');
      expect(goal).toHaveProperty('weeklyChange');
      expect(goal).toHaveProperty('dailyChange');
      
      // Verify the incorrect field names do NOT exist (snake_case)
      expect(goal).not.toHaveProperty('starting_weight');
      expect(goal).not.toHaveProperty('target_weight');
      expect(goal).not.toHaveProperty('weight_goal');
      expect(goal).not.toHaveProperty('start_date');
      expect(goal).not.toHaveProperty('target_date');
      expect(goal).not.toHaveProperty('calorie_target');
      expect(goal).not.toHaveProperty('calculated_weeks');
      expect(goal).not.toHaveProperty('weekly_change');
      expect(goal).not.toHaveProperty('daily_change');
    });
  });

  describe('User Profile Field Names', () => {
    it('uses correct field names for user profile', () => {
      const profile = mockUserProfileComplete;
      
      // Verify the expected field names exist
      expect(profile).toHaveProperty('firstName');
      expect(profile).toHaveProperty('lastName');
      expect(profile).toHaveProperty('dateOfBirth');
      expect(profile).toHaveProperty('activityLevel');
      expect(profile).toHaveProperty('isProfileComplete');
      
      // Verify the incorrect field names do NOT exist (snake_case)
      expect(profile).not.toHaveProperty('first_name');
      expect(profile).not.toHaveProperty('last_name');
      expect(profile).not.toHaveProperty('date_of_birth');
      expect(profile).not.toHaveProperty('activity_level');
      expect(profile).not.toHaveProperty('is_profile_complete');
    });
  });

  describe('Macro Target Field Names', () => {
    it('uses correct field names for macro target', () => {
      const target = mockMacroTargetResponse.macroTarget;
      
      // Verify the expected field names exist
      expect(target).toHaveProperty('proteinPercentage');
      expect(target).toHaveProperty('carbsPercentage');
      expect(target).toHaveProperty('fatsPercentage');
      expect(target).toHaveProperty('lockedMacros');
      
      // Verify the incorrect field names do NOT exist (snake_case)
      expect(target).not.toHaveProperty('protein_percentage');
      expect(target).not.toHaveProperty('carbs_percentage');
      expect(target).not.toHaveProperty('fats_percentage');
      expect(target).not.toHaveProperty('locked_macros');
    });
  });
});

// ============================================================================
// Response Shape Validation Tests
// ============================================================================

describe('Response Shape Validation', () => {
  describe('Macro Entry Response Shape', () => {
    it('has all required fields with correct types', () => {
      const entry = mockMacroEntry;
      
      expect(typeof entry.id).toBe('number');
      expect(typeof entry.protein).toBe('number');
      expect(typeof entry.carbs).toBe('number');
      expect(typeof entry.fats).toBe('number');
      expect(typeof entry.mealType).toBe('string');
      expect(typeof entry.entryDate).toBe('string');
      expect(typeof entry.entryTime).toBe('string');
      expect(typeof entry.createdAt).toBe('string');
    });

    it('has valid meal type value', () => {
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      
      expect(validMealTypes).toContain(mockMacroEntry.mealType);
      expect(validMealTypes).toContain(mockBreakfastEntry.mealType);
      expect(validMealTypes).toContain(mockDinnerEntry.mealType);
      expect(validMealTypes).toContain(mockSnackEntry.mealType);
    });
  });

  describe('Macro Totals Response Shape', () => {
    it('has all required fields with correct types', () => {
      const totals = mockMacroDailyTotals;
      
      expect(typeof totals.protein).toBe('number');
      expect(typeof totals.carbs).toBe('number');
      expect(typeof totals.fats).toBe('number');
      expect(typeof totals.calories).toBe('number');
    });

    it('has non-negative values', () => {
      const totals = mockMacroDailyTotals;
      
      expect(totals.protein).toBeGreaterThanOrEqual(0);
      expect(totals.carbs).toBeGreaterThanOrEqual(0);
      expect(totals.fats).toBeGreaterThanOrEqual(0);
      expect(totals.calories).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Weight Goal Response Shape', () => {
    it('has valid weight goal type', () => {
      const validGoalTypes = ['lose', 'maintain', 'gain', null];
      
      expect(validGoalTypes).toContain(mockWeightLossGoal.weightGoal);
      expect(validGoalTypes).toContain(mockWeightGainGoal.weightGoal);
      expect(validGoalTypes).toContain(mockMaintainGoal.weightGoal);
      expect(validGoalTypes).toContain(mockEmptyWeightGoal.weightGoal);
    });
  });

  describe('User Profile Response Shape', () => {
    it('has valid subscription status', () => {
      const validStatuses = ['free', 'pro', 'canceled'];
      
      expect(validStatuses).toContain(mockUserProfileComplete.subscription.status);
      expect(validStatuses).toContain(mockUserProfileIncomplete.subscription.status);
    });

    it('has valid gender value when present', () => {
      const validGenders = ['male', 'female', null];
      
      expect(validGenders).toContain(mockUserProfileComplete.gender);
      expect(validGenders).toContain(mockUserProfileIncomplete.gender);
      expect(validGenders).toContain(mockUserProfileFemale.gender);
    });

    it('has valid activity level when present', () => {
      const profile = mockUserProfileComplete;
      
      if (profile.activityLevel !== null) {
        expect(profile.activityLevel).toBeGreaterThanOrEqual(1);
        expect(profile.activityLevel).toBeLessThanOrEqual(5);
      }
    });
  });
});
