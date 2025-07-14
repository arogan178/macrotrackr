import { useLoaderData } from "@tanstack/react-router";
import React, { useState } from "react";

import { FormButton } from "@/components/form";
import {
  CheckCircleIcon,
  ExternalLinkIcon,
  InfoIcon,
  Modal,
  WarningIcon,
} from "@/components/ui";
import { useStore } from "@/store/store";
import { cancelSubscription } from "@/utils/apiBilling";
import { BillingDetailsResponse } from "@/utils/apiServices";

import StatusBadge from "./StatusBadge";

const ProBillingView: React.FC<{
  onManage: () => void;
  isLoading: boolean;
  billingDetails?: BillingDetailsResponse;
}> = ({ onManage, isLoading, billingDetails }) => {
  const [show, setShow] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const { showNotification } = useStore();
  // If user is needed, get from loader: const { user } = useLoaderData({ from: '/' });

  // Extract details from billingDetails
  const price = billingDetails?.price || "";
  const paymentMethod = billingDetails?.paymentMethod;
  const renewalDate = billingDetails?.subscription?.currentPeriodEnd
    ? new Date(
        billingDetails.subscription.currentPeriodEnd,
      ).toLocaleDateString()
    : undefined;
  const status = billingDetails?.subscription?.status || "unknown";
  const isCanceled = status === "canceled";
  const isActionRequired = status === "past_due" || status === "unpaid";

  return (
    <>
      {isActionRequired && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-900/25 to-orange-900/25 border border-amber-500/30 rounded-lg">
          <p className="text-amber-200 text-sm flex items-center">
            <span className="p-1 bg-amber-500/20 rounded mr-2">
              <WarningIcon className="w-4 h-4 text-amber-400" />
            </span>
            <span>
              <span className="font-bold">Payment Issue:</span> Your
              subscription is {status}. Please update your payment method to
              restore access.
            </span>
          </p>
        </div>
      )}
      <div className="relative bg-gradient-to-br from-green-900/25 via-green-800/20 to-emerald-900/25 p-6 rounded-xl border border-green-500/40 mb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-xl transform translate-x-16 -translate-y-16"></div>
        <div className="relative">
          {/* Header with status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-1.5 bg-green-400/20 rounded-lg mr-3">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <span className="text-green-300 font-semibold text-lg">
                  Pro Plan Member
                </span>
                <div className="flex items-center mt-1"></div>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Subscription details in clean grid */}
          <div className="bg-black/20 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center sm:text-left">
                <div className="text-gray-400 text-xs mb-1">Plan & Price</div>
                <div className="text-gray-100 font-semibold">
                  {price || "-"}
                </div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-gray-400 text-xs mb-1">
                  {isCanceled ? "Expires" : "Renews"}
                </div>
                <div className="text-gray-100 font-semibold">
                  {renewalDate || "-"}
                </div>
              </div>
              <div className="text-center sm:text-left">
                <div className="text-gray-400 text-xs mb-1">Payment</div>
                <div className="text-gray-100 font-semibold">
                  {paymentMethod
                    ? `${paymentMethod.brand.toUpperCase()} •••• ${paymentMethod.last4}`
                    : "Not available"}
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed">
            {isCanceled
              ? "Your Pro access will continue until the expiration date shown above. You can reactivate your subscription at any time."
              : "Enjoy unlimited access to all premium features. Manage your subscription, view invoices, or update payment methods below."}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <FormButton
          onClick={() => setShow(true)}
          isLoading={isLoading}
          loadingText="Opening Portal..."
          fullWidth
          variant="primary"
          className={`bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 ${
            isActionRequired ? "animate-pulse" : ""
          }`}
          icon={<ExternalLinkIcon />}
          ariaLabel="Manage your Pro subscription"
        >
          {isActionRequired ? "Fix Payment Issue" : "Manage Subscription"}
        </FormButton>
        {!isCanceled && (
          <FormButton
            onClick={() => setShowCancel(true)}
            variant="danger"
            fullWidth
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0"
            ariaLabel="Cancel your Pro subscription"
          >
            Cancel Subscription
          </FormButton>
        )}
      </div>

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel Subscription"
        size="md"
        variant="form"
        hideDefaultButtons
      >
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <WarningIcon className="w-6 h-6 text-red-400 flex-shrink-0" />
            </div>
            <div>
              <h4 className="text-gray-100 font-medium mb-2">
                Are you sure you want to cancel?
              </h4>
              <p className="text-gray-300 text-sm mb-3">
                This will immediately cancel your Pro subscription. You will
                retain access until the end of your current billing period.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <FormButton
              onClick={() => setShowCancel(false)}
              variant="secondary"
              className="flex-1"
            >
              Keep Subscription
            </FormButton>
            <FormButton
              onClick={async () => {
                try {
                  const response = await cancelSubscription();
                  setShowCancel(false);
                  showNotification(
                    response?.message || "Subscription canceled.",
                    "success",
                  );
                  // Refresh user details to update UI
                  // No need to refetch user details, loader will handle updates if needed
                } catch (error) {
                  setShowCancel(false);
                  showNotification(
                    (error as Error)?.message ||
                      "Failed to cancel subscription.",
                    "error",
                  );
                }
              }}
              variant="danger"
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Confirm Cancel
            </FormButton>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={show}
        onClose={() => setShow(false)}
        title="Manage Subscription"
        size="md"
        variant="form"
        hideDefaultButtons
        hideClose={true}
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
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 inline-block"></span>
                  Update your payment method
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 inline-block"></span>
                  Download invoices and receipts
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 inline-block"></span>
                  Change your billing address
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3 inline-block"></span>
                  Cancel your subscription
                </li>
              </ul>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-900/25 to-orange-900/25 border border-amber-500/30 p-4 rounded-lg">
            <p className="text-amber-200 text-sm flex items-center">
              <span className="p-1 bg-amber-500/20 rounded mr-2">
                <WarningIcon className="w-3 h-3 text-amber-400" />
              </span>
              This will open in a new tab. Your current session will remain
              active.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <FormButton
              onClick={() => setShow(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </FormButton>
            <FormButton
              onClick={() => {
                setShow(false);
                onManage();
              }}
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

export default ProBillingView;
