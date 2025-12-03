# Frontend Technical Debt

This document tracks known structural issues to be addressed in future cleanup efforts.

## Completed ✓

### Cross-Feature Import Fixes (Partial)

The following shared code has been extracted:

- ✅ `UserMetricsPanel` → `src/components/metrics/UserMetricsPanel.tsx`
- ✅ `useSubscriptionStatus` → `src/hooks/useSubscriptionStatus.ts`
- ✅ `PageBackground` → `src/components/layout/PageBackground.tsx`
- ✅ `formatDate` → `src/lib/dateUtils.ts` (shared date utilities)
- ✅ `ACTIVITY_LEVELS`, `GENDER_OPTIONS` → `src/utils/userConstants.ts`

Settings/auth constants now re-export from shared location for backwards compatibility.

---

## Priority: High

### 1. Remaining Cross-Feature Import Violations

Per `FRONTEND_STRUCTURE_GUIDELINES.md`, features should NOT import directly from other features. Remaining violations:

| From Feature    | Imports From    | Example Files                                    |
| --------------- | --------------- | ------------------------------------------------ |
| `goals`         | `habits`        | WeightGoalSection, MacroTargetSection, GoalsPage |
| `goals`         | `settings`      | TDEEService usage                                |
| `macroTracking` | `settings`      | TDEEService                                      |
| `auth`          | `notifications` | Toast integration                                |
| `landing`       | `auth`          | Re-exports                                       |

**Fix**: Extract remaining shared code to `src/`:

- `TDEEService` → `src/utils/tdeeCalculations.ts`
- Habit types → `src/types/habit.ts` if used across features

---

## Priority: Medium

### 2. Duplicate Date Utility Files

Multiple overlapping date utility files still exist:

- `src/lib/dateUtils.ts` - **Canonical shared location** ✅
- `src/utils/dateFormatters.ts` - Simpler date functions (potential overlap)
- `features/reporting/utils/dateUtilities.ts` - Feature-specific (has reporting constants)
- `features/goals/utils/dateUtils.ts` - Feature-specific

**Fix**: Update remaining imports to use `src/lib/dateUtils.ts`, remove duplicates where possible.

### 3. Misplaced Shared Components

- `src/components/macros/` - Contains macro-specific components that should be in `features/macroTracking/components/`
- `src/components/auth/ProRoute.tsx` - Billing-related, should be in `components/billing/` or `features/billing/`

### 4. Redundant `src/pages/` Directory

- Contains only `NotFoundPage.tsx`
- All other pages are in feature folders
- Inconsistent with feature-based structure

**Fix**: Move `NotFoundPage.tsx` to `src/components/ui/` and delete `src/pages/`.

### 5. Naming Inconsistency in macroTracking

- Has both `utilities.ts` (file) and `utils/` (folder)
- Guideline pattern is `utils/` folder only

**Fix**: Merge `utilities.ts` into `utils/index.ts`.

---

## Priority: Low

### 6. Dashboard Feature Evaluation

- `features/dashboard/` contains only `components/` with `UserMetricsPanel`
- Original `UserMetricsPanel` moved to shared, feature may be empty
- Tightly coupled to `macroTracking`

**Consider**: Remove dashboard feature entirely if empty, or repurpose for dashboard-specific features.

### 7. Hooks Directory Organization

- `src/hooks/` has mixed organization: root-level hooks and subdirectories (`auth/`, `queries/`)
- `hooks/queries/` may duplicate feature-specific query logic

**Fix**: Standardize pattern - either all flat or all in subdirectories.

### 8. Rollup Circular Chunk Warnings

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
