import { useAuth, useSession } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { queryKeys } from "@/lib/queryKeys";
import { apiService, setAuthToken } from "@/utils/apiServices";

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

  const redirectTo = search.redirectTo || "/home";

  useEffect(() => {
    async function setupAuth() {
      try {
        // Wait for Clerk to be fully loaded
        if (!isLoaded) {
          return;
        }

        // If not signed in, redirect to login
        if (!isSignedIn) {
          navigate({ to: "/login" });
          return;
        }

        // Get the token from the session
        let token: string | null = null;
        if (session) {
          token = await session.getToken();
          if (token) {
            setAuthToken(token);
            console.log("[AuthReadyPage] Token set successfully");
          } else {
            console.warn("[AuthReadyPage] No token available from session");
          }
        }

        // Give a small moment for the token to be set
        await new Promise(resolve => setTimeout(resolve, 50));

        // Sync the Clerk user with our backend
        // This ensures the user exists in our database even if they logged in
        // (not just signed up) and haven't completed profile setup yet
        console.log("[AuthReadyPage] Syncing user with backend...");
        let syncSuccess = false;
        try {
          const syncedUser = await apiService.auth.syncUser(token || undefined);
          console.log("[AuthReadyPage] User synced successfully:", syncedUser);
          syncSuccess = true;
        } catch (syncError: any) {
          // Log the error but don't block navigation
          // The user will be redirected to profile setup if needed
          console.error("[AuthReadyPage] User sync failed:", {
            status: syncError?.status,
            message: syncError?.message,
            code: syncError?.code,
          });
          
          // If it's a 401, the token might be invalid - force a logout
          if (syncError?.status === 401) {
            console.error("[AuthReadyPage] Authentication failed during sync - redirecting to login");
            // Show error and don't navigate
            setError("Authentication failed. Please sign in again.");
            return;
          }
        }
        
        // Small delay after successful sync to ensure DB is updated
        if (syncSuccess) {
          await new Promise(resolve => setTimeout(resolve, 100));
          // Invalidate user query to force refetch with new synced data
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
          console.log("[AuthReadyPage] Invalidated user query");
        }

        // Navigate to the target route
        if (redirectTo === "/home") {
          navigate({ to: "/home", search: { limit: 20, offset: 0 } });
        } else {
          navigate({ to: redirectTo as any });
        }
      } catch (err) {
        console.error("[AuthReadyPage] Error setting up auth:", err);
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
            onClick={() => navigate({ to: "/login" })}
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
        <p className="mt-2 text-muted">
          Please wait while we set things up
        </p>
      </div>
    </div>
  );
}
