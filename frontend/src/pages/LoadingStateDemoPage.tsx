/**
 * Demo page showcasing all the new loading state components and hooks
 * This page provides a visual demonstration of the error handling and loading state patterns
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  Button,
  CriticalLoadingIndicator,
  FeatureLoadingIndicator,
  GlobalLoadingIndicator,
  LoadingSpinner,
  MutationLoadingButton,
  QueryErrorBoundary,
  QueryLoadingWrapper,
} from "@/components/ui";
import {
  useCriticalLoading,
  useErrorHandler,
  useFeatureLoading,
  useGlobalLoading,
  useMutationErrorHandler,
} from "@/hooks";

// Mock data and API functions for demonstration
const mockApiCall = (delay: number, shouldFail = false): Promise<any> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error("Simulated API error"));
      } else {
        resolve({
          id: Date.now(),
          data: `Data loaded at ${new Date().toLocaleTimeString()}`,
          items: Array.from({ length: 5 }, (_, index) => ({
            id: index + 1,
            name: `Item ${index + 1}`,
          })),
        });
      }
    }, delay);
  });
};

export default function LoadingStateDemoPage() {
  const [triggerError, setTriggerError] = useState(false);
  const [slowQuery, setSlowQuery] = useState(false);

  const queryClient = useQueryClient();
  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) => console.error("Demo mutation failed:", message),
      onSuccess: (message) => console.log("Demo mutation succeeded:", message),
    });

  // Global loading state info
  const globalLoading = useGlobalLoading();
  const criticalLoading = useCriticalLoading();
  const habitsLoading = useFeatureLoading("habits");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Global Loading Indicator Demo */}
      <GlobalLoadingIndicator className="fixed top-4 right-4 z-50">
        <div className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm">Loading...</span>
        </div>
      </GlobalLoadingIndicator>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold mb-2">
            Loading State Components Demo
          </h1>
          <p className="text-gray-400">
            Interactive demonstration of all loading state patterns
          </p>
        </header>

        {/* Loading State Information Panel */}
        <LoadingStateInfoPanel
          globalLoading={globalLoading}
          criticalLoading={criticalLoading}
          habitsLoading={habitsLoading}
        />

        {/* Demo Controls */}
        <DemoControls
          triggerError={triggerError}
          setTriggerError={setTriggerError}
          slowQuery={slowQuery}
          setSlowQuery={setSlowQuery}
          onClearCache={() => queryClient.clear()}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QueryLoadingWrapper Demo */}
          <DemoSection title="QueryLoadingWrapper">
            <QueryLoadingWrapperDemo
              shouldFail={triggerError}
              isSlowQuery={slowQuery}
            />
          </DemoSection>

          {/* FeatureLoadingIndicator Demo */}
          <DemoSection title="FeatureLoadingIndicator">
            <FeatureLoadingIndicatorDemo />
          </DemoSection>

          {/* MutationLoadingButton Demo */}
          <DemoSection title="MutationLoadingButton">
            <MutationLoadingButtonDemo
              onError={handleMutationError}
              onSuccess={handleMutationSuccess}
            />
          </DemoSection>

          {/* Error Boundary Demo */}
          <DemoSection title="QueryErrorBoundary">
            <QueryErrorBoundaryDemo />
          </DemoSection>

          {/* Critical Loading Demo */}
          <DemoSection title="CriticalLoadingIndicator">
            <CriticalLoadingIndicatorDemo />
          </DemoSection>

          {/* Custom Loading States Demo */}
          <DemoSection title="Custom Loading Patterns">
            <CustomLoadingPatternsDemo />
          </DemoSection>
        </div>
      </div>
    </div>
  );
}

