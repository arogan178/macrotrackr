import { useEffect, useRef, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { authApi } from "@/api/auth";
import { ApiError } from "@/api/core";
import { userApi } from "@/api/user";
import PageBackground from "@/components/layout/PageBackground";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  normalizeAuthRedirect,
  resolveAuthReturnTo,
} from "@/features/auth/utils/redirect";
import {
  resolveSocialAuthError,
  type SocialAuthResolution,
} from "@/features/auth/utils/socialAuth";
import { logger } from "@/lib/logger";

/**
 * SSOCallbackPage - Handles the callback from Clerk OAuth providers
 *
 * This page is shown after the user authenticates with Google/Facebook/Apple.
 *
 * Key edge case: If an existing user clicks "Sign up with Google", Clerk
 * will still authenticate them. We detect this by syncing with our backend
 * and checking profile completion. Existing users skip profile setup entirely.
 *
 * Flow:
 * 1. User clicks "Sign up/in with Google" → Clerk creates/finds account, redirects here
 * 2. Clerk processes the OAuth callback via handleRedirectCallback
 * 3. Once session is active, we get a token and sync with backend
 * 4. If existing user with complete profile → /auth-ready (straight to app)
 * 5. If new user or incomplete profile → /profile-setup
 */
export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();
  const search = useSearch({ from: "/sso-callback" }) as {
    redirectTo?: string;
    flow?: string;
  };
  const [error, setError] = useState<string | null>(null);
  const [callbackResolution, setCallbackResolution] =
    useState<SocialAuthResolution | null>(null);
  const hasProcessedCallback = useRef(false);
  const hasProcessedRouting = useRef(false);

  const isSignUpFlow = search.flow === "signup";
  const redirectTo = normalizeAuthRedirect(search.redirectTo ?? "/home");
  const returnToSearch = { returnTo: resolveAuthReturnTo(redirectTo) };

  // Step 1: Let Clerk process the OAuth redirect callback
  useEffect(() => {
    if (hasProcessedCallback.current) return;
    hasProcessedCallback.current = true;

    handleRedirectCallback({
      // We handle routing ourselves, so tell Clerk to stay on this page
      afterSignInUrl: globalThis.location.href,
      afterSignUpUrl: globalThis.location.href,
    }).catch((error_) => {
      // Clerk may throw if the callback was already handled (e.g. page refresh)
      // This is safe to ignore if the user is already signed in
      const resolution = resolveSocialAuthError(
        error_,
        isSignUpFlow ? "signup" : "signin",
      );

      logger.warn(
        "[SSOCallback] handleRedirectCallback error (may be safe to ignore):",
        error_,
      );
      setCallbackResolution(resolution);
    });
  }, [handleRedirectCallback, isSignUpFlow]);

  // Step 2: Once Clerk is loaded and user is signed in, handle routing
  useEffect(() => {
    if (hasProcessedRouting.current) return;
    if (!authLoaded || !userLoaded) return;

    if (!isSignedIn || !user) {
      if (callbackResolution) {
        hasProcessedRouting.current = true;
        setError(callbackResolution.message);
      }

      return;
    }

    hasProcessedRouting.current = true;

    async function routeUser() {
      try {
        const safeRedirectTo = redirectTo;

        // For sign-in flows, go straight to auth-ready
        if (!isSignUpFlow) {
          sessionStorage.removeItem("socialProfileData");
          navigate({
            to: "/auth-ready",
            search: { redirectTo: safeRedirectTo },
          });

          return;
        }

        // ── Sign-up flow: check if the user already exists in our DB ──
        // This handles existing users who clicked "Sign up with Google"
        // instead of "Log in with Google".

        // Check if user already exists in our backend via sync + profile check.
        // apiService.auth.syncUser() uses getHeaders() which automatically
        // retrieves the Clerk token via the token getter set by useClerkAuth.
        let existingUser = false;
        let profileComplete = false;

        try {
          // syncUser uses getHeaders which pulls from the Clerk token getter
          await authApi.syncUser();

          // If sync succeeds, check profile completion
          try {
            const userDetails = await userApi.getUserDetails();
            existingUser = true;

            if (typeof userDetails === "object") {
              if (typeof userDetails.isProfileComplete === "boolean") {
                profileComplete = userDetails.isProfileComplete;
              } else if ("dateOfBirth" in userDetails) {
                profileComplete = Boolean(userDetails.dateOfBirth);
              }
            }
          } catch (userError) {
            if (userError instanceof ApiError && userError.status === 404) {
              existingUser = false;
            } else {
              logger.warn(
                "[SSOCallback] Failed to fetch user details:",
                userError,
              );
            }
          }
        } catch (syncError) {
          if (syncError instanceof ApiError && syncError.status === 404) {
            logger.info(
              "[SSOCallback] Sync indicates new user profile:",
              syncError,
            );
            existingUser = false;
          } else {
            logger.error("[SSOCallback] Unexpected sync failure:", syncError);
            throw syncError;
          }
        }

        // Route based on what we found
        if (existingUser && profileComplete) {
          logger.info(
            "[SSOCallback] Existing user with complete profile - routing to auth-ready",
          );
          sessionStorage.removeItem("socialProfileData");
          navigate({
            to: "/auth-ready",
            search: { redirectTo: safeRedirectTo },
          });

          return;
        }

        // New user or incomplete profile → go to profile setup
        const socialData = {
          firstName: user?.firstName ?? "",
          lastName: user?.lastName ?? "",
          email: user?.primaryEmailAddress?.emailAddress ?? "",
          dateOfBirth:
            (user!.unsafeMetadata.dateOfBirth as string | undefined) ?? "",
        };
        sessionStorage.setItem("socialProfileData", JSON.stringify(socialData));
        navigate({
          to: "/profile-setup",
          search: { redirectTo: safeRedirectTo },
        });
      } catch (error_) {
        logger.error("SSO callback routing error:", error_);
        setError(
          error_ instanceof Error
            ? error_.message
            : "Failed to complete sign-in. Please try again.",
        );
      }
    }

    routeUser();
  }, [
    authLoaded,
    callbackResolution,
    isSignUpFlow,
    isSignedIn,
    navigate,
    redirectTo,
    user,
    userLoaded,
  ]);

  const primaryAction =
    callbackResolution?.action === "switch-to-signin"
      ? {
          label: "Go to sign in",
          onClick: () =>
            navigate({
              to: "/login",
              search: returnToSearch,
            }),
        }
      : callbackResolution?.action === "switch-to-signup"
        ? {
            label: "Go to sign up",
            onClick: () =>
              navigate({
                to: "/register",
                search: returnToSearch,
              }),
          }
        : {
            label: isSignUpFlow ? "Continue with email" : "Back to sign in",
            onClick: () =>
              navigate({
                to: isSignUpFlow ? "/register" : "/login",
                search: returnToSearch,
              }),
          };

  const secondaryAction = isSignUpFlow
    ? {
        label: "Already have an account? Sign in",
        onClick: () =>
          navigate({
            to: "/login",
            search: returnToSearch,
          }),
      }
    : {
        label: "Need an account? Sign up",
        onClick: () =>
          navigate({
            to: "/register",
            search: returnToSearch,
          }),
      };

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
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-foreground">
            Sign-in Failed
          </h1>
          <p className="mb-6 text-muted">{error}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-2 font-bold text-black transition-colors duration-200 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
            >
              {primaryAction.label}
            </button>
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 py-2 font-medium text-foreground transition-colors duration-200 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
            >
              {secondaryAction.label}
            </button>
          </div>
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
          Completing sign-in...
        </h1>
        <p className="mt-2 text-muted">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  );
}
