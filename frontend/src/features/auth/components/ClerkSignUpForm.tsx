import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Browser } from "@capacitor/browser";
import { useClerk } from "@clerk/react";
import { useSignIn, useSignUp } from "@clerk/react/legacy";
import { resolveSignupSource } from "@shared/product-analytics";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import TextField from "@/components/form/TextField";
import Button from "@/components/ui/Button";
import { CalorieIcon } from "@/components/ui/Icons";
import { LegalConsentCheckbox } from "@/features/auth/components/LegalConsentCheckbox";
import {
  SocialAuthOptions,
  type SocialAuthStrategy,
} from "@/features/auth/components/SocialAuthOptions";
import { AUTH_NOT_READY_MESSAGE } from "@/features/auth/constants";
import {
  forgetLegalConsent,
  isMissingLegalConsent,
  rememberLegalConsent,
} from "@/features/auth/utils/legalConsent";
import {
  buildSocialAuthRedirectUrls,
  encodeAuthRedirect,
  normalizeAuthRedirect,
  shouldBypassSyncForRedirect,
} from "@/features/auth/utils/redirect";
import {
  extractClerkError,
  resolveSocialAuthError,
} from "@/features/auth/utils/socialAuth";
import { logger } from "@/lib/logger";
import { useProductAnalytics } from "@/lib/productAnalytics";
import {
  exchangeNativeGoogleTokenWithClerk,
  nativeGoogleSignIn,
} from "@/services/native/googleAuth";
import { isNativePlatform } from "@/services/native/platform";
import { useStore } from "@/store/store";

const RESEND_COOLDOWN_SECONDS = 30;

const VERIFICATION_CODE_LENGTH = 6;

// Pasting a code out of an email routinely brings whitespace with it, and the
// autofill for one-time-code can bring a non-breaking space. Keep the digits.
function sanitizeVerificationCode(value: string): string {
  return value.replaceAll(/\D/gu, "").slice(0, VERIFICATION_CODE_LENGTH);
}

const CONSENT_REQUIRED_MESSAGE =
  "Please accept the Terms of Service and Privacy Policy to create an account.";

function resolveVerificationErrorMessage(
  errorCode: string | undefined,
  message: string | undefined,
): string {
  switch (errorCode) {
    case "form_code_incorrect":
    case "verification_failed": {
      return "That code doesn't match. Check the email and try again, or resend a new code.";
    }
    case "verification_expired": {
      return "That code has expired. Send a new one and try again.";
    }
    default: {
      return message ?? "Verification failed. Please try again.";
    }
  }
}

interface ClerkSignUpFormProps {
  onSwitchToSignIn: () => void;
  redirectTo?: string;
}

