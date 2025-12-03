# Frontend Technical Debt

This document tracks known structural issues to be addressed in future cleanup efforts.

## Priority: High

### 1. Cross-Feature Import Violations (~37 occurrences)

Per `FRONTEND_STRUCTURE_GUIDELINES.md`, features should NOT import directly from other features. Current violations:

| From Feature    | Imports From                           | Example Files                                    |
| --------------- | -------------------------------------- | ------------------------------------------------ |
| `goals`         | `habits`                               | WeightGoalSection, MacroTargetSection, GoalsPage |
| `goals`         | `settings`                             | TDEEService usage                                |
| `goals`         | `reporting`                            | dateUtils                                        |
| `macroTracking` | `dashboard`                            | UserMetricsPanel                                 |
| `macroTracking` | `settings`                             | TDEEService                                      |
| `habits`        | `billing`                              | useSubscriptionStatus                            |
| `auth`          | `notifications`, `settings`, `landing` | Various                                          |
| `billing`       | `landing`                              | Component imports                                |
| `landing`       | `auth`                                 | Re-exports                                       |

**Fix**: Extract shared code to `src/utils/`, `src/components/`, or `src/hooks/`:

- `TDEEService` → `src/utils/tdeeCalculations.ts`
- `UserMetricsPanel` → `src/components/metrics/`
- `useSubscriptionStatus` → `src/hooks/` (if truly shared)
- Shared date utilities → consolidate in `src/lib/dateUtils.ts`

---

## Priority: Medium

### 2. Duplicate Date Utility Files

Multiple overlapping date utility files exist:

- `src/lib/dateUtils.ts` - Comprehensive date-fns utilities
- `src/utils/dateFormatters.ts` - Simpler date functions (potential overlap)
- `features/reporting/utils/dateUtils.ts` - Feature-specific
- `features/goals/utils/dateUtils.ts` - Feature-specific

**Fix**: Consolidate into `src/lib/dateUtils.ts`, remove duplicates.

### 3. Misplaced Shared Components

- `src/components/macros/` - Contains macro-specific components that should be in `features/macroTracking/components/`
- `src/components/auth/ProRoute.tsx` - Billing-related, should be in `components/billing/` or `features/billing/`

### 4. Redundant `src/pages/` Directory

- Contains only `NotFoundPage.tsx`
- All other pages are in feature folders
- Inconsistent with feature-based structureYes proceeed

**Fix**: Move `NotFoundPage.tsx` to `src/components/ui/` and delete `src/pages/`.

### 5. Naming Inconsistency in macroTracking

- Has both `utilities.ts` (file) and `utils/` (folder)
- Guideline pattern is `utils/` folder only

**Fix**: Merge `utilities.ts` into `utils/index.ts`.

---

## Priority: Low

### 6. Dashboard Feature Evaluation

- `features/dashboard/` contains only `components/` with `UserMetricsPanel`
- No pages, no hooks, minimal content
- Tightly coupled to `macroTracking`

**Consider**: Merge into `macroTracking` feature or extract `UserMetricsPanel` to shared components.

### 7. Hooks Directory Organization

- `src/hooks/` has mixed organization: root-level hooks and subdirectories (`auth/`, `queries/`)
- `hooks/queries/` may duplicate feature-specific query logic

**Fix**: Standardize pattern - either all flat or all in subdirectories.

---

## Enforcement Suggestions

1. Add ESLint rule to ban `features/*` importing from other `features/*`
2. Add pre-commit hook or CI check for cross-feature imports
3. Schedule periodic structure audits

---

_Last updated: December 2024_
