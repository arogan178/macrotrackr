import { useEffect, useRef, useState } from "react";
import { useAuth, useSession } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { authApi } from "@/api/auth";
import { ApiError, setAuthToken } from "@/api/core";
import { userApi } from "@/api/user";
import PageBackground from "@/components/layout/PageBackground";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { normalizeAuthRedirect, resolveProfileCompletion, shouldBypassSyncForRedirect } from "@/features/auth/utils/redirect";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

function isLikelyUserDetailsPayload(
  value: unknown,
): value is Record<string, unknown> {
  return !!value && typeof value === "object" && Object.keys(value).length > 0;
}

/**
 * AuthReadyPage - Intermediate page that ensures auth token is set before redirecting
 *
 * This page is shown briefly after sign-in/sign-up to ensure the Clerk token
 * is properly set before navigating to protected routes with data loaders.
 *
 * Query params:
 * - redirectTo: The path to redirect to after auth is ready (default: /home)
 */
export default function AuthReadyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = useSearch({ from: "/auth-ready" }) as { redirectTo?: string };
  const { isLoaded, isSignedIn } = useAuth();
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const hasInitializedReference = useRef(false);

  const redirectTo = normalizeAuthRedirect(search.redirectTo);

  useEffect(() => {
    async function setupAuth() {
      try {
        if (hasInitializedReference.current) {
          return;
        }

        // Wait for Clerk to be fully loaded
        if (!isLoaded) {
          return;
        }

        hasInitializedReference.current = true;

        // If not signed in, redirect to login
        if (!isSignedIn) {
          navigate({ to: "/login", search: { returnTo: undefined } });
          return;
        }

        // Get the token from the session
        let token: string | null = null;
        if (session) {
          token = await session.getToken();
          if (token) {
            setAuthToken(token);
          }
        }

        // Give a small moment for the token to be set
        await new Promise((resolve) => setTimeout(resolve, 50));

        const shouldBypassSync = shouldBypassSyncForRedirect(redirectTo);

        // Sync the Clerk user with our backend when continuing to app routes.
        let syncSuccess = false;
        if (!shouldBypassSync) {
          try {
            await authApi.syncUser(token || undefined);
            syncSuccess = true;
          } catch (syncError: unknown) {
            // If it's a 401, the token might be invalid.
            if (syncError instanceof Error && "status" in syncError) {
              const errorWithStatus = syncError as { status: number };
              if (errorWithStatus.status === 401) {
                setError("Authentication failed. Please sign in again.");
                return;
              }
            }

            logger.error(
              "[AuthReadyPage] Failed to sync Clerk user with backend",
              syncError,
            );
            setError(
              "We couldn't link your account yet. Please try signing in again.",
            );
            return;
          }
        }

        // Small delay after successful sync to ensure DB is updated
        if (syncSuccess) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
        }

        if (shouldBypassSync) {
          navigate({
            to: "/profile-setup",
            search: { redirectTo },
            replace: true,
          });
          return;
        }

        // Resolve backend user details before leaving auth-ready.
        // This avoids bouncing to protected routes while /api/user/me still returns 401.
        let userDetails: Record<string, unknown> | null = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const response = await userApi.getUserDetails();

            if (!isLikelyUserDetailsPayload(response)) {
              logger.warn(
                `[AuthReadyPage] Malformed user details payload on attempt ${attempt + 1}`,
                response,
              );
              await new Promise((resolve) => setTimeout(resolve, 120));
              continue;
            }

            userDetails = response;
            break;
          } catch (userError) {
            logger.warn(
              `[AuthReadyPage] Attempt ${attempt + 1} failed:`,
              userError,
            );
            if (userError instanceof ApiError && userError.status === 401) {
              await new Promise((resolve) => setTimeout(resolve, 120));
              continue;
            }
            throw userError;
          }
        }

        if (userDetails) {
          queryClient.setQueryData(queryKeys.auth.user(), userDetails);
        }

        // Route by profile completion only when we can confidently determine it.
        const isProfileComplete = resolveProfileCompletion(userDetails);
        if (isProfileComplete === false) {
          logger.warn(
            "[AuthReadyPage] Profile incomplete - redirecting to /profile-setup",
          );
          navigate({
            to: "/profile-setup",
            search: { redirectTo },
          });
          return;
        }

        if (isProfileComplete === undefined) {
          logger.warn(
            "[AuthReadyPage] Could not determine profile completion from /api/user/me. Continuing to requested route.",
          );
        }

        const normalizedRedirectTo = normalizeAuthRedirect(redirectTo);

        if (normalizedRedirectTo === "/home") {
          navigate({ to: "/home", search: { limit: 20, offset: 0 } });
        } else {
          globalThis.location.assign(normalizedRedirectTo);
          return;
        }
      } catch {
        setError("Failed to complete authentication. Please try again.");
      }
    }

    setupAuth();
  }, [isLoaded, isSignedIn, session, navigate, redirectTo, queryClient]);

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