// Loading State Information Panel
function LoadingStateInfoPanel({
  globalLoading,
  criticalLoading,
  habitsLoading,
}: any) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Current Loading States</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="space-y-2">
          <h3 className="font-medium text-blue-400">Global Loading</h3>
          <div className="space-y-1 text-gray-300">
            <div>Is Loading: {globalLoading.isLoading ? "✅" : "❌"}</div>
            <div>Active Queries: {globalLoading.activeQueries}</div>
            <div>Active Mutations: {globalLoading.activeMutations}</div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium text-green-400">Critical Loading</h3>
          <div className="space-y-1 text-gray-300">
            <div>
              Is Critical Loading:{" "}
              {criticalLoading.isCriticalLoading ? "✅" : "❌"}
            </div>
            <div>
              Is Mutation Loading:{" "}
              {criticalLoading.isMutationLoading ? "✅" : "❌"}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium text-purple-400">Habits Feature</h3>
          <div className="space-y-1 text-gray-300">
            <div>Is Loading: {habitsLoading.isLoading ? "✅" : "❌"}</div>
            <div>
              Query Loading: {habitsLoading.isQueryLoading ? "✅" : "❌"}
            </div>
            <div>
              Mutation Loading: {habitsLoading.isMutationLoading ? "✅" : "❌"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo Controls
function DemoControls({
  triggerError,
  setTriggerError,
  slowQuery,
  setSlowQuery,
  onClearCache,
}: any) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">Demo Controls</h2>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={triggerError}
            onChange={(e) => setTriggerError(e.target.checked)}
            className="rounded"
          />
          <span>Trigger API Errors</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={slowQuery}
            onChange={(e) => setSlowQuery(e.target.checked)}
            className="rounded"
          />
          <span>Slow Queries (5s delay)</span>
        </label>
        <Button
          onClick={onClearCache}
          variant="secondary"
          className="px-3 py-1 text-sm"
        >
          Clear Cache
        </Button>
      </div>
    </div>
  );
}

// QueryLoadingWrapper Demo
function QueryLoadingWrapperDemo({ shouldFail, isSlowQuery }: any) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["demo-query-wrapper", shouldFail, isSlowQuery],
    queryFn: () => mockApiCall(isSlowQuery ? 5000 : 1000, shouldFail),
    retry: false,
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">
          Auto-refetches when controls change
        </span>
        <Button
          onClick={() => refetch()}
          variant="ghost"
          className="text-xs px-2 py-1"
        >
          Manual Refetch
        </Button>
      </div>

      <QueryLoadingWrapper
        isLoading={isLoading}
        isError={isError}
        error={error}
        className="min-h-[150px] bg-gray-700/30 rounded-lg"
        loadingComponent={
          <div className="flex flex-col items-center justify-center space-y-2">
            <LoadingSpinner size="md" />
            <span className="text-sm text-gray-400">Loading demo data...</span>
          </div>
        }
      >
        <div className="p-4">
          <h3 className="font-medium mb-2">Query Result:</h3>
          <div className="text-sm text-gray-300">
            <div>Loaded: {data?.data}</div>
            <div className="mt-2">Items:</div>
            <ul className="list-disc list-inside ml-2">
              {data?.items?.map((item: any) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </QueryLoadingWrapper>
    </div>
  );
}

// FeatureLoadingIndicator Demo
function FeatureLoadingIndicatorDemo() {
  const [isLoading, setIsLoading] = useState(false);

  const simulateFeatureLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  return (
    <div className="space-y-3">
      <Button onClick={simulateFeatureLoading} disabled={isLoading}>
        Simulate Feature Loading
      </Button>

      <FeatureLoadingIndicator
        feature="habits"
        className="min-h-[150px] bg-gray-700/30 rounded-lg"
      >
        <div className="p-4">
          <h3 className="font-medium mb-2">Habits Feature Content</h3>
          <p className="text-sm text-gray-300">
            This content is wrapped with a FeatureLoadingIndicator that monitors
            all habits-related queries and mutations.
          </p>
          {isLoading && (
            <div className="mt-2 text-yellow-400 text-sm">
              ⚡ Simulated loading active...
            </div>
          )}
        </div>
      </FeatureLoadingIndicator>
    </div>
  );
}

