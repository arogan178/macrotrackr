import { Component, ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

import Button from "@/components/ui/Button";
import { WarningIcon } from "@/components/ui/Icons";
import { getErrorMessage } from "@/utils/errorHandling";

interface QueryErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface QueryErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class QueryErrorBoundaryInner extends Component<
  QueryErrorBoundaryProps & { reset: () => void },
  QueryErrorBoundaryState
> {
  constructor(properties: QueryErrorBoundaryProps & { reset: () => void }) {
    super(properties);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): QueryErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    console.error("Query Error caught by boundary:", error, info);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.props.reset);
      }

      return (
        <div className="flex min-h-50 items-center justify-center p-4">
          <div className="w-full max-w-md rounded-card border border-border bg-surface p-6">
            <div className="mb-4 text-error">
              <WarningIcon className="mx-auto mb-3 h-8 w-8" />
              <h3 className="mb-2 text-center text-lg font-semibold text-foreground">
                Couldn't load data
              </h3>
              <p className="mb-4 text-center text-sm text-muted">
                {getErrorMessage(this.state.error)}
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  this.props.reset();
                }}
                ariaLabel="Try again"
                variant="primary"
              >
                Try again
              </Button>
              <Button
                onClick={() => globalThis.location.reload()}
                ariaLabel="Reload page"
                variant="secondary"
              >
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * QueryErrorBoundary component that integrates with TanStack Query's error reset functionality
 * This boundary specifically handles query-related errors and provides reset capabilities
 */
export function QueryErrorBoundary({
  children,
  fallback,
}: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <QueryErrorBoundaryInner reset={reset} fallback={fallback}>
          {children}
        </QueryErrorBoundaryInner>
      )}
    </QueryErrorResetBoundary>
  );
}

export default QueryErrorBoundary;
