import React from "react";
import { Navigate } from "@tanstack/react-router";

import { isLocalAuthMode } from "@/config/runtime";
import { useAppAuthState } from "@/hooks/auth/useAuthState";
import { LoadingFallback } from "@/routes/-authGuards";

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
    return <LoadingFallback />;
  }

  if (isSignedIn) {
    return <Navigate to="/home" search={{ limit: 20, offset: 0 }} />;
  }

  return <Navigate to="/login" search={{ returnTo: undefined }} />;
}
