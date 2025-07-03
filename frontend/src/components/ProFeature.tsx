import React from "react";
import { ProBadge } from "@/components/ProBadge";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useSubscriptionStatus } from "@/features/pricing/hooks/useSubscriptionStatus";

/**
 * ProFeature - Conditionally renders Pro features with gating
 * Usage: <ProFeature><AdvancedComponent /></ProFeature>
 */
export const ProFeature: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { subscriptionStatus } = useSubscriptionStatus();
  const [modalOpen, setModalOpen] = React.useState(false);

  if (subscriptionStatus === "pro") return <>{children}</>;

  return (
    <div
      className="relative opacity-60 pointer-events-auto select-none cursor-pointer"
      onClick={() => setModalOpen(true)}
    >
      <div className="pointer-events-none">{children}</div>
      <ProBadge />
      <UpgradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpgrade={() => {
          setModalOpen(false);
          window.location.href = "/pricing";
        }}
      />
    </div>
  );
};

// Usage example:
// <ProFeature><AdvancedReporting /></ProFeature>
