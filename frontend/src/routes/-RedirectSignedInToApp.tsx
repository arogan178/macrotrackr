import React from "react";
import { Navigate } from "@tanstack/react-router";

import { useAppAuthState } from "@/hooks/auth/useAuthState";

interface RedirectSignedInToAppProps {
  children: React.ReactNode;
}

/**
 * Sends an already signed-in visitor from `/` straight into the app.
 *
 * The installed PWA launches at `start_url`, and the marketing header is
 * auth-unaware — it offers "Log in" and "Get started" whether or not there is
 * a session. So a signed-in launch landed on the marketing page, which read as
 * having been signed out; tapping "Log in" then went through `/auth-ready`,
 * which re-syncs the account and re-fetches the profile before forwarding to
 * `/home`. Several seconds of spinner for a session that was never lost.
 *
 * `start_url` now points at `/home`, but a manifest change only reaches an
 * installed app when the browser re-reads it (never, on iOS, without a
 * reinstall), so the redirect has to exist client side too.
 *
 * Deliberately renders the landing page while Clerk is still loading rather
 * than holding a spinner: `/` is the marketing entry point and its first paint
 * should not wait on auth. A signed-in visitor sees it for a frame; a crawler,
 * which never resolves a session, sees the page it came for.
 */
export function RedirectSignedInToApp({ children }: RedirectSignedInToAppProps) {
  const { isLoaded, isSignedIn } = useAppAuthState();

  if (isLoaded && isSignedIn) {
    return <Navigate to="/home" search={{ limit: 20, offset: 0 }} replace />;
  }

  return children;
}
