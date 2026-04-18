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

const SOCIAL_AUTH_PROVIDERS = [
  {
    strategy: "oauth_google" as const,
    label: "Google",
    Icon: GoogleIcon,
  },
  {
    strategy: "oauth_facebook" as const,
    label: "Facebook",
    Icon: FacebookIcon,
  },
  {
    strategy: "oauth_apple" as const,
    label: "Apple",
    Icon: AppleIcon,
  },
];

export function SocialAuthOptions({
  onProviderSelect,
  onContinueWithEmail,
}: SocialAuthOptionsProps) {
  return (
    <>
      <div className="space-y-3">
        {SOCIAL_AUTH_PROVIDERS.map(({ strategy, label, Icon }) => (
          <Button
            key={strategy}
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => onProviderSelect(strategy)}
            leftIcon={<Icon className="h-5 w-5" />}
          >
            Continue with {label}
          </Button>
        ))}
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
