import React from "react";

import { Button, StarIcon } from "@/components/ui";

const FreeBillingView: React.FC<{
  onUpgrade: () => void;
  isLoading: boolean;
}> = ({ onUpgrade, isLoading }) => (
  <div className="space-y-6 text-center">
    <div className="relative rounded-xl border border-border/50 bg-gradient-to-br from-gray-800/60 via-gray-800/40 to-gray-900/60 p-6">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-yellow-400/20 bg-warning/10">
        <StarIcon className="h-8 w-8 text-warning" />
      </div>
      <h4 className="mb-2 text-xl font-semibold text-foreground">
        Unlock Your Full Potential
      </h4>
      <p className="mx-auto max-w-md text-foreground">
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
        className="bg-gradient-to-r from-yellow-500 to-yellow-600 py-4 text-lg font-bold text-black shadow-primary transition-all duration-200 hover:from-yellow-600 hover:to-yellow-700 hover:shadow-modal"
        icon={<StarIcon className="h-5 w-5" />}
        ariaLabel="Upgrade to Pro"
      >
        Upgrade to Pro
      </Button>
    </div>
  </div>
);

export default FreeBillingView;
