# Bun-Focused Implementation Plan

## 1. Initial Setup and Dependencies

```bash
# Core dependencies
bun add react@19.0.0 react-dom@19.0.0 react-router-dom@7.1.5 recharts@2.15.1

# State management and data fetching
bun add zustand @tanstack/react-query

# Build and optimization
bun add -d vite@6.0.5 @vitejs/plugin-react autoprefixer tailwindcss
```

## 2. Core Architecture Updates

### State Management Setup

```typescript
// src/store/types.ts
export interface RootState {
  ui: UISlice;
  auth: AuthSlice;
  macros: MacrosSlice;
}

// src/store/index.ts
import { create } from "zustand";
import { createUISlice } from "./slices/ui-slice";
import { createAuthSlice } from "./slices/auth-slice";
import { createMacrosSlice } from "./slices/macros-slice";

export const useStore = create<RootState>()((...args) => ({
  ...createUISlice(...args),
  ...createAuthSlice(...args),
  ...createMacrosSlice(...args),
}));
```

### API Layer with React Query

```typescript
// src/api/client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        if (error instanceof NetworkError) return failureCount < 3;
        return false;
      },
    },
  },
});

// src/api/mutations/macros.ts
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../client";

export function useMacroEntry() {
  return useMutation({
    mutationFn: (entry: MacroEntry) => apiService.macros.addEntry(entry),
    onMutate: async (newEntry) => {
      await queryClient.cancelQueries({ queryKey: ["macros"] });
      const previousData = queryClient.getQueryData(["macros"]);

      queryClient.setQueryData(["macros"], (old: MacrosData) => ({
        ...old,
        entries: [...old.entries, { ...newEntry, id: "temp-" + Date.now() }],
      }));

      return { previousData };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["macros"], context?.previousData);
    },
  });
}
```

### Lazy Loading Configuration

```typescript
// src/router.tsx
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";

const HomePage = lazy(() => import("./pages/HomePage"));
const ReportingPage = lazy(() => import("./pages/ReportingPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/reporting",
        element: <ReportingPage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
    ],
  },
]);
```

### Vite Configuration for Bun

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext", // Optimize for modern browsers
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "chart-vendor": ["recharts"],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "zustand",
      "@tanstack/react-query",
    ],
  },
  server: {
    // Use Bun's built-in HTTP server
    port: 3000,
  },
});
```

### Performance Optimization

```typescript
// src/utils/performance.ts
export const performanceMetrics = {
  trackPageLoad: (pageName: string) => {
    if (performance.mark) {
      performance.mark(`${pageName}-start`);

      // Use Bun's performance API
      setTimeout(() => {
        performance.mark(`${pageName}-end`);
        performance.measure(
          `${pageName}-loading`,
          `${pageName}-start`,
          `${pageName}-end`
        );
      }, 0);
    }
  },
};

// src/pages/HomePage.tsx
import { useEffect } from "react";
import { performanceMetrics } from "../utils/performance";

export default function HomePage() {
  useEffect(() => {
    performanceMetrics.trackPageLoad("home");
  }, []);

  // Component implementation...
}
```

## 3. Implementation Steps

1. **Initial Setup (Day 1)**

   - Set up Bun environment
   - Install core dependencies
   - Configure Vite for Bun

2. **State Management (Day 2-3)**

   - Implement Zustand store
   - Create store slices
   - Set up React Query integration

3. **Routing & Code Splitting (Day 4)**

   - Configure lazy loading
   - Set up route structure
   - Implement loading boundaries

4. **Performance Optimization (Day 5)**
   - Configure build optimization
   - Implement performance tracking
   - Set up chunk splitting

## 4. Bun-Specific Optimizations

1. **Fast Dependency Installation**

   - Use `bun install` for faster package installation
   - Leverage Bun's lockfile format

2. **Build Performance**

   - Use Bun's native bundler capabilities where possible
   - Optimize transpilation settings for modern browsers

3. **Runtime Performance**

   - Use Bun's built-in fetch implementation
   - Leverage Bun's performance APIs

4. **Development Experience**
   - Use Bun's fast refresh capabilities
   - Leverage built-in TypeScript support

## 5. Next Steps

1. Execute initial setup and verify Bun compatibility
2. Implement core state management
3. Set up routing with code splitting
4. Apply performance optimizations
5. Monitor and tune performance metrics

Note: This implementation focuses on leveraging Bun's capabilities while maintaining the architectural improvements outlined in the analysis document.