export function ClerkSignUpForm({
  onSwitchToSignIn,
  redirectTo,
}: ClerkSignUpFormProps) {
  const productAnalytics = useProductAnalytics();
  const navigate = useNavigate();
  const clerk = useClerk();
  const { isLoaded, signUp, setActive } = useSignUp();
  const {
    isLoaded: isSignInLoaded,
    signIn,
    setActive: setSignInActive,
  } = useSignIn();
  const { showNotification } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStrategy, setLoadingStrategy] =
    useState<SocialAuthStrategy | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [consentRequiredOnVerify, setConsentRequiredOnVerify] = useState(false);
  const hasCheckedPendingSignUp = useRef(false);

  const showPasswordField = useMemo(() => email.trim().length > 0, [email]);
  const normalizedRedirect = normalizeAuthRedirect(redirectTo);
  const pendingEmail = signUp?.emailAddress ?? email;

  // Latched at restore rather than read live, so ticking the box does not make
  // the box disappear out from under the pointer.
  const consentOutstanding = consentRequiredOnVerify && !legalAccepted;

  const afterSignUpRedirect = shouldBypassSyncForRedirect(normalizedRedirect)
    ? normalizedRedirect
    : `/profile-setup?redirectTo=${encodeAuthRedirect(normalizedRedirect)}`;

  // A sign-up attempt lives on the Clerk client, not in this component, so an
  // unverified one survives a reload, a tab close, or the app being killed.
  // Without this the user came back to an empty form and no way to reach the
  // code they had already been sent.
  useEffect(() => {
    if (!isLoaded || hasCheckedPendingSignUp.current) {
      return;
    }
    hasCheckedPendingSignUp.current = true;

    // Clerk abandons a stale attempt server-side. Restoring one puts the user
    // on a screen where the code, the resend and the submit all fail.
    const isAbandoned =
      signUp.abandonAt !== null && signUp.abandonAt <= Date.now();

    if (
      !isAbandoned &&
      signUp.status === "missing_requirements" &&
      signUp.unverifiedFields.includes("email_address") &&
      signUp.emailAddress
    ) {
      setEmail(signUp.emailAddress);
      setIsEmailMode(true);
      setVerifying(true);
      // An attempt created before consent was collected still owes it. Ask on
      // the verify screen rather than accepting on the user's behalf when the
      // code lands.
      setConsentRequiredOnVerify(isMissingLegalConsent(signUp));
    }
  }, [isLoaded, signUp]);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const goToAuthReady = useCallback(
    async (sessionId: string) => {
      forgetLegalConsent();
      await setActive?.({ session: sessionId });
      navigate({
        to: "/auth-ready",
        search: { redirectTo: afterSignUpRedirect },
      });
    },
    [afterSignUpRedirect, navigate, setActive],
  );

  type SignUpAttempt = NonNullable<typeof signUp>;

  /**
   * Settles whatever the attempt still owes. "outstanding" means something is
   * genuinely unmet, so the caller can say what rather than reaching for the
   * nearest error message.
   */
  const finishSignUpAttempt = useCallback(
    async (
      attempt: SignUpAttempt,
    ): Promise<"signed-in" | "needs-sign-in" | "outstanding"> => {
      let settled = attempt;

      if (isMissingLegalConsent(settled)) {
        settled = await settled.update({ legalAccepted: true });
      }

      if (settled.status !== "complete") {
        return "outstanding";
      }

      if (!settled.createdSessionId) {
        // Complete with no session is not something the user can act on here.
        logger.error("Sign-up completed without a session");
        showNotification(
          "Your account was created, but we couldn't sign you in. Please sign in to continue.",
          "warning",
        );
        onSwitchToSignIn();

        return "needs-sign-in";
      }

      await goToAuthReady(settled.createdSessionId);

      return "signed-in";
    },
    [goToAuthReady, onSwitchToSignIn, showNotification],
  );

  // Handle social sign-up
  const handleSocialSignUp = async (strategy: SocialAuthStrategy) => {
    if (!isLoaded || !isSignInLoaded) {
      showNotification(AUTH_NOT_READY_MESSAGE, "error");

      return;
    }

    if (!legalAccepted) {
      showNotification(CONSENT_REQUIRED_MESSAGE, "warning");

      return;
    }

    // The redirect paths cannot carry the consent flag, so record it here and
    // let /sso-callback apply it to the attempt Clerk hands back.
    rememberLegalConsent();

    productAnalytics.capture({
      event: "signup_started",
      properties: {
        authMethod: strategy,
        source: resolveSignupSource(normalizedRedirect),
      },
    });
    setLoadingStrategy(strategy);

    try {
      if (strategy === "oauth_google" && isNativePlatform()) {
        logger.info("Initiating native Google Sign-In on mobile...");
        let googleAuthRes = null;
        try {
          googleAuthRes = await Promise.race([
            nativeGoogleSignIn(),
            new Promise<null>((_, reject) =>
              setTimeout(
                () => reject(new Error("Native Google Sign-In timed out")),
                10000,
              ),
            ),
          ]);
        } catch (nativeError) {
          logger.warn(
            "Native Google Sign-In failed or timed out:",
            nativeError,
          );
        }

        if (googleAuthRes?.idToken) {
          logger.info(
            "Native Google Sign-In obtained idToken, exchanging with Clerk...",
          );
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
          showNotification(
            "Google sign-in could not be completed. Please try again in a moment.",
            "warning",
          );

          return;
        } else {
          logger.info(
            "Native Google Sign-In returned no idToken or timed out, falling back to web OAuth...",
          );
        }
      }

      const { redirectUrl, redirectUrlComplete } = buildSocialAuthRedirectUrls(
        normalizedRedirect,
        "signup",
      );

      if (isNativePlatform()) {
        let externalUrl: string | undefined;

        try {
          const res = await signUp.create({
            strategy,
            redirectUrl,
            actionCompleteRedirectUrl: redirectUrlComplete,
            legalAccepted: true,
          });

          externalUrl =
            res.verifications?.externalAccount?.externalVerificationRedirectURL?.toString() ||
            (
              res as any
            )?.firstFactorVerification?.externalVerificationRedirectURL?.toString();
        } catch (createError) {
          logger.warn(
            "signUp.create externalUrl unavailable, trying signIn.create fallback:",
            createError,
          );
        }

        if (!externalUrl) {
          try {
            const signInRes = await signIn.create({
              strategy,
              redirectUrl,
              actionCompleteRedirectUrl: redirectUrlComplete,
            });

            externalUrl =
              signInRes.firstFactorVerification?.externalVerificationRedirectURL?.toString() ||
              (
                signInRes as any
              )?.verifications?.externalVerificationRedirectURL?.toString();
          } catch (signInError) {
            logger.warn(
              "signIn.create externalUrl also unavailable on sign-up:",
              signInError,
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
      logger.error("Social sign-up error:", error);

      const resolution = resolveSocialAuthError(error, "signup");

      if (resolution.action === "auth-ready") {
        showNotification(resolution.message, resolution.tone);
        navigate({
          to: "/auth-ready",
          search: { redirectTo: normalizedRedirect },
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
    } finally {
      setLoadingStrategy(null);
    }
  };

  // Handle email/password sign-up
  const handleEmailSignUp = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isLoaded) {
      showNotification(AUTH_NOT_READY_MESSAGE, "error");

      return;
    }

    if (!legalAccepted) {
      showNotification(CONSENT_REQUIRED_MESSAGE, "warning");

      return;
    }

    productAnalytics.capture({
      event: "signup_started",
      properties: {
        authMethod: "email",
        source: resolveSignupSource(normalizedRedirect),
      },
    });
    setIsLoading(true);

    try {
      // legalAccepted is required by the instance. Omitting it leaves the
      // attempt at missing_requirements even after the email code verifies.
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
        legalAccepted: true,
      });

      if (result.status === "complete") {
        // Sign-up complete, set session and redirect to auth-ready
        // AuthReadyPage will set the token and then redirect to the intended destination
        await finishSignUpAttempt(result);
      } else if (result.status === "missing_requirements") {
        // Email verification required
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setVerifying(true);
        setCode("");
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
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
      const firstErrorCode = clerkError.errors?.[0]?.code;

      if (
        firstErrorCode === "form_identifier_exists" ||
        firstErrorCode === "identifier_already_signed_up"
      ) {
        // Automatically attempt sign-in with the same credentials
        if (isSignInLoaded && password) {
          try {
            const signInResult = await signIn.create({
              identifier: email,
              password,
            });

            if (
              signInResult.status === "complete" &&
              signInResult.createdSessionId
            ) {
              await setSignInActive({ session: signInResult.createdSessionId });
              navigate({
                to: "/auth-ready",
                search: { redirectTo: normalizedRedirect },
              });

              return;
            }
          } catch (signInError) {
            logger.warn(
              "Auto sign-in after duplicate sign-up failed:",
              signInError,
            );
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
        clerkError.errors?.[0]?.message ??
          clerkError.message ??
          "Sign-up failed. Please try again.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    // The submit button is disabled while loading, but Enter in the code field
    // is not, and a second attempt on an accepted code fails.
    if (!isLoaded || isLoading) return;

    if (consentOutstanding) {
      showNotification(CONSENT_REQUIRED_MESSAGE, "warning");

      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: sanitizeVerificationCode(code),
      });

      // Reaching here means the code was accepted: a wrong one throws. Anything
      // still outstanding is a different requirement, and blaming the code for
      // it strands the user on a screen whose only input is already correct.
      const outcome = await finishSignUpAttempt(result);

      if (outcome === "signed-in") {
        showNotification("Email verified", "success");

        return;
      }

      if (outcome === "needs-sign-in") {
        return;
      }

      logger.error("Sign-up still incomplete after verification", {
        status: result.status,
        missingFields: result.missingFields,
        unverifiedFields: result.unverifiedFields,
      });
      showNotification(
        "Your email is verified, but we couldn't finish creating the account. Please try again.",
        "error",
      );
    } catch (error) {
      logger.error("Verification error:", error);

      const { code: errorCode, message } = extractClerkError(error);

      // The code landed on an earlier submit. Carry on from where that got to
      // rather than reporting a failure for something that already worked.
      if (
        errorCode === "verification_already_verified" &&
        (await finishSignUpAttempt(signUp)) !== "outstanding"
      ) {
        return;
      }

      showNotification(
        resolveVerificationErrorMessage(errorCode, message),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Codes expire, and a user coming back to a half-finished sign-up needs a
  // fresh one rather than a dead end.
  const handleResendCode = async () => {
    if (!isLoaded || isResending || resendCooldown > 0) return;

    setIsResending(true);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setCode("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      showNotification(`New code sent to ${pendingEmail}`, "success");
    } catch (error) {
      logger.error("Resend verification code error:", error);
      showNotification(
        extractClerkError(error).message ??
          "Couldn't send a new code. Please try again.",
        "error",
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleUseDifferentEmail = () => {
    setVerifying(false);
    setCode("");
    setResendCooldown(0);
    // A restored attempt prefills the old address; leaving it there makes the
    // button a lie and re-submits the same sign-up.
    setEmail("");
    setPassword("");
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
            We&apos;ve sent a verification code to {pendingEmail}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <TextField
            label="Verification Code"
            value={code}
            onChange={(value) => setCode(sanitizeVerificationCode(value))}
            type="text"
            required
            placeholder="123456"
            name="verificationCode"
            autoComplete="one-time-code"
          />

          {consentRequiredOnVerify ? (
            <LegalConsentCheckbox
              checked={legalAccepted}
              onChange={setLegalAccepted}
            />
          ) : null}

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            loadingText="Verifying..."
            disabled={consentOutstanding}
          >
            Verify Email
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-1 text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isResending || resendCooldown > 0}
            className="inline-flex min-h-11 items-center rounded-control px-3 py-2 text-sm text-primary transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none disabled:text-muted disabled:hover:no-underline"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : isResending
                ? "Sending..."
                : "Resend code"}
          </button>
          <button
            type="button"
            onClick={handleUseDifferentEmail}
            className="inline-flex min-h-11 items-center rounded-control px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

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
                className="inline-flex min-h-11 items-center rounded-control px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
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

              <LegalConsentCheckbox
                checked={legalAccepted}
                onChange={setLegalAccepted}
              />

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                loadingText="Creating account..."
                disabled={!legalAccepted}
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
            <div className="mb-5">
              <LegalConsentCheckbox
                checked={legalAccepted}
                onChange={setLegalAccepted}
              />
            </div>

            <SocialAuthOptions
              onProviderSelect={handleSocialSignUp}
              onContinueWithEmail={() => setIsEmailMode(true)}
              loadingStrategy={loadingStrategy}
              providersDisabled={!legalAccepted}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 border-t border-border pt-6 text-center text-sm">
        <span className="text-muted">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="inline-flex min-h-11 items-center rounded-control px-3 py-2 font-medium text-primary transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
