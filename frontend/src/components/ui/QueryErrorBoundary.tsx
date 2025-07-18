import { Component, ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

import { FormButton } from "@/components/form";
import { WarningIcon } from "@/components/ui";
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
  constructor(props: QueryErrorBoundaryProps & { reset: () => void }) {
    super(props);
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
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full border border-gray-700">
            <div className="text-red-400 mb-4">
              <WarningIcon className="w-8 h-8 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-center text-white mb-2">
                Data Loading Error
              </h3>
              <p className="text-center text-gray-400 text-sm mb-4">
                {getErrorMessage(this.state.error)}
              </p>
            </div>

            <div className="flex justify-center space-x-3">
              <FormButton
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  this.props.reset();
                }}
                ariaLabel="Try again"
                variant="primary"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Try Again
              </FormButton>
              <FormButton
                onClick={() => globalThis.location.reload()}
                ariaLabel="Reload page"
                variant="secondary"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Reload Page
              </FormButton>
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
export function QueryErrorBoundary({ children, fallback }: QueryErrorBoundaryProps) {
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