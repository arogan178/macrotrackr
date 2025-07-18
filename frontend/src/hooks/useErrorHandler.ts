import { useCallback } from "react";

import { getErrorMessage } from "@/utils/errorHandling";

export interface ErrorHandlerOptions {
  /**
   * Whether to log errors to console
   * @default true
   */
  logError?: boolean;

  /**
   * Custom error message to display instead of the actual error
   */
  fallbackMessage?: string;

  /**
   * Callback function to execute when an error occurs
   */
  onError?: (error: Error, errorMessage: string) => void;
}

/**
 * Hook for consistent error handling across the application
 * Provides a standardized way to handle and display errors
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { logError = true, fallbackMessage, onError } = options;

  const handleError = useCallback(
    (error: unknown): string => {
      const errorMessage = fallbackMessage || getErrorMessage(error);
      const errorObject =
        error instanceof Error ? error : new Error(errorMessage);

      if (logError) {
        console.error("Error handled:", errorObject);
      }

      if (onError) {
        onError(errorObject, errorMessage);
      }

      return errorMessage;
    },
    [logError, fallbackMessage, onError],
  );

  const handleAsyncError = useCallback(
    async (
      asyncFunction: () => Promise<void>,
      errorCallback?: (errorMessage: string) => void,
    ): Promise<void> => {
      try {
        await asyncFunction();
      } catch (error) {
        const errorMessage = handleError(error);
        if (errorCallback) {
          errorCallback(errorMessage);
        }
      }
    },
    [handleError],
  );

  return {
    handleError,
    handleAsyncError,
  };
}

/**
 * Hook for handling query-specific errors
 * Provides additional context for query failures
 */
export function useQueryErrorHandler(options: ErrorHandlerOptions = {}) {
  const { handleError } = useErrorHandler(options);

  const handleQueryError = useCallback(
    (error: unknown, queryKey?: unknown[]): string => {
      const errorMessage = handleError(error);

      if (queryKey && options.logError !== false) {
        console.error(`Query error for key [${queryKey.join(", ")}]:`, error);
      }

      return errorMessage;
    },
    [handleError, options.logError],
  );

  return {
    handleQueryError,
  };
}
