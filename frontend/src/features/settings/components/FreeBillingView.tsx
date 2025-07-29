import React from "react";

import { Button, StarIcon } from "@/components/ui";

const FreeBillingView: React.FC<{
  onUpgrade: () => void;
  isLoading: boolean;
}> = ({ onUpgrade, isLoading }) => (
  <div className="space-y-6 text-center">
    <div className="relative bg-gradient-to-br from-gray-800/60 via-gray-800/40 to-gray-900/60 p-6 rounded-xl border border-gray-700/50">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10 border-2 border-yellow-400/20">
        <StarIcon className="h-8 w-8 text-yellow-400" />
      </div>
      <h4 className="font-semibold text-gray-100 text-xl mb-2">
        Unlock Your Full Potential
      </h4>
      <p className="text-gray-400 max-w-md mx-auto">
        Upgrade to Pro to access exclusive features like advanced reporting,
        unlimited habit tracking, and custom macro targets.
      </p>
    </div>

    <div className="space-y-4">
      <Button
        onClick={onUpgrade}
        isLoading={isLoading}
        loadingText="Redirecting..."
        fullWidth
        variant="primary"
        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold text-lg py-4 shadow-lg hover:shadow-xl transition-all duration-200"
        icon={<StarIcon className="w-5 h-5" />}
        ariaLabel="Upgrade to Pro"
      >
        Upgrade to Pro
      </Button>
    </div>
  </div>
);

export default FreeBillingView;
