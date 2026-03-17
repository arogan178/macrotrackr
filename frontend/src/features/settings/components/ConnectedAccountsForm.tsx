import { useState } from "react";
import { useReverification, useUser } from "@clerk/clerk-react";

import { CardContainer } from "@/components/form";
import Button from "@/components/ui/Button";
import {
  AppleIcon,
  CloseIcon,
  EmailIcon,
  FacebookIcon,
  GoogleIcon,
  ShieldCheckIcon,
} from "@/components/ui/Icons";
import Modal from "@/components/ui/Modal";
import {
  encodeAuthRedirect,
  normalizeAuthRedirect,
} from "@/features/auth/utils/redirect";
import { logger } from "@/lib/logger";
import { useStore } from "@/store/store";

// Provider configuration
const PROVIDERS = {
  google: {
    name: "Google",
    icon: GoogleIcon,
    strategy: "oauth_google" as const,
    color: "text-[#4285F4]",
    bgColor: "bg-[#4285F4]/10",
  },
  facebook: {
    name: "Facebook",
    icon: FacebookIcon,
    strategy: "oauth_facebook" as const,
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10",
  },
  apple: {
    name: "Apple",
    icon: AppleIcon,
    strategy: "oauth_apple" as const,
    color: "text-foreground",
    bgColor: "bg-foreground/10",
  },
} as const;

type ProviderKey = keyof typeof PROVIDERS;

interface ModalState {
  isOpen: boolean;
  type: "disconnect" | "warning";
  provider: ProviderKey | null;
  email: string;
}

