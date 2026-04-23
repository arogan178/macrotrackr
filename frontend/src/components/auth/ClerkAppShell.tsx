import { type ReactNode } from "react";
import { ClerkProvider } from "@clerk/clerk-react";

import { clerkAppearance } from "@/lib/clerkAppearance";

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
      appearance={clerkAppearance}
    >
      <ClerkTokenSync />
      {children}
    </ClerkProvider>
  );
}
