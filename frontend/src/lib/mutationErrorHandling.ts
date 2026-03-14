import { QueryClient } from "@tanstack/react-query";

import { logger } from "./logger";

/**
 * Enhanced error handling utilities for mutations
 */

export interface MutationError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterFactor: number;
}

export interface MutationErrorHandlerOptions {
  queryClient: QueryClient;
  onError?: (error: MutationError) => void;
  onRetry?: (error: MutationError, attemptNumber: number) => void;
  showNotification?: boolean;
}

export function logMutationError(operation: string, error: unknown) {
  logger.error(`${operation}:`, error);
}

export function createMutationErrorLogger(operation: string) {
  return (error: unknown) => {
    logMutationError(operation, error);
  };
}

/**
 * Default retry configurations for different types of operations
 */
export const retryConfigs = {
  // Critical operations (auth, payments) - more conservative
  critical: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitterFactor: 0.1,
  },
  // Standard operations (CRUD) - balanced approach
  standard: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10_000,
    backoffMultiplier: 2,
    jitterFactor: 0.2,
  },
  // Background operations (sync, analytics) - more aggressive
  background: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30_000,
    backoffMultiplier: 2,
    jitterFactor: 0.3,
  },
} as const;

/**
 * Determines if an error should be retried based on its characteristics
 */
export function shouldRetryError(
  error: MutationError,
  attemptCount: number,
  maxRetries: number,
): boolean {
  // Never retry if we've exceeded max attempts
  if (attemptCount >= maxRetries) {
    return false;
  }

  // Check for status code if available
  if (error.status) {
    // Never retry authentication/authorization errors
    if (error.status === 401 || error.status === 403) {
      return false;
    }

    // Never retry validation errors
    if (error.status === 400 || error.status === 422) {
      return false;
    }

    // Never retry not found errors (usually indicates data inconsistency)
    if (error.status === 404) {
      return false;
    }

    // Never retry conflict errors (usually indicates business logic violations)
    if (error.status === 409) {
      return false;
    }

    // Retry rate limiting errors
    if (error.status === 429) {
      return true;
    }

    // Retry server errors
    if (error.status >= 500) {
      return true;
    }

    // Don't retry other client errors
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
  }

  // Retry network errors
  if (isNetworkError(error)) {
    return true;
  }

  // Retry timeout errors
  if (isTimeoutError(error)) {
    return true;
  }

  // Default: don't retry unknown errors
  return false;
}

/**
 * Calculates retry delay with exponential backoff and jitter
 */
export function calculateRetryDelay(
  attemptIndex: number,
  config: RetryConfig,
  error?: MutationError,
): number {
  const { baseDelay, maxDelay, backoffMultiplier, jitterFactor } = config;

  // Base exponential backoff
  let delay = Math.min(
    baseDelay * Math.pow(backoffMultiplier, attemptIndex),
    maxDelay,
  );

  // Special handling for rate limiting - use longer delays
  if (error?.status === 429) {
    delay = Math.min(delay * 3, maxDelay * 2);
  }

  // Add jitter to prevent thundering herd
  const jitter = delay * jitterFactor * (Math.random() - 0.5);
  delay += jitter;

  return Math.max(delay, 100); // Minimum 100ms delay
}

/**
 * Creates a standardized retry function for mutations
 */
export function createMutationRetryFunction(config: RetryConfig) {
  return (failureCount: number, error: MutationError) => {
    return shouldRetryError(error, failureCount, config.maxRetries);
  };
}

/**
 * Creates a standardized retry delay function for mutations
 */
export function createMutationRetryDelayFunction(config: RetryConfig) {
  return (attemptIndex: number, error: MutationError) => {
    return calculateRetryDelay(attemptIndex, config, error);
  };
}

/**
 * Comprehensive error classification utilities
 */
