import { type ReactNode } from "react";
import { ClerkProvider } from "@clerk/react";

import { useRecoverPlayPurchases } from "@/features/billing/hooks/useRecoverPlayPurchases";
import { clerkAppearance } from "@/lib/clerkAppearance";
import { navigateWithRouter } from "@/lib/clerkNavigation";

import { ClerkTokenSync } from "./ClerkTokenSync";

/**
 * Has to sit inside ClerkProvider to read auth state, and renders nothing.
 */
function PlayPurchaseRecovery() {
  useRecoverPlayPurchases();

  return null;
}

interface ClerkAppShellProps {
  publishableKey: string;
  children: ReactNode;
}

export function ClerkAppShell({ publishableKey, children }: ClerkAppShellProps) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/home"
      signUpFallbackRedirectUrl="/home"
      routerPush={(to) => navigateWithRouter(to, false)}
      routerReplace={(to) => navigateWithRouter(to, true)}
      appearance={clerkAppearance}
    >
      <ClerkTokenSync />
      <PlayPurchaseRecovery />
      {children}
    </ClerkProvider>
  );
}
