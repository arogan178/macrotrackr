import Button from "@/components/ui/Button";
import { WarningIcon } from "@/components/ui/Icons";

interface GoalsErrorStateProps {
  onRetry?: () => void;
  errorMessage?: string;
}

export default function GoalsErrorState({ 
  onRetry, 
  errorMessage = "Failed to load your goals data. Please try again." 
}: GoalsErrorStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
        <div className="mb-4 text-error">
          <WarningIcon className="mx-auto mb-3 h-12 w-12" />
          <h3 className="mb-2 text-center text-lg font-semibold text-foreground">
            Unable to Load Data
          </h3>
          <p className="mb-4 text-center text-sm text-foreground">
            {errorMessage}
          </p>
        </div>

        <div className="flex justify-center space-x-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              ariaLabel="Try again"
              variant="primary"
            >
              Try Again
            </Button>
          )}
          <Button
            onClick={() => globalThis.location.reload()}
            ariaLabel="Reload page"
            variant="secondary"
          >
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
}
