import { useCallback } from "react";

import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/utils/errorHandling";

export interface ErrorHandlerOptions {
  logError?: boolean;
  fallbackMessage?: string;
  onError?: (error: Error, errorMessage: string) => void;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { logError = true, fallbackMessage, onError } = options;

  const handleError = useCallback(
    (error: unknown): string => {
      const errorMessage = fallbackMessage ?? getErrorMessage(error);
      const errorObject =
        error instanceof Error ? error : new Error(errorMessage);

      if (logError) {
        logger.error("Error handled", {
          message: errorObject.message,
          name: errorObject.name,
        });
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

export function useQueryErrorHandler(options: ErrorHandlerOptions = {}) {
  const { handleError } = useErrorHandler(options);

  const handleQueryError = useCallback(
    (error: unknown, queryKey?: unknown[]): string => {
      const errorMessage = handleError(error);

      if (queryKey && options.logError !== false) {
        logger.error("Query error", {
          queryKey: queryKey.map(String),
          error,
        });
      }

      return errorMessage;
    },
    [handleError, options.logError],
  );

  return {
    handleQueryError,
  };
}
