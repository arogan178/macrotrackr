# Frontend Patterns

Patterns and conventions for the React frontend.

## Table of Contents

- [Feature-Based Architecture](#feature-based-architecture)
- [TanStack Query Patterns](#tanstack-query-patterns)
- [Import Conventions](#import-conventions)
- [Component Organization](#component-organization)
- [State Management](#state-management)
- [UI Components](#ui-components)
- [Key Frontend Files](#key-frontend-files)
- [React Performance Patterns](#react-performance-patterns)
- [Bundle Optimization](#bundle-optimization)
- [Data Fetching Patterns](#data-fetching-patterns)
- [React 19 Patterns](#react-19-patterns)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

## Feature-Based Architecture

Features live under `frontend/src/features/` with self-contained components, pages, and hooks:

```
frontend/src/features/
├── auth/
│   ├── components/      # Auth-specific components
│   ├── pages/           # Auth pages
│   ├── hooks/           # Auth hooks
│   ├── types.ts         # Auth types
│   └── index.ts         # Public exports
├── dashboard/
│   ├── components/
│   ├── pages/
│   └── hooks/
├── macros/
│   ├── components/
│   ├── pages/
│   └── hooks/
└── settings/
    ├── components/
    └── pages/
```

### Feature Module Structure

Each feature should be self-contained:

```typescript
// features/auth/index.ts - Public API
export { AuthPage } from "./pages/AuthPage";
export { useAuth } from "./hooks/useAuth";
export type { AuthState } from "./types";
```

## TanStack Query Patterns

### Centralized Query Keys

Query keys are centralized in [`frontend/src/lib/queryKeys.ts`](../frontend/src/lib/queryKeys.ts):

```typescript
import { queryKeys } from "@/lib/queryKeys";

// Query key factory pattern
useQuery({
  queryKey: queryKeys.macros.targets(),
  queryFn: fetchTargets,
});

useQuery({
  queryKey: queryKeys.macros.history(page),
  queryFn: fetchHistory,
});

useQuery({
  queryKey: queryKeys.macros.entry(id),
  queryFn: () => fetchEntry(id),
});

// Mutations with cache invalidation
const mutation = useMutation({
  mutationFn: createEntry,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.macros.all() });
  },
});
```

### Query Key Structure

```typescript
// queryKeys.ts
export const queryKeys = {
  macros: {
    all: () => ["macros"] as const,
    targets: () => ["macros", "targets"] as const,
    history: (page: number) => ["macros", "history", page] as const,
    entry: (id: string) => ["macros", "entry", id] as const,
  },
  goals: {
    all: () => ["goals"] as const,
    active: () => ["goals", "active"] as const,
  },
  user: {
    profile: () => ["user", "profile"] as const,
    settings: () => ["user", "settings"] as const,
  },
};
```

## Import Conventions

### Path Aliases

- `@/` alias for shared imports (lib, components)
- Relative imports for feature-internal files

```typescript
// Shared imports - use @/ alias
import { Button } from "@/components/ui";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api";

// Feature-internal imports - use relative paths
import { calculateDailyTotals } from "./calculations";
import { useMacroState } from "./hooks/useMacroState";
import { MacroCard } from "./components/MacroCard";
```

### Barrel Exports

Use index files for clean exports:

```typescript
// components/ui/index.ts
export { Button } from "./Button";
export { Modal } from "./Modal";
export { LoadingSpinner } from "./LoadingSpinner";

// Usage
import { Button, Modal, LoadingSpinner } from "@/components/ui";
```

## Component Organization

### Directory Structure

```
frontend/src/components/
├── ui/           # Generic, reusable UI components
├── form/         # Form-related components
├── layout/       # Layout components (Navbar, etc.)
├── chart/        # Chart components
├── animation/    # Animation components
└── utils/        # Utility components
```

### Component Categories

- **ui/** - Generic components (Button, Modal, Badge, etc.)
- **form/** - Form components (TextField, NumberField, etc.)
- **layout/** - Layout components (MainLayout, Navbar, etc.)
- **chart/** - Chart components (LineChart, ChartCard, etc.)
- **animation/** - Animation components (AnimatedNumber, etc.)

## State Management

### TanStack Query for Server State

```typescript
// Server state - use TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.macros.targets(),
  queryFn: fetchTargets,
});
```

### Zustand for Client State

```typescript
// Client state - use Zustand
import { create } from "zustand";

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

## UI Components

Follow design system in [`.github/design-system.md`](./design-system.md). Key rules:

- No emojis, no accent colors, monochromatic palette
- Use `text-neutral-*` opacity levels for hierarchy
- Animate with Framer Motion using blur-to-clear transitions

### Component Patterns

```typescript
// Use cn() for conditional classes
import { cn } from "@/lib/utils";

interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Button({ variant = "primary", size = "md", className }: ButtonProps) {
  return (
    <button
      className={cn(
        "base-styles",
        variant === "primary" && "primary-styles",
        size === "sm" && "small-styles",
        className
      )}
    >
      {children}
    </button>
  );
}
```

## Key Frontend Files

| File                                                                | Purpose                      |
| ------------------------------------------------------------------- | ---------------------------- |
| [`frontend/src/main.tsx`](../frontend/src/main.tsx)                 | App bootstrap with providers |
| [`frontend/src/AppRouter.tsx`](../frontend/src/AppRouter.tsx)       | Route definitions            |
| [`frontend/src/lib/queryKeys.ts`](../frontend/src/lib/queryKeys.ts) | Cache key factory            |
| [`frontend/src/lib/api.ts`](../frontend/src/lib/api.ts)             | API client                   |
| [`frontend/src/features/auth/`](../frontend/src/features/auth/)     | Example feature module       |
| [`frontend/src/components/ui/`](../frontend/src/components/ui/)     | Shared UI components         |
| [`.github/design-system.md`](./design-system.md)                    | UI design guidelines         |

## React Performance Patterns

Based on Vercel best practices for optimal React performance.

### When to Use React.memo

Use `React.memo` for components that:

- Render frequently with the same props
- Have expensive render logic
- Are list items in large lists
- Receive object/array props that are compared by reference

```typescript
// Good: Memoized list item with expensive rendering
const MacroEntryCard = React.memo(function MacroEntryCard({
  entry,
  onUpdate
}: {
  entry: MacroEntry;
  onUpdate: (id: number, data: Partial<MacroEntry>) => void;
}) {
  // Expensive calculations or complex rendering
  return <ComplexCard {...} />;
});

// Bad: Memoizing simple components unnecessarily
const SimpleBadge = React.memo(function SimpleBadge({ text }: { text: string }) {
  return <span>{text}</span>; // Too simple to benefit from memoization
});
```

### When NOT to Use useMemo

Avoid `useMemo` for:

- Simple expressions (arithmetic, string concatenation)
- Static data that doesn't change
- Values that are already memoized elsewhere
- Cases where the overhead outweighs the benefit

```typescript
// Bad: Over-memoization of simple expressions
const total = useMemo(() => a + b, [a, b]); // Just use: const total = a + b;

// Good: Memoizing expensive calculations
const sortedEntries = useMemo(() => {
  return [...entries].sort(
    (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime(),
  );
}, [entries]);
```

### Hoisting Static Objects and JSX

Move static objects, arrays, and JSX outside components to prevent recreation on every render:

```typescript
// Bad: Object recreated on every render
function UserCard({ user }) {
  const defaultOptions = { theme: 'dark', size: 'md' }; // Recreated every render!
  return <Card options={defaultOptions} user={user} />;
}

// Good: Hoisted outside component
const DEFAULT_CARD_OPTIONS = { theme: 'dark', size: 'md' };

function UserCard({ user }) {
  return <Card options={DEFAULT_CARD_OPTIONS} user={user} />;
}

// Good: Static JSX hoisted outside
const LoadingFallback = (
  <div className="flex min-h-screen items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

function AppRouter() {
  return (
    <Suspense fallback={LoadingFallback}>
      <Routes />
    </Suspense>
  );
}
```

### Functional setState Updates

Use functional updates when new state depends on previous state:

```typescript
// Bad: Can lead to stale state in rapid updates
setCount(count + 1);

// Good: Functional update always uses latest state
setCount((prev) => prev + 1);

// Good: Functional update with objects
setUser((prev) => ({ ...prev, name: newName }));
```

### Lazy State Initialization

Use lazy initialization for expensive initial state:

```typescript
// Bad: Expensive computation runs on every render
const [data, setData] = useState(parseLargeJSON(initialData));

// Good: Expensive computation runs only once
const [data, setData] = useState(() => parseLargeJSON(initialData));
```

## Bundle Optimization

### Code Splitting with React.lazy

Use dynamic imports for route-level and heavy components:

```typescript
// From AppRouter.tsx - Lazy loaded page components
const LandingPage = React.lazy(
  () => import("./features/landing/pages/LandingPage"),
);
const HomePage = React.lazy(
  () => import("./features/macroTracking/pages/HomePage"),
);
const SettingsPage = React.lazy(
  () => import("@/features/settings/pages/SettingsPage"),
);
const GoalsPage = React.lazy(() => import("@/features/goals/pages/GoalsPage"));
```

### Dynamic Imports for Heavy Components

```typescript
// Heavy chart component loaded only when needed
const LineChartComponent = React.lazy(() =>
  import("@/components/chart/LineChartComponent")
);

// Usage with Suspense
<Suspense fallback={<ChartSkeleton />}>
  <LineChartComponent data={chartData} />
</Suspense>
```

### Preloading on Hover/Focus

Preload components on user interaction for instant navigation:

```typescript
// From LandingPage.tsx - Idle and saver-aware prefetch
useEffect(() => {
  const connection = (navigator as any).connection as
    | { saveData?: boolean; effectiveType?: string }
    | undefined;
  const isDataSaver = connection?.saveData === true;
  const isVerySlow = connection?.effectiveType === "2g";

  if (isDataSaver || isVerySlow) return;

  const doPrefetch = () => {
    void import("../components/FeaturesSection");
    void import("../components/PricingSection");
    void import("../components/ProductPreviewSection");
  };

  const schedulePrefetch = () => {
    if ("requestIdleCallback" in globalThis) {
      requestIdleCallback(doPrefetch, { timeout: 1500 });
    } else {
      setTimeout(doPrefetch, 500);
    }
  };

  requestAnimationFrame(() => schedulePrefetch());
}, []);
```

### CRITICAL: Barrel File Anti-Pattern

**Avoid barrel files (index.ts re-exporting many modules) for large component libraries.**

```typescript
// BAD: Barrel file forces loading ALL components
// components/ui/index.ts
export { Button } from "./Button";
export { Modal } from "./Modal";
export { HeavyChart } from "./HeavyChart";
export { DataGrid } from "./DataGrid";
// ... 20 more exports

// This imports EVERYTHING even if you only need Button!
import { Button } from "@/components/ui";

// GOOD: Direct imports for tree-shaking
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
```

**Why this matters:**

- Barrel files defeat tree-shaking
- Initial bundle includes unused code
- Significantly impacts Time to Interactive (TTI)

**Exception:** Small, tightly-coupled modules that are typically used together can use barrel files.

### Deferring Third-Party Libraries

```typescript
// Defer non-critical third-party libraries
const loadAnalytics = () => import("./analytics").then((m) => m.init());

// Load after page is interactive
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(loadAnalytics);
} else {
  setTimeout(loadAnalytics, 1000);
}
```

## Data Fetching Patterns

### Query Key Factory Pattern

Centralized query keys ensure consistent cache management:

```typescript
// From queryKeys.ts
export const queryKeys = {
  macros: {
    all: () => ["macros"] as const,
    history: (page?: number, startDate?: string, endDate?: string) =>
      startDate || endDate ?
        (["macros", "history", page, startDate, endDate] as const)
      : (["macros", "history", page] as const),
    dailyTotals: (date: string) => ["macros", "daily-totals", date] as const,
    targets: () => ["macros", "targets"] as const,
  },
  goals: {
    all: () => ["goals"] as const,
    weight: () => ["goals", "weight"] as const,
    weightLog: () => ["goals", "weight-log"] as const,
  },
} as const;

// Usage - invalidates all macro queries
queryClient.invalidateQueries({ queryKey: queryKeys.macros.all() });

// Usage - specific query invalidation
queryClient.invalidateQueries({ queryKey: queryKeys.macros.dailyTotals(date) });
```

### Parallel Queries with Promise.all

Fetch independent data in parallel to minimize waterfall requests:

```typescript
// From AppRouter.tsx - Parallel fetching in route loader
const [macroTarget, macroHistory, weightGoals, weightLog] = await Promise.all([
  safeFetch(
    () =>
      context.queryClient.fetchQuery({
        queryKey: queryKeys.macros.targets(),
        queryFn: () => apiService.macros.getMacroTarget(),
      }),
    undefined,
  ),
  safeFetch(
    () =>
      context.queryClient.fetchQuery({
        queryKey: queryKeys.macros.history(page),
        queryFn: () => apiService.macros.getHistory(limit, offset),
      }),
    { entries: [], hasMore: false, total: 0 },
  ),
  safeFetch(
    () =>
      context.queryClient.fetchQuery({
        queryKey: queryKeys.goals.weight(),
        queryFn: () => apiService.goals.getWeightGoals(),
      }),
    null,
  ),
  safeFetch(
    () =>
      context.queryClient.fetchQuery({
        queryKey: queryKeys.goals.weightLog(),
        queryFn: () => apiService.goals.getWeightLog(),
      }),
    [],
  ),
]);
```

### Optimistic Updates Pattern

Update UI immediately while mutation is in flight:

```typescript
// From useMacroQueries.ts - Optimistic add entry
export function useAddMacroEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: MacroEntryCreatePayload) => {
      return await apiService.macros.addEntry(entry);
    },
    onMutate: async (variables) => {
      // 1. Cancel ongoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.macros.historyInfinite(),
      });

      // 2. Snapshot current state for rollback
      const previousData = queryClient.getQueryData(
        queryKeys.macros.historyInfinite(),
      );

      // 3. Create optimistic entry
      const optimisticEntry = {
        id: `temp_${Date.now()}`,
        ...variables,
        optimistic: true,
      };

      // 4. Optimistically update cache
      queryClient.setQueryData(
        queryKeys.macros.historyInfinite(),
        (old: any) => ({
          ...old,
          pages: old.pages.map((page: any, i: number) =>
            i === 0 ?
              { ...page, entries: [optimisticEntry, ...page.entries] }
            : page,
          ),
        }),
      );

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.macros.historyInfinite(),
          context.previousData,
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: queryKeys.macros.all() });
    },
  });
}
```

### Prefetching Strategies

```typescript
// Prefetch on hover for instant navigation
const prefetchUser = (userId: string) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: () => apiService.users.getProfile(userId),
  });
};

<Link onMouseEnter={() => prefetchUser(user.id)} href={`/users/${user.id}`}>
  View Profile
</Link>
```

### useQueries for Parallel Data

```typescript
// Fetch multiple resources in parallel
const userQueries = useQueries({
  queries: userIds.map((id) => ({
    queryKey: queryKeys.user.profile(id),
    queryFn: () => apiService.users.getProfile(id),
    staleTime: 5 * 60 * 1000,
  })),
  combine: (results) => ({
    data: results.map((r) => r.data),
    pending: results.some((r) => r.isPending),
    errors: results.filter((r) => r.error),
  }),
});
```

## React 19 Patterns

### use() Hook for Promises

React 19's `use()` hook unwraps promises in components:

```typescript
// Note: Requires Suspense boundary
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

// Usage with Suspense
<Suspense fallback={<UserSkeleton />}>
  <UserProfile userPromise={fetchUser(id)} />
</Suspense>
```

### useTransition for Non-Urgent Updates

Mark state updates as non-urgent to keep UI responsive:

```typescript
import { useTransition } from 'react';

function SearchComponent() {
  const [isPending, startTransition] = useTransition();
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (query: string) => {
    // Urgent: Update input immediately
    setSearchQuery(query);

    // Non-urgent: Filter results (can be interrupted)
    startTransition(() => {
      setSearchResults(filterLargeDataset(query));
    });
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {isPending && <Spinner />}
      <ResultsList results={searchResults} />
    </div>
  );
}
```

### Suspense Boundaries

Strategic Suspense placement for optimal loading states:

```typescript
// Good: Granular Suspense boundaries
function Dashboard() {
  return (
    <div>
      <Header /> {/* Loads immediately */}

      <Suspense fallback={<ChartSkeleton />}>
        <ChartData /> {/* Loads async */}
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <DataTable /> {/* Loads async independently */}
      </Suspense>
    </div>
  );
}

// Bad: Single Suspense wrapping everything
<Suspense fallback={<FullPageLoader />}>
  <Header />
  <ChartData />
  <DataTable />
</Suspense>
```

## Anti-Patterns to Avoid

### Inline Object Creation in Render

```typescript
// Bad: New object on every render breaks memoization
<MotionDiv animate={{ x: 0, y: 100 }} />
<Card style={{ padding: 16 }} />

// Good: Hoist static objects
const cardStyle = { padding: 16 };
<Card style={cardStyle} />

// Good: Use useMemo for dynamic objects
const animatedStyle = useMemo(() => ({
  transform: `translateX(${offset}px)`
}), [offset]);
```

### Animation Variants Inside Components

```typescript
// Bad: Variants recreated every render
function AnimatedCard() {
  const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  return <motion.div variants={variants} />;
}

// Good: Hoist variants outside component
const cardVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function AnimatedCard() {
  return <motion.div variants={cardVariants} />;
}
```

### Over-Memoization of Simple Expressions

```typescript
// Bad: Unnecessary memoization overhead
const displayName = useMemo(() => `${user.firstName} ${user.lastName}`, [user]);
const isActive = useMemo(() => status === "active", [status]);

// Good: Let these compute on every render
const displayName = `${user.firstName} ${user.lastName}`;
const isActive = status === "active";
```

### Conditional Rendering with && for Numbers

```typescript
// Bad: 0 renders as "0" when count is zero
{count && <Badge>{count}</Badge>}

// Good: Explicit boolean check
{count > 0 && <Badge>{count}</Badge>}

// Good: Ternary for explicit fallback
{count ? <Badge>{count}</Badge> : null}
```

### Sequential Awaits for Independent Operations

```typescript
// Bad: Sequential awaits create waterfall
const user = await fetchUser();
const posts = await fetchPosts();
const comments = await fetchComments();

// Good: Parallel fetching
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments(),
]);

// Good: Promise.allSettled for fault tolerance
const results = await Promise.allSettled([
  fetchUser(),
  fetchPosts(),
  fetchComments(),
]);
const [user, posts, comments] = results.map((r) =>
  r.status === "fulfilled" ? r.value : null,
);
```
