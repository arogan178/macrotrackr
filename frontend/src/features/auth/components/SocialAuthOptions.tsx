import type React from "react";

import Button from "@/components/ui/Button";
import { AppleIcon, GoogleIcon } from "@/components/ui/Icons";

export type SocialAuthStrategy = "oauth_google" | "oauth_apple";

interface SocialAuthOptionsProps {
  onProviderSelect: (strategy: SocialAuthStrategy) => void;
  onContinueWithEmail: () => void;
  loadingStrategy?: SocialAuthStrategy | null;
}

interface SocialAuthProviderConfig {
  strategy: SocialAuthStrategy;
  label: string;
  Icon: React.FC<{ className?: string }>;
  enabled: boolean;
}

function parseFeatureFlag(value: string | undefined): boolean {
  if (value === undefined || value.trim() === "") {
    return true;
  }

  return value.toLowerCase() === "true";
}

const SOCIAL_AUTH_PROVIDERS: SocialAuthProviderConfig[] = [
  {
    strategy: "oauth_google" as const,
    label: "Google",
    Icon: GoogleIcon,
    enabled: parseFeatureFlag(import.meta.env.VITE_SOCIAL_GOOGLE_ENABLED),
  },
  {
    strategy: "oauth_apple" as const,
    label: "Apple",
    Icon: AppleIcon,
    // Temporarily disabled / hidden
    enabled: false,
  },
].filter((provider) => provider.enabled);

export function SocialAuthOptions({
  onProviderSelect,
  onContinueWithEmail,
  loadingStrategy,
}: SocialAuthOptionsProps) {
  return (
    <>
      <div className="space-y-3">
        {SOCIAL_AUTH_PROVIDERS.map(({ strategy, label, Icon, enabled }) => {
          const isLoading = loadingStrategy === strategy;
          const buttonLabel = isLoading
            ? `Connecting to ${label}...`
            : enabled
              ? `Continue with ${label}`
              : `${label} temporarily unavailable`;

          return (
            <Button
              key={strategy}
              type="button"
              variant="secondary"
              fullWidth
              isLoading={isLoading}
              loadingText={`Connecting to ${label}...`}
              onClick={() => {
                if (enabled && !loadingStrategy) {
                  onProviderSelect(strategy);
                }
              }}
              leftIcon={<Icon className="h-5 w-5" />}
              disabled={!enabled || Boolean(loadingStrategy)}
            >
              {buttonLabel}
            </Button>
          );
        })}
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
        onClick={onContinueWithEmail}
      >
        Continue with email
      </Button>
    </>
  );
}
