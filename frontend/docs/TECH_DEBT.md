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
- ✅ `features/notifications/` moved to `src/components/notifications/` (shared infrastructure)

---

## Priority: High

### 1. Remaining Cross-Feature Import Violations

Per `FRONTEND_STRUCTURE_GUIDELINES.md`, features should NOT import directly from other features. Remaining violations:

| From Feature | Imports From | Example Files | Notes                                |
| ------------ | ------------ | ------------- | ------------------------------------ |
| `goals`      | `habits`     | GoalsPage.tsx | Component composition (HabitTracker) |
| `landing`    | `auth`       | Re-exports    | May be acceptable for landing flow   |

**Note**: These are page-level compositions which may be acceptable. Consider moving shared components to `src/components/` if they're truly reusable.

---

## Priority: Medium

### 2. Date Utility Files ✅ Consolidated

**Canonical location**: `src/utils/dateUtilities.ts` (uses date-fns)

Completed:

- ✅ Deleted `src/lib/dateUtils.ts` (was duplicate)
- ✅ Deleted `features/goals/utils/date.ts` (was unused)
- ✅ Merged `src/utils/dates.ts` into `dateUtilities.ts` (getTodayISO, getDisplayDate)
- ✅ Removed local duplicate in `DateField.tsx`

Remaining: `features/reporting/utils/dateUtilities.ts` has feature-specific constants - acceptable to keep.

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

### 5. Rollup Circular Chunk Warnings ✅ Fixed

All circular dependency warnings have been resolved by converting barrel imports to direct sibling imports within component directories:

- ✅ `src/components/ui/*.tsx` - now import from `./Icons`, `./Button`, etc.
- ✅ `src/components/billing/ProFeature.tsx` - now imports from `./ProBadge`, `./UpgradeModal`

Remaining build warnings (not blocking):

- Dynamic vs static import warnings for `tokenStorage.ts` and `apiServices.ts` (TanStack Router code-splitting behavior)
- Large chunk size warning for recharts (LineChartComponent)

---

## Enforcement Suggestions

1. Add ESLint rule to ban `features/*` importing from other `features/*`
2. Add pre-commit hook or CI check for cross-feature imports
3. Schedule periodic structure audits

---

_Last updated: December 2025_
