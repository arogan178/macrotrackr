import { useCallback, useRef, useState } from "react";
import { useAuth, useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { authApi } from "@/api/auth";
import { ApiError } from "@/api/core";
import { userApi } from "@/api/user";
import { handleAccountCollision } from "@/features/auth/utils/handleAuthCollision";
import { normalizeAuthRedirect, resolveProfileCompletion, shouldBypassSyncForRedirect } from "@/features/auth/utils/redirect";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

function isLikelyUserDetailsPayload(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && Object.keys(value).length > 0;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const signal = AbortSignal.timeout(ms);
      signal.addEventListener("abort", () => reject(new Error(message)), { once: true });
    }),
  ]);
}

function isApiErrorWithStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}

const SYNC_TIMEOUT_MS = 12_000;
const PROFILE_TIMEOUT_MS = 8000;

interface UseAuthReadyResult {
  error: string | null;
  setupAuth: () => Promise<void>;
}

/**
 * The step between "Clerk says you're signed in" and the app proper.
 *
 * Ordered around the fact that almost every visit here is a returning sign-in,
 * whose account was linked to a local row long ago. So it asks for the profile
 * first and only syncs when the answer is that there isn't one — one request
 * for the common case, where this used to always spend a sync and a profile
 * fetch back to back, plus 150ms of fixed sleeps between them.
 *
 * The sleeps are gone rather than shortened: they were waiting for the Clerk
 * token to become available, and `apiClient.getAuthToken()` awaits the token
 * getter on every request, so there was never anything to wait for.
 */
export function useAuthReady(redirectTo: string): UseAuthReadyResult {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [error, setError] = useState<string | null>(null);
  const hasInitializedRef = useRef(false);

  const setupAuth = useCallback(async () => {
    try {
      if (hasInitializedRef.current) return;
      if (!isLoaded) return;

      hasInitializedRef.current = true;

      if (!isSignedIn) {
        navigate({ to: "/login", search: { returnTo: undefined } });

        return;
      }

      if (shouldBypassSyncForRedirect(redirectTo)) {
        navigate({ to: "/profile-setup", search: { redirectTo }, replace: true });

        return;
      }

      // A 401 here means the backend rejected a token the client believes is
      // live. Asking again picks up a freshly minted one; beyond that it is a
      // real failure and not worth sitting on.
      let userDetails: Record<string, unknown> | null = null;
      let isAccountSynced = true;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await withTimeout(
            userApi.getUserDetails(),
            PROFILE_TIMEOUT_MS,
            "Fetching user details timed out",
          );
          if (isLikelyUserDetailsPayload(response)) {
            userDetails = response;
          }
          break;
        } catch (profileError) {
          // No local row for this Clerk account yet: a first-ever sign-in, or a
          // sign-up whose sync never landed. That is what the sync is for.
          if (
            profileError instanceof ApiError &&
            profileError.status === 409 &&
            profileError.code === "ACCOUNT_NOT_SYNCED"
          ) {
            isAccountSynced = false;
            break;
          }

          if (isApiErrorWithStatus(profileError, 401) && attempt === 0) {
            continue;
          }

          throw profileError;
        }
      }

      if (!isAccountSynced) {
        let isNewUser = false;
        try {
          const syncResult = await withTimeout(
            authApi.syncUser(),
            SYNC_TIMEOUT_MS,
            "Account synchronization timed out",
          );
          isNewUser = syncResult.isNewUser;
        } catch (syncError: unknown) {
          if (
            syncError instanceof ApiError &&
            syncError.status === 409 &&
            syncError.code === "ACCOUNT_LINK_REQUIRED"
          ) {
            await handleAccountCollision({ signOut, navigate });

            return;
          }

          if (isApiErrorWithStatus(syncError, 401)) {
            setError("Authentication failed. Please sign in again.");

            return;
          }

          logger.error("[AuthReadyPage] Failed to sync user", syncError);
          setError("We couldn't link your account yet. Please try signing in again.");

          return;
        }

        // A row the sync just inserted has NULL details by construction, so
        // there is nothing to read back — it goes to setup either way.
        if (isNewUser) {
          queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
          navigate({ to: "/profile-setup", search: { redirectTo } });

          return;
        }

        try {
          const response = await withTimeout(
            userApi.getUserDetails(),
            PROFILE_TIMEOUT_MS,
            "Fetching user details timed out",
          );
          if (isLikelyUserDetailsPayload(response)) {
            userDetails = response;
          }
        } catch (profileError) {
          logger.error("[AuthReadyPage] Failed to load profile after sync", profileError);
        }
      }

      // Seeds the cache the destination route is about to read, so it renders
      // from this response instead of asking for it again.
      if (userDetails) {
        queryClient.setQueryData(queryKeys.auth.user(), userDetails);
      }

      const isProfileComplete = resolveProfileCompletion(userDetails);
      if (isProfileComplete === false) {
        navigate({ to: "/profile-setup", search: { redirectTo } });

        return;
      }

      const normalizedRedirectTo = normalizeAuthRedirect(redirectTo);
      if (normalizedRedirectTo === "/home") {
        navigate({ to: "/home", search: { limit: 20, offset: 0 } });
      } else {
        navigate({ to: normalizedRedirectTo as any });

        return;
      }
    } catch {
      setError("Failed to complete authentication. Please try again.");
    }
  }, [isLoaded, isSignedIn, navigate, redirectTo, queryClient, signOut]);

  return { error, setupAuth };
}