// MutationLoadingButton Demo
function MutationLoadingButtonDemo({ onError, onSuccess }: any) {
  const mutation = useMutation({
    mutationFn: (data: { action: string }) =>
      mockApiCall(2000, Math.random() > 0.7),
    onSuccess: () => onSuccess("Demo mutation completed!"),
    onError: (error) => onError(error, "demo mutation"),
  });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <MutationLoadingButton
          isLoading={mutation.isPending}
          loadingText="Processing..."
          onClick={() => mutation.mutate({ action: "demo" })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Run Demo Mutation
        </MutationLoadingButton>

        <div className="text-xs text-gray-400">
          70% chance of success - check console for results
        </div>
      </div>

      {mutation.isError && (
        <div className="bg-red-900/30 border border-red-700 rounded p-2 text-red-300 text-sm">
          Error: {mutation.error?.message}
        </div>
      )}

      {mutation.isSuccess && (
        <div className="bg-green-900/30 border border-green-700 rounded p-2 text-green-300 text-sm">
          Success! Check console for details.
        </div>
      )}
    </div>
  );
}

// QueryErrorBoundary Demo
function QueryErrorBoundaryDemo() {
  const [shouldError, setShouldError] = useState(false);

  return (
    <div className="space-y-3">
      <Button
        onClick={() => setShouldError(!shouldError)}
        variant={shouldError ? "secondary" : "primary"}
      >
        {shouldError ? "Fix Component" : "Break Component"}
      </Button>

      <QueryErrorBoundary>
        <div className="min-h-[150px] bg-gray-700/30 rounded-lg p-4">
          {shouldError ? (
            <ErrorComponent />
          ) : (
            <div>
              <h3 className="font-medium mb-2">Working Component</h3>
              <p className="text-sm text-gray-300">
                This component is wrapped in a QueryErrorBoundary. Click the
                button above to simulate an error.
              </p>
            </div>
          )}
        </div>
      </QueryErrorBoundary>
    </div>
  );
}

// Component that throws an error for demo
function ErrorComponent() {
  throw new Error("Demo query error - this is intentional!");
}

// CriticalLoadingIndicator Demo
function CriticalLoadingIndicatorDemo() {
  const { data, refetch } = useQuery({
    queryKey: ["critical-demo"],
    queryFn: () => mockApiCall(2000),
    staleTime: 0, // Always refetch to show loading
  });

  return (
    <div className="space-y-3">
      <Button onClick={() => refetch()}>Trigger Critical Load</Button>

      <CriticalLoadingIndicator className="min-h-[150px] bg-gray-700/30 rounded-lg">
        <div className="p-4">
          <h3 className="font-medium mb-2">Critical Loading Demo</h3>
          <p className="text-sm text-gray-300">
            This only shows loading for first-time loads, not background
            refetches.
          </p>
          {data && (
            <div className="mt-2 text-green-400 text-sm">
              ✅ Data loaded: {data.data}
            </div>
          )}
        </div>
      </CriticalLoadingIndicator>
    </div>
  );
}

// Custom Loading Patterns Demo
function CustomLoadingPatternsDemo() {
  const { handleError } = useErrorHandler({
    logError: true,
    onError: (error, message) => {
      console.log("Custom error handler:", message);
    },
  });

  const [customLoading, setCustomLoading] = useState(false);

  const simulateCustomPattern = async () => {
    setCustomLoading(true);
    try {
      await mockApiCall(2000, Math.random() > 0.8);
      console.log("Custom pattern succeeded");
    } catch (error) {
      handleError(error);
    } finally {
      setCustomLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button onClick={simulateCustomPattern} disabled={customLoading}>
        Custom Loading Pattern
      </Button>

      <div className="min-h-[150px] bg-gray-700/30 rounded-lg p-4">
        {customLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <LoadingSpinner size="md" />
              <div className="mt-2 text-sm text-gray-400">
                Custom loading state...
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-medium mb-2">Custom Pattern</h3>
            <p className="text-sm text-gray-300">
              This demonstrates using the loading hooks with custom logic and
              manual state management.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Demo Section Wrapper
function DemoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4 text-blue-400">{title}</h2>
      {children}
    </div>
  );
}
