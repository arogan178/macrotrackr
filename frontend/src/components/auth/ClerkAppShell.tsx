import { type ReactNode } from "react";
import { ClerkProvider } from "@clerk/react";

import { clerkAppearance } from "@/lib/clerkAppearance";
import { navigateWithRouter } from "@/lib/clerkNavigation";

import { ClerkTokenSync } from "./ClerkTokenSync";

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
      {children}
    </ClerkProvider>
  );
}
