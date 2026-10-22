import React from "react";
import { Navigate } from "@tanstack/react-router";

import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { isLocalAuthMode } from "@/config/runtime";
import { useAppAuthState } from "@/hooks/auth/useAuthState";
import { isNativePlatform } from "@/services/native/platform";

interface PublicSelfHostedGateProps {
  children: React.ReactNode;
  /**
   * Also gate inside the native app. Set on `/` only: an installed app opened
   * on the marketing page, signed out, with "Start free" and a calculator link.
   * Pricing and the legal pages still have to open in the app.
   */
  gateInApp?: boolean;
}

export function PublicSelfHostedGate({
  children,
  gateInApp = false,
}: PublicSelfHostedGateProps) {
  const { isLoaded, isSignedIn } = useAppAuthState();

  if (!isLocalAuthMode && !(gateInApp && isNativePlatform())) {
    return children;
  }

  if (!isLoaded) {
    return <AuthLoadingScreen />;
  }

  if (isSignedIn) {
    return <Navigate to="/home" search={{ limit: 20, offset: 0 }} replace />;
  }

  return <Navigate to="/login" search={{ returnTo: undefined }} replace />;
}
