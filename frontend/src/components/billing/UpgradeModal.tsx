import React, { memo, useEffect } from "react";

import { CheckIcon, Modal } from "@/components/ui";
import { PRICING, PRICING_PLANS } from "@/config/pricing";
import { formatGrouped } from "@/lib/formatNumber";
import { useProductAnalytics } from "@/lib/productAnalytics";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  featureName?: string;
  description?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onClose,
  onUpgrade,
  featureName = "Pro",
  description = "Free keeps your last seven days. Pro opens the rest.",
}) => {
  const productAnalytics = useProductAnalytics();

  useEffect(() => {
    if (!open) return;

    productAnalytics.capture({
      event: "paywall_viewed",
      properties: {
        featureName,
        surface: "upgrade_modal",
      },
    });
  }, [featureName, open, productAnalytics]);

  if (!open) return;

  // The same list the pricing page prints, so the two can never promise
  // different things. This one used to offer an "ad-free experience" on an
  // app with no ads on any plan.
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Upgrade to Pro"
      variant="confirmation"
      message={description}
      onConfirm={onUpgrade}
      confirmLabel="See plans"
      cancelLabel="Not now"
      size="md"
    >
      <div className="text-left">
        <ul className="space-y-3 border-t border-border pt-4">
          {PRICING_PLANS.pro.features.map((feature) => (
            <li key={feature} className="flex gap-3 text-sm text-foreground">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          ${PRICING.monthly} a month, or ${formatGrouped(PRICING.yearly, 2)} a year.
        </p>
      </div>
    </Modal>
  );
};

export default memo(UpgradeModal);
