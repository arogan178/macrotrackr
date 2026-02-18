import { QueryClient } from "@tanstack/react-query";

import { hasStatus } from "@/lib/queryClient";

/**
 * Utility types for optimistic updates
 */
export interface OptimisticUpdateContext<T = any> {
  previousData: T;
  queryKey: readonly unknown[];
}

export interface OptimisticUpdateOptions<TData, TVariables> {
  queryClient: QueryClient;
  queryKey: readonly unknown[];
  updateFn: (
    oldData: TData | undefined,
    variables: TVariables,
  ) => TData | undefined;
  variables: TVariables;
}

export interface OptimisticMutationCallbacks<
  TData,
  TError,
  TVariables,
  TContext,
> {
  onMutate?: (variables: TVariables) => Promise<TContext>;
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined,
  ) => void;
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined,
  ) => void;
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined,
  ) => void;
}

/**
 * Creates an optimistic update with automatic rollback on error
 */
export function createOptimisticUpdate<TData, TVariables>({
  queryClient,
  queryKey,
  updateFn,
  variables,
}: OptimisticUpdateOptions<TData, TVariables>): OptimisticUpdateContext<TData> {
  // Cancel any outgoing refetches
  queryClient.cancelQueries({ queryKey });

  // Snapshot the previous value
  const previousData = queryClient.getQueryData<TData>(queryKey);

  // Optimistically update the cache
  const newData = updateFn(previousData, variables);
  if (newData !== undefined) {
    queryClient.setQueryData<TData>(queryKey, newData);
  }

  return { previousData, queryKey };
}

/**
 * Rolls back an optimistic update
 */
export function rollbackOptimisticUpdate<TData>(
  queryClient: QueryClient,
  context: OptimisticUpdateContext<TData>,
): void {
  if (context.previousData === undefined) {
    // If there was no previous data, remove the query data
    queryClient.removeQueries({ queryKey: context.queryKey });
  } else {
    queryClient.setQueryData(context.queryKey, context.previousData);
  }
}

/**
 * Creates standardized mutation callbacks with optimistic updates
 */
export function createOptimisticMutationCallbacks<
  TData,
  TError,
  TVariables,
  TContext extends OptimisticUpdateContext,
>(options: {
  queryClient: QueryClient;
  queryKey: readonly unknown[];
  updateFn: (oldData: any, variables: TVariables) => any;
  invalidateQueries?: readonly unknown[][];
  onSuccessCallback?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined,
  ) => void;
  onErrorCallback?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined,
  ) => void;
}): OptimisticMutationCallbacks<TData, TError, TVariables, TContext> {
  return {
    onMutate: async (variables: TVariables) => {
      const context = createOptimisticUpdate({
        queryClient: options.queryClient,
        queryKey: options.queryKey,
        updateFn: options.updateFn,
        variables,
      });
      return context as TContext;
    },
    onError: (
      error: TError,
      variables: TVariables,
      context: TContext | undefined,
    ) => {
      // Rollback optimistic update
      if (context) {
        rollbackOptimisticUpdate(options.queryClient, context);
      }

      // Call custom error handler
      if (options.onErrorCallback) {
        options.onErrorCallback(error, variables, context);
      }

      console.error("Mutation failed:", error);
    },
    onSuccess: (
      data: TData,
      variables: TVariables,
      context: TContext | undefined,
    ) => {
      // Call custom success handler
      if (options.onSuccessCallback) {
        options.onSuccessCallback(data, variables, context);
      }
    },
    onSettled: () => {
      // Invalidate related queries to ensure consistency
      if (options.invalidateQueries) {
        for (const queryKey of options.invalidateQueries) {
          options.queryClient.invalidateQueries({ queryKey });
        }
      }
    },
  };
}

/**
 * Utility for array-based optimistic updates (add/remove/update items)
 */
export const arrayOptimisticUpdates = {
  /**
   * Add item to array optimistically
   */
  add: <T>(array: T[] | undefined, newItem: T): T[] => {
    if (!array) return [newItem];
    return [...array, newItem];
  },

  /**
   * Remove item from array optimistically
   */
  remove: <T>(array: T[] | undefined, predicate: (item: T) => boolean): T[] => {
    if (!array) return [];
    return array.filter((item) => !predicate(item));
  },

  /**
   * Update item in array optimistically
   */
  update: <T>(
    array: T[] | undefined,
    predicate: (item: T) => boolean,
    updateFunction: (item: T) => T,
  ): T[] => {
    if (!array) return [];
    return array.map((item) => (predicate(item) ? updateFunction(item) : item));
  },

  /**
   * Replace entire array optimistically
   */
  replace: <T>(_array: T[] | undefined, newArray: T[]): T[] => {
    return newArray;
  },
};

/**
 * Utility for object-based optimistic updates
 */
export const objectOptimisticUpdates = {
  /**
   * Update object properties optimistically
   */
  update: <T extends Record<string, any>>(
    object: T | undefined,
    updates: Partial<T>,
  ): T => {
    if (!object) return updates as T;
    return { ...object, ...updates };
  },

  /**
   * Replace entire object optimistically
   */
  replace: <T>(_object: T | undefined, newObject: T): T => {
    return newObject;
  },
};

/**
 * Error classification utilities for retry logic
 */
export const errorClassification = {
  /**
   * Check if error is a network error that should be retried
   */
  isNetworkError: (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;

    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("timeout") ||
      error.name === "NetworkError" ||
      error.name === "TypeError" // Often indicates network issues
    );
  },

  /**
   * Check if error is a server error that should be retried
   */
  isServerError: (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;

    if (hasStatus(error)) {
      const status = error.status;
      return status >= 500 && status < 600;
    }

    return false;
  },

  /**
   * Check if error is a rate limiting error
   */
  isRateLimitError: (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;

    if (hasStatus(error)) {
      const status = error.status;
      return status === 429;
    }

    return false;
  },

  /**
   * Check if error should not be retried
   */
  isNonRetryableError: (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;

    if (hasStatus(error)) {
      const status = error.status;
      // Don't retry auth errors, validation errors, not found, etc.
      return (
        status === 401 ||
        status === 403 ||
        status === 400 ||
        status === 404 ||
        status === 422
      );
    }

    return false;
  },
};
