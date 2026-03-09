import React, { useCallback, useEffect, useState } from "react";

import { CardContainer } from "@/components/form";
import { AwardIcon } from "@/components/ui";
import { useFeatureLoading, useMutationErrorHandler } from "@/hooks";
import { useBillingDetails } from "@/hooks/queries/useBilling";
import { cn } from "@/lib/classnameUtilities";
import { useStore } from "@/store/store";
import { createPortalSession } from "@/utils/apiBilling";

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
      const { url } = await createPortalSession(returnUrl);

      // Validation for successful URL generation
      if (!url || !url.startsWith("https://")) {
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

  const isPro = subscriptionStatus === "pro";

  return (
    <>
      <CardContainer className="p-6 sm:p-8">
        {/* Enhanced responsive header with improved mobile layout */}
        <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center">
            <div className="mr-4 rounded-xl bg-warning/10 p-3">
              <AwardIcon className="h-7 w-7 shrink-0 text-warning" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-semibold text-foreground">
                Subscription Plan
              </h3>
              <p className="mt-1 text-sm text-muted">
                {isPro
                  ? "Pro features active • Full access"
                  : "Basic plan • Upgrade available"}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "self-start rounded-full border px-4 py-2 text-sm font-semibold sm:self-auto",
              isPro
                ? "border-warning/30 bg-warning/10 text-warning"
                : "border-border bg-surface-2 text-muted"
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
    </>
  );
};

export default BillingForm;
