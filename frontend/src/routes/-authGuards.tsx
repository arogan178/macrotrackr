import React from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "@tanstack/react-router";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { hasStatus } from "@/lib/queryClient";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" search={{ returnTo: undefined }} />;
  }

  return <>{children}</>;
}

export function RequireUnauth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/auth-ready" search={{ redirectTo: "/home" }} />;
  }

  return <>{children}</>;
}

export function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export async function safeFetch<T>(
  fetchFunction: () => Promise<T>,
  defaultValue: T,
): Promise<T> {
  try {
    return await fetchFunction();
  } catch (error) {
    if (error instanceof Error && hasStatus(error) && error.status === 401) {
      return defaultValue;
    }
    throw error;
  }
}
