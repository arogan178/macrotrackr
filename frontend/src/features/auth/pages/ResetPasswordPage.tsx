import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { QueryErrorBoundary } from "@/components/ui/QueryErrorBoundary";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

function ResetPasswordPage() {
  return (
    <QueryErrorBoundary>
      <ErrorBoundary>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <main className="w-full max-w-md px-4">
            <ResetPasswordForm />
          </main>
        </div>
      </ErrorBoundary>
    </QueryErrorBoundary>
  );
}

export default ResetPasswordPage;
