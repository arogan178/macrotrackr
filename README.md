# Macro Trackr

A modern, full-stack nutrition and fitness tracking application.

## 🏗️ Architecture & Stack

**Frontend:**
- **Framework:** React 18, Vite, TypeScript
- **Routing:** TanStack Router (file-based routing via `routeTree.gen.ts`)
- **State & Data Fetching:** React Query, Zustand (for UI states like notifications)
- **Styling:** Tailwind CSS, Framer Motion for animations
- **Architecture:** Feature-sliced design (`frontend/src/features/`)

**Backend:**
- **Runtime:** Bun
- **Framework:** Elysia.js (fast, type-safe REST APIs)
- **Database:** SQLite (local/embedded)
- **Architecture:** Modular domain-driven design (`backend/src/modules/`)

**Shared Infrastructure:**
- **Authentication:** Clerk (integrated on both frontend via SDK and backend via Elysia middleware)
- **Payments:** Stripe (via webhooks in `billing` module)
- **External APIs:** OpenFoodFacts for food search/barcode scanning

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
└── package.json          # Root monorepo scripts
```

## 🚀 Development Guide

**1. Installation**
```bash
bun install
```

**2. Environment Variables**
Ensure you have a `.env` file configured with your Clerk, Stripe, and base URL settings.

**3. Running the App**
```bash
# Run both frontend and backend concurrently
bun run dev
```

**4. Where to add new features?**
- **Frontend:** Create a new folder inside `frontend/src/features/` if it's a distinct domain. Add API clients in `frontend/src/api/` and shared UI components to `frontend/src/components/ui/`.
- **Backend:** Create a new module folder in `backend/src/modules/`. Expose its routes via a `routes.ts` file and register it in `backend/src/index.ts`. Use the `requireAuth` middleware for protected endpoints.

## 🧪 Testing

- **Backend:** `bun run test:backend`
- **Frontend:** `bun run test:frontend`
- **E2E:** Playwright tests are run via GitHub actions or locally using `bun run e2e`

