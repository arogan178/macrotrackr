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
- ✅ `features/habits/` merged into `features/goals/` (habits is a sub-feature of goals)
- ✅ `features/landing/pages/ResetPasswordPage.tsx` stub removed (router imports directly from auth)
- ✅ `src/components/auth/ProRoute.tsx` removed (was unused)

### Habits → Goals Merge

The `features/habits/` feature has been merged into `features/goals/` as a sub-module since:

- HabitTracker only appears on GoalsPage
- Habits has no dedicated route
- It's functionally a sub-feature of the goals workflow

New structure:

- `features/goals/components/habits/` - HabitActions, HabitCard, HabitForm, HabitModal, HabitTracker
- `features/goals/utils/habits/` - calculations.ts, habitUtilities.ts
- `features/goals/constants/habits.ts` - habit icons, colors, validation

---

## Priority: High

### 1. Cross-Feature Import Violations ✅ RESOLVED

All cross-feature imports have been resolved:

- ✅ `goals` ← `habits`: Merged habits into goals as sub-module
- ✅ `landing` ← `auth`: Router now imports directly from auth, stub removed

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

### 3. Hooks Directory Organization

Current structure (acceptable pattern):

- `src/hooks/` root: General UI/utility hooks (useErrorHandler, useGlobalLoading, etc.)
- `src/hooks/auth/`: Auth-specific hooks (useAuthQueries, useRegistration)
- `src/hooks/queries/`: Data fetching hooks (useMacroQueries, useGoals, etc.)

The index.ts barrel exports from root level only. Subdirectories are accessed via direct imports.

**Status**: ✅ Structure is reasonable - no immediate action needed. Could benefit from adding exports for auth/queries subdirectories to the barrel if frequently used.

### 4. Rollup Circular Chunk Warnings ✅ Fixed

All circular dependency warnings have been resolved by converting barrel imports to direct sibling imports within component directories:

- ✅ `src/components/ui/*.tsx` - now import from `./Icons`, `./Button`, etc.
- ✅ `src/components/billing/ProFeature.tsx` - now imports from `./ProBadge`, `./UpgradeModal`

Remaining build warnings (not blocking):

- Dynamic vs static import warnings for `tokenStorage.ts` and `apiServices.ts` (TanStack Router code-splitting behavior)
- Large chunk size warning for recharts (LineChartComponent) - already code-split into separate chunk

### 5. Recharts Bundle Size ✅ Optimized

Recharts is already lazy-loaded via route code-splitting:

- `LineChartComponent.BLwSzr3I.js` (404KB) is a separate chunk
- Only loaded when ReportingPage or GoalsPage (with WeightGoalProgressChart) is visited
- No further optimization needed

---

## Enforcement Suggestions

1. ✅ Cross-feature import convention documented in `FRONTEND_STRUCTURE_GUIDELINES.md`
2. Note: ESLint `no-restricted-imports` cannot distinguish internal vs cross-feature imports without `eslint-plugin-boundaries`
3. Schedule periodic structure audits

---

_Last updated: December 2025_
