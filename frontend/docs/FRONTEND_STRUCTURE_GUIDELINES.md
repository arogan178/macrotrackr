# Frontend Structure & Organization Guidelines

## Principles

- **Shared code** (UI, logic, types, hooks) lives in `src/components/`, `src/utils/`, `src/types/`, `src/hooks/`.
- **Feature-specific code** lives in `src/features/featureName/` (with its own `components/`, `utils/`, `store/`, etc).
- Only promote code to shared if it is reused by at least two features.
- Avoid over-abstraction; prefer clarity and local reasoning.

---

## Recommended Folder Structure

```
src/
  components/      # Shared UI primitives (Button, Modal, Spinner, etc.)
  utils/           # Shared utilities (API, validation, helpers)
  hooks/           # Shared hooks
  types/           # Shared types/interfaces
  features/
    auth/
      components/  # Feature-specific UI
      utils/       # Feature-specific logic
      store/       # Feature-specific state
      pages/       # Feature-specific pages
      ...
    goals/
    habits/
    ...
  pages/           # Route-level pages, composed of features
  store/           # App-wide state (if any)
```

---

## Import Conventions

- Use path aliases (`@/components`, `@/utils`, etc.) for all shared code imports.
- Use **relative imports only within the same feature**.
- **Do not import directly between features**; feature-to-feature imports are prohibited to maintain encapsulation.
- Enforce these rules via ESLint and code review.

---

## Abstraction Guidelines

- Move code to shared folders only if reused in multiple features.
- Avoid abstracting for hypothetical reuse.
- Keep shared code simple and focused.

---

## Example Table

| Location              | Purpose                 | Example                       |
| --------------------- | ----------------------- | ----------------------------- |
| `src/components/`     | Shared UI primitives    | Button, Modal, Spinner        |
| `src/utils/`          | Shared logic/helpers    | API, validation, id-generator |
| `src/features/auth/`  | Auth-specific logic/UI  | RegisterForm, auth-utils      |
| `src/features/goals/` | Goals-specific logic/UI | GoalsPage, goals-utils        |

---

## Visual Structure

```mermaid
graph TD
  A[components (shared)] -->|used by| B(auth/components)
  A -->|used by| C(goals/components)
  D[utils (shared)] -->|used by| B
  D -->|used by| C
  E[features/auth/utils] -->|feature-specific| B
  F[features/goals/utils] -->|feature-specific| C
  G[hooks (shared)] -->|used by| B
  G -->|used by| C
```

---

## Actionable Steps

1. Audit for duplication; move only code used in multiple features to shared folders.
2. Keep feature boundaries; do not over-abstract.
3. Document shared code with comments/examples and usage examples.
4. Review regularly for new abstraction opportunities.
5. Enforce path alias usage for all shared code imports.
6. Prohibit direct imports between features; allow only relative imports within a feature.
7. Use a checklist for moving code to shared folders:
   - [ ] Code is reused by at least two features
   - [ ] Code is stable and well-tested
   - [ ] Documentation and usage example are present
   - [ ] Path aliases are used for shared imports
   - [ ] No feature-to-feature imports
   - [ ] Shared code is simple and focused
8. Schedule regular audits for code duplication and abstraction.
9. Incorporate structure and import checks into code reviews.
