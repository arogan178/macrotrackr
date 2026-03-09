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
// Macro Entry Response Snapshots
// ============================================================================

describe('Macro Entry Response Snapshots', () => {
  it('matches snapshot for lunch entry', () => {
    expect(mockMacroEntry).toMatchSnapshot();
  });

  it('matches snapshot for breakfast entry', () => {
    expect(mockBreakfastEntry).toMatchSnapshot();
  });

  it('matches snapshot for dinner entry', () => {
    expect(mockDinnerEntry).toMatchSnapshot();
  });

  it('matches snapshot for snack entry', () => {
    expect(mockSnackEntry).toMatchSnapshot();
  });
});

// ============================================================================
// Macro Totals Response Snapshots
// ============================================================================

describe('Macro Totals Response Snapshots', () => {
  it('matches snapshot for daily totals', () => {
    expect(mockMacroDailyTotals).toMatchSnapshot();
  });

  it('matches snapshot for empty totals', () => {
    expect(mockEmptyMacroTotals).toMatchSnapshot();
  });

  it('matches snapshot for high totals (athlete)', () => {
    expect(mockHighMacroTotals).toMatchSnapshot();
  });
});

// ============================================================================
// Macro Target Response Snapshots
// ============================================================================

describe('Macro Target Response Snapshots', () => {
  it('matches snapshot for default target', () => {
    expect(mockMacroTargetResponse).toMatchSnapshot();
  });

  it('matches snapshot for target with locked macros', () => {
    expect(mockMacroTargetWithLocks).toMatchSnapshot();
  });
});

// ============================================================================
// Macro History Response Snapshots
// ============================================================================

describe('Macro History Response Snapshots', () => {
  it('matches snapshot for history with entries', () => {
    expect(mockMacroHistoryResponse).toMatchSnapshot();
  });

  it('matches snapshot for history with pagination', () => {
    expect(mockMacroHistoryWithPagination).toMatchSnapshot();
  });

  it('matches snapshot for empty history', () => {
    expect(mockEmptyMacroHistory).toMatchSnapshot();
  });
});

// ============================================================================
// Weight Goal Response Snapshots
// ============================================================================

describe('Weight Goal Response Snapshots', () => {
  it('matches snapshot for weight loss goal', () => {
    expect(mockWeightLossGoal).toMatchSnapshot();
  });

  it('matches snapshot for weight gain goal', () => {
    expect(mockWeightGainGoal).toMatchSnapshot();
  });

  it('matches snapshot for maintenance goal', () => {
    expect(mockMaintainGoal).toMatchSnapshot();
  });

  it('matches snapshot for empty goal (not set)', () => {
    expect(mockEmptyWeightGoal).toMatchSnapshot();
  });
});

// ============================================================================
// Weight Log Response Snapshots
// ============================================================================

describe('Weight Log Response Snapshots', () => {
  it('matches snapshot for weight log with entries', () => {
    expect(mockWeightLogResponse).toMatchSnapshot();
  });

  it('matches snapshot for empty weight log', () => {
    expect(mockEmptyWeightLog).toMatchSnapshot();
  });
});

// ============================================================================
// User Profile Response Snapshots
// ============================================================================

describe('User Profile Response Snapshots', () => {
  it('matches snapshot for complete profile', () => {
    expect(mockUserProfileComplete).toMatchSnapshot();
  });

  it('matches snapshot for incomplete profile', () => {
    expect(mockUserProfileIncomplete).toMatchSnapshot();
  });

  it('matches snapshot for female profile', () => {
    expect(mockUserProfileFemale).toMatchSnapshot();
  });
});

// ============================================================================
// Database Row Transformation Snapshots
// ============================================================================

describe('Database Row Transformation Snapshots', () => {
  it('transforms macro entry row to camelCase', () => {
    const transformed = transformKeysToCamel(mockMacroEntryRow);
    expect(transformed).toMatchSnapshot();
  });

  it('transforms user row to camelCase', () => {
    const transformed = transformKeysToCamel(mockUserRow);
    expect(transformed).toMatchSnapshot();
  });

  it('transforms user details row to camelCase', () => {
    const transformed = transformKeysToCamel(mockUserDetailsRow);
    expect(transformed).toMatchSnapshot();
  });

  it('transforms weight goal row to camelCase', () => {
    const transformed = transformKeysToCamel(mockWeightGoalRow);
    expect(transformed).toMatchSnapshot();
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
