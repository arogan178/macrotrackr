import { useMemo } from "react";
import { motion } from "motion/react";

import TextField from "@/components/form/TextField";
import Button from "@/components/ui/Button";
import {
  describeAlternativeStrategy,
  describeSecondFactor,
  isNumericCode,
  type SecondFactorOption,
} from "@/features/auth/utils/secondFactor";

interface SecondFactorChallengeProps {
  /** The factor currently being challenged. */
  option: SecondFactorOption;
  /** Every factor Clerk offered, so the user can switch method. */
  options: readonly SecondFactorOption[];
  /**
   * True when this came from `needs_client_trust` rather than `needs_second_factor`,
   * which only changes the wording — the API calls are identical.
   */
  isDeviceTrust: boolean;
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onSelectStrategy: (option: SecondFactorOption) => void;
  onCancel: () => void;
  isVerifying: boolean;
  isResending: boolean;
  error?: string;
}

export function SecondFactorChallenge({
  option,
  options,
  isDeviceTrust,
  code,
  onCodeChange,
  onSubmit,
  onResend,
  onSelectStrategy,
  onCancel,
  isVerifying,
  isResending,
  error,
}: SecondFactorChallengeProps) {
  const copy = useMemo(
    () => describeSecondFactor(option, isDeviceTrust),
    [option, isDeviceTrust],
  );

  const alternatives = useMemo(
    () => options.filter((candidate) => candidate.strategy !== option.strategy),
    [options, option.strategy],
  );

  const numeric = isNumericCode(option.strategy);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <motion.div
      key="second-factor"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
          {copy.title}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          Back
        </button>
      </div>

      <p className="mb-4 text-sm text-muted">{copy.description}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label={copy.inputLabel}
          value={code}
          onChange={onCodeChange}
          required
          placeholder={numeric ? "123456" : "xxxxx-xxxxx"}
          name="second-factor-code"
          autoComplete="one-time-code"
        />

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          disabled={isVerifying || code.trim().length === 0}
        >
          {isVerifying ? "Verifying..." : "Verify"}
        </Button>
      </form>

      {copy.resendLabel ? (
        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className="mt-4 inline-flex min-h-11 items-center rounded-md px-1 py-2 text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none disabled:opacity-60"
        >
          {isResending ? "Sending..." : copy.resendLabel}
        </button>
      ) : null}

      {alternatives.length > 0 ? (
        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-muted uppercase">
            Try another way
          </p>
          <div className="flex flex-col items-start gap-1">
            {alternatives.map((alternative) => (
              <button
                key={alternative.strategy}
                type="button"
                onClick={() => onSelectStrategy(alternative)}
                disabled={isVerifying || isResending}
                className="inline-flex min-h-11 items-center rounded-md px-1 py-2 text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none disabled:opacity-60"
              >
                {describeAlternativeStrategy(alternative.strategy)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
