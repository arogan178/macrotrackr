# Calorie Fields Refactoring Plan

## Overview

This refactoring involves two main changes:

1. Removing the `targetCalories` field from the macro tracking system
2. Renaming `adjustedCalorieIntake` to `calorieTarget` throughout the application

## Database Changes

```sql
-- Remove targetCalories from macro_targets table
ALTER TABLE macro_targets DROP COLUMN target_calories;

-- Rename adjusted_calorie_intake to calorie_target in weight_goals table
ALTER TABLE weight_goals RENAME COLUMN adjusted_calorie_intake TO calorie_target;
```

## Backend Changes

### 1. Schema Updates (modules/goals/schemas.ts)

- Remove `targetCalories` from:
  - getMacroTargetResponse
  - updateMacroTargetBody
  - updateMacroTargetResponse
- Rename `adjustedCalorieIntake` to `calorieTarget` in:
  - getWeightGoalResponse
  - updateWeightGoalBody
  - updateWeightGoalResponse

### 2. Route Updates (modules/goals/routes.ts)

- Remove `target_calories` from MacroTargetFromDB type
- Update `adjusted_calorie_intake` to `calorie_target` in WeightGoalFromDB type
- Update SQL queries and response mappings

## Frontend Changes

### 1. Type Definitions (features/goals/types.ts)

- Remove `targetCalories` from MacroTarget interface
- Rename `adjustedCalorieIntake` to `calorieTarget` in:
  - WeightGoals interface
  - WeightGoalFormValues interface

### 2. API Service (api-service.ts)

- Update WeightGoalPayload interface to use `calorieTarget`
- Remove `targetCalories` from MacroTargetPayload interface

### 3. Calculations (features/goals/calculations.ts)

- Rename `calculateAdjustedCalorieIntake` function to `calculateCalorieTarget`
- Update references in `generateWeightGoalCalculations`

### 4. Component Updates

- WeightGoalDashboard.tsx:
  - Remove `targetCalories` prop
  - Update references to use `calorieTarget`
- WeightGoalStatus.tsx:
  - Remove `targetCalories` prop
  - Update variable references

## Testing Steps

1. Verify database migration executes successfully
2. Test weight goal creation and updates
3. Confirm macro targets still work without the removed field
4. Verify calorie calculations display correctly in UI
5. Check that saved goals maintain correct calorie values

## Rollback Plan

```sql
-- If needed, revert the database changes
ALTER TABLE macro_targets ADD COLUMN target_calories REAL;
ALTER TABLE weight_goals RENAME COLUMN calorie_target TO adjusted_calorie_intake;
```
