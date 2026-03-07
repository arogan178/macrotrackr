import React from "react";

import { CardContainer } from "@/components/form";
import { Button, StarIcon } from "@/components/ui";

const FreeBillingView: React.FC<{
  onUpgrade: () => void;
  isLoading: boolean;
}> = ({ onUpgrade, isLoading }) => (
  <div className="space-y-6 text-center">
    <CardContainer className="relative bg-surface-2/50 p-6">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-warning/20 bg-warning/10">
        <StarIcon className="h-8 w-8 text-warning" />
      </div>
      <h4 className="mb-2 text-xl font-semibold text-foreground">
        Unlock Your Full Potential
      </h4>
      <p className="mx-auto max-w-md text-muted">
        Upgrade to Pro to access exclusive features like advanced reporting,
        unlimited habit tracking, and custom macro targets.
      </p>
    </CardContainer>

    <div className="space-y-4">
      <Button
        onClick={onUpgrade}
        isLoading={isLoading}
        loadingText="Redirecting..."
        fullWidth
        variant="primary"
        className="bg-warning py-4 text-lg font-bold text-black hover:bg-warning/90"
        icon={<StarIcon className="" />}
        ariaLabel="Upgrade to Pro"
      >
        Upgrade to Pro
      </Button>
    </div>
  </div>
);

export default FreeBillingView;
