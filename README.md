# Macro Tracker

A modern, full-stack nutrition and fitness tracking application.

## 🏗️ Architecture & Stack

**Frontend:**

- **Framework:** React 19, Vite, TypeScript
- **Routing:** TanStack Router (file-based routing via `routeTree.gen.ts`)
- **State & Data Fetching:** React Query, Zustand (for UI states like notifications)
- **Styling:** Tailwind CSS, Framer Motion for animations
- **Architecture:** Feature-sliced design (`frontend/src/features/`)

**Backend:**

- **Runtime:** Bun
- **Framework:** Elysia.js (fast, type-safe REST APIs)
- **Database:** SQLite (local/embedded)
- **Architecture:** Modular domain-driven design (`backend/src/modules/`) with explicit bootstrap lifecycle in `backend/src/index.ts`

**Shared Infrastructure:**

- **Authentication:** Clerk (integrated on both frontend via SDK and backend via Elysia middleware)
- **Payments:** Stripe (via webhooks in `billing` module)
- **External APIs:** OpenFoodFacts for food search/barcode scanning

## 🔁 Runtime Bootstrap Contracts

### Backend bootstrap flow (`backend/src/index.ts`)

The backend startup path is intentionally explicit and should be preserved when adding new runtime services:

1. Resolve runtime config and database path (`resolveDatabasePath`).
2. Create and initialize SQLite (`createDatabase` → `initializeDatabase`).
3. Wire runtime services from the initialized DB (`createRuntimeServices(db)`).
4. Build the Elysia app (`new Elysia().use(createApp(db))`).
5. Start listening only from `startServer()`.

If you add new singleton-style services, register them during runtime bootstrap (step 3) rather than relying on import-time side effects.

### Frontend bootstrap flow (`frontend/src/main.tsx`)

The frontend startup path establishes auth and provider ordering before routes mount:

1. Validate required environment variables (for example, `VITE_CLERK_PUBLISHABLE_KEY`).
2. Initialize auth token provider state early (`initializeAuthTokenProvider()`).
3. Mount providers in this order:
   - `PersistQueryClientProvider`
   - `ClerkProvider` (+ `ClerkTokenSync`)
   - optional `PostHogProvider`
   - `AppRouter`
4. Register service worker after root render (`registerServiceWorker()`).

Provider order is part of app contract; keep it stable unless there is a strong reason to change it.

## 📦 Dependency Governance

Dependency/tooling policy for the workspace is documented in
[`docs/DEPENDENCY_GOVERNANCE.md`](./docs/DEPENDENCY_GOVERNANCE.md).
Use it when adding or updating dependencies to avoid cross-workspace drift.

### Frontend feature/public-surface conventions

- Keep domain logic inside `frontend/src/features/<feature>/` and avoid cross-feature deep imports.
- Prefer shared imports via `@/components`, `@/hooks`, `@/lib`, and `@/types`.
- Expose feature-level entry points with `index.ts` where practical so route/pages import stable public surfaces instead of internal file paths.
- Keep API callers on shared request contracts from `frontend/src/api/core.ts` (for example, common header-building and error-handling paths).

## 📂 Workspace Layout

```text
macro_tracker/
├── frontend/
│   ├── src/
│   │   ├── api/          # API clients matching backend modules
│   │   ├── components/   # Shared generic UI (buttons, form fields, layout)
│   │   ├── features/     # Domain-specific logic (macroTracking, goals, reporting, etc.)
│   │   ├── hooks/        # Shared react-query hooks
│   │   ├── routes/       # TanStack Router route definitions
│   │   └── lib/          # Utilities, formatters, configurations
│   └── (vite, eslint, playwright configs)
├── backend/
│   ├── src/
│   │   ├── db/           # SQLite schema and setup
│   │   ├── lib/          # Core utilities (errors, openfoodfacts, route-adapter)
│   │   ├── middleware/   # Elysia plugins (Clerk auth, rate limiting)
│   │   └── modules/      # Feature modules (auth, macros, goals, reporting, billing, user)
│   └── tests/            # API integration and contract tests
├── scripts/              # One-off maintenance/refactor helpers
└── package.json          # Root monorepo scripts
```

## 🚀 Development Guide

### 1. Installation

```bash
bun install
```

### 2. Environment Variables

Ensure you have a `.env` file configured with your Clerk, Stripe, and base URL settings.

### 3. Running the App

```bash
# Run both frontend and backend concurrently
bun run dev
```

Useful workspace scripts:

```bash
bun run dev:backend
bun run dev:frontend
bun run build
bun run build:backend
bun run start
bun run --cwd backend test
bun run lint
bun run typecheck
```

### 5. Maintenance scripts

One-time helper scripts now live under `scripts/` at repository root.
They are intentionally kept out of runtime paths and exist for targeted migration/refactor workflows.

### 4. Where to add new features?

- **Frontend:** Create a new folder inside `frontend/src/features/` if it's a distinct domain. Add API clients in `frontend/src/api/` and shared UI components to `frontend/src/components/ui/`.
- **Backend:** Create a new module folder in `backend/src/modules/`. Expose its routes via a `routes.ts` file and register it in `backend/src/index.ts`. Use the `requireAuth` middleware for protected endpoints.

## 🧪 Testing

- **Frontend unit/integration:** `bun run test`
- **Frontend e2e:** `bun run --cwd frontend test:e2e`
- **Backend tests:** `bun run --cwd backend test`
