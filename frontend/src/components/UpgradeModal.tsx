import React from "react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

/**
 * UpgradeModal - Prompts free users to upgrade to Pro
 * Usage: <UpgradeModal open={open} onClose={...} onUpgrade={...} />
 */
export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  open,
  onClose,
  onUpgrade,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl"
          onClick={onClose}
          aria-label="Close upgrade modal"
        >
          ×
        </button>
        <h3 className="text-xl font-bold mb-2">Unlock Pro Features</h3>
        <p className="mb-4 text-gray-700">
          This feature is available for{" "}
          <span className="font-semibold">Pro</span> members only.
          <br />
          Upgrade to Pro to access advanced analytics, unlimited habits,
          customizations, and more!
        </p>
        <button
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded text-lg focus:outline-none focus:ring-2 focus:ring-yellow-300"
          onClick={onUpgrade}
        >
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
};

// Usage example:
// <UpgradeModal open={modalOpen} onClose={closeModal} onUpgrade={goToPricing} />
