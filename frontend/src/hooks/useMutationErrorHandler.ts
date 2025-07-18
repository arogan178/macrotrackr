import { useCallback } from "react";

import { getErrorMessage } from "@/utils/errorHandling";

export interface MutationErrorHandlerOptions {
  /**
   * Whether to log errors to console
   * @default true
   */
  logError?: boolean;

  /**
   * Whether to show success notifications
   * @default true
   */
  showSuccess?: boolean;

  /**
   * Default success message
   * @default "Operation completed successfully"
   */
  defaultSuccessMessage?: string;

  /**
   * Callback for displaying error messages (e.g., toast notifications)
   */
  onError?: (errorMessage: string) => void;

  /**
   * Callback for displaying success messages (e.g., toast notifications)
   */
  onSuccess?: (message: string) => void;
}

/**
 * Hook for handling mutation errors and success states consistently
 * Provides standardized error handling and success notifications for mutations
 */
export function useMutationErrorHandler(
  options: MutationErrorHandlerOptions = {},
) {
  const {
    logError = true,
    showSuccess = true,
    defaultSuccessMessage = "Operation completed successfully",
    onError,
    onSuccess,
  } = options;

  const handleMutationError = useCallback(
    (error: unknown, context?: string): string => {
      const errorMessage = getErrorMessage(error);
      const errorObject =
        error instanceof Error ? error : new Error(errorMessage);

      if (logError) {
        const contextMessage = context ? ` (${context})` : "";
        console.error(`Mutation error${contextMessage}:`, errorObject);
      }

      if (onError) {
        onError(errorMessage);
      }

      return errorMessage;
    },
    [logError, onError],
  );

  const handleMutationSuccess = useCallback(
    (message?: string): void => {
      if (showSuccess) {
        const successMessage = message || defaultSuccessMessage;

        if (onSuccess) {
          onSuccess(successMessage);
        } else {
          console.log("Mutation success:", successMessage);
        }
      }
    },
    [showSuccess, defaultSuccessMessage, onSuccess],
  );

  const createMutationHandlers = useCallback(
    (context?: string) => ({
      onError: (error: unknown) => handleMutationError(error, context),
      onSuccess: (message?: string) => handleMutationSuccess(message),
    }),
    [handleMutationError, handleMutationSuccess],
  );

  return {
    handleMutationError,
    handleMutationSuccess,
    createMutationHandlers,
  };
}

/**
 * Hook for handling optimistic update errors specifically
 * Provides rollback functionality and error handling for optimistic mutations
 */
export function useOptimisticMutationHandler<
  TData = unknown,
  TVariables = unknown,
>(options: MutationErrorHandlerOptions = {}) {
  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler(options);

  const createOptimisticHandlers = useCallback(
    (rollbackFunction?: (context: any) => void, context?: string) => ({
      onError: (
        error: unknown,
        variables: TVariables,
        rollbackContext: any,
      ) => {
        // Perform rollback if provided
        if (rollbackFunction && rollbackContext) {
          rollbackFunction(rollbackContext);
        }

        return handleMutationError(error, context);
      },
      onSuccess: (data: TData, variables: TVariables, rollbackContext: any) => {
        handleMutationSuccess();
      },
    }),
    [handleMutationError, handleMutationSuccess],
  );

  return {
    createOptimisticHandlers,
    handleMutationError,
    handleMutationSuccess,
  };
}
