import { Component, ReactNode } from "react";

import { Button, WarningIcon } from "@/components/ui";
import { getErrorMessage } from "@/utils/errorHandling";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * Whether this boundary should handle query errors specifically
   * @default false
   */
  handleQueryErrors?: boolean;
  /**
   * Callback when an error is caught
   */
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  isQueryError?: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(properties: ErrorBoundaryProps) {
    super(properties);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Check if this is a query-related error
    const isQueryError =
      error.message?.includes("query") ||
      error.message?.includes("fetch") ||
      error.name?.includes("Query");

    return { hasError: true, error, isQueryError };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    // Log the error to console and call custom error handler if provided
    console.error("Error caught by boundary:", error, info);

    if (this.props.onError) {
      this.props.onError(error, info);
    }

    // Additional logging for query errors
    if (this.state.isQueryError && this.props.handleQueryErrors) {
      console.error("Query error details:", {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
      });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl max-w-lg w-full border border-gray-700">
              <div className="text-red-400 mb-4">
                <WarningIcon className="w-12 h-12 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-center text-white mb-1">
                  {this.state.isQueryError
                    ? "Data Loading Error"
                    : "Something went wrong"}
                </h2>
                <p className="text-center text-gray-400">
                  {getErrorMessage(this.state.error)}
                </p>
                {this.state.isQueryError && (
                  <p className="text-center text-gray-500 text-sm mt-2">
                    There was a problem loading your data. Please try again.
                  </p>
                )}
              </div>

              <div className="flex justify-center space-x-3">
                <Button
                  onClick={() => {
                    this.setState({
                      hasError: false,
                      error: undefined,
                      isQueryError: false,
                    });
                  }}
                  ariaLabel="Try again"
                  variant="secondary"
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => globalThis.location.reload()}
                  ariaLabel="Reload page"
                  variant="primary"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Reload page
                </Button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Also export as default for backward compatibility
export default ErrorBoundary;
