import { useAuth, useSession } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError, apiService, setAuthToken } from "@/utils/apiServices";

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

  const redirectTo = search.redirectTo || "/home";

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

        // Sync the Clerk user with our backend.
        let syncSuccess = false;
        try {
          await apiService.auth.syncUser(token || undefined);
          syncSuccess = true;
        } catch (syncError: any) {
          // If it's a 401, the token might be invalid.
          if (syncError?.status === 401) {
            setError("Authentication failed. Please sign in again.");
            return;
          }
        }

        // Small delay after successful sync to ensure DB is updated
        if (syncSuccess) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
        }

        // Resolve backend user details before leaving auth-ready.
        // This avoids bouncing to protected routes while /api/user/me still returns 401.
        let userDetails = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            userDetails = await apiService.user.getUserDetails();
            break;
          } catch (userError) {
            if (userError instanceof ApiError && userError.status === 401) {
              await new Promise((resolve) => setTimeout(resolve, 120));
              continue;
            }
            throw userError;
          }
        }

        if (!userDetails) {
          setError("Authentication is not ready yet. Please sign in again.");
          return;
        }

        queryClient.setQueryData(queryKeys.auth.user(), userDetails);

        // Route by profile completion first.
        if (!userDetails.isProfileComplete) {
          navigate({ to: "/profile-setup" });
          return;
        }

        // Validate redirect URL to prevent open redirect attacks
        // Must be a relative path starting with '/' but not '//' (protocol-relative)
        const isValidRedirect = (url: string): boolean =>
          url.startsWith("/") && !url.startsWith("//");

        const normalizedRedirectTo =
          !redirectTo ||
          !isValidRedirect(redirectTo) ||
          redirectTo.startsWith("/auth-ready")
            ? "/home"
            : redirectTo;

        if (normalizedRedirectTo === "/home") {
          navigate({ to: "/home", search: { limit: 20, offset: 0 } });
        } else {
          navigate({ to: normalizedRedirectTo as any });
        }
      } catch {
        setError("Failed to complete authentication. Please try again.");
      }
    }

    setupAuth();
  }, [isLoaded, isSignedIn, session, navigate, redirectTo, queryClient]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-surface-2 p-8 text-center shadow-lg">
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
            onClick={() =>
              navigate({ to: "/login", search: { returnTo: undefined } })
            }
            className="rounded-md bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-foreground">
          Preparing your account...
        </h1>
        <p className="mt-2 text-muted">Please wait while we set things up</p>
      </div>
    </div>
  );
}
