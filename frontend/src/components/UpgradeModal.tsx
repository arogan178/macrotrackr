import React from "react";
import Modal from "./Modal";
import { AwardIcon, CheckCircleIcon } from "./Icons";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  featureName?: string;
  description?: string;
}

/**
 * UpgradeModal - Prompts free users to upgrade to Pro
 * Usage: <UpgradeModal open={open} onClose={...} onUpgrade={...} />
 */
export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onClose,
  onUpgrade,
  featureName = "Pro",
  description = "Upgrade to Pro to unlock these powerful features:",
}) => {
  if (!open) return null;

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
      hideCancelButton={true}
    >
      <div className="text-left">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <AwardIcon className="h-6 w-6 text-yellow-600" />
        </div>
        <p className="text-gray-300 mb-4">{description}</p>

        <ul className="space-y-2">
          {proFeatures.map((feature) => (
            <li key={feature} className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};

// Usage example:
// <UpgradeModal open={modalOpen} onClose={closeModal} onUpgrade={goToPricing} />
