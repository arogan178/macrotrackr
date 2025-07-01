import React, { useState, useEffect, useCallback } from "react";
import {
  createPortalSession,
  createCheckoutSession,
} from "@/utils/api-billing";
import { CardContainer, FormButton } from "@/components/form";
import { useStore } from "@/store/store";
import {
  AwardIcon,
  StarIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  InfoIcon,
  WarningIcon,
} from "@/components/Icons";
import { PricingTable } from "@/components/PricingTable";
import Modal from "@/components/Modal";

// Enhanced error handling types
interface BillingError {
  type: "network" | "stripe" | "auth" | "validation" | "unknown";
  message: string;
  retryable: boolean;
}

// Helper function to parse billing errors
const parseBillingError = (error: unknown): BillingError => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return {
        type: "network",
        message:
          "Network connection issue. Please check your internet connection.",
        retryable: true,
      };
    }

    if (message.includes("stripe") || message.includes("payment")) {
      return {
        type: "stripe",
        message: "Payment service temporarily unavailable. Please try again.",
        retryable: true,
      };
    }

    if (message.includes("auth") || message.includes("unauthorized")) {
      return {
        type: "auth",
        message: "Authentication required. Please refresh and try again.",
        retryable: false,
      };
    }

    return {
      type: "unknown",
      message: error.message || "An unexpected error occurred.",
      retryable: true,
    };
  }

  return {
    type: "unknown",
    message: "An unexpected error occurred. Please try again.",
    retryable: true,
  };
};

