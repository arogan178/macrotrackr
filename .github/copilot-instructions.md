# Macro Tracker - AI Coding Agent Instructions

Quick reference for AI agents working in this codebase.

## Tech Stack

- **Runtime**: Bun
- **Backend**: Elysia.js + SQLite + Clerk auth + Stripe billing
- **Frontend**: React 19 + Vite + TanStack Router/Query + Zustand + Tailwind CSS 4

## Documentation Map

| Document                                    | Purpose                                            |
| ------------------------------------------- | -------------------------------------------------- |
| [Backend Patterns](./backend-patterns.md)   | Route modules, error handling, logging, auth       |
| [Frontend Patterns](./frontend-patterns.md) | Feature architecture, state management, components |
| [Design System](./design-system.md)         | UI styling, color palette, animation patterns      |

## Quick Start

```bash
bun run dev          # Start both frontend & backend
bun run typecheck    # Typecheck both packages
bun run test         # Run frontend tests
```

## Architecture

```
macrotrackr/
├── frontend/     # React 19 + Vite + TanStack
├── backend/      # Elysia.js + Bun + SQLite
└── .github/      # Documentation and AI instructions
```

## Key Files

| File                                                                | Purpose                        |
| ------------------------------------------------------------------- | ------------------------------ |
| [`backend/src/index.ts`](../backend/src/index.ts)                   | Server setup, middleware chain |
| [`backend/src/db/schema.ts`](../backend/src/db/schema.ts)           | Database models                |
| [`frontend/src/main.tsx`](../frontend/src/main.tsx)                 | App bootstrap with providers   |
| [`frontend/src/lib/queryKeys.ts`](../frontend/src/lib/queryKeys.ts) | Cache key factory              |

## Performance Best Practices Quick Reference

### React Performance

| Pattern       | When to Use                                        | Example                                                    |
| ------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| `React.memo`  | Frequent re-renders, expensive renders, list items | `const Card = React.memo(function Card({ data }) { ... })` |
| `useMemo`     | Expensive calculations, large array operations     | `useMemo(() => sortLargeArray(data), [data])`              |
| `useCallback` | Functions passed to memoized children              | `useCallback((id) => select(id), [select])`                |
| Hoisting      | Static objects, animation variants, styles         | Move outside component                                     |

### Bundle Optimization

| Pattern                | Benefit                         | Example                                           |
| ---------------------- | ------------------------------- | ------------------------------------------------- |
| `React.lazy`           | Code splitting at route level   | `const Page = React.lazy(() => import("./Page"))` |
| Dynamic imports        | Load heavy components on demand | `import("./HeavyChart")`                          |
| Prefetching            | Instant navigation              | `onMouseEnter={() => prefetch(id)}`               |
| **Avoid barrel files** | Tree-shaking works correctly    | Import directly: `from "@/components/ui/Button"`  |

### Data Fetching

| Pattern            | Use Case                      | Example                                           |
| ------------------ | ----------------------------- | ------------------------------------------------- |
| Query key factory  | Centralized cache management  | `queryKeys.macros.history(page)`                  |
| `Promise.all`      | Parallel independent requests | `await Promise.all([fetchA(), fetchB()])`         |
| Optimistic updates | Instant UI feedback           | Update cache in `onMutate`, rollback in `onError` |
| Prefetching        | Hover/focus preloading        | `queryClient.prefetchQuery(...)`                  |

### Common Anti-Patterns to Avoid

```typescript
// Inline objects break memoization
<Component style={{ padding: 16 }} />

// Hoist static objects
const style = { padding: 16 };
<Component style={style} />

// Sequential awaits for independent operations
const a = await fetchA();
const b = await fetchB();

// Parallel fetching
const [a, b] = await Promise.all([fetchA(), fetchB()]);

// && with numbers renders "0"
{count && <Badge>{count}</Badge>}

// Explicit comparison
{count > 0 && <Badge>{count}</Badge>}
```

See [Frontend Patterns](./frontend-patterns.md) for detailed documentation on:

- React Performance Patterns (memo, useMemo, useCallback)
- Bundle Optimization (code splitting, barrel file anti-pattern)
- Data Fetching Patterns (parallel queries, optimistic updates)
- React 19 Patterns (use() hook, transitions, Suspense)
- Anti-patterns to avoid

---

## VS Code Copilot Overlay

VS Code Copilot supports native subagents via `.github/agents/` definitions.
Use them for context-isolated subjective reviews.

### Review workflow

Define a reviewer in `.github/agents/desloppify-reviewer.md`:

```yaml
---
