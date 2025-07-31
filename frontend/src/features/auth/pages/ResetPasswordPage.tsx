import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { QueryErrorBoundary } from "@/components/ui/QueryErrorBoundary";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

function ResetPasswordPage() {
  return (
    <QueryErrorBoundary>
      <ErrorBoundary>
        <div className="min-h-screen bg-background">
          <main className="max-w-md mx-auto px-4 py-16">
            <div className="bg-surface backdrop-blur-sm border border-border rounded-2xl p-6">
              <ResetPasswordForm />
            </div>
          </main>
        </div>
      </ErrorBoundary>
    </QueryErrorBoundary>
  );
}

export default ResetPasswordPage;
