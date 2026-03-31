import { ReactNode, useMemo } from "react";

import { type FeatureType, useFeatureLoading } from "@/hooks/useFeatureLoading";
import { useCriticalLoading, useGlobalLoading } from "@/hooks/useGlobalLoading";

import { cn } from "../../lib/classnameUtilities";

import LoadingSpinner from "./LoadingSpinner";
/* eslint-disable react/prop-types */

interface LoadingStateProps {
  children?: ReactNode;
  loadingComponent?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

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
      {loadingComponent ?? <LoadingSpinner size={size} />}
    </div>
  );
}

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
      {loadingComponent ?? <LoadingSpinner size={size} />}
    </div>
  );
}

interface FeatureLoadingIndicatorProps extends LoadingStateProps {
  feature: FeatureType;
  queriesOnly?: boolean;
  mutationsOnly?: boolean;
}

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
      {loadingComponent ?? <LoadingSpinner size={size} />}
    </div>
  );
}

interface QueryLoadingWrapperProps {
  isLoading: boolean;
  isError?: boolean;
  error?: Error | undefined;
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function QueryLoadingWrapper({
  isLoading,
  isError = false,
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
        {loadingComponent ?? <LoadingSpinner size={size} />}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        {errorComponent ?? (
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
  isLoading: boolean;
  children: ReactNode;
  loadingText?: string;
  [key: string]: string | boolean | number | undefined | ReactNode;
}

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
