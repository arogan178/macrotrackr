# Frontend Structure and Organization Guidelines

These guidelines codify best practices for organizing shared code and feature modules to maximize cohesion, scalability, and ease of refactoring.

## Principles

- Shared code (UI, logic, types, hooks) lives in `src/components/`, `src/utils/`, `src/types/`, `src/hooks/`.
- Feature-specific code lives in `src/features/{featureName}/` (with its own components, hooks, pages, types, utils).
- Promote code to shared only when reused by at least two features and stable.
- Prefer clarity over premature abstraction; keep modules cohesive and purpose-driven.
- Features must be internally consistent and expose a clear public API surface.

---

## Recommended Folder Structure

```
src/
  components/         # Shared UI primitives (Button, Modal, Spinner, etc.)
  utils/              # Shared utilities (API, validation, helpers)
  hooks/              # Shared hooks
  types/              # Shared types/interfaces (app-wide)
  features/
    featureName/
      components/     # Feature-specific UI
      hooks/          # Feature-specific hooks
      pages/          # Feature-specific pages
      types/          # Feature-specific types (if not app-wide)
      utils/          # Feature-specific helpers (lists, validation, formatting)
      calculations/   # Feature domain math/aggregation (optional but recommended)
      constants.ts    # Feature-local constants
      index.ts        # Feature public API (barrel)
      # Optional: store/ if feature uses local state containers
  pages/              # Route-level pages composed of multiple features
  store/              # App-wide state (if applicable)
```

Notes:

- Prefer `calculations/` for pure domain logic and aggregation math.
- Prefer `utils/` for list manipulation, formatting, validation, and state helpers.
- Keep constants local to the feature unless truly cross-feature.

---

## Feature Public API and Barrels

Each feature should provide a stable public API via `index.ts` at the feature root that re-exports what consumers need. Additionally, add `index.ts` barrels inside subfolders to keep imports concise and controlled.

Example:

```
features/macroTracking/
  components/index.ts
  hooks/index.ts
  pages/index.ts
  types/index.ts
  calculations/index.ts
  utils/index.ts
  constants.ts
  index.ts
```

Benefits:

- Encapsulation: Consumers import from the feature root rather than deep paths.
- Refactor safety: Internal reorganizations do not break external imports.
- Discoverability: Clear contract of what's public versus internal.

---

## Import Conventions

- Use path aliases (`@/components`, `@/utils`, `@/hooks`, `@/types`) for all shared imports.
- Use relative imports within a feature (e.g., `./utils`, `../types`).
- Do not import directly across features (e.g., `features/goals` importing from `features/habits`); extract shared code to `src/utils`, `src/types`, or `src/components` if needed.
- Enforce via ESLint and code review.

Examples:

```ts
// Shared import from any feature or page
import { Button } from "@/components/form";
import { calculateDailyTotals } from "@/utils/nutritionCalculations";
import type { MacroEntry } from "@/types/macro";

// Feature-internal import
import { getMealTypeDisplay } from "./constants";
import { calculateTodayTotals } from "./calculations";
```

---

## Cohesion Within Feature Modules

Aim for single-responsibility modules:

- calculations/: Domain math and aggregation only.
  - Example: `calculateDailyTotals`, `calculateEntryCalories`, date-scoped aggregation helpers like `getTodayEntries`, `calculateTodayTotals`.

- utils/: UI/form/list/state helpers.
  - Example: `updateEntryInList`, `removeEntryFromList`, `formatMacroValue`, `validateMacroInputs`, optimistic state snapshots.

- constants.ts: Feature-local defaults and enum-like helpers.

Rationale:

- Keeps math pure and testable.
- Prevents UI-focused utilities from creeping into domain logic.
- Simplifies imports and improves readability.

---

## Example: Macro Tracking Feature Layout

Good:

```
features/macroTracking/
  calculations/
    index.ts         # Re-exports nutrition math and daily aggregation
  utils/
    index.ts         # List ops, formatting, validation, optimistic state
  components/
  hooks/
  pages/
  types/
  constants.ts
  index.ts
```

Where:

- `calculateTodayTotals`, `getTodayEntries` live in `calculations/`.
- `updateEntryInList`, `removeEntryFromList`, `formatMacroValue`, `validateMacroInputs` live in `utils/`.

---

## Abstraction Guidelines

- Move code to shared folders only if reused in multiple features and stable.
- Avoid abstracting for hypothetical reuse.
- Keep shared code small, focused, and documented with examples.
- Prefer copying simple code once within a feature over premature generalization.

---

## Enforcement Suggestions

- ESLint:
  - Rule to ban cross-feature imports except via `@/` shared aliases.
  - Rule to prefer relative imports inside a feature.
- Code review checklist:
  - Are imports respecting feature boundaries?
  - Is the feature’s public API (`index.ts`) used by consumers?
  - Are calculations kept separate from utilities when applicable?
- CI checks:
  - Simple AST-based script or lint rule to detect `features/*` importing other `features/*`.

---

## Visual Structure

```mermaid
graph TD
  SHARED_COMPONENTS[components shared] -->|used by| FEATURE_UI_A[features/auth/components]
  SHARED_COMPONENTS -->|used by| FEATURE_UI_B[features/goals/components]
  SHARED_UTILS[utils shared] -->|used by| FEATURE_LOGIC_A[features/auth/utils]
  SHARED_UTILS -->|used by| FEATURE_LOGIC_B[features/goals/utils]
  SHARED_HOOKS[hooks shared] -->|used by| FEATURE_UI_A
  SHARED_HOOKS -->|used by| FEATURE_UI_B

  SUBGRAPH_MACROS[features/macroTracking]
    MACROS_INDEX[index ts public API] --> MACROS_COMPONENTS[components]
    MACROS_INDEX --> MACROS_HOOKS[hooks]
    MACROS_INDEX --> MACROS_PAGES[pages]
    MACROS_INDEX --> MACROS_TYPES[types]
    MACROS_INDEX --> MACROS_CONSTANTS[constants ts]
    MACROS_INDEX --> MACROS_CALCS[calculations]
    MACROS_INDEX --> MACROS_UTILS[utils]
  end
```

---

## Actionable Steps

1. Add `index.ts` barrels to feature subfolders (components, hooks, pages, types) and a feature root `index.ts` to define the public API.
2. Keep domain math/aggregation in `calculations/` and UI/form/list/state helpers in `utils/`.
3. Use path aliases for all shared imports; use relative imports inside features.
4. Enforce boundaries via ESLint rules and code review policies.
5. Promote code to shared only when reused by ≥ 2 features and stable; accompany with documentation and examples.
6. Prefer refactor-safe imports (via feature public index) to avoid deep path coupling.
7. Schedule periodic audits to identify candidates for promotion to shared and remove cross-feature coupling.

## Review Checklist

- [ ] No cross-feature imports (except via shared `@/` modules).
- [ ] Feature provides a root `index.ts` public API and subfolder barrels.
- [ ] Domain math/aggregation isolated in `calculations/`.
- [ ] UI/form/list/state utilities isolated in `utils/`.
- [ ] Shared imports use path aliases.
- [ ] Module responsibilities are cohesive and focused.
- [ ] Documentation/examples exist for any shared module updates.
