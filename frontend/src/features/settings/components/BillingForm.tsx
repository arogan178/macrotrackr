import React, { useCallback, useEffect, useState } from "react";

import { billingApi } from "@/api/billing";
import CardContainer from "@/components/form/CardContainer";
import { isLocalAuthMode } from "@/config/runtime";
import { useFeatureLoading, useMutationErrorHandler } from "@/hooks";
import { useBillingDetails } from "@/hooks/queries/useBilling";
import { cn } from "@/lib/classnameUtilities";
import { useStore } from "@/store/store";

import FreeBillingView from "./FreeBillingView";
import ProBillingView from "./ProBillingView";

function handleUpgradeRedirect() {
  globalThis.location.href = "/pricing";
}

const BillingForm: React.FC = () => {
  const { subscriptionStatus, showNotification } = useStore();
  // Get billing details from TanStack Query
  const { data: billingDetails } = useBillingDetails();
  const [isLoading, setIsLoading] = useState(false);

  // Use new loading state hooks
  const { isLoading: _isBillingFeatureLoading } = useFeatureLoading("settings");
  const { handleMutationError, handleMutationSuccess: _handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) => showNotification(message, "error"),
      onSuccess: (message) => showNotification(message, "success"),
    });

  // Check for successful upgrade on component mount
  useEffect(() => {
    const urlParameters = new URLSearchParams(globalThis.location.search);
    if (urlParameters.get("upgraded") === "true") {
      showNotification(
        "Welcome to Pro! Your subscription is now active.",
        "success",
        { duration: 8000, context: "billing_success" },
      );

      // Clean up URL parameters
      const newUrl = globalThis.location.pathname + globalThis.location.hash;
      globalThis.history.replaceState({}, "", newUrl);
    }
  }, [showNotification]);

  // Enhanced portal management with retry logic and validation
  const handleManage = useCallback(async () => {
    if (subscriptionStatus !== "pro") {
      showNotification(
        "Pro subscription required to access billing portal.",
        "info",
      );

      return;
    }

    setIsLoading(true);
    try {
      const returnUrl = globalThis.location.origin + "/settings";
      const { url } = await billingApi.createPortalSession({ returnUrl });

      // Validation for successful URL generation
      if (!url?.startsWith("https://")) {
        throw new Error("Invalid billing portal URL received from server");
      }

      // Success notification before redirect
      showNotification("Redirecting to billing portal...", "info", {
        duration: 2000,
        context: "billing_redirect",
      });

      globalThis.location.href = url;
    } catch (error) {
      handleMutationError(error, "accessing billing portal");
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionStatus, showNotification, handleMutationError]);

  const isPro = isLocalAuthMode || subscriptionStatus === "pro";

  return (
    <CardContainer className="p-3.5 sm:p-6">
      {/* Current plan status bar */}
      <div className="mb-4 sm:mb-5 flex items-center justify-between border-b border-border pb-3.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Current Plan Status
        </span>
        <div
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            isPro
              ? "border-warning/30 bg-warning/10 text-warning"
              : "border-border bg-surface-2 text-muted",
          )}
          role="status"
          aria-label={`Current plan: ${isPro ? "Pro" : "Free"}`}
        >
          {isPro ? "Pro Plan" : "Free Plan"}
        </div>
      </div>

      {/* Conditional rendering based on subscription status */}
      {isPro ? (
        <ProBillingView
          onManage={handleManage}
          isLoading={isLoading}
          billingDetails={billingDetails}
        />
      ) : (
        <FreeBillingView
          onUpgrade={handleUpgradeRedirect}
          isLoading={isLoading}
        />
      )}
    </CardContainer>
  );
};

export default BillingForm;
