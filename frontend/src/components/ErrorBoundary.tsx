import { Component, ReactNode } from "react";
import { WarningIcon } from "./Icons";
import FormButton from "./form/FormButton";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    // You can log the error to an error reporting service
    console.error("Error caught by boundary:", error, info);
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
                  Something went wrong
                </h2>
                <p className="text-center text-gray-400">
                  {this.state.error?.message || "An unexpected error occurred"}
                </p>
              </div>

              <div className="flex justify-center">
                <FormButton
                  onClick={() => window.location.reload()}
                  ariaLabel="Reload page"
                  variant="primary"
                  size="md"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Reload page
                </FormButton>
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
