import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

import PageBackground from "@/components/layout/PageBackground";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuthReady } from "@/features/auth/hooks/useAuthReady";
import { normalizeAuthRedirect } from "@/features/auth/utils/redirect";

export default function AuthReadyPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth-ready" }) as { redirectTo?: string };
  const redirectTo = normalizeAuthRedirect(search.redirectTo);
  const { error, setupAuth } = useAuthReady(redirectTo);

  useEffect(() => {
    setupAuth();
  }, [setupAuth]);

  if (error) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground">
        <PageBackground />
        <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <svg
              className="h-8 w-8 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-foreground">
            Authentication Error
          </h1>
          <p className="mb-6 text-muted">{error}</p>
          <button
            type="button"
            onClick={() =>
              navigate({ to: "/login", search: { returnTo: undefined } })
            }
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 py-2 font-bold text-black transition-colors duration-200 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      <PageBackground />
      <div className="relative z-10 text-center">
        <div className="mx-auto mb-4">
          <LoadingSpinner size="lg" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">
          Preparing your account...
        </h1>
        <p className="mt-2 text-muted">Please wait while we set things up</p>
      </div>
    </div>
  );
}
