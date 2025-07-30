import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { QueryErrorBoundary } from "@/components/ui/QueryErrorBoundary";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

function ResetPasswordPage() {
  return (
    <QueryErrorBoundary>
      <ErrorBoundary>
        <div className="min-h-screen flex items-center justify-center bg-surface p-4">
          <div className="w-full max-w-md">
            <ResetPasswordForm />
          </div>
        </div>
      </ErrorBoundary>
    </QueryErrorBoundary>
  );
}

export default ResetPasswordPage;
