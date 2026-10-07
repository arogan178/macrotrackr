import { useEffect, useState } from "react";
import { useSignIn } from "@clerk/react/legacy";
import { motion } from "motion/react";

import TextField from "@/components/form/TextField";
import Button from "@/components/ui/Button";
import { AUTH_NOT_READY_MESSAGE } from "@/features/auth/constants";
import { extractClerkError } from "@/features/auth/utils/socialAuth";
import { logger } from "@/lib/logger";

const RESEND_COOLDOWN_SECONDS = 30;

const VERIFICATION_CODE_LENGTH = 6;

const RESET_STRATEGY = "reset_password_email_code";

const SECONDARY_BUTTON_CLASS =
  "inline-flex min-h-11 items-center rounded-control px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none";

interface ClerkPasswordResetProps {
  email: string;
  onEmailChange: (email: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  onComplete: (createdSessionId: string | null) => Promise<void>;
  onNeedsSecondFactor: (supportedSecondFactors: unknown[] | null) => Promise<void>;
  onCancel: () => void;
}

export function ClerkPasswordReset({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onComplete,
  onNeedsSecondFactor,
  onCancel,
}: ClerkPasswordResetProps) {
  const { isLoaded, signIn } = useSignIn();

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const sendCode = async () => {
    if (!isLoaded) {
      setError(AUTH_NOT_READY_MESSAGE);

      return;
    }

    setIsSending(true);
    setError(undefined);

    try {
      await signIn.create({ strategy: RESET_STRATEGY, identifier: email.trim() });
      setIsCodeSent(true);
      setCode("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (sendError) {
      logger.error("Failed to send password reset code:", sendError);
      setError(
        extractClerkError(sendError).message ??
          "We couldn't send a reset code. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSendCode = (event: React.FormEvent) => {
    event.preventDefault();
    void sendCode();
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isLoaded) {
      setError(AUTH_NOT_READY_MESSAGE);

      return;
    }

    setIsResetting(true);
    setError(undefined);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: RESET_STRATEGY,
        code,
        password,
      });

      if (result.status === "needs_second_factor") {
        await onNeedsSecondFactor(result.supportedSecondFactors);

        return;
      }

      if (result.status === "complete") {
        await onComplete(result.createdSessionId);

        return;
      }

      logger.warn("Unexpected status after password reset:", result.status);
      setError("That didn't complete the reset. Please try again.");
    } catch (resetError) {
      logger.error("Password reset failed:", resetError);
      setError(
        extractClerkError(resetError).message ??
          "We couldn't reset your password. Please try again.",
      );
    } finally {
      setIsResetting(false);
    }
  };

  const handleUseDifferentEmail = () => {
    setIsCodeSent(false);
    setCode("");
    setError(undefined);
    setResendCooldown(0);
  };

  return (
    <motion.div
      key="password-reset"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
          Reset password
        </p>
        <button type="button" onClick={onCancel} className={SECONDARY_BUTTON_CLASS}>
          Back
        </button>
      </div>

      {isCodeSent ? (
        <>
          <p className="mb-4 text-sm text-muted">
            We sent a code to {email.trim()}. Enter it with your new password.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            <TextField
              label="Reset code"
              value={code}
              onChange={(value) =>
                setCode(value.replaceAll(/\D/gu, "").slice(0, VERIFICATION_CODE_LENGTH))
              }
              required
              placeholder="123456"
              name="reset-code"
              autoComplete="one-time-code"
            />

            <TextField
              label="New password"
              value={password}
              onChange={onPasswordChange}
              type="password"
              required
              placeholder="••••••••"
              name="new-password"
              autoComplete="new-password"
            />

            {error ? (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              fullWidth
              isLoading={isResetting}
              loadingText="Resetting..."
            >
              Reset password
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-1 text-center">
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={isSending || resendCooldown > 0}
              className="inline-flex min-h-11 items-center rounded-control px-3 py-2 text-sm text-primary transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none disabled:text-muted disabled:hover:no-underline"
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : isSending
                  ? "Sending..."
                  : "Resend code"}
            </button>
            <button
              type="button"
              onClick={handleUseDifferentEmail}
              className={SECONDARY_BUTTON_CLASS}
            >
              Use a different email
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            Enter your account email and we&apos;ll send you a code to set a new
            password.
          </p>

          <form onSubmit={handleSendCode} className="space-y-4">
            <TextField
              label="Email"
              value={email}
              onChange={onEmailChange}
              type="email"
              required
              placeholder="your@email.com"
              name="email"
              autoComplete="username"
            />

            {error ? (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              fullWidth
              isLoading={isSending}
              loadingText="Sending..."
            >
              Send reset code
            </Button>
          </form>
        </>
      )}
    </motion.div>
  );
}
