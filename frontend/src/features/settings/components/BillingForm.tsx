import React, { useCallback, useEffect, useState } from "react";

import { CardContainer } from "@/components/form";
import { AwardIcon } from "@/components/ui";
import { useStore } from "@/store/store";
import { createPortalSession } from "@/utils/apiBilling";

import FreeBillingView from "./FreeBillingView";
import parseBillingError from "./parseBillingError";
import ProBillingView from "./ProBillingView";

function handleUpgradeRedirect() {
  globalThis.location.href = "/pricing";
}

const BillingForm: React.FC = () => {
  const { subscriptionStatus, showNotification } = useStore();
  const [isLoading, setIsLoading] = useState(false);

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

  // Enhanced error handling with user-friendly messages
  const handleBillingError = useCallback(
    (error: unknown, operation: string) => {
      const billingError = parseBillingError(error);

      const contextualMessage =
        operation === "upgrade"
          ? `Upgrade failed: ${billingError.message}`
          : `Billing portal unavailable: ${billingError.message}`;

      showNotification(contextualMessage, "error", {
        duration: billingError.retryable ? 10_000 : 6000,
        context: `billing_error_${operation}`,
      });

      setIsLoading(false);
    },
    [showNotification],
  );

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
      handleBillingError(error, "portal");
    }
  }, [subscriptionStatus, handleBillingError, showNotification]);

  const isPro = subscriptionStatus === "pro";

  return (
    <>
      <CardContainer className="p-6 sm:p-8">
        {/* Enhanced responsive header with improved mobile layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 rounded-xl mr-4">
              <AwardIcon className="w-7 h-7 text-yellow-400 flex-shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-gray-100 truncate">
                Subscription Plan
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {isPro
                  ? "Pro features active • Full access"
                  : "Basic plan • Upgrade available"}
              </p>
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 self-start sm:self-auto ${
              isPro
                ? "bg-gradient-to-r from-yellow-400/25 to-yellow-500/25 border border-yellow-400/40 text-yellow-300 shadow-lg"
                : "bg-gradient-to-r from-gray-600/25 to-gray-700/25 border border-gray-500/40 text-gray-300"
            }`}
            role="status"
            aria-label={`Current plan: ${isPro ? "Pro" : "Free"}`}
          >
            {isPro ? "✨ Pro Plan" : "Free Plan"}
          </div>
        </div>

        {/* Conditional rendering based on subscription status */}
        {isPro ? (
          <ProBillingView onManage={handleManage} isLoading={isLoading} />
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
