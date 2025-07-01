import React from "react";
import {
  createPortalSession,
  createCheckoutSession,
} from "@/utils/api-billing";
import { CardContainer } from "@/components/form";
import { useStore } from "@/store/store";

/**
 * BillingForm - Pro users manage subscription
 */
const BillingForm: React.FC = () => {
  const subscriptionStatus = useStore((state) => state.subscriptionStatus);

  const handleManage = async () => {
    try {
      const returnUrl = window.location.origin + "/settings";
      const { url } = await createPortalSession(returnUrl);
      window.location.href = url;
    } catch (e) {
      alert("Failed to open billing portal. Please try again.");
    }
  };

  const handleUpgrade = async () => {
    try {
      const successUrl = window.location.origin + "/settings";
      const cancelUrl = window.location.origin + "/settings";
      const { url } = await createCheckoutSession(successUrl, cancelUrl);
      window.location.href = url;
    } catch (e) {
      alert("Failed to start checkout. Please try again.");
    }
  };

  return (
    <CardContainer className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-200">
              Manage Subscription
            </h3>
            <div
              className={
                subscriptionStatus === "pro"
                  ? "px-3 py-1 bg-yellow-400/20 border border-yellow-400/30 rounded-full"
                  : "px-3 py-1 bg-gray-400/20 border border-gray-400/30 rounded-full"
              }
            >
              <span
                className={
                  subscriptionStatus === "pro"
                    ? "text-sm text-yellow-400"
                    : "text-sm text-gray-300"
                }
              >
                {subscriptionStatus === "pro" ? "Pro" : "Free"}
              </span>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            {subscriptionStatus === "pro"
              ? "Manage your subscription, payment methods, or cancel anytime."
              : "Upgrade to Pro to manage your subscription and access advanced features."}
          </p>
          {subscriptionStatus === "pro" ? (
            <button
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded text-lg shadow focus:outline-none focus:ring-2 focus:ring-yellow-300 w-full"
              onClick={handleManage}
            >
              Manage Subscription
            </button>
          ) : (
            <button
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded text-lg shadow focus:outline-none focus:ring-2 focus:ring-yellow-300 w-full"
              onClick={handleUpgrade}
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
    </CardContainer>
  );
};

export default BillingForm;
// Usage: Render <BillingForm /> in settings tabs
