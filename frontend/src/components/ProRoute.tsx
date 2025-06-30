import React from "react";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Navigate } from "react-router-dom";

/**
 * ProRoute - Protects Pro-only pages/routes
 * Usage: <ProRoute><ProOnlyComponent /></ProRoute>
 */
export const ProRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { subscriptionStatus } = useSubscriptionStatus();
  if (subscriptionStatus !== "pro") {
    return <Navigate to="/pricing" replace />;
  }
  return <>{children}</>;
};

// Usage example:
// <ProRoute><BillingPage /></ProRoute>
