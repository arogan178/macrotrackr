import Button from "@/components/ui/Button";
import { AppleIcon, FacebookIcon, GoogleIcon } from "@/components/ui/Icons";

export type SocialAuthStrategy =
  | "oauth_google"
  | "oauth_facebook"
  | "oauth_apple";

interface SocialAuthOptionsProps {
  onProviderSelect: (strategy: SocialAuthStrategy) => void;
  onContinueWithEmail: () => void;
}

interface SocialAuthProviderConfig {
  strategy: SocialAuthStrategy;
  label: "Google" | "Facebook" | "Apple";
  Icon: typeof GoogleIcon;
  enabled: boolean;
}

function parseFeatureFlag(value: string | undefined): boolean {
  if (value === undefined) {
    return true;
  }

  return value === "true";
}

const SOCIAL_AUTH_PROVIDERS: SocialAuthProviderConfig[] = [
  {
    strategy: "oauth_google" as const,
    label: "Google",
    Icon: GoogleIcon,
    enabled: parseFeatureFlag(import.meta.env.VITE_SOCIAL_GOOGLE_ENABLED),
  },
  {
    strategy: "oauth_facebook" as const,
    label: "Facebook",
    Icon: FacebookIcon,
    enabled: parseFeatureFlag(import.meta.env.VITE_SOCIAL_FACEBOOK_ENABLED),
  },
  {
    strategy: "oauth_apple" as const,
    label: "Apple",
    Icon: AppleIcon,
    enabled: parseFeatureFlag(import.meta.env.VITE_SOCIAL_APPLE_ENABLED),
  },
];

export function SocialAuthOptions({
  onProviderSelect,
  onContinueWithEmail,
}: SocialAuthOptionsProps) {
  return (
    <>
      <div className="space-y-3">
        {SOCIAL_AUTH_PROVIDERS.map(({ strategy, label, Icon, enabled }) => {
          const buttonLabel =
            enabled ? `Continue with ${label}` : `${label} temporarily unavailable`;

          return (
            <Button
              key={strategy}
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                if (enabled) {
                  onProviderSelect(strategy);
                }
              }}
              leftIcon={<Icon className="h-5 w-5" />}
              disabled={!enabled}
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