const ConnectedAccountsForm = () => {
  const { user, isLoaded } = useUser();
  const { showNotification } = useStore();
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "warning",
    provider: null,
    email: "",
  });
  const [isConnecting, setIsConnecting] = useState<ProviderKey | null>(null);
  const [_isDisconnecting, setIsDisconnecting] = useState(false);

  // Wrap both operations with reverification
  const createExternalAccount = useReverification(
    (parameters: { strategy: any; redirectUrl: string }) =>
      user?.createExternalAccount(parameters),
  );

  const destroyExternalAccount = useReverification(
    (account: { destroy: () => Promise<void> }) => account.destroy(),
  );

  // Get connected external accounts
  const externalAccounts = user?.externalAccounts ?? [];
  const connectedProviders = new Set(
    externalAccounts.map((account) => account.provider as ProviderKey),
  );

  // Check if user has password authentication
  const hasPassword = user?.passwordEnabled ?? false;

  // Check if disconnecting would leave user with no auth method
  const wouldBeLastAuthMethod = (_provider: ProviderKey): boolean => {
    if (hasPassword) return false;

    return externalAccounts.length === 1;
  };

  // Handle connect - useReverification handles password prompt, then we redirect to OAuth
  const handleConnect = async (providerKey: ProviderKey) => {
    if (!user) return;

    const provider = PROVIDERS[providerKey];
    setIsConnecting(providerKey);

    try {
      // createExternalAccount with useReverification will:
      // 1. Show password verification modal if needed
      // 2. Return the external account with verification URL
      const result = await createExternalAccount({
        strategy: provider.strategy,
        redirectUrl:
          globalThis.location.origin +
          `/sso-callback?flow=signin&redirectTo=${encodeAuthRedirect(
            normalizeAuthRedirect("/settings?tab=accounts"),
          )}`,
      });

      // The result contains a verification URL that we need to redirect to
      // This is the OAuth provider's authorization URL
      if (result?.verification?.externalVerificationRedirectURL) {
        // Redirect to the OAuth provider
        globalThis.location.href =
          result.verification.externalVerificationRedirectURL.href;
      }
    } catch (error) {
      logger.error("Error connecting provider:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect provider";
      if (
        !errorMessage.includes("cancelled") &&
        !errorMessage.includes("Cancel")
      ) {
        showNotification(errorMessage, "error");
      }
      setIsConnecting(null);
    }
  };

  // Handle disconnect click
  const handleDisconnectClick = (provider: ProviderKey, email: string) => {
    const isLastMethod = wouldBeLastAuthMethod(provider);
    setModal({
      isOpen: true,
      type: isLastMethod ? "warning" : "disconnect",
      provider,
      email,
    });
  };

  // Execute disconnect after user confirms
  const handleDisconnectConfirm = async () => {
    if (!modal.provider || modal.type === "warning") {
      closeModal();

      return;
    }

    const account = externalAccounts.find(
      (accumulator) => accumulator.provider === modal.provider,
    );

    if (!account) {
      showNotification("Account not found.", "error");
      closeModal();

      return;
    }

    setIsDisconnecting(true);

    try {
      await destroyExternalAccount(account);
      showNotification(
        `${PROVIDERS[modal.provider].name} account disconnected successfully.`,
        "success",
      );
      closeModal();
    } catch (error) {
      logger.error("Error disconnecting provider:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to disconnect provider";
      if (!errorMessage.includes("cancelled")) {
        showNotification(errorMessage, "error");
      }
    } finally {
      setIsDisconnecting(false);
    }
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: "warning",
      provider: null,
      email: "",
    });
  };

  // Render connected account item
  const renderConnectedAccount = (account: {
    provider: string;
    emailAddress?: string;
  }) => {
    const providerKey = account.provider as ProviderKey;
    const provider = PROVIDERS[providerKey];
    if (!provider) return null;

    const ProviderIcon = provider.icon;
    const displayEmail = account.emailAddress ?? "Connected";

    return (
      <div
        key={account.provider}
        className="rounded-2xl border border-border/60 bg-surface-2 p-5 transition-colors duration-200 hover:border-white/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${provider.bgColor}`}>
              <ProviderIcon className={`h-5 w-5 ${provider.color}`} />
            </div>
            <div>
              <p className="font-medium text-foreground">{provider.name}</p>
              <p className="text-sm text-muted">{displayEmail}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            buttonSize="sm"
            onClick={() =>
              handleDisconnectClick(providerKey, account.emailAddress ?? "")
            }
            className="text-muted hover:text-error"
            ariaLabel={`Disconnect ${provider.name}`}
          >
            <CloseIcon size="sm" />
          </Button>
        </div>
        <div className="mt-3 rounded-md bg-surface-3 px-3 py-2">
          <p className="text-xs text-muted">
            <span className="font-medium text-foreground">
              Sign in with {provider.name}:
            </span>{" "}
            Use <span className="font-medium text-primary">{displayEmail}</span>{" "}
            to access this account
          </p>
        </div>
      </div>
    );
  };

  // Render available provider to connect
  const renderAvailableProvider = (providerKey: ProviderKey) => {
    const provider = PROVIDERS[providerKey];
    const ProviderIcon = provider.icon;
    const isCurrentlyConnecting = isConnecting === providerKey;

    return (
      <div key={providerKey} className="space-y-2">
        <Button
          variant="secondary"
          buttonSize="md"
          fullWidth
          onClick={() => handleConnect(providerKey)}
          isLoading={isCurrentlyConnecting}
          loadingText="Connecting..."
          icon={<ProviderIcon className="h-5 w-5" />}
          iconPosition="left"
          className="justify-start"
        >
          Connect {provider.name}
        </Button>
        <p className="px-1 text-xs text-muted">
          Verify identity → Sign in with {provider.name} → Account linked
        </p>
      </div>
    );
  };

  // Get list of providers that can be connected
  const availableProviders = (Object.keys(PROVIDERS) as ProviderKey[]).filter(
    (key) => !connectedProviders.has(key),
  );

  // Get all login emails for summary
  const allLoginEmails = [
    ...(hasPassword ? [user?.primaryEmailAddress?.emailAddress] : []),
    ...externalAccounts.map((accumulator) => accumulator.emailAddress),
  ].filter(Boolean);

  if (!isLoaded) {
    return (
      <CardContainer className="p-6 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-surface-3" />
          <div className="h-16 rounded-lg bg-surface-3" />
          <div className="h-16 rounded-lg bg-surface-3" />
        </div>
      </CardContainer>
    );
  }

  return (
    <>
      <CardContainer className="p-6 sm:p-8">
        {/* Header section */}
        <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center">
            <div className="mr-4 rounded-xl bg-success/10 p-3">
              <ShieldCheckIcon className="h-7 w-7 shrink-0 text-success" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-semibold text-foreground">
                Connected Accounts
              </h3>
              <p className="mt-1 text-sm text-muted">
                Manage your sign-in methods and connected services
              </p>
            </div>
          </div>
        </div>

        {/* Login summary */}
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <EmailIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">
                Your account can be accessed with:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {allLoginEmails.map((email) => (
                  <span
                    key={email}
                    className="rounded-full border border-border bg-surface-2 px-3 py-1 text-sm font-medium text-foreground"
                  >
                    {email}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                Use any of these emails/providers to sign in. All methods link
                to the same account.
              </p>
            </div>
          </div>
        </div>

        {/* Email/Password authentication status */}
        {hasPassword && (
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
              Email & Password
            </h4>
            <div             className="rounded-2xl border border-border/60 bg-surface-2 p-5 transition-colors duration-200 hover:border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <ShieldCheckIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Email & Password
                    </p>
                    <p className="text-sm text-muted">
                      {user?.primaryEmailAddress?.emailAddress ??
                        "Password enabled"}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-success/20 px-3 py-1 text-xs font-medium text-success">
                  Active
                </span>
              </div>
              <div className="mt-3 rounded-md bg-surface-3 px-3 py-2">
                <p className="text-xs text-muted">
                  <span className="font-medium text-foreground">
                    Sign in with password:
                  </span>{" "}
                  Use{" "}
                  <span className="font-medium text-primary">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connected social accounts */}
        {externalAccounts.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
              Social Accounts
            </h4>
            <div className="space-y-3">
              {externalAccounts.map((account) =>
                renderConnectedAccount({
                  provider: account.provider,
                  emailAddress: account.emailAddress,
                }),
              )}
            </div>
          </div>
        )}

        {/* Available providers to connect */}
        {availableProviders.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">
              Connect More Accounts
            </h4>
            <div className="space-y-4">
              {availableProviders.map((providerKey) =>
                renderAvailableProvider(providerKey),
              )}
            </div>
          </div>
        )}

        {/* No accounts message */}
        {!hasPassword && externalAccounts.length === 0 && (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5">
            <p className="text-sm text-warning">
              You don&apos;t have any sign-in methods configured. Please add at
              least one method to secure your account.
            </p>
          </div>
        )}
      </CardContainer>

      {/* Disconnect Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={
          modal.type === "warning"
            ? "Cannot Disconnect"
            : `Disconnect ${modal.provider ? PROVIDERS[modal.provider].name : ""}`
        }
        variant="confirmation"
        message={
          modal.type === "warning"
            ? `This is your only sign-in method. Disconnecting ${modal.provider ? PROVIDERS[modal.provider].name : ""} will prevent you from accessing your account. Please set up another sign-in method first.`
            : `Are you sure you want to disconnect your ${modal.provider ? PROVIDERS[modal.provider].name : ""} account (${modal.email})? You'll need to verify your identity to complete this action.`
        }
        confirmLabel={modal.type === "warning" ? "Understood" : "Disconnect"}
        onConfirm={
          modal.type === "warning" ? closeModal : handleDisconnectConfirm
        }
        isDanger={modal.type !== "warning"}
        hideCancelButton={modal.type === "warning"}
      />
    </>
  );
};

export default ConnectedAccountsForm;
