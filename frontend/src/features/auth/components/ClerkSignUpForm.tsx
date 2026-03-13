import { useMemo, useState } from "react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import TextField from "@/components/form/TextField";
import Button from "@/components/ui/Button";
import {
  AppleIcon,
  CalorieIcon,
  FacebookIcon,
  GoogleIcon,
} from "@/components/ui/Icons";
import {
  encodeAuthRedirect,
  normalizeAuthRedirect,
  shouldBypassSyncForRedirect,
} from "@/features/auth/utils/redirect";
import { resolveSocialAuthError } from "@/features/auth/utils/socialAuth";
import { logger } from "@/lib/logger";
import { useStore } from "@/store/store";

interface ClerkSignUpFormProps {
  onSwitchToSignIn: () => void;
  redirectTo?: string;
}

export function ClerkSignUpForm({
  onSwitchToSignIn,
  redirectTo,
}: ClerkSignUpFormProps) {
  const navigate = useNavigate();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { showNotification } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [isEmailMode, setIsEmailMode] = useState(false);

  const showPasswordField = useMemo(() => email.trim().length > 0, [email]);

  // Handle social sign-up
  const handleSocialSignUp = async (
    strategy: "oauth_google" | "oauth_facebook" | "oauth_apple",
  ) => {
    if (!isLoaded || !signUp) {
      showNotification("Authentication not ready. Please try again.", "error");
      return;
    }

    try {
      const destination = normalizeAuthRedirect(redirectTo);
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: `/sso-callback?flow=signup&redirectTo=${encodeAuthRedirect(destination)}`,
        redirectUrlComplete: `/auth-ready?redirectTo=${encodeAuthRedirect(destination)}`,
      });
    } catch (error) {
      logger.error("Social sign-up error:", error);

      const resolution = resolveSocialAuthError(error, "signup");

      if (resolution.action === "auth-ready") {
        showNotification(resolution.message, resolution.tone);
        navigate({
          to: "/auth-ready",
          search: { redirectTo: normalizeAuthRedirect(redirectTo) },
        });
        return;
      }

      if (resolution.action === "switch-to-signin") {
        showNotification(resolution.message, resolution.tone);
        onSwitchToSignIn();
        return;
      }

      if (resolution.action === "show-email") {
        setIsEmailMode(true);
      }

      showNotification(resolution.message, resolution.tone);
    }
  };

  // Handle email/password sign-up
  const handleEmailSignUp = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isLoaded || !signUp) {
      showNotification("Authentication not ready. Please try again.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      if (result.status === "complete") {
        // Sign-up complete, set session and redirect to auth-ready
        // AuthReadyPage will set the token and then redirect to the intended destination
        await setActive({ session: result.createdSessionId });
        const normalizedRedirect = normalizeAuthRedirect(redirectTo);
        navigate({
          to: "/auth-ready",
          search: {
            redirectTo: shouldBypassSyncForRedirect(normalizedRedirect)
              ? normalizedRedirect
              : `/profile-setup?redirectTo=${encodeAuthRedirect(normalizedRedirect)}`,
          },
        });
      } else if (result.status === "missing_requirements") {
        // Email verification required
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setVerifying(true);
        showNotification(
          "Please check your email for the verification code",
          "success",
        );
      }
    } catch (error) {
      logger.error("Sign-up error:", error);

      // Check if this is a "user already exists" error from Clerk
      const clerkError = error as {
        errors?: Array<{ code?: string; message?: string }>;
        message?: string;
      };
      const firstErrorCode = clerkError?.errors?.[0]?.code;

      if (
        firstErrorCode === "form_identifier_exists" ||
        firstErrorCode === "identifier_already_signed_up"
      ) {
        // Automatically attempt sign-in with the same credentials
        if (isSignInLoaded && signIn && password) {
          try {
            const signInResult = await signIn.create({
              identifier: email,
              password,
            });

            if (signInResult.status === "complete" && signInResult.createdSessionId) {
              await setSignInActive({ session: signInResult.createdSessionId });
              navigate({
                to: "/auth-ready",
                search: { redirectTo: normalizeAuthRedirect(redirectTo) },
              });
              return;
            }
          } catch (signInError) {
            logger.warn("Auto sign-in after duplicate sign-up failed:", signInError);
            // Fall through to show a generic message
          }
        }

        // If auto-sign-in failed (e.g. wrong password), switch to sign-in form silently
        showNotification(
          "That email already has an account. Please sign in instead.",
          "info",
        );
        onSwitchToSignIn();
        return;
      }

      showNotification(
        clerkError?.errors?.[0]?.message || clerkError?.message || "Sign-up failed. Please try again.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isLoaded || !signUp) return;

    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        // Verification complete, set session and redirect to auth-ready
        // AuthReadyPage will set the token and then redirect to the intended destination
        await setActive({ session: result.createdSessionId });
        showNotification("Email verified successfully!", "success");
        const normalizedRedirect = normalizeAuthRedirect(redirectTo);
        navigate({
          to: "/auth-ready",
          search: {
            redirectTo: shouldBypassSyncForRedirect(normalizedRedirect)
              ? normalizedRedirect
              : `/profile-setup?redirectTo=${encodeAuthRedirect(normalizedRedirect)}`,
          },
        });
      } else {
        showNotification(
          "Invalid verification code. Please try again.",
          "error",
        );
      }
    } catch (error) {
      logger.error("Verification error:", error);
      showNotification(
        error instanceof Error ? error.message : "Verification failed",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show verification form
  if (verifying) {
    return (
      <div className="w-full">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CalorieIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Verify Your Email
          </h1>
          <p className="mt-2 text-muted">
            We&apos;ve sent a verification code to {email}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <TextField
            label="Verification Code"
            value={code}
            onChange={setCode}
            type="text"
            required
            placeholder="123456"
            maxLength={6}
            name="verificationCode"
            autoComplete="one-time-code"
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            loadingText="Verifying..."
          >
            Verify Email
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVerifying(false)}
            className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-primary transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            Back to sign up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        {isEmailMode ? (
          <motion.div
            key="email-sign-up"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                Email sign up
              </p>
              <button
                type="button"
                onClick={() => setIsEmailMode(false)}
                className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
              >
                Back
              </button>
            </div>

            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  label="First Name"
                  value={firstName}
                  onChange={setFirstName}
                  required
                  placeholder="John"
                  textOnly
                  name="firstName"
                  autoComplete="given-name"
                />
                <TextField
                  label="Last Name"
                  value={lastName}
                  onChange={setLastName}
                  required
                  placeholder="Doe"
                  textOnly
                  name="lastName"
                  autoComplete="family-name"
                />
              </div>

              <TextField
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
                required
                placeholder="your@email.com"
                name="email"
                autoComplete="email"
              />

              <AnimatePresence initial={false}>
                {showPasswordField ? (
                  <motion.div
                    key="sign-up-password"
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <TextField
                      label="Password"
                      value={password}
                      onChange={setPassword}
                      type="password"
                      required
                      placeholder="••••••••"
                      name="password"
                      autoComplete="new-password"
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Clerk CAPTCHA element - required for bot protection */}
              <div id="clerk-captcha" className="hidden" />

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                loadingText="Creating account..."
              >
                Create Account
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="social-sign-up"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="space-y-3">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => handleSocialSignUp("oauth_google")}
                icon={<GoogleIcon className="h-5 w-5" />}
                iconPosition="left"
              >
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => handleSocialSignUp("oauth_facebook")}
                icon={<FacebookIcon className="h-5 w-5" />}
                iconPosition="left"
              >
                Continue with Facebook
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => handleSocialSignUp("oauth_apple")}
                icon={<AppleIcon className="h-5 w-5" />}
                iconPosition="left"
              >
                Continue with Apple
              </Button>
            </div>

            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-border" />
              <span className="mx-4 text-xs font-semibold tracking-wide text-muted uppercase">
                or
              </span>
              <div className="flex-1 border-t border-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => setIsEmailMode(true)}
            >
              Continue with email
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 border-t border-border pt-6 text-center text-sm">
        <span className="text-muted">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="inline-flex min-h-11 items-center rounded-md px-3 py-2 font-medium text-primary transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
