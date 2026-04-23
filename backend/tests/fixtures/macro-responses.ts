// backend/tests/fixtures/macro-responses.ts
// Mock data fixtures for API response contract tests

import type {
  MacroEntryResponse,
  MacroTotalsResponse,
  MacroTargetResponse,
  MacroHistoryResponse,
  WeightGoalResponse,
  WeightLogResponse,
  UserProfileResponse,
} from '../contracts/schemas';

// ============================================================================
// Macro Entry Fixtures
// ============================================================================

/**
 * Mock macro entry response for a typical lunch
 */
export const mockMacroEntry: MacroEntryResponse = {
  id: 1,
  protein: 30,
  carbs: 40,
  fats: 15,
  mealType: 'lunch',
  mealName: 'Grilled Chicken Salad',
  entryDate: '2026-02-18',
  entryTime: '12:30',
  createdAt: '2026-02-18T12:30:00Z',
};

/**
 * Mock macro entry for breakfast
 */
export const mockBreakfastEntry: MacroEntryResponse = {
  id: 2,
  protein: 20,
  carbs: 50,
  fats: 10,
  mealType: 'breakfast',
  mealName: 'Oatmeal with Berries',
  entryDate: '2026-02-18',
  entryTime: '08:00',
  createdAt: '2026-02-18T08:00:00Z',
};

/**
 * Mock macro entry for dinner
 */
export const mockDinnerEntry: MacroEntryResponse = {
  id: 3,
  protein: 35,
  carbs: 45,
  fats: 20,
  mealType: 'dinner',
  mealName: 'Salmon with Rice',
  entryDate: '2026-02-18',
  entryTime: '19:00',
  createdAt: '2026-02-18T19:00:00Z',
};

/**
 * Mock macro entry for a snack
 */
export const mockSnackEntry: MacroEntryResponse = {
  id: 4,
  protein: 10,
  carbs: 25,
  fats: 8,
  mealType: 'snack',
  mealName: 'Greek Yogurt',
  entryDate: '2026-02-18',
  entryTime: '15:00',
  createdAt: '2026-02-18T15:00:00Z',
};

// ============================================================================
// Macro Totals Fixtures
// ============================================================================

/**
 * Mock daily macro totals for a typical day
 */
export const mockMacroDailyTotals: MacroTotalsResponse = {
  protein: 150,
  carbs: 250,
  fats: 67,
  calories: 2000,
};

/**
 * Mock daily macro totals with zero values
 */
export const mockEmptyMacroTotals: MacroTotalsResponse = {
  protein: 0,
  carbs: 0,
  fats: 0,
  calories: 0,
};

/**
 * Mock daily macro totals with high values (athlete)
 */
export const mockHighMacroTotals: MacroTotalsResponse = {
  protein: 200,
  carbs: 400,
  fats: 90,
  calories: 3200,
};

// ============================================================================
// Macro Target Fixtures
// ============================================================================

/**
 * Mock macro target response with default percentages
 */
export const mockMacroTargetResponse: MacroTargetResponse = {
  macroTarget: {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
    lockedMacros: [],
  },
};

/**
 * Mock macro target response with locked macros
 */
export const mockMacroTargetWithLocks: MacroTargetResponse = {
  macroTarget: {
    proteinPercentage: 35,
    carbsPercentage: 40,
    fatsPercentage: 25,
    lockedMacros: ['protein', 'fats'],
  },
};

// ============================================================================
// Macro History Fixtures
// ============================================================================

/**
 * Mock macro history response with multiple entries
 */
export const mockMacroHistoryResponse: MacroHistoryResponse = {
  entries: [
    mockDinnerEntry,
    mockSnackEntry,
    mockMacroEntry,
    mockBreakfastEntry,
  ],
  total: 4,
  limit: 20,
  offset: 0,
  hasMore: false,
};

/**
 * Mock macro history response with pagination
 */
export const mockMacroHistoryWithPagination: MacroHistoryResponse = {
  entries: [mockMacroEntry, mockBreakfastEntry],
  total: 50,
  limit: 20,
  offset: 0,
  hasMore: true,
};

/**
 * Mock empty macro history response
 */
export const mockEmptyMacroHistory: MacroHistoryResponse = {
  entries: [],
  total: 0,
  limit: 20,
  offset: 0,
  hasMore: false,
};

// ============================================================================
// Weight Goal Fixtures
// ============================================================================

/**
 * Mock weight goal response for weight loss
 */
export const mockWeightLossGoal: WeightGoalResponse = {
  startingWeight: 85.5,
  currentWeight: 83.2,
  targetWeight: 80,
  weightGoal: 'lose',
  startDate: '2026-01-01',
  targetDate: '2026-06-01',
  calorieTarget: 2000,
  calculatedWeeks: 22,
  weeklyChange: 0.25,
  dailyChange: 250,
};

