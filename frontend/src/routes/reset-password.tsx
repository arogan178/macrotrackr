import { createFileRoute } from "@tanstack/react-router";

import AuthPageShell from "@/features/auth/components/AuthPageShell";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: search.token as string | undefined,
    returnTo: search.returnTo as string | undefined,
  }),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  return (
    <AuthPageShell
      eyebrow="Password Recovery"
      title="Reset your password"
      description="Choose a new password to secure your account and continue where you left off."
    >
      <ResetPasswordForm />
    </AuthPageShell>
  );
}
