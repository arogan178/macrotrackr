import { useCallback, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { authApi } from "@/api/auth";
import { ApiError } from "@/api/core";
import { userApi } from "@/api/user";
import { normalizeAuthRedirect, resolveProfileCompletion, shouldBypassSyncForRedirect } from "@/features/auth/utils/redirect";
import { logger } from "@/lib/logger";
import { queryKeys } from "@/lib/queryKeys";

function isLikelyUserDetailsPayload(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && Object.keys(value).length > 0;
}

interface UseAuthReadyResult {
  error: string | null;
  setupAuth: () => Promise<void>;
}

export function useAuthReady(redirectTo: string): UseAuthReadyResult {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn } = useAuth();
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

      await new Promise((r) => setTimeout(r, 50));

      const shouldBypassSync = shouldBypassSyncForRedirect(redirectTo);

      if (!shouldBypassSync) {
        try {
          await authApi.syncUser();
        } catch (syncError: unknown) {
          if (syncError instanceof Error && "status" in syncError) {
            const errorWithStatus = syncError as { status: number };
            if (errorWithStatus.status === 401) {
              setError("Authentication failed. Please sign in again.");

              return;
            }
          }
          logger.error("[AuthReadyPage] Failed to sync user", syncError);
          setError("We couldn't link your account yet. Please try signing in again.");

          return;
        }
        await new Promise((r) => setTimeout(r, 100));
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
      }

      if (shouldBypassSync) {
        navigate({ to: "/profile-setup", search: { redirectTo }, replace: true });

        return;
      }

      let userDetails: Record<string, unknown> | null = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await userApi.getUserDetails();
          if (!isLikelyUserDetailsPayload(response)) {
            await new Promise((r) => setTimeout(r, 120));
            continue;
          }
          userDetails = response;
          break;
        } catch (userError) {
          if (userError instanceof ApiError && userError.status === 401) {
            await new Promise((r) => setTimeout(r, 120));
            continue;
          }
          throw userError;
        }
      }

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
        globalThis.location.assign(normalizedRedirectTo);

        return;
      }
    } catch {
      setError("Failed to complete authentication. Please try again.");
    }
  }, [isLoaded, isSignedIn, navigate, redirectTo, queryClient]);

  return { error, setupAuth };
}
