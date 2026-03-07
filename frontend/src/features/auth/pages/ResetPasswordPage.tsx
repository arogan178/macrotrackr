import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { QueryErrorBoundary } from "@/components/ui/QueryErrorBoundary";
import AuthPageShell from "@/features/auth/components/AuthPageShell";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

function ResetPasswordPage() {
  return (
    <QueryErrorBoundary>
      <ErrorBoundary>
        <AuthPageShell
          eyebrow="Account Recovery"
          title="Reset your password"
          description="Choose a new password and get back into your account without losing your tracking data."
        >
          <ResetPasswordForm />
        </AuthPageShell>
      </ErrorBoundary>
    </QueryErrorBoundary>
  );
}

export default ResetPasswordPage;
