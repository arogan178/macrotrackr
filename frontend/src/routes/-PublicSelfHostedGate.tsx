import React from "react";
import { Navigate } from "@tanstack/react-router";

import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";
import { isLocalAuthMode } from "@/config/runtime";
import { useAppAuthState } from "@/hooks/auth/useAuthState";

interface PublicSelfHostedGateProps {
  children: React.ReactNode;
}

export function PublicSelfHostedGate({
  children,
}: PublicSelfHostedGateProps) {
  const { isLoaded, isSignedIn } = useAppAuthState();

  if (!isLocalAuthMode) {
    return children;
  }

  if (!isLoaded) {
    return <AuthLoadingScreen />;
  }

  if (isSignedIn) {
    return <Navigate to="/home" search={{ limit: 20, offset: 0 }} />;
  }

  return <Navigate to="/login" search={{ returnTo: undefined }} />;
}
