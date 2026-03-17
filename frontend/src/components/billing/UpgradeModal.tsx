import React, { memo } from "react";

import { AwardIcon, CheckCircleIcon, Modal } from "@/components/ui";

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
  description = "Upgrade to Pro to unlock these powerful features:",
}) => {
  if (!open) return;

  const proFeatures = [
    "Advanced, filterable reporting",
    "Unlimited habit tracking",
    "Specific macronutrient targets",
    "Ad-free experience",
  ];

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Unlock ${featureName} Features`}
      variant="confirmation"
      message={description}
      onConfirm={onUpgrade}
      confirmLabel="Upgrade to Pro"
      cancelLabel="Maybe Later"
      size="md"
      hideCancelButton
    >
      <div className="text-left">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning">
          <AwardIcon className="h-6 w-6 text-black" />
        </div>
        <p className="mb-4 text-foreground">{description}</p>

        <ul className="space-y-2">
          {proFeatures.map((feature) => (
            <li key={feature} className="flex items-center">
              <CheckCircleIcon className="mr-2  flex-shrink-0 text-success" />
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

export default memo(UpgradeModal);
