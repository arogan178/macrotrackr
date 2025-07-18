/**
 * Example components demonstrating how to use the new loading state hooks and components
 * These examples show best practices for integrating TanStack Query loading states
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  QueryLoadingWrapper,
  FeatureLoadingIndicator,
  MutationLoadingButton,
  GlobalLoadingIndicator
} from "@/components/ui";
import { 
  useFeatureLoading, 
  useGlobalLoading,
  useMutationErrorHandler 
} from "@/hooks";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Example 1: Using QueryLoadingWrapper for individual queries
 */
export function QueryLoadingExample() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.habits.list(),
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [{ id: '1', name: 'Example Habit' }];
    },
  });

  return (
    <QueryLoadingWrapper
      isLoading={isLoading}
      isError={isError}
      error={error}
      className="min-h-[200px]"
    >
      <div>
        <h3>Habits Data</h3>
        {data?.map(habit => (
          <div key={habit.id}>{habit.name}</div>
        ))}
      </div>
    </QueryLoadingWrapper>
  );
}

/**
 * Example 2: Using FeatureLoadingIndicator for feature-level loading
 */
export function FeatureLoadingExample() {
  const { data } = useQuery({
    queryKey: queryKeys.habits.list(),
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [{ id: '1', name: 'Example Habit' }];
    },
  });

  return (
    <FeatureLoadingIndicator 
      feature="habits"
      className="min-h-[200px]"
    >
      <div>
        <h3>Habits Feature Content</h3>
        {data?.map(habit => (
          <div key={habit.id}>{habit.name}</div>
        ))}
      </div>
    </FeatureLoadingIndicator>
  );
}

/**
 * Example 3: Using MutationLoadingButton for mutations
 */
export function MutationLoadingExample() {
  const queryClient = useQueryClient();
  const { handleMutationError, handleMutationSuccess } = useMutationErrorHandler({
    onError: (message) => console.error("Mutation failed:", message),
    onSuccess: (message) => console.log("Mutation succeeded:", message),
  });

  const mutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { id: Date.now().toString(), ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.habits.all() });
      handleMutationSuccess("Habit created successfully!");
    },
    onError: (error) => {
      handleMutationError(error, "creating habit");
    },
  });

  return (
    <div className="space-y-4">
      <MutationLoadingButton
        isLoading={mutation.isPending}
        loadingText="Creating habit..."
        onClick={() => mutation.mutate({ name: "New Habit" })}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Create Habit
      </MutationLoadingButton>
      
      {mutation.isError && (
        <div className="text-red-400 text-sm">
          Error: {mutation.error?.message}
        </div>
      )}
      
      {mutation.isSuccess && (
        <div className="text-green-400 text-sm">
          Success! Created habit with ID: {mutation.data?.id}
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Using loading state hooks for custom logic
 */
export function CustomLoadingLogicExample() {
  const { isLoading: isGlobalLoading, activeQueries, activeMutations } = useGlobalLoading();
  const { isLoading: isHabitsLoading, activeQueries: habitsQueries } = useFeatureLoading('habits');

  return (
    <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
      <h3 className="text-white font-semibold">Loading State Information</h3>
      
      <div className="space-y-2 text-sm">
        <div className="text-gray-300">
          Global Loading: {isGlobalLoading ? "Yes" : "No"}
        </div>
        <div className="text-gray-300">
          Active Queries: {activeQueries}
        </div>
        <div className="text-gray-300">
          Active Mutations: {activeMutations}
        </div>
        <div className="text-gray-300">
          Habits Loading: {isHabitsLoading ? "Yes" : "No"}
        </div>
        <div className="text-gray-300">
          Habits Queries: {habitsQueries}
        </div>
      </div>

      {isGlobalLoading && (
        <div className="text-yellow-400 text-sm">
          ⚡ Some operations are in progress...
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Global loading indicator usage
 */
export function GlobalLoadingExample() {
  return (
    <div className="relative">
      <GlobalLoadingIndicator className="absolute top-2 right-2 z-10">
        <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
          Loading...
        </div>
      </GlobalLoadingIndicator>
      
      <div className="p-4">
        <h3>Page Content</h3>
        <p>This content will show a loading indicator when any query is active.</p>
      </div>
    </div>
  );
}