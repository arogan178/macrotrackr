import { createFileRoute, Link } from "@tanstack/react-router";

import { isLocalAuthMode } from "@/config/runtime";
import AuthPageShell from "@/features/auth/components/AuthPageShell";
import { SUPPORT_EMAIL, SUPPORT_EMAIL_MAILTO } from "@/utils/appConstants";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: search.returnTo as string | undefined,
  }),
  component: ResetPasswordRoute,
});

const RESET_COMMAND =
  "docker exec <backend-container> bun run reset-password you@example.com";

const LINK_CLASS =
  "inline-flex min-h-11 items-center rounded-control px-3 py-2 font-medium text-primary transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none";

function ResetPasswordRoute() {
  const { returnTo } = Route.useSearch();

  return (
    <AuthPageShell
      eyebrow="Password Recovery"
      title="Reset your password"
      description={
        isLocalAuthMode
          ? "Whoever runs this server can reset it for you."
          : "Our support team can reset it for you."
      }
      showBackToHome={!isLocalAuthMode}
    >
      <div className="space-y-4 text-sm text-muted">
        {isLocalAuthMode ? (
          <>
            <p>
              Ask them to run this on the server, with the email you sign in
              with:
            </p>
            <pre className="rounded-control bg-surface-2 p-4 font-mono whitespace-pre-wrap text-foreground">
              <code>{RESET_COMMAND}</code>
            </pre>
            <p>
              It prints a temporary password. Sign in with it, then set a new
              password in Settings.
            </p>
          </>
        ) : (
          <p>
            Email{" "}
            <a href={SUPPORT_EMAIL_MAILTO} className="text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            from the address on your account.
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-border pt-6 text-center text-sm">
        <Link to="/login" search={{ returnTo }} className={LINK_CLASS}>
          Back to sign in
        </Link>
      </div>
    </AuthPageShell>
  );
}