export function isNetworkError(error: MutationError): boolean {
  return (
    error.message.includes("fetch") ||
    error.message.includes("network") ||
    error.message.includes("NetworkError") ||
    error.name === "NetworkError" ||
    error.name === "TypeError" // Often indicates network issues
  );
}

export function isTimeoutError(error: MutationError): boolean {
  return (
    error.message.includes("timeout") ||
    error.message.includes("aborted") ||
    error.name === "TimeoutError" ||
    error.name === "AbortError"
  );
}

export function isServerError(error: MutationError): boolean {
  return error.status ? error.status >= 500 && error.status < 600 : false;
}

export function isRateLimitError(error: MutationError): boolean {
  return error.status === 429;
}

export function isAuthError(error: MutationError): boolean {
  return error.status === 401 || error.status === 403;
}

export function isValidationError(error: MutationError): boolean {
  return error.status === 400 || error.status === 422;
}

export function isConflictError(error: MutationError): boolean {
  return error.status === 409;
}

/**
 * Enhanced error handler that provides consistent error processing
 */
export class MutationErrorHandler {
  constructor(private options: MutationErrorHandlerOptions) {}

  /**
   * Handles mutation errors with consistent logging and user feedback
   */
  handleError(
    error: MutationError,
    context?: { operation: string; variables?: unknown },
  ): void {
    logger.error(`Mutation error in ${context?.operation || "unknown"}:`, {
      message: error.message,
      status: error.status,
    });

    // Call custom error handler if provided
    if (this.options.onError) {
      this.options.onError(error);
    }

    // Show user-friendly notification if enabled
    if (this.options.showNotification) {
      this.showErrorNotification(error);
    }
  }

  /**
   * Handles retry attempts with logging
   */
  handleRetry(
    error: MutationError,
    attemptNumber: number,
    operation: string,
  ): void {
    console.warn(`Retrying ${operation} (attempt ${attemptNumber}):`, {
      error: error.message,
      status: error.status,
    });

    if (this.options.onRetry) {
      this.options.onRetry(error, attemptNumber);
    }
  }

  /**
   * Shows user-friendly error notifications
   */
  private showErrorNotification(error: MutationError): void {
    let message = "An unexpected error occurred. Please try again.";

    if (isNetworkError(error)) {
      message = "Network error. Please check your connection and try again.";
    } else if (isTimeoutError(error)) {
      message = "Request timed out. Please try again.";
    } else if (isServerError(error)) {
      message = "Server error. Please try again in a moment.";
    } else if (isRateLimitError(error)) {
      message = "Too many requests. Please wait a moment and try again.";
    } else if (isAuthError(error)) {
      message = "Authentication error. Please log in again.";
    } else if (isValidationError(error)) {
      message = "Invalid data. Please check your input and try again.";
    } else if (isConflictError(error)) {
      message = "Conflict detected. Please refresh and try again.";
    }

    // In a real app, you would integrate with your notification system here
    // For now, we'll just log the user-friendly message
    console.info("User notification:", message);
  }
}

/**
 * Factory function to create mutation error handlers
 */
export function createMutationErrorHandler(
  options: MutationErrorHandlerOptions,
): MutationErrorHandler {
  return new MutationErrorHandler(options);
}

/**
 * Utility to create standardized mutation options with error handling and retries
 */
export function createStandardMutationOptions<
  _TData = unknown,
  TError extends MutationError = MutationError,
  TVariables = unknown,
  TContext = unknown,
>(config: {
  retryConfig?: RetryConfig;
  errorHandler?: MutationErrorHandler;
  operation: string;
}) {
  const retryConfig = config.retryConfig || retryConfigs.standard;

  return {
    retry: createMutationRetryFunction(retryConfig),
    retryDelay: createMutationRetryDelayFunction(retryConfig),
    onError: (
      error: TError,
      variables: TVariables,
      _context: TContext | undefined,
    ) => {
      if (config.errorHandler) {
        config.errorHandler.handleError(error, {
          operation: config.operation,
          variables,
        });
      }
    },
  };
}
