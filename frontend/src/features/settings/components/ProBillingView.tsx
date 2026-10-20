import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { billingApi, type BillingDetailsResponse } from "@/api/billing";
import {
  Button,
  ExternalLinkIcon,
  InfoIcon,
  Modal,
  WarningIcon,
} from "@/components/ui";
import { queryKeys } from "@/lib/queryKeys";
import { useStore } from "@/store/store";

const PLAY_PACKAGE_NAME = "com.macrotrackr.app";

/**
 * Open the Play Store subscription screen. We store the purchase token rather
 * than the SKU, so there is no sku to deep link with and the user lands on
 * their subscription list filtered to this app.
 */
function openPlaySubscriptions() {
  const url = new URL("https://play.google.com/store/account/subscriptions");
  url.searchParams.set("package", PLAY_PACKAGE_NAME);
  globalThis.open(url.toString(), "_blank", "noopener");
}

const ProBillingView: React.FC<{
  onManage: () => void;
  isLoading: boolean;
  billingDetails?: BillingDetailsResponse;
}> = ({ onManage, isLoading, billingDetails }) => {
  const [show, setShow] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const { showNotification } = useStore();
  const queryClient = useQueryClient();
  // If user is needed, get from loader: const { user } = useLoaderData({ from: '/' });

  // Extract details from billingDetails
  const price = billingDetails?.price ?? "";
  const paymentMethod = billingDetails?.paymentMethod;
  const renewalDate = billingDetails?.subscription?.currentPeriodEnd
    ? format(new Date(billingDetails.subscription.currentPeriodEnd), "d MMM yyyy")
    : undefined;
  // A cancelled Stripe subscription stays active until the period it paid for ends.
  const status = billingDetails?.subscription?.cancelAtPeriodEnd
    ? "canceled"
    : (billingDetails?.subscription?.status ?? "unknown");
  // Google owns the billing relationship for Play purchases. The Stripe
  // portal cannot show it and our cancel endpoint refuses it, so offering
  // either button here would just produce an error the user cannot act on.
  const isPlayBilled = billingDetails?.subscription?.provider === "play";
  const isCanceled = status === "canceled";
  const isActionRequired = status === "past_due" || status === "unpaid";
  const statusLabel =
    status === "active"
      ? "Active"
      : status === "past_due"
        ? "Past due"
        : status === "canceled"
          ? "Canceled"
          : status === "unpaid"
            ? "Unpaid"
            : status;
  const statusTone =
    status === "active"
      ? "border-success/30 bg-success/20 text-success"
      : status === "past_due" || status === "unpaid"
        ? "border-warning/30 bg-warning/20 text-warning"
        : "border-border bg-surface-2 text-muted";

  return (
    <>
      {isActionRequired && (
        <div className="mb-6 rounded-card border border-warning/30 bg-warning/10 p-5">
          <p className="flex items-center text-sm text-warning">
            <span className="mr-2 rounded-control bg-warning/20 p-1">
              <WarningIcon className="h-4 w-4 text-warning" />
            </span>
            <span>
              <span className="font-semibold">Payment issue:</span> Your
              subscription is {status}. Please update your payment method to
              restore access.
            </span>
          </p>
        </div>
      )}
      {/* The plan as rows, like the rest of Settings: only what is known. */}
      <dl className="mb-6 divide-y divide-border border-b border-border text-sm">
        <div className="flex min-h-12 items-center justify-between gap-3">
          <dt className="text-muted">Status</dt>
          <dd
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusTone}`}
          >
            {statusLabel}
          </dd>
        </div>
        {price && (
          <div className="flex min-h-12 items-center justify-between gap-3">
            <dt className="text-muted">Price</dt>
            <dd className="text-foreground">{price}</dd>
          </div>
        )}
        {renewalDate && (
          <div className="flex min-h-12 items-center justify-between gap-3">
            <dt className="text-muted">{isCanceled ? "Pro until" : "Renews"}</dt>
            <dd className="text-foreground">{renewalDate}</dd>
          </div>
        )}
        {(paymentMethod ?? isPlayBilled) && (
          <div className="flex min-h-12 items-center justify-between gap-3">
            <dt className="text-muted">Payment</dt>
            <dd className="text-foreground">
              {paymentMethod
                ? `${paymentMethod.brand.toUpperCase()} •••• ${paymentMethod.last4}`
                : "Google Play"}
            </dd>
          </div>
        )}
      </dl>
      {isCanceled && (
        <p className="mb-6 text-sm text-muted">
          Pro stays on until the date above. You can resume it from Manage
          subscription before then.
        </p>
      )}
      {isPlayBilled ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            This subscription is billed by Google Play. Changing the plan,
            updating the payment method or cancelling all happen in the Play
            Store.
          </p>
          <Button
            onClick={openPlaySubscriptions}
            fullWidth
            variant="primary"
            leftIcon={<ExternalLinkIcon />}
            ariaLabel="Manage your subscription in Google Play"
          >
            Manage in Google Play
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => setShow(true)}
            isLoading={isLoading}
            loadingText="Opening portal..."
            fullWidth
            variant="primary"
            className={isActionRequired ? "animate-pulse" : ""}
            leftIcon={<ExternalLinkIcon />}
            ariaLabel="Manage your Pro subscription"
          >
            {isActionRequired ? "Fix payment issue" : "Manage subscription"}
          </Button>
          {!isCanceled && (
            <Button
              onClick={() => setShowCancel(true)}
              variant="danger"
              fullWidth
              ariaLabel="Cancel your Pro subscription"
            >
              Cancel subscription
            </Button>
          )}
        </div>
      )}

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        title="Cancel subscription"
        size="md"
        variant="form"
        hideDefaultButtons
      >
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="rounded-control bg-error/10 p-2">
              <WarningIcon className="h-6 w-6 shrink-0 text-error" />
            </div>
            <div>
              <h4 className="mb-2 font-medium text-foreground">
                Are you sure you want to cancel?
              </h4>
              <p className="mb-3 text-sm text-muted">
                Your subscription will not renew. You will keep Pro until the
                end of your current billing period.
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
                  await queryClient.invalidateQueries({
                    queryKey: queryKeys.settings.billing(),
                  });
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
        title="Manage subscription"
        size="md"
        variant="form"
        hideDefaultButtons
        hideClose
      >
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="rounded-control bg-primary/10 p-2">
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
          <div className="rounded-control border border-warning/30 bg-warning/10 p-4">
            <p className="flex items-center text-sm text-warning">
              <span className="mr-2 rounded-control bg-warning/20 p-1">
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
              leftIcon={<ExternalLinkIcon className="h-4 w-4" />}
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
