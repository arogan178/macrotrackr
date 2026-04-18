import { Component, ReactNode } from "react";

import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/utils/errorHandling";

import Button from "./Button";
import { WarningIcon } from "./Icons";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  handleQueryErrors?: boolean;
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
    const isQueryError =
      error.message.includes("query") ||
      error.message.includes("fetch") ||
      error.name.includes("Query");

    return { hasError: true, error, isQueryError };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    logger.error("Error caught by boundary", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: info.componentStack,
    });

    if (this.props.onError) {
      this.props.onError(error, info);
    }

    if (this.state.isQueryError && this.props.handleQueryErrors) {
      logger.error("Query error details", {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
      });
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center bg-surface p-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-modal">
              <div className="mb-4 text-error">
                <WarningIcon className="mx-auto mb-3 h-12 w-12" />
                <h2 className="mb-1 text-center text-xl font-bold text-foreground">
                  {this.state.isQueryError
                    ? "Data Loading Error"
                    : "Something went wrong"}
                </h2>
                <p className="text-center text-foreground">
                  {getErrorMessage(this.state.error)}
                </p>
                {this.state.isQueryError && (
                  <p className="mt-2 text-center text-sm text-foreground">
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
                  className="rounded-lg bg-surface px-4 py-2 font-medium text-foreground transition-colors duration-200 hover:bg-surface"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => globalThis.location.reload()}
                  ariaLabel="Reload page"
                  variant="primary"
                  className="rounded-lg bg-primary px-4 py-2 font-medium text-foreground transition-colors duration-200 hover:bg-primary"
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

export default ErrorBoundary;