// Enhanced Pro billing view with confirmation dialog
const ProBillingView: React.FC<{
  onManage: () => void;
  isLoading: boolean;
}> = ({ onManage, isLoading }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleManageClick = () => {
    setShowConfirmation(true);
  };

  const confirmAndProceed = () => {
    setShowConfirmation(false);
    onManage();
  };

  return (
    <>
      <div className="relative bg-gradient-to-br from-green-900/25 via-green-800/20 to-emerald-900/25 p-6 rounded-xl border border-green-500/40 mb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-xl transform translate-x-16 -translate-y-16"></div>
        <div className="relative">
          <div className="flex items-center mb-3">
            <div className="p-1.5 bg-green-400/20 rounded-lg mr-3">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <span className="text-green-300 font-semibold text-lg">
                Pro Plan Active
              </span>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-green-200 text-xs uppercase tracking-wide">
                  Premium Member
                </span>
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            Enjoy unlimited access to all premium features. Manage your
            subscription, view invoices, or update payment methods below.
          </p>
        </div>
      </div>

      <FormButton
        onClick={handleManageClick}
        isLoading={isLoading}
        loadingText="Redirecting to Billing Portal..."
        fullWidth
        variant="primary"
        className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
        icon={<ExternalLinkIcon className="w-4 h-4" />}
        ariaLabel="Manage your Pro subscription"
      >
        Manage Subscription
      </FormButton>

      <div className="mt-6 p-4 bg-gradient-to-r from-gray-800/40 to-gray-700/40 rounded-lg border border-gray-600/30 backdrop-blur-sm">
        <p className="text-xs text-gray-300 flex items-center">
          <div className="p-1 bg-blue-500/20 rounded mr-2">
            <InfoIcon className="w-3 h-3 text-blue-400" />
          </div>
          <span>
            <span className="font-medium">Securely managed by Stripe.</span>{" "}
            Cancel anytime with no hidden fees.
          </span>
        </p>
      </div>

      {/* Enhanced Confirmation Modal */}
      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Manage Subscription"
        size="md"
        variant="form"
        hideDefaultButtons
      >
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <InfoIcon className="w-6 h-6 text-blue-400 flex-shrink-0" />
            </div>
            <div>
              <h4 className="text-gray-100 font-medium mb-2">
                Stripe Billing Portal
              </h4>
              <p className="text-gray-300 text-sm mb-3">
                You'll be redirected to Stripe's secure billing portal where you
                can:
              </p>
              <ul className="text-gray-300 text-sm space-y-2">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                  Update your payment method
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                  Download invoices and receipts
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                  Change your billing address
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></div>
                  Cancel your subscription
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-900/25 to-orange-900/25 border border-amber-500/30 p-4 rounded-lg">
            <p className="text-amber-200 text-sm flex items-center">
              <div className="p-1 bg-amber-500/20 rounded mr-2">
                <WarningIcon className="w-3 h-3 text-amber-400" />
              </div>
              This will open in a new tab. Your current session will remain
              active.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <FormButton
              onClick={() => setShowConfirmation(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </FormButton>
            <FormButton
              onClick={confirmAndProceed}
              variant="primary"
              className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
              icon={<ExternalLinkIcon className="w-4 h-4" />}
            >
              Continue to Portal
            </FormButton>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Enhanced Free billing view with improved features list
const FreeBillingView: React.FC<{
  onUpgrade: () => void;
  onCompare: () => void;
  isLoading: boolean;
  onRetry?: () => void;
  hasError?: boolean;
  isDisabled?: boolean;
}> = ({
  onUpgrade,
  onCompare,
  isLoading,
  onRetry,
  hasError = false,
  isDisabled = false,
}) => (
  <div className="space-y-6">
    <div className="relative bg-gradient-to-br from-gray-800/60 via-gray-800/40 to-gray-900/60 p-6 rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 rounded-full blur-xl transform translate-x-12 -translate-y-12"></div>
      <div className="relative">
        <h4 className="font-semibold text-gray-100 mb-4 flex items-center text-lg">
          <div className="p-2 bg-yellow-400/20 rounded-lg mr-3">
            <StarIcon className="w-5 h-5 text-yellow-400" />
          </div>
          Unlock Pro Features
        </h4>
        <div className="grid gap-3">
          {[
            {
              feature: "Advanced Reporting & Analytics",
              icon: "📊",
              desc: "Detailed insights and trends",
            },
            {
              feature: "Advanced Goal Setting",
              icon: "🎯",
              desc: "Custom targets and milestones",
            },
            {
              feature: "Unlimited Habit Tracking",
              icon: "✅",
              desc: "Track as many habits as you want",
            },
            {
              feature: "Recipe & Meal Saver",
              icon: "🍽️",
              desc: "Save and reuse favorite meals",
            },
            {
              feature: "Custom Meal Types",
              icon: "🔧",
              desc: "Create personalized meal categories",
            },
            {
              feature: "Data Export (CSV)",
              icon: "📤",
              desc: "Download your data anytime",
            },
            {
              feature: "Priority Support",
              icon: "💬",
              desc: "Fast response from our team",
            },
          ].map(({ feature, icon, desc }) => (
            <div
              key={feature}
              className="flex items-center p-3 rounded-lg bg-gray-800/30 border border-gray-700/30 hover:border-gray-600/50 transition-colors"
            >
              <div className="p-1.5 bg-green-400/20 rounded-lg mr-3">
                <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
              </div>
              <span className="text-lg mr-3">{icon}</span>
              <div className="flex-1">
                <div className="text-gray-200 font-medium text-sm">
                  {feature}
                </div>
                <div className="text-gray-400 text-xs">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {hasError && (
      <div className="bg-gradient-to-r from-red-900/25 to-red-800/25 border border-red-500/40 p-4 rounded-lg">
        <div className="flex items-center text-red-300 text-sm mb-3">
          <div className="p-1 bg-red-500/20 rounded mr-2">
            <WarningIcon className="w-4 h-4 text-red-400" />
          </div>
          <span className="font-medium">Upgrade temporarily unavailable</span>
        </div>
        <div className="flex gap-2">
          <FormButton
            onClick={onRetry}
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            Try Again
          </FormButton>
          <FormButton
            onClick={onCompare}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            View Details
          </FormButton>
        </div>
      </div>
    )}

    <div className="space-y-4">
      <FormButton
        onClick={onUpgrade}
        isLoading={isLoading}
        loadingText="Redirecting to Checkout..."
        fullWidth
        variant="primary"
        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold text-lg py-4 shadow-lg hover:shadow-xl transition-all duration-200"
        icon={<StarIcon className="w-5 h-5" />}
        ariaLabel="Upgrade to Pro plan for $5/month"
        disabled={hasError || isDisabled}
      >
        Upgrade to Pro - $5/month
      </FormButton>

      <button
        onClick={onCompare}
        className="w-full text-center text-sm text-gray-400 hover:text-yellow-300 transition-colors py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded font-medium"
        aria-label="Compare Free and Pro plan features"
      >
        ✨ Compare Plans & See All Benefits
      </button>
    </div>
  </div>
);

/**
 * BillingForm - Enhanced subscription management component
 *
 * Features:
 * - Smart error handling with retry mechanisms
 * - Success notifications for upgrade completion
 * - Improved accessibility and loading states
 * - Mobile-responsive design
 * - Graceful degradation for network issues
 */
const BillingForm: React.FC = () => {
  const { subscriptionStatus, showNotification } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [lastError, setLastError] = useState<BillingError | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Network status monitoring for graceful degradation (minimal, just update isOnline)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check for successful upgrade on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("upgraded") === "true") {
      showNotification(
        "Welcome to Pro! Your subscription is now active.",
        "success",
        { duration: 8000, context: "billing_success" }
      );

      // Clean up URL parameters
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  }, [showNotification]);

  // Enhanced error handling with user-friendly messages
  const handleBillingError = useCallback(
    (error: unknown, operation: string) => {
      const billingError = parseBillingError(error);
      setLastError(billingError);

      const contextualMessage =
        operation === "upgrade"
          ? `Upgrade failed: ${billingError.message}`
          : `Billing portal unavailable: ${billingError.message}`;

      showNotification(contextualMessage, "error", {
        duration: billingError.retryable ? 10000 : 6000,
        context: `billing_error_${operation}`,
      });

      setIsLoading(false);
    },
    [showNotification]
  );

  // Enhanced portal management with retry logic and validation
  const handleManage = useCallback(async () => {
    // Basic validation before proceeding
    if (!isOnline) {
      showNotification(
        "Internet connection required to access billing portal.",
        "warning"
      );
      return;
    }

    if (subscriptionStatus !== "pro") {
      showNotification(
        "Pro subscription required to access billing portal.",
        "info"
      );
      return;
    }

    setIsLoading(true);
    setLastError(null);

    try {
      const returnUrl = window.location.origin + "/settings";
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

      window.location.href = url;
    } catch (error) {
      handleBillingError(error, "portal");
    }
  }, [isOnline, subscriptionStatus, handleBillingError, showNotification]);

  // Enhanced upgrade flow with better success handling and validation
  const handleUpgrade = useCallback(async () => {
    // Basic validation before proceeding
    if (!isOnline) {
      showNotification("Internet connection required for upgrade.", "warning");
      return;
    }

    if (subscriptionStatus === "pro") {
      showNotification("You already have an active Pro subscription.", "info");
      return;
    }

    setIsLoading(true);
    setLastError(null);

    try {
      const successUrl = window.location.origin + "/settings?upgraded=true";
      const cancelUrl = window.location.origin + "/settings";
      const { url } = await createCheckoutSession(successUrl, cancelUrl);

      // Validation for successful URL generation
      if (!url || !url.startsWith("https://")) {
        throw new Error("Invalid checkout URL received from server");
      }

      // Success notification before redirect
      showNotification("Redirecting to secure checkout...", "info", {
        duration: 2000,
        context: "billing_redirect",
      });

      window.location.href = url;
    } catch (error) {
      handleBillingError(error, "upgrade");
    }
  }, [isOnline, subscriptionStatus, handleBillingError, showNotification]);

  // Simple retry for upgrade (no exponential backoff)
  const handleRetry = useCallback(() => {
    setLastError(null);
    handleUpgrade();
  }, [handleUpgrade]);

  const isPro = subscriptionStatus === "pro";
  const hasError = lastError !== null;

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
            onUpgrade={handleUpgrade}
            onCompare={() => setIsPricingModalOpen(true)}
            onRetry={handleRetry}
            isLoading={isLoading}
            hasError={hasError}
            isDisabled={!isOnline}
          />
        )}
      </CardContainer>

      {/* Enhanced responsive pricing modal */}
      <Modal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        title="✨ Compare Plans"
        size="2xl"
        variant="form"
        hideDefaultButtons
      >
        <div className="max-h-[75vh] overflow-y-auto">
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg border border-blue-500/30">
            <p className="text-blue-200 text-sm flex items-center">
              <div className="p-1 bg-blue-500/20 rounded mr-2">
                <InfoIcon className="w-3 h-3 text-blue-400" />
              </div>
              Compare features and choose the plan that's right for you
            </p>
          </div>
          <PricingTable onUpgrade={handleUpgrade} />
        </div>
      </Modal>
    </>
  );
};

export default BillingForm;
