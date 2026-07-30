import { useEffect, useMemo, useState } from "react";
import { useClerk, useSignIn, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { Browser } from "@capacitor/browser";
import { AnimatePresence, motion } from "motion/react";

import TextField from "@/components/form/TextField";
import Button from "@/components/ui/Button";
import { BiometricSignInButton } from "@/features/auth/components/BiometricSignInButton";
import {
  SocialAuthOptions,
  type SocialAuthStrategy,
} from "@/features/auth/components/SocialAuthOptions";
import { AUTH_NOT_READY_MESSAGE } from "@/features/auth/constants";
import { getAuthLinkIntent } from "@/features/auth/utils/linkIntent";
import {
  buildSocialAuthRedirectUrls,
  normalizeAuthRedirect,
} from "@/features/auth/utils/redirect";
import { resolveSocialAuthError } from "@/features/auth/utils/socialAuth";
import { logger } from "@/lib/logger";
import { saveBiometricCredentials } from "@/services/biometrics";
import {
  exchangeNativeGoogleTokenWithClerk,
  nativeGoogleSignIn,
} from "@/services/native/googleAuth";
import { isNativePlatform } from "@/services/native/platform";
import { useStore } from "@/store/store";

interface ClerkSignInFormProps {
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
  redirectTo?: string;
}

function getStrategies(
  factors: Array<unknown> | null | undefined,
): string[] | undefined {
  return factors
    ?.map((factor) => {
      if (
        typeof factor === "object" &&
        factor !== null &&
        "strategy" in factor &&
        typeof factor.strategy === "string"
      ) {
        return factor.strategy;
      }

      return undefined;
    })
    .filter((strategy): strategy is string => strategy !== undefined);
}

export function ClerkSignInForm({
  onSwitchToSignUp,
  onForgotPassword,
  redirectTo,
}: ClerkSignInFormProps) {
  const navigate = useNavigate();
  const clerk = useClerk();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const { showNotification } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState<SocialAuthStrategy | null>(null);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [showLinkIntentBanner, setShowLinkIntentBanner] = useState(false);

  const showPasswordField = useMemo(() => email.trim().length > 0, [email]);
  const normalizedRedirect = normalizeAuthRedirect(redirectTo);

  useEffect(() => {
    setShowLinkIntentBanner(getAuthLinkIntent() !== null);
  }, []);

  // Handle social sign-in
  // We intentionally start OAuth via the sign-up resource because the callback
  // flow already handles both cases safely:
  // - existing social account => continue as sign-in
  // - new social account => continue to onboarding/profile setup
  // This keeps social auth consistent across the login and registration pages.
  const handleSocialSignIn = async (strategy: SocialAuthStrategy) => {
    if (!isLoaded || !isSignUpLoaded) {
      showNotification(AUTH_NOT_READY_MESSAGE, "error");

      return;
    }

    setLoadingStrategy(strategy);

    try {
      if (strategy === "oauth_google" && isNativePlatform()) {
        logger.info("Initiating native Google Sign-In on mobile...");
        let googleAuthRes = null;
        try {
          googleAuthRes = await Promise.race([
            nativeGoogleSignIn(),
            new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error("Native Google Sign-In timed out")), 10000)
            ),
          ]);
        } catch (nativeErr) {
          logger.warn("Native Google Sign-In failed or timed out:", nativeErr);
        }

        if (googleAuthRes?.idToken) {
          logger.info("Native Google Sign-In obtained idToken, exchanging with Clerk...");
          const success = await exchangeNativeGoogleTokenWithClerk({
            idToken: googleAuthRes.idToken,
            clerk,
            signIn,
            signUp,
            setActive,
          });

          if (success) {
            showNotification("Signed in with Google successfully!", "success");
            navigate({
              to: "/auth-ready",
              search: { redirectTo: normalizedRedirect },
            });
            return;
          }
          logger.warn("Native Google token exchange returned false.");
          showNotification("Google sign-in could not be completed. Please try again in a moment.", "warning");
          return;
        } else {
          logger.info("Native Google Sign-In returned no idToken or timed out, falling back to web OAuth...");
        }
      }

      const { redirectUrl, redirectUrlComplete } = buildSocialAuthRedirectUrls(
        normalizedRedirect,
        "signin",
      );

      if (isNativePlatform()) {
        let externalUrl: string | undefined;

        try {
          const res = await signIn.create({
            strategy,
            redirectUrl,
            redirectUrlComplete,
          });

          externalUrl =
            res.firstFactorVerification?.externalVerificationRedirectUrl?.toString() ||
            (res as any)?.verifications?.externalVerificationRedirectUrl?.toString();
        } catch (signInError) {
          logger.warn(
            "signIn.create externalUrl unavailable on sign-in, trying signUp.create:",
            signInError,
          );
        }

        if (!externalUrl) {
          try {
            const signUpRes = await signUp.create({
              strategy,
              redirectUrl,
              redirectUrlComplete,
            });

            externalUrl =
              signUpRes.verifications?.externalVerificationRedirectUrl?.toString() ||
              (signUpRes as any)?.firstFactorVerification?.externalVerificationRedirectUrl?.toString();
          } catch (signUpError) {
            logger.warn(
              "signUp.create externalUrl also unavailable on sign-in:",
              signUpError,
            );
          }
        }

        if (externalUrl) {
          await Browser.open({ url: externalUrl });

          return;
        }

        // Fallback to standard Clerk redirect flow if externalUrl is not returned directly
        await signUp.authenticateWithRedirect({
          strategy,
          redirectUrl,
          redirectUrlComplete,
        });
        return;
      }

      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl,
        redirectUrlComplete,
      });
    } catch (error) {
      setLoadingStrategy(null);
      logger.error("Social sign-in error:", error);

      const resolution = resolveSocialAuthError(error, "signin");

      if (resolution.action === "auth-ready") {
        showNotification(resolution.message, resolution.tone);
        navigate({
          to: "/auth-ready",
          search: { redirectTo: normalizedRedirect },
        });

        return;
      }

      if (resolution.action === "show-email") {
        setIsEmailMode(true);
      }

      showNotification(resolution.message, resolution.tone);
    } finally {
      setLoadingStrategy(null);
    }
  };

  // Handle email/password sign-in
  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isLoaded) {
      showNotification(AUTH_NOT_READY_MESSAGE, "error");

      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      switch (result.status) {
        case "complete": {
          // Sign-in complete, set session and redirect to auth-ready
          // AuthReadyPage will set the token and then redirect to the intended destination
          if (!result.createdSessionId) {
            logger.error(
              "No session ID available despite complete sign-in status",
            );
            showNotification(
              "Sign-in completed but session could not be created. Please try again.",
              "error",
            );

            return;
          }
          await setActive({ session: result.createdSessionId });
          await saveBiometricCredentials(email.trim().toLowerCase(), password);
          showNotification("Signed in successfully!", "success");
          navigate({
            to: "/auth-ready",
            search: { redirectTo: normalizedRedirect },
          });

          break;
        }
        case "needs_first_factor": {
          // Handle cases like email verification or password reset needed
          const supportedStrategies = getStrategies(
            result.supportedFirstFactors,
          );

          if (supportedStrategies?.includes("reset_password_email_code")) {
            showNotification(
              "Your password needs to be reset. Please check your email for reset instructions.",
              "info",
            );
            onForgotPassword();
          } else if (supportedStrategies?.includes("email_code")) {
            showNotification(
              "Please check your email for the verification code.",
              "info",
            );
          } else {
            showNotification(
              "Please complete the verification process.",
              "info",
            );
          }

          break;
        }
        case "needs_new_password": {
          // Password was changed or expired
          showNotification(
            "Your password has been changed. Please check your email or reset your password.",
            "info",
          );
          // Redirect to forgot password page
          onForgotPassword();

          break;
        }
        case "needs_second_factor": {
          // 2FA required
          showNotification("Two-factor authentication required.", "info");

          break;
        }
        default: {
          // Handle any other status
          logger.warn("Unhandled sign-in status:", result.status);
          showNotification(
            `Sign-in status: ${result.status}. Please try again or contact support.`,
            "warning",
          );
        }
      }
    } catch (error) {
      logger.error("Sign-in error:", error);

      // Handle Clerk-specific error structures
      let errorMessage = "Invalid email or password";

      if (error && typeof error === "object") {
        const clerkError = error as {
          message?: string;
          status?: number;
          errors?: Array<{ code?: string; message?: string }>;
        };
        logger.error("Sign-in error details:", {
          message: clerkError.message,
          status: clerkError.status,
          errors: clerkError.errors,
        });

        // Check for specific Clerk error codes
        if (clerkError.errors && Array.isArray(clerkError.errors)) {
          const firstError = clerkError.errors[0];
          switch (firstError.code) {
            case "form_password_incorrect": {
              errorMessage =
                "Incorrect password. If you recently changed your password, please use the new password.";

              break;
            }
            case "form_identifier_not_found": {
              errorMessage =
                "Email not found. Please check your email or sign up.";

              break;
            }
            case "session_exists": {
              errorMessage =
                "You already have an active session. Please sign out and try again.";

              break;
            }
            case "authorization_invalid": {
              errorMessage =
                "Your session or request was unauthorized. Please sign out and try again.";

              break;
            }
            default: {
              if (firstError.message) {
                errorMessage = firstError.message;
              }
            }
          }
        } else if (clerkError.message) {
          errorMessage = clerkError.message;
        }
      }

      showNotification(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Clerk CAPTCHA element - required for bot protection */}
      <div
        id="clerk-captcha"
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          opacity: 0.001,
          pointerEvents: "none",
        }}
      />

      {showLinkIntentBanner && (
        <div className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          This email already has an account. Sign in to link your social
          account.
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {isEmailMode ? (
          <motion.div
            key="email-sign-in"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                Email sign in
              </p>
              <button
                type="button"
                onClick={() => setIsEmailMode(false)}
                className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
              >
                Back
              </button>
            </div>

            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <TextField
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
                required
                placeholder="your@email.com"
                name="email"
                autoComplete="username"
              />

              <AnimatePresence initial={false}>
                {showPasswordField ? (
                  <motion.div
                    key="password-field"
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="space-y-3 overflow-hidden"
                  >
                    <TextField
                      label="Password"
                      value={password}
                      onChange={setPassword}
                      type="password"
                      required
                      placeholder="••••••••"
                      name="password"
                      autoComplete="current-password"
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={onForgotPassword}
                        className="inline-flex min-h-11 items-center rounded-md px-2 py-2 text-sm text-primary transition-colors duration-200 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                loadingText="Signing in..."
              >
                Sign In
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="social-sign-in"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <BiometricSignInButton redirectTo={redirectTo} />

            <SocialAuthOptions
              onProviderSelect={handleSocialSignIn}
              onContinueWithEmail={() => setIsEmailMode(true)}
              loadingStrategy={loadingStrategy}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 border-t border-border pt-6 text-center text-sm">
        <span className="text-muted">Don&apos;t have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="inline-flex min-h-11 items-center rounded-md px-3 py-2 font-medium text-primary transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
