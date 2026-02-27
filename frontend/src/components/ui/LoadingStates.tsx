import { ReactNode, useMemo } from "react";

import type { FeatureType } from "@/hooks/useFeatureLoading";
import { useFeatureLoading } from "@/hooks/useFeatureLoading";
import { useCriticalLoading , useGlobalLoading } from "@/hooks/useGlobalLoading";

import { cn } from "../../lib/classnameUtilities";
import LoadingSpinner from "./LoadingSpinner";
/* eslint-disable react/prop-types */

interface LoadingStateProps {
  /**
   * Content to show when loading
   */
  children?: ReactNode;

  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;

  /**
   * Size of the loading spinner
   */
  size?: "sm" | "md" | "lg";

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Global loading indicator that shows when any query or mutation is active
 */
export function GlobalLoadingIndicator({
  children,
  loadingComponent,
  size = "md",
  className = "",
}: LoadingStateProps) {
  const { isLoading } = useGlobalLoading();

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn("flex items-center justify-center p-4", className)}>
      {loadingComponent || <LoadingSpinner size={size} />}
    </div>
  );
}

/**
 * Critical loading indicator that only shows for first-time loads, not background refetches
 */
export function CriticalLoadingIndicator({
  children,
  loadingComponent,
  size = "md",
  className = "",
}: LoadingStateProps) {
  const { isLoading } = useCriticalLoading();

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn("flex items-center justify-center p-4", className)}>
      {loadingComponent || <LoadingSpinner size={size} />}
    </div>
  );
}

interface FeatureLoadingIndicatorProps extends LoadingStateProps {
  /**
   * The feature to check loading state for
   */
  feature: FeatureType;

  /**
   * Whether to show loading for queries only (not mutations)
   */
  queriesOnly?: boolean;

  /**
   * Whether to show loading for mutations only (not queries)
   */
  mutationsOnly?: boolean;
}

/**
 * Feature-specific loading indicator
 */
export function FeatureLoadingIndicator({
  feature,
  children,
  loadingComponent,
  size = "md",
  className = "",
  queriesOnly = false,
  mutationsOnly = false,
}: FeatureLoadingIndicatorProps) {
  const { isQueryLoading, isMutationLoading, isLoading } =
    useFeatureLoading(feature);

  // Memoize the loading check to avoid recalculating on every render
  const shouldShowLoading = useMemo(() => {
    if (queriesOnly) return isQueryLoading;
    if (mutationsOnly) return isMutationLoading;
    return isLoading;
  }, [queriesOnly, mutationsOnly, isQueryLoading, isMutationLoading, isLoading]);

  if (!shouldShowLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn("flex items-center justify-center p-4", className)}>
      {loadingComponent || <LoadingSpinner size={size} />}
    </div>
  );
}

interface QueryLoadingWrapperProps {
  /**
   * Whether the query is loading
   */
  isLoading: boolean;

  /**
   * Whether the query has an error
   */
  isError?: boolean;

  /**
   * The error object if there is one
   */
  error?: Error | undefined;

  /**
   * Content to show when loaded successfully
   */
  children: ReactNode;

  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;

  /**
   * Custom error component
   */
  errorComponent?: ReactNode;

  /**
   * Size of the loading spinner
   */
  size?: "sm" | "md" | "lg";

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Wrapper component that handles loading, error, and success states for queries
 */
export function QueryLoadingWrapper({
  isLoading,
  isError = false,
  // Use optional chaining below; keep default to undefined without explicit assignment
  error,
  children,
  loadingComponent,
  errorComponent,
  size = "md",
  className = "",
}: QueryLoadingWrapperProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        {loadingComponent || <LoadingSpinner size={size} />}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        {errorComponent || (
          <div className="text-center text-error">
            <p className="font-medium">Error loading data</p>
            {error?.message && (
              <p className="mt-1 text-sm text-foreground">{error.message}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

interface MutationLoadingButtonProps {
  /**
   * Whether the mutation is loading
   */
  isLoading: boolean;

  /**
   * Button content when not loading
   */
  children: ReactNode;

  /**
   * Loading text to show
   */
  loadingText?: string;

  /**
   * Additional props to pass to the button
   */
  [key: string]: any;
}

/**
 * Button component that shows loading state during mutations
 */
export function MutationLoadingButton({
  isLoading,
  children,
  loadingText = "Loading...",
  disabled,
  className = "",
  ...properties
}: MutationLoadingButtonProps) {
  return (
    <button
      {...properties}
      aria-busy={isLoading}
      disabled={Boolean(disabled) || isLoading}
      className={cn(className, isLoading && "cursor-not-allowed opacity-75")}
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <LoadingSpinner size="sm" />
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