/**
 * Mock weight goal response for weight gain
 */
export const mockWeightGainGoal: WeightGoalResponse = {
  startingWeight: 70,
  currentWeight: 71.5,
  targetWeight: 75,
  weightGoal: 'gain',
  startDate: '2026-01-01',
  targetDate: '2026-04-01',
  calorieTarget: 2800,
  calculatedWeeks: 13,
  weeklyChange: 0.25,
  dailyChange: 250,
};

/**
 * Mock weight goal response for maintenance
 */
export const mockMaintainGoal: WeightGoalResponse = {
  startingWeight: 75,
  currentWeight: 75,
  targetWeight: 75,
  weightGoal: 'maintain',
  startDate: '2026-01-01',
  targetDate: null,
  calorieTarget: 2200,
  calculatedWeeks: null,
  weeklyChange: null,
  dailyChange: null,
};

/**
 * Mock empty weight goal response (no goal set)
 */
export const mockEmptyWeightGoal: WeightGoalResponse = {
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

// ============================================================================
// Weight Log Fixtures
// ============================================================================

/**
 * Mock weight log response with entries
 */
export const mockWeightLogResponse: WeightLogResponse = [
  { id: 'weight-1', timestamp: '2026-02-18T08:00:00Z', weight: 83.2 },
  { id: 'weight-2', timestamp: '2026-02-17T08:00:00Z', weight: 83.5 },
  { id: 'weight-3', timestamp: '2026-02-16T08:00:00Z', weight: 83.7 },
  { id: 'weight-4', timestamp: '2026-02-15T08:00:00Z', weight: 84.0 },
];

/**
 * Mock empty weight log response
 */
export const mockEmptyWeightLog: WeightLogResponse = [];

// ============================================================================
// User Profile Fixtures
// ============================================================================

/**
 * Mock user profile response with complete profile
 */
export const mockUserProfileComplete: UserProfileResponse = {
  id: 1,
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: '2026-01-01T00:00:00Z',
  dateOfBirth: '1990-05-15',
  height: 180,
  weight: 75,
  gender: 'male',
  activityLevel: 3,
  isProfileComplete: true,
  subscription: {
    status: 'pro',
  },
};

/**
 * Mock user profile response with incomplete profile
 */
export const mockUserProfileIncomplete: UserProfileResponse = {
  id: 2,
  email: 'jane.smith@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  createdAt: '2026-02-01T00:00:00Z',
  dateOfBirth: null,
  height: null,
  weight: null,
  gender: null,
  activityLevel: null,
  isProfileComplete: false,
  subscription: {
    status: 'free',
  },
};

/**
 * Mock user profile response with female gender
 */
export const mockUserProfileFemale: UserProfileResponse = {
  id: 3,
  email: 'sarah.jones@example.com',
  firstName: 'Sarah',
  lastName: 'Jones',
  createdAt: '2025-12-15T00:00:00Z',
  dateOfBirth: '1992-08-20',
  height: 165,
  weight: 60,
  gender: 'female',
  activityLevel: 4,
  isProfileComplete: true,
  subscription: {
    status: 'free',
  },
};

// ============================================================================
// Database Row Fixtures (snake_case)
// ============================================================================

/**
 * Mock database row for macro entry (snake_case from SQLite)
 */
export const mockMacroEntryRow = {
  id: 1,
  user_id: 1,
  protein: 30,
  carbs: 40,
  fats: 15,
  meal_type: 'lunch',
  meal_name: 'Grilled Chicken Salad',
  entry_date: '2026-02-18',
  entry_time: '12:30',
  created_at: '2026-02-18T12:30:00Z',
};

/**
 * Mock database row for user (snake_case from SQLite)
 */
export const mockUserRow = {
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  clerk_id: 'clerk_user_123',
  subscription_status: 'pro',
  stripe_customer_id: 'cus_abc123',
  created_at: '2026-01-01T00:00:00Z',
};

/**
 * Mock database row for user details (snake_case from SQLite)
 */
export const mockUserDetailsRow = {
  id: 1,
  user_id: 1,
  date_of_birth: '1990-05-15',
  height: 180,
  weight: 75,
  gender: 'male',
  activity_level: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-18T00:00:00Z',
};

/**
 * Mock database row for weight goal (snake_case from SQLite)
 */
export const mockWeightGoalRow = {
  id: 1,
  user_id: 1,
  starting_weight: 85.5,
  target_weight: 80,
  weight_goal: 'lose',
  start_date: '2026-01-01',
  target_date: '2026-06-01',
  calorie_target: 2000,
  calculated_weeks: 22,
  weekly_change: 0.25,
  daily_change: 250,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-18T00:00:00Z',
};
