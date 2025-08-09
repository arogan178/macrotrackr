import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { QueryErrorBoundary } from "@/components/ui/QueryErrorBoundary";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

function ResetPasswordPage() {
  return (
    <QueryErrorBoundary>
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <main className="mx-auto max-w-md px-4 py-16">
            <div className="rounded-2xl border border-border bg-surface p-6 backdrop-blur-sm">
              <ResetPasswordForm />
            </div>
          </main>
        </div>
      </ErrorBoundary>
    </QueryErrorBoundary>
  );
}

export default ResetPasswordPage;
