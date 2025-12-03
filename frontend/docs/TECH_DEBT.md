# Frontend Technical Debt

This document tracks known structural issues to be addressed in future cleanup efforts.

## Completed ✓

### Cross-Feature Import Fixes (Partial)

The following shared code has been extracted:

- ✅ `UserMetricsPanel` → `src/components/metrics/UserMetricsPanel.tsx`
- ✅ `useSubscriptionStatus` → `src/hooks/useSubscriptionStatus.ts`
- ✅ `PageBackground` → `src/components/layout/PageBackground.tsx`
- ✅ `formatDate` → `src/utils/dateUtilities.ts` (consolidated date utilities using date-fns)
- ✅ `ACTIVITY_LEVELS`, `GENDER_OPTIONS` → `src/utils/userConstants.ts`
- ✅ `createNutritionProfile` → `src/utils/userConstants.ts`
- ✅ `getActivityLevelFromString` → `src/utils/userConstants.ts`
- ✅ Habit types → `src/types/habit.ts` (HabitGoal, HabitGoalFormValues, etc.)

Settings/auth constants now re-export from shared location for backwards compatibility.

### Structural Cleanup

- ✅ `NotFoundPage.tsx` moved from `src/pages/` to `src/components/ui/`
- ✅ `src/pages/` directory removed (was redundant)
- ✅ `utilities.ts` in macroTracking merged into `utils/index.ts` (naming consistency)
- ✅ `features/dashboard/` removed (was redundant - UserMetricsPanel moved to shared)

---

## Priority: High

### 1. Remaining Cross-Feature Import Violations

Per `FRONTEND_STRUCTURE_GUIDELINES.md`, features should NOT import directly from other features. Remaining violations:

| From Feature | Imports From | Example Files | Notes                                |
| ------------ | ------------ | ------------- | ------------------------------------ |
| `goals`      | `habits`     | GoalsPage.tsx | Component composition (HabitTracker) |
| `landing`    | `auth`       | Re-exports    | May be acceptable for landing flow   |

**Note**: GoalsPage importing HabitTracker/HabitModal is page-level composition, which may be acceptable. The type imports have been fixed.

---

## Priority: Medium

### 2. Date Utility Files (Partially Consolidated)

Current state:

- `src/utils/dateUtilities.ts` - **Canonical shared location** (uses date-fns) ✅
- `src/utils/dates.ts` - Simple helpers (getTodayISO, getDisplayDate)
- `features/reporting/utils/dateUtilities.ts` - Feature-specific with reporting constants

Completed:

- ✅ Deleted `src/lib/dateUtils.ts` (was duplicate)
- ✅ Deleted `features/goals/utils/date.ts` (was unused)

Remaining: Consolidate `src/utils/dates.ts` into `dateUtilities.ts` if feasible.

### 3. Misplaced Shared Components

- ~~`src/components/macros/`~~ - ✅ Actually correct - shared between `macroTracking` and `goals` features
- ~~`src/components/auth/ProRoute.tsx`~~ - ✅ Removed (was unused)

### 4. Hooks Directory Organization

Current structure (acceptable pattern):

- `src/hooks/` root: General UI/utility hooks (useErrorHandler, useGlobalLoading, etc.)
- `src/hooks/auth/`: Auth-specific hooks (useAuthQueries, useRegistration)
- `src/hooks/queries/`: Data fetching hooks (useMacroQueries, useGoals, etc.)

The index.ts barrel exports from root level only. Subdirectories are accessed via direct imports.

**Status**: ✅ Structure is reasonable - no immediate action needed. Could benefit from adding exports for auth/queries subdirectories to the barrel if frequently used.

### 5. Rollup Circular Chunk Warnings

Build produces many warnings about circular dependencies between `src/components/ui/index.ts` barrel and individual components. Not blocking but indicates architectural issue.

**Fix**: Either:

- Remove barrel re-exports and use direct imports
- Configure Rollup `manualChunks` to keep UI components in same chunk

---

## Enforcement Suggestions

1. Add ESLint rule to ban `features/*` importing from other `features/*`
2. Add pre-commit hook or CI check for cross-feature imports
3. Schedule periodic structure audits

---

_Last updated: January 2025_
