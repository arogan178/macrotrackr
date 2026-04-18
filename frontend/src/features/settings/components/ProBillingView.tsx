import React, { useState } from "react";

import { billingApi, type BillingDetailsResponse } from "@/api/billing";
import CardContainer from "@/components/form/CardContainer";
import {
  Button,
  ExternalLinkIcon,
  InfoIcon,
  Modal,
  WarningIcon,
} from "@/components/ui";
import StatusBadge from "@/components/ui/StatusBadge";
import { useStore } from "@/store/store";

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
  const price = billingDetails?.price ?? "";
  const paymentMethod = billingDetails?.paymentMethod;
  const renewalDate = billingDetails?.subscription?.currentPeriodEnd
    ? new Date(
        billingDetails.subscription.currentPeriodEnd,
      ).toLocaleDateString()
    : undefined;
  const status = billingDetails?.subscription?.status ?? "unknown";
  const isCanceled = status === "canceled";
  const isActionRequired = status === "past_due" || status === "unpaid";

  return (
    <>
      {isActionRequired && (
        <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/10 p-5">
          <p className="flex items-center text-sm text-warning">
            <span className="mr-2 rounded bg-warning/20 p-1">
              <WarningIcon className="h-4 w-4 text-warning" />
            </span>
            <span>
              <span className="font-bold">Payment Issue:</span> Your
              subscription is {status}. Please update your payment method to
              restore access.
            </span>
          </p>
        </div>
      )}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-success/30 bg-success/10 p-6">
        <div className="relative">
          {/* Header with status */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <span className="text-lg font-semibold text-success">
                  Pro Plan Member
                </span>
                <div className="mt-1 flex items-center" />
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Subscription details in clean grid */}
          <CardContainer
            variant="transparent"
            className="mb-4 bg-surface-2/40 p-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center sm:text-left">
                <div className="mb-1 text-xs text-muted">Plan & Price</div>
                <div className="font-semibold text-foreground">
                  {price || "-"}
                </div>
              </div>
              <div className="text-center sm:text-left">
                <div className="mb-1 text-xs text-muted">
                  {isCanceled ? "Expires" : "Renews"}
                </div>
                <div className="font-semibold text-foreground">
                  {renewalDate ?? "-"}
                </div>
              </div>
              <div className="text-center sm:text-left">
                <div className="mb-1 text-xs text-muted">Payment</div>
                <div className="font-semibold text-foreground">
                  {paymentMethod
                    ? `${paymentMethod.brand.toUpperCase()} •••• ${paymentMethod.last4}`
                    : "Not available"}
                </div>
              </div>
            </div>
          </CardContainer>

          <p className="text-sm leading-relaxed text-muted">
            {isCanceled
              ? "Your Pro access will continue until the expiration date shown above. You can reactivate your subscription at any time."
              : "Enjoy unlimited access to all premium features. Manage your subscription, view invoices, or update payment methods below."}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={() => setShow(true)}
          isLoading={isLoading}
          loadingText="Opening Portal..."
          fullWidth
          variant="primary"
          className={isActionRequired ? "animate-pulse" : ""}
          icon={<ExternalLinkIcon />}
          ariaLabel="Manage your Pro subscription"
        >
          {isActionRequired ? "Fix Payment Issue" : "Manage Subscription"}
        </Button>
        {!isCanceled && (
          <Button
            onClick={() => setShowCancel(true)}
            variant="danger"
            fullWidth
            ariaLabel="Cancel your Pro subscription"
          >
            Cancel Subscription
          </Button>
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
            <div className="rounded-lg bg-error/10 p-2">
              <WarningIcon className="h-6 w-6 shrink-0 text-error" />
            </div>
            <div>
              <h4 className="mb-2 font-medium text-foreground">
                Are you sure you want to cancel?
              </h4>
              <p className="mb-3 text-sm text-muted">
                This will immediately cancel your Pro subscription. You will
                retain access until the end of your current billing period.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setShowCancel(false)}
              variant="secondary"
              className="flex-1"
            >
              Keep Subscription
            </Button>
            <Button
              onClick={async () => {
                try {
                  const response = await billingApi.cancelSubscription();
                  setShowCancel(false);
                  showNotification(response.message, "success");
                  // Refresh user details to update UI
                  // No need to refetch user details, loader will handle updates if needed
                } catch (error) {
                  setShowCancel(false);
                  showNotification((error as Error).message, "error");
                }
              }}
              variant="danger"
              className="flex-1"
            >
              Confirm Cancel
            </Button>
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
        hideClose
      >
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <InfoIcon className="h-6 w-6 shrink-0 text-primary" />
            </div>
            <div>
              <h4 className="mb-2 font-medium text-foreground">
                Stripe Billing Portal
              </h4>
              <p className="mb-3 text-sm text-muted">
                You'll be redirected to Stripe's secure billing portal where you
                can:
              </p>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-center">
                  <span className="mr-3 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Update your payment method
                </li>
                <li className="flex items-center">
                  <span className="mr-3 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Download invoices and receipts
                </li>
                <li className="flex items-center">
                  <span className="mr-3 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Change your billing address
                </li>
                <li className="flex items-center">
                  <span className="mr-3 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Cancel your subscription
                </li>
              </ul>
            </div>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <p className="flex items-center text-sm text-warning">
              <span className="mr-2 rounded bg-warning/20 p-1">
                <WarningIcon className="h-3 w-3 text-warning" />
              </span>
              This will open in a new tab. Your current session will remain
              active.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => setShow(false)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShow(false);
                onManage();
              }}
              variant="primary"
              className="flex-1"
              icon={<ExternalLinkIcon className="h-4 w-4" />}
            >
              Continue to Portal
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProBillingView;
