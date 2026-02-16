# Development Commands

Build, test, lint, and development workflows for the Macro Tracker monorepo.

## Root Workspace Commands

Run from the project root (`macro_tracker/`):

```bash
bun dev              # Start both frontend and backend
bun dev:backend      # Backend only (port 3000)
bun dev:frontend     # Frontend only (port 5173)
bun build            # Build frontend for production
bun test             # Run frontend tests
bun lint             # Lint frontend code
bun typecheck        # Typecheck both packages
```

## Backend Commands

Run from `backend/` directory:

```bash
cd backend

bun dev              # Start development server (port 3000)
bun build            # Build for production
bun start            # Start production server
bun test             # Run tests (if configured)
```

### Backend Ports

- Development server: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

## Frontend Commands

Run from `frontend/` directory:

```bash
cd frontend

bun dev              # Start Vite dev server (port 5173)
bun build            # Build for production
bun preview          # Preview production build
bun test             # Run tests with Vitest
bun lint             # Run ESLint
bun typecheck        # Run TypeScript check
```

### Frontend Ports

- Development server: `http://localhost:5173`
- Preview server: `http://localhost:4173`

## Environment Setup

### Backend Environment Variables

Create `backend/.env`:

```env
DATABASE_PATH=./macro_tracker.db
JWT_SECRET=<32+ chars>
CLERK_SECRET_KEY=sk_...
CLERK_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
RESEND_API_KEY=re_...
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_API_URL=http://localhost:3000
```

## Development Workflow

### Initial Setup

```bash
# Install dependencies
bun install

# Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your values

# Initialize database
bun dev:backend  # Creates SQLite database on first run
```

### Daily Development

```bash
# Start both servers
bun dev

# Or start individually
bun dev:backend   # Terminal 1
bun dev:frontend  # Terminal 2
```

### Before Committing

```bash
# Run all checks
bun typecheck     # Type check both packages
bun lint          # Lint frontend
bun test          # Run tests
bun build         # Verify build succeeds
```

## Database Management

### SQLite Database

- Location: `backend/macro_tracker.db`
- Created automatically on first run
- Schema defined in [`backend/src/db/schema.ts`](../backend/src/db/schema.ts)

### Database Operations

```bash
# View database
sqlite3 backend/macro_tracker.db

# Backup database
cp backend/macro_tracker.db backend/macro_tracker.db.backup

# Reset database (delete and restart)
rm backend/macro_tracker.db
bun dev:backend  # Recreates database
```

## Production Deployment

### Build

```bash
bun build
```

### Environment

Ensure all production environment variables are set:

- Use production Clerk keys
- Use production Stripe keys
- Set `CORS_ORIGIN` to production domain
- Set `DATABASE_PATH` to persistent storage location

### Start Production Server

```bash
cd backend
bun start
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# Kill process
kill -9 <PID>
```

### Type Errors

```bash
# Full typecheck
bun typecheck

# Or individually
cd backend && bun tsc --noEmit
cd frontend && bun tsc --noEmit
```

### Clear Caches

```bash
# Clear Bun cache
bun pm cache rm

# Clear node_modules
rm -rf node_modules bun.lock
bun install
```
